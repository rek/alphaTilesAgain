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
 */
function splitWordIntoSyllableTexts(wordInLOP: string): string[] {
  return wordInLOP.replace(/#/g, '').split('.').filter(Boolean);
}

/** Parse a syllable text into its constituent tiles using the tile hash map. */
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

/**
 * Build BoundaryInfo for each gap between adjacent groups.
 * Locked-boundary indices use ABSOLUTE-tile-index space (the boundary "after"
 * tile k for k in 0..N-2). The boundary between groups[i] and groups[i+1]
 * corresponds to the absolute-tile index of the LAST tile of groups[i].
 */
function buildBoundaries(
  groups: TileGroup[],
  lockedBoundaries: Set<number>,
): BoundaryInfo[] {
  const result: BoundaryInfo[] = [];
  let absTileEnd = -1;
  for (let i = 0; i < groups.length - 1; i++) {
    absTileEnd += groups[i].tiles.length;
    result.push({
      index: i,
      visible: true,
      clickable: !lockedBoundaries.has(absTileEnd),
    });
  }
  return result;
}

/**
 * Mark a group as locked iff ALL its absolute-tile indices are in lockedTiles.
 * Partial-credit and win logic both produce contiguous lock segments, so any
 * group is either fully locked or fully unlocked.
 */
function applyTileLocks(
  groups: TileGroup[],
  lockedTiles: Set<number>,
): TileGroup[] {
  let absoluteTile = 0;
  return groups.map((g) => {
    const allLocked = g.tiles.length > 0 &&
      g.tiles.every((_, j) => lockedTiles.has(absoluteTile + j));
    absoluteTile += g.tiles.length;
    return { ...g, isLocked: allLocked };
  });
}

/**
 * Concatenate currentViews text for win detection.
 * Java evaluateCombination 457-461: tiles contribute syllable text; remaining
 * link buttons contribute ".".
 */
function concatCurrentViewsText(groups: TileGroup[]): string {
  return groups.map((g) => g.tiles.join('')).join('.');
}

/** Build the SAD-stripped wordInLOP target as syllables joined by '.'. */
function buildExpectedConcat(correctSyllables: string[][]): string {
  return correctSyllables.map((syll) => syll.join('')).join('.');
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

  const scriptDirection =
    assets.langInfo.find('Script direction (LTR or RTL)') ?? 'LTR';
  const isRTL = scriptDirection.toUpperCase() === 'RTL';

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

  /** Parse a word into its correct syllable groupings (post-SAD). */
  const parseCorrectSyllables = useCallback(
    (word: Word): string[][] | null => {
      const syllableTexts = splitWordIntoSyllableTexts(word.wordInLOP);
      const result: string[][] = [];
      for (const sText of syllableTexts) {
        const tiles = parseSyllableIntoTiles(sText, tileMap, multitypeTiles, placeholderChar);
        if (!tiles || tiles.length === 0) return null;
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
  const [lockedBoundaries, setLockedBoundaries] = useState<Set<number>>(
    () => new Set(),
  );
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

  // expo-screen-orientation lock (Java line 97 SCREEN_ORIENTATION_LANDSCAPE):
  // DEFERRED — `expo-screen-orientation` is not in package.json. Adding npm
  // deps requires explicit user OK per agent protocol. When the dep lands,
  // wire `ScreenOrientation.lockAsync(LANDSCAPE)` on mount and unlock on
  // cleanup here.

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
      if (candidateTiles.length < 2) continue;

      const candidateSyllables = parseCorrectSyllables(candidate);
      if (!candidateSyllables || candidateSyllables.length === 0) continue;
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
    setLockedBoundaries(new Set());
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

  /**
   * Run partial-credit evaluation; carry-forward prior locks so they remain
   * monotonic. Returns next groups + cumulative locked boundaries.
   */
  const applyEvaluation = useCallback(
    (
      newGroups: TileGroup[],
      syllables: string[][],
      priorLockedBoundaries: Set<number>,
    ): { groups: TileGroup[]; lockedBoundaries: Set<number> } => {
      const { lockedTiles, lockedBoundaries: nextBoundaries } = evaluateGroupings(
        newGroups,
        syllables,
      );
      // Carry forward already-locked tiles via the prior groups' isLocked flag.
      let absTile = 0;
      for (const g of newGroups) {
        for (let i = 0; i < g.tiles.length; i++) {
          if (g.isLocked) lockedTiles.add(absTile + i);
        }
        absTile += g.tiles.length;
      }
      const merged = new Set([...priorLockedBoundaries, ...nextBoundaries]);
      return {
        groups: applyTileLocks(newGroups, lockedTiles),
        lockedBoundaries: merged,
      };
    },
    [],
  );

  /**
   * Win condition (Java evaluateCombination 463): concat of currentViews text
   * (tiles + remaining "." link buttons) equals SAD-stripped wordInLOP.
   * Modeled as syllables-joined-by-'.' since both sides have SAD removed.
   */
  const checkWin = useCallback(
    (updatedGroups: TileGroup[], syllables: string[][]): boolean => {
      if (updatedGroups.length === 0) return false;
      return concatCurrentViewsText(updatedGroups) === buildExpectedConcat(syllables);
    },
    [],
  );

  const onJoin = useCallback(
    (boundaryIndex: number) => {
      if (isWon || shell.interactionLocked) return;

      setGroups((prev) => {
        const joined = joinTiles(prev, boundaryIndex);
        const { groups: evaluated, lockedBoundaries: nextLocked } = applyEvaluation(
          joined,
          correctSyllables,
          lockedBoundaries,
        );
        setLockedBoundaries(nextLocked);

        if (checkWin(evaluated, correctSyllables)) {
          // Force-lock all groups for the green/disabled win state.
          const finalGroups = evaluated.map((g) => ({ ...g, isLocked: true }));
          setIsWon(true);
          shell.setInteractionLocked(true);
          // Spec: playCorrectSoundThenActiveWordClip(false) — chime then word —
          // BEFORE updatePointsAndTrackers(1). Sequenced via .then chain.
          audio.playCorrectFinal().then(() => {
            if (!isMountedRef.current) return;
            shell.replayWord();
            shell.incrementPointsAndTracker(true, 1);
          });
          return finalGroups;
        }

        return evaluated;
      });
    },
    [
      isWon,
      shell,
      correctSyllables,
      lockedBoundaries,
      applyEvaluation,
      checkWin,
      audio,
    ],
  );

  const onSeparate = useCallback(
    (groupIndex: number, tilePositionInGroup: number) => {
      if (isWon || shell.interactionLocked) return;

      setGroups((prev) => {
        const separated = separateTiles(prev, groupIndex, tilePositionInGroup);
        const { groups: evaluated, lockedBoundaries: nextLocked } = applyEvaluation(
          separated,
          correctSyllables,
          lockedBoundaries,
        );
        setLockedBoundaries(nextLocked);
        return evaluated;
      });
    },
    [isWon, shell, correctSyllables, lockedBoundaries, applyEvaluation],
  );

  if (error === 'insufficient-content') {
    return (
      <JapanScreen
        groups={[]}
        boundaries={[]}
        onJoin={noop}
        onSeparate={noop}
        wordText="?"
        rtl={isRTL}
      />
    );
  }

  if (groups.length === 0) return <></>;

  const boundaries = buildBoundaries(groups, lockedBoundaries);

  return (
    <JapanScreen
      groups={groups}
      boundaries={boundaries}
      onJoin={onJoin}
      onSeparate={onSeparate}
      wordText={wordText}
      wordImage={wordImage}
      rtl={isRTL}
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
