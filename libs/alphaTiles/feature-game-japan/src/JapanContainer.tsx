/**
 * JapanContainer — container for the Japan syllable-segmentation game.
 *
 * Owns all state and logic. Renders GameShellContainer (outer);
 * JapanGame is the inner component that calls useGameShell() and drives
 * the tile-linking mechanic.
 *
 * Port of Japan.java. See design.md for the full symbol mapping table.
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import {
  buildTileHashMap,
  getMultitypeTiles,
  parseWordIntoTilesPreliminary,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { JapanScreen } from './JapanScreen';
import { evaluateGroupings } from './evaluateGroupings';
import { joinTiles } from './joinTiles';
import { separateTiles } from './separateTiles';
import type { TileGroup } from './evaluateGroupings';
import type { BoundaryInfo } from './JapanScreen';

type Word = LangAssets['words']['rows'][number];

type RouteParams = Record<string, string | string[] | undefined>;

/** SAD tile type — tiles with type 'SAD' are stripped from the word. */
const SAD_TYPE = 'SAD';

/** Max tiles per challenge level, matching japan_7 / japan_12 layouts. */
const MAX_TILES_BY_LEVEL: Record<number, number> = { 1: 7, 2: 12 };
const DEFAULT_MAX_TILES = 7;

const MAX_DRAW_ATTEMPTS = 50;

/** Pick a random item from an array. */
function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Parse a word's LOP string into syllable groups (split on '.', strip '#').
 * Each part is a syllable text string.
 * e.g. "ba.na.na" → ["ba", "na", "na"]
 */
function splitWordIntoSyllableTexts(wordInLOP: string): string[] {
  return wordInLOP.replace(/#/g, '').split('.').filter(Boolean);
}

/**
 * Parse a syllable text into its constituent tiles using the tile hash map.
 * Returns null if any character can't be matched.
 */
function parseSyllableIntoTiles(
  syllableText: string,
  tileMap: ReturnType<typeof buildTileHashMap>,
  multitypeTiles: Set<string>,
  placeholderChar: string,
): string[] | null {
  const parsed = parseWordIntoTilesPreliminary(
    syllableText,
    '',
    tileMap,
    multitypeTiles,
    placeholderChar,
  );
  if (!parsed) return null;
  return parsed.map((t) => t.base);
}

/** Build the initial groups array: one TileGroup per tile. */
function buildInitialGroups(tiles: string[]): TileGroup[] {
  return tiles.map((t) => ({ tiles: [t], isLocked: false }));
}

/** Build the boundaries array from current groups (visible when both sides unlocked). */
function buildBoundaries(groups: TileGroup[]): BoundaryInfo[] {
  const result: BoundaryInfo[] = [];
  for (let i = 0; i < groups.length - 1; i++) {
    result.push({
      index: i,
      visible: !groups[i].isLocked && !groups[i + 1].isLocked,
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Inner game component (calls useGameShell)
// ─────────────────────────────────────────────────────────────

type JapanGameProps = {
  challengeLevel: number;
};

function JapanGame({ challengeLevel }: JapanGameProps): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();

  const maxTiles = MAX_TILES_BY_LEVEL[challengeLevel] ?? DEFAULT_MAX_TILES;

  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileRows = assets.tiles.rows;

  const tileMap = useMemo(
    () => buildTileHashMap(tileRows, placeholderChar),
    [tileRows, placeholderChar],
  );
  const multitypeTiles = useMemo(() => getMultitypeTiles(tileRows), [tileRows]);

  /** Parse a word into non-SAD tile bases. Returns null if parse fails. */
  const parseWordTiles = useCallback(
    (word: Word): string[] | null => {
      const parsed = parseWordIntoTilesPreliminary(
        word.wordInLOP,
        word.mixedDefs,
        tileMap,
        multitypeTiles,
        placeholderChar,
      );
      if (!parsed) return null;
      return parsed.filter((t) => t.typeOfThisTileInstance !== SAD_TYPE).map((t) => t.base);
    },
    [tileMap, multitypeTiles, placeholderChar],
  );

  /**
   * Parse a word into its correct syllable groupings as arrays of tile bases.
   * e.g. word "ba.na.na" → [["ba"], ["na", "na"]] (after tile parsing each syllable)
   */
  const parseCorrectSyllables = useCallback(
    (word: Word): string[][] | null => {
      const syllableTexts = splitWordIntoSyllableTexts(word.wordInLOP);
      const result: string[][] = [];
      for (const sText of syllableTexts) {
        const tiles = parseSyllableIntoTiles(sText, tileMap, multitypeTiles, placeholderChar);
        if (!tiles || tiles.length === 0) return null;
        // Filter SAD tiles within a syllable
        const filtered = tiles.filter((_, i) => {
          const parsed = parseWordIntoTilesPreliminary(
            sText,
            '',
            tileMap,
            multitypeTiles,
            placeholderChar,
          );
          if (!parsed) return true;
          return parsed[i]?.typeOfThisTileInstance !== SAD_TYPE;
        });
        if (filtered.length > 0) result.push(filtered);
      }
      return result.length > 0 ? result : null;
    },
    [tileMap, multitypeTiles, placeholderChar],
  );

  // Game state
  const [groups, setGroups] = useState<TileGroup[]>([]);
  const [correctSyllables, setCorrectSyllables] = useState<string[][]>([]);
  const [wordText, setWordText] = useState('');
  const [wordImage, setWordImage] = useState<ImageSourcePropType | undefined>(undefined);
  const [isWon, setIsWon] = useState(false);
  const [error, setError] = useState<'insufficient-content' | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Landscape orientation on mount/unmount
  // NOTE: expo-screen-orientation is not currently installed.
  // Add it and uncomment when landscape locking is needed:
  //
  // import * as ScreenOrientation from 'expo-screen-orientation';
  // useEffect(() => {
  //   ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  //   return () => {
  //     ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  //   };
  // }, []);

  const startRound = useCallback(() => {
    const wordRows = assets.words.rows;
    if (wordRows.length === 0) {
      setError('insufficient-content');
      return;
    }

    let chosenWord: Word | undefined;
    let tiles: string[] | null = null;
    let syllables: string[][] | null = null;

    for (let attempt = 0; attempt < MAX_DRAW_ATTEMPTS; attempt++) {
      const candidate = pickRandom(wordRows);
      if (!candidate) break;

      const candidateTiles = parseWordTiles(candidate);
      if (!candidateTiles || candidateTiles.length === 0) continue;
      if (candidateTiles.length > maxTiles) continue;

      // Must have at least 2 tiles to have any link buttons
      if (candidateTiles.length < 2) continue;

      const candidateSyllables = parseCorrectSyllables(candidate);
      if (!candidateSyllables || candidateSyllables.length === 0) continue;

      // Must have at least 2 syllables to be a meaningful game
      // (single-syllable words are degenerate)
      if (candidateSyllables.length < 2) continue;

      chosenWord = candidate;
      tiles = candidateTiles;
      syllables = candidateSyllables;
      break;
    }

    if (!chosenWord || !tiles || !syllables) {
      setError('insufficient-content');
      return;
    }

    const initialGroups = buildInitialGroups(tiles);
    setGroups(initialGroups);
    setCorrectSyllables(syllables);
    setWordText(chosenWord.wordInLOP.replace(/[.#]/g, ''));
    setWordImage(
      (assets.images.words[chosenWord.wordInLWC] as ImageSourcePropType | undefined),
    );
    setIsWon(false);
    setError(null);

    shell.setRefWord({
      wordInLOP: chosenWord.wordInLOP,
      wordInLWC: chosenWord.wordInLWC,
    });
  }, [assets, parseWordTiles, parseCorrectSyllables, maxTiles, shell]);

  // Mount-only kickoff (useMountEffect pattern)
  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyEvaluation = useCallback(
    (newGroups: TileGroup[], syllables: string[][]): TileGroup[] => {
      const lockedIndices = evaluateGroupings(newGroups, syllables);
      return newGroups.map((g, i) => ({
        ...g,
        isLocked: lockedIndices.has(i) || g.isLocked,
      }));
    },
    [],
  );

  const checkWin = useCallback(
    (updatedGroups: TileGroup[]): boolean => {
      return updatedGroups.length > 0 && updatedGroups.every((g) => g.isLocked);
    },
    [],
  );

  const onJoin = useCallback(
    (boundaryIndex: number) => {
      if (isWon || shell.interactionLocked) return;

      setGroups((prev) => {
        const joined = joinTiles(prev, boundaryIndex);
        const evaluated = applyEvaluation(joined, correctSyllables);

        if (checkWin(evaluated)) {
          setIsWon(true);
          shell.setInteractionLocked(true);
          shell.incrementPointsAndTracker(true);
          audio.playCorrectFinal().then(() => {
            if (isMountedRef.current) {
              shell.replayWord();
            }
          });
        }

        return evaluated;
      });
    },
    [isWon, shell, correctSyllables, applyEvaluation, checkWin, audio],
  );

  const onSeparate = useCallback(
    (groupIndex: number) => {
      if (isWon || shell.interactionLocked) return;

      setGroups((prev) => {
        const separated = separateTiles(prev, groupIndex);
        const evaluated = applyEvaluation(separated, correctSyllables);
        return evaluated;
      });
    },
    [isWon, shell, correctSyllables, applyEvaluation],
  );

  if (error === 'insufficient-content') {
    return (
      <JapanScreen
        groups={[]}
        boundaries={[]}
        onJoin={noop}
        onSeparate={noop}
        wordText="?"
      />
    );
  }

  if (groups.length === 0) return <></>;

  const boundaries = buildBoundaries(groups);

  return (
    <JapanScreen
      groups={groups}
      boundaries={boundaries}
      onJoin={onJoin}
      onSeparate={onSeparate}
      wordText={wordText}
      wordImage={wordImage}
    />
  );
}

function noop() {
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Public container
// ─────────────────────────────────────────────────────────────

export function JapanContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const challengeLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
    >
      <JapanGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
