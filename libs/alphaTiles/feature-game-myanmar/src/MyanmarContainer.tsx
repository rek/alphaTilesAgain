/**
 * Container for the Myanmar 7×7 word-search game.
 *
 * Port of Myanmar.java — see openspec/changes/game-myanmar/design.md.
 *
 * Outer MyanmarContainer wraps GameShellContainer; inner MyanmarGame owns state.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import { MyanmarScreen } from './MyanmarScreen';
import type {
  MyanmarCell,
  MyanmarImageSlot,
} from './MyanmarScreen';
import { placeWords, WORDS_PER_BOARD, MIN_TILES, MAX_TILES } from './placeWords';
import type { PlacedWord } from './placeWords';
import type { ChallengeLevel } from './directions';
import { fillRandomNonVowels } from './fillRandomNonVowels';
import { spanBetween } from './spanBetween';
import { matchPath } from './matchPath';
import { stackAppend, EMPTY_STACK } from './stackAppend';
import type { StackState } from './stackAppend';

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

type WordRow = {
  wordInLOP: string;
  wordInLWC: string;
  mixedDefs: string;
};

type PlacedWithMeta = PlacedWord<WordRow>;

const DEFAULT_FOUND_PALETTE = [
  '#1565C0',
  '#43A047',
  '#E53935',
  '#FB8C00',
  '#8E24AA',
  '#00897B',
  '#F4511E',
];

function shuffle<T>(arr: ReadonlyArray<T>, rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function MyanmarGame({
  challengeLevel,
  selectionMethod,
}: {
  challengeLevel: ChallengeLevel;
  selectionMethod: 1 | 2;
}): React.JSX.Element {
  const shell = useGameShell();
  const {
    setRefWord, setInteractionLocked, incrementPointsAndTracker,
    replayWord, interactionLocked,
  } = shell;
  const audio = useAudio();
  const assets = useLangAssets();

  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileRows = assets.tiles.rows;
  const wordRows = assets.words.rows;
  const colorList = assets.colors.hexByIndex;
  const tileMap = useMemo(
    () => buildTileHashMap(tileRows, placeholderChar),
    [tileRows, placeholderChar],
  );
  const multitypeTiles = useMemo(() => getMultitypeTiles(tileRows), [tileRows]);

  const palette = colorList.length >= 7 ? colorList.slice(0, 7) : DEFAULT_FOUND_PALETTE;

  // Build per-round state from a single random seed (game-level RNG).
  const [grid, setGrid] = useState<string[]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWithMeta[]>([]);
  const [foundFlags, setFoundFlags] = useState<boolean[]>([]); // length matches placedWords
  const [foundColorBySlot, setFoundColorBySlot] = useState<(string | null)[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [stack, setStack] = useState<StackState>(EMPTY_STACK);
  const [activeWord, setActiveWord] = useState('');
  const [completionGoal, setCompletionGoal] = useState(0);
  const isMountedRef = useRef(true);

  const startRound = useCallback(() => {
    setInteractionLocked(false);

    const rng = Math.random;
    // Pick candidate words: filter to those with parseable tile counts in [3..7],
    // then shuffle and feed up to 2× the per-board target as a buffer for placement failures.
    const eligible: Array<{ word: WordRow; tiles: string[] }> = [];
    for (const w of wordRows) {
      const parsed = parseWordIntoTilesPreliminary(
        w.wordInLOP,
        w.mixedDefs,
        tileMap,
        multitypeTiles,
        placeholderChar,
      );
      if (parsed === null) continue;
      const tiles = parsed.map((p) => p.base);
      if (tiles.length >= MIN_TILES && tiles.length <= MAX_TILES) {
        eligible.push({ word: w, tiles });
      }
    }
    const candidates = shuffle(eligible, rng).slice(0, WORDS_PER_BOARD * 2);

    const { grid: placementGrid, placed } = placeWords({
      candidates,
      level: challengeLevel,
      rng,
    });
    const filled = fillRandomNonVowels({
      grid: placementGrid,
      tilePool: tileRows.map((t) => ({ base: t.base, type: t.type })),
      rng,
    });

    setGrid(filled);
    setPlacedWords(placed);
    setFoundFlags(new Array(placed.length).fill(false));
    setFoundColorBySlot(new Array(placed.length).fill(null));
    setFirst(null);
    setStack(EMPTY_STACK);
    setActiveWord('');
    setCompletionGoal(placed.length);

    if (placed.length > 0) {
      const firstWord = placed[0].word;
      setRefWord({
        wordInLOP: firstWord.wordInLOP,
        wordInLWC: firstWord.wordInLWC,
      });
    }
  }, [
    setRefWord, setInteractionLocked,
    wordRows,
    tileRows,
    tileMap,
    multitypeTiles,
    placeholderChar,
    challengeLevel,
  ]);

  // Mount-only kickoff (useMountEffect pattern — empty deps, one-shot).
  useEffect(() => {
    isMountedRef.current = true;
    startRound();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useShellAdvance(startRound);

  const recordFound = useCallback(
    (placedIdx: number) => {
      // Cycle to next palette color based on how many slots already coloured.
      const usedColors = foundColorBySlot.filter((c) => c !== null).length;
      const color = palette[usedColors % palette.length];
      const word = placedWords[placedIdx].word;
      const nextFoundCount = foundFlags.filter(Boolean).length + 1;
      setFoundFlags((prev) => prev.map((v, i) => (i === placedIdx ? true : v)));
      setFoundColorBySlot((prev) =>
        prev.map((v, i) => (i === placedIdx ? color : v)),
      );
      setActiveWord(word.wordInLOP);
      setRefWord({ wordInLOP: word.wordInLOP, wordInLWC: word.wordInLWC });
      // Completion fires here (event-driven), not in a derived effect.
      // Java parity: playCorrectThenWord(true) on the final found word.
      if (completionGoal > 0 && nextFoundCount === completionGoal) {
        incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          replayWord();
        });
      } else {
        audio.playCorrect();
      }
    },
    [foundColorBySlot, palette, placedWords, foundFlags, completionGoal,
     setRefWord, incrementPointsAndTracker, replayWord, audio],
  );

  const handleClassicTap = useCallback(
    (i: number) => {
      if (first === null) {
        setFirst(i);
        return;
      }
      const span = spanBetween({ first, second: i });
      setFirst(null);
      if (span === null) return;
      const placedIdx = matchPath({
        candidate: span,
        paths: placedWords.filter((_, idx) => !foundFlags[idx]),
      });
      // Re-resolve placedIdx into the original placedWords array (we filtered above).
      if (placedIdx === -1) return;
      const liveIndices = placedWords
        .map((_, idx) => (foundFlags[idx] ? -1 : idx))
        .filter((idx) => idx !== -1);
      recordFound(liveIndices[placedIdx]);
    },
    [first, placedWords, foundFlags, recordFound],
  );

  const handleStackTap = useCallback(
    (i: number) => {
      const next = stackAppend({ state: stack, tap: i });
      setStack(next);
      if (next.stack.length < 2) return;
      const remaining = placedWords
        .map((p, idx) => (foundFlags[idx] ? null : { path: p.path, idx }))
        .filter((p): p is { path: number[]; idx: number } => p !== null);
      const found = matchPath({
        candidate: next.stack,
        paths: remaining.map((r) => ({ path: r.path })),
      });
      if (found !== -1) {
        recordFound(remaining[found].idx);
        setStack(EMPTY_STACK);
      }
    },
    [stack, placedWords, foundFlags, recordFound],
  );

  const onCellPress = useCallback(
    (i: number) => {
      if (interactionLocked) return;
      if (selectionMethod === 1) handleClassicTap(i);
      else handleStackTap(i);
    },
    [interactionLocked, selectionMethod, handleClassicTap, handleStackTap],
  );

  const onImagePress = useCallback(
    (slot: number) => {
      const placed = placedWords[slot];
      if (!placed) return;
      setActiveWord(placed.word.wordInLOP);
      setRefWord({
        wordInLOP: placed.word.wordInLOP,
        wordInLWC: placed.word.wordInLWC,
      });
      replayWord();
    },
    [placedWords, setRefWord, replayWord],
  );

  // Build presenter props.
  const cells: MyanmarCell[] = useMemo(() => {
    const colorByCell = new Map<number, string>();
    placedWords.forEach((p, i) => {
      const color = foundColorBySlot[i];
      if (color !== null && color !== undefined) {
        p.path.forEach((idx) => colorByCell.set(idx, color));
      }
    });
    const selected = new Set<number>();
    if (selectionMethod === 1 && first !== null) selected.add(first);
    if (selectionMethod === 2) stack.stack.forEach((s) => selected.add(s));
    return grid.map((text, i) => ({
      text,
      color: colorByCell.get(i) ?? null,
      selected: selected.has(i),
    }));
  }, [grid, placedWords, foundColorBySlot, first, stack, selectionMethod]);

  const imageBank: MyanmarImageSlot[] = useMemo(() => {
    return placedWords.map((p, i) => {
      const wlwc = p.word.wordInLWC;
      const source = assets.images.words[wlwc] as ImageSourcePropType | undefined;
      return {
        source,
        label: wlwc,
        done: foundFlags[i] === true,
      };
    });
  }, [placedWords, foundFlags, assets.images.words]);

  if (grid.length === 0) return <></>;

  return (
    <MyanmarScreen
      grid={cells}
      imageBank={imageBank}
      activeWord={activeWord}
      interactionLocked={interactionLocked}
      onCellPress={onCellPress}
      onImagePress={onImagePress}
    />
  );
}

export function MyanmarContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const rawLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const challengeLevel = (rawLevel >= 1 && rawLevel <= 3 ? rawLevel : 1) as ChallengeLevel;
  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  // Settings key: "Selection Method for Word Search" — 1 or 2; default 1.
  const settingValue = assets.settings.findInt('Selection Method for Word Search', 1);
  const selectionMethod = (settingValue === 2 ? 2 : 1) as 1 | 2;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
      icons={props.icons}
    >
      <MyanmarGame
        challengeLevel={challengeLevel}
        selectionMethod={selectionMethod}
      />
    </GameShellContainer>
  );
}
