/**
 * Container for the Colombia "build the word" game.
 *
 * ColombiaContainer wraps GameShellContainer; ColombiaGame is the inner component
 * that calls useGameShell() and owns all game state.
 *
 * Port of Colombia.java — see design.md for the full mapping table.
 *
 * S-CL4 is unsupported (Java line 78 → goBackToEarth). We immediately call
 * router.back() and render nothing.
 */
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
  useShellAdvance,
} from '@alphaTiles/feature-game-shell';
import type { GameShellIcons } from '@alphaTiles/feature-game-shell';
import {
  buildTileHashMap,
  getMultitypeTiles,
  parseWordIntoTiles,
} from '@shared/util-phoneme';
import type { ParsedTile, ScriptType } from '@shared/util-phoneme';
import { ColombiaScreen } from './ColombiaScreen';
import { buildKeyboard } from './buildKeyboard';
import type { TileRow } from './buildKeyboard';
import { evaluateStatus } from './evaluateStatus';
import {
  KEYS_PER_PAGE_BODY,
  computeKeyIndex,
  visibleSlotsOnPage,
} from './paginateKeyboard';
import type {
  AttemptStatus, ChallengeLevel, ColombiaVariant, KeyTile, WordPiece,
} from './types';
import type { SyllableRow } from './drawSyllableDistractor';

type RouteParams = Record<string, string | string[] | undefined> & {
  icons?: GameShellIcons;
};

type Round = {
  word: { wordInLOP: string; wordInLWC: string; mixedDefs: string };
  parsedTiles: ParsedTile[];
  parsedSyllables: SyllableRow[];
  keys: KeyTile[];
  visible: number;
  paginated: boolean;
  totalScreens: number;
  partial: number;
};

const PALETTE_FALLBACK = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#9C27B0'];

/** Naive longest-match syllable parser, mirrors Java's syllableList.parseWordIntoSyllables. */
function parseWordIntoSyllables(
  wordInLOP: string,
  syllables: SyllableRow[],
): SyllableRow[] {
  if (syllables.length === 0) return [];
  const sorted = [...syllables].sort((a, b) => b.syllable.length - a.syllable.length);
  const lop = wordInLOP.replace(/[#.]/g, '');
  const result: SyllableRow[] = [];
  let i = 0;
  while (i < lop.length) {
    let matched: SyllableRow | undefined;
    for (const s of sorted) {
      if (s.syllable.length > 0 && lop.startsWith(s.syllable, i)) {
        matched = s;
        break;
      }
    }
    if (!matched) return [];
    result.push(matched);
    i += matched.syllable.length;
  }
  return result;
}

function ColombiaGame({
  challengeLevel,
  variant,
}: {
  challengeLevel: ChallengeLevel;
  variant: ColombiaVariant;
}): React.JSX.Element {
  const shell = useGameShell();
  const {
    setRefWord, setInteractionLocked, incrementPointsAndTracker,
    replayWord, interactionLocked,
  } = shell;
  const audio = useAudio();
  const assets = useLangAssets();

  const scriptType = (assets.langInfo.find('Script type') ?? 'Roman') as ScriptType;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';

  const tileMap = useMemo(
    () => buildTileHashMap(assets.tiles.rows, placeholderChar),
    [assets.tiles.rows, placeholderChar],
  );
  void tileMap;
  const multitypeTiles = useMemo(
    () => getMultitypeTiles(assets.tiles.rows),
    [assets.tiles.rows],
  );
  void multitypeTiles;

  const colorList = assets.colors.hexByIndex.length > 0
    ? assets.colors.hexByIndex
    : PALETTE_FALLBACK;

  // Java SAD_STRINGS: tile bases whose type is 'SAD'.
  const sadStrings = useMemo(() => {
    const set = new Set<string>();
    for (const t of assets.tiles.rows) {
      if (t.type === 'SAD') set.add(t.base);
    }
    return set;
  }, [assets.tiles.rows]);

  const [round, setRound] = useState<Round | null>(null);
  const [page, setPage] = useState(1);
  const [clickedKeys, setClickedKeys] = useState<WordPiece[]>([]);
  const [tilesInBuiltWord, setTilesInBuiltWord] = useState<ParsedTile[]>([]);
  const [status, setStatus] = useState<AttemptStatus>('yellow');
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const isMountedRef = useRef(true);

  const wordPoolRef = useRef<typeof assets.words.rows>([]);

  const pickNextWord = useCallback((): typeof assets.words.rows[number] | null => {
    if (wordPoolRef.current.length === 0) {
      const pool = [...assets.words.rows];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      wordPoolRef.current = pool;
    }
    return wordPoolRef.current.pop() ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets.words.rows]);

  const startRound = useCallback(() => {
    setInteractionLocked(false);

    let nextRound: Round | null = null;
    for (let attempt = 0; attempt < 8 && nextRound === null; attempt++) {
      const word = pickNextWord();
      if (!word) break;

      const parsedTiles = parseWordIntoTiles({
        wordInLOP: word.wordInLOP,
        mixedDefs: word.mixedDefs,
        tiles: assets.tiles.rows,
        scriptType,
        placeholderCharacter: placeholderChar,
      });
      if (!parsedTiles || parsedTiles.length === 0) continue;

      const parsedSyllables = variant === 'S'
        ? parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows)
        : [];
      if (variant === 'S' && parsedSyllables.length === 0) continue;

      const built = buildKeyboard({
        level: challengeLevel,
        variant,
        parsedTiles,
        parsedSyllables,
        tileList: assets.tiles.rows as TileRow[],
        syllableList: assets.syllables.rows,
        keyList: assets.keys.rows,
        colorList,
        sadStrings,
      });

      nextRound = {
        word: {
          wordInLOP: word.wordInLOP,
          wordInLWC: word.wordInLWC,
          mixedDefs: word.mixedDefs,
        },
        parsedTiles,
        parsedSyllables,
        keys: built.keys,
        visible: built.visible,
        paginated: built.paginated,
        totalScreens: built.totalScreens,
        partial: built.partial,
      };
    }

    if (nextRound === null) {
      setError('insufficient-content');
      return;
    }

    setError(null);
    setRound(nextRound);
    setPage(1);
    setClickedKeys([]);
    setTilesInBuiltWord([]);
    setStatus('yellow');
    setRefWord({
      wordInLOP: nextRound.word.wordInLOP,
      wordInLWC: nextRound.word.wordInLWC,
    });
    audio.playWord(nextRound.word.wordInLWC);
  }, [
    setRefWord, setInteractionLocked, audio, assets.tiles.rows, assets.syllables.rows, assets.keys.rows,
    scriptType, placeholderChar, variant, challengeLevel, colorList, sadStrings,
    pickNextWord,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    startRound();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useShellAdvance(startRound);

  const recomputeStatus = useCallback(
    (nextClickedKeys: WordPiece[], nextTilesBuilt: ParsedTile[]) => {
      if (!round) return;
      const result = evaluateStatus({
        level: challengeLevel,
        variant,
        clickedKeys: nextClickedKeys,
        tilesInBuiltWord: nextTilesBuilt,
        parsedTiles: round.parsedTiles,
        parsedSyllables: round.parsedSyllables,
        refWord: { wordInLOP: round.word.wordInLOP, mixedDefs: round.word.mixedDefs },
        tiles: assets.tiles.rows,
        scriptType,
        placeholderCharacter: placeholderChar,
      });
      setStatus(result.color);
      if (result.isWin) {
        setInteractionLocked(true);
        incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          if (!isMountedRef.current) return;
          replayWord();
        });
      }
    },
    [round, challengeLevel, variant, assets.tiles.rows, scriptType, placeholderChar,
     setInteractionLocked, incrementPointsAndTracker, replayWord, audio],
  );

  const onKeyPress = useCallback(
    (slotIndex: number) => {
      if (!round) return;
      if (interactionLocked) return;
      const absIndex = round.paginated
        ? computeKeyIndex(page, slotIndex)
        : slotIndex;
      const tile = round.keys[absIndex];
      if (!tile) return;

      let nextClickedKeys: WordPiece[];
      let nextTilesBuilt: ParsedTile[] = tilesInBuiltWord;

      if (variant === 'S' || (variant === 'T' && challengeLevel === 3)) {
        nextClickedKeys = [...clickedKeys, { text: tile.text }];
      } else {
        const parsedClone: ParsedTile = {
          base: tile.text,
          typeOfThisTileInstance: tile.type ?? '',
          stageOfFirstAppearanceForThisTileType: 0,
          audioForThisTileType: '',
          tileType: tile.type ?? '',
          tileTypeB: 'none',
          tileTypeC: 'none',
        };
        nextTilesBuilt = [...tilesInBuiltWord, parsedClone];
        nextClickedKeys = [...clickedKeys, { text: tile.text }];
      }

      setClickedKeys(nextClickedKeys);
      setTilesInBuiltWord(nextTilesBuilt);
      recomputeStatus(nextClickedKeys, nextTilesBuilt);
    },
    [round, interactionLocked, page, clickedKeys, tilesInBuiltWord,
     variant, challengeLevel, recomputeStatus],
  );

  const onDelete = useCallback(() => {
    if (!round) return;
    if (interactionLocked) return;
    if (clickedKeys.length === 0) return;

    let nextTilesBuilt = tilesInBuiltWord;
    if (variant === 'T' && challengeLevel !== 3) {
      nextTilesBuilt = tilesInBuiltWord.slice(0, -1);
    }
    const nextClickedKeys = clickedKeys.slice(0, -1);
    setClickedKeys(nextClickedKeys);
    setTilesInBuiltWord(nextTilesBuilt);
    recomputeStatus(nextClickedKeys, nextTilesBuilt);
  }, [round, interactionLocked, clickedKeys, tilesInBuiltWord,
      variant, challengeLevel, recomputeStatus]);

  const onPageChange = useCallback(
    (delta: 1 | -1) => {
      if (!round) return;
      setPage((prev) => {
        const next = prev + delta;
        if (next < 1) return 1;
        if (next > round.totalScreens) return round.totalScreens;
        return next;
      });
    },
    [round],
  );

  const onImagePress = useCallback(() => {
    replayWord();
  }, [replayWord]);

  if (error === 'insufficient-content' || !round) {
    return (
      <ColombiaScreen
        wordImage={undefined}
        wordLabel="?"
        displayedText=""
        status="yellow"
        keys={[]}
        paginated={false}
        page={1}
        totalScreens={1}
        interactionLocked
        onDelete={() => undefined}
        onKeyPress={() => undefined}
        onPageChange={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  const wordImage = assets.images.words[round.word.wordInLWC] as ImageSourcePropType | undefined;

  let visibleKeys: KeyTile[] = round.keys;
  if (round.paginated) {
    const start = computeKeyIndex(page, 0);
    const slotCount = visibleSlotsOnPage({
      page,
      totalScreens: round.totalScreens,
      partial: round.partial,
    });
    const limit = slotCount === 0 ? KEYS_PER_PAGE_BODY : slotCount;
    visibleKeys = round.keys.slice(start, start + limit);
  }

  // Re-evaluate to derive displayed text. Pure call; no side effects.
  const displayEval = evaluateStatus({
    level: challengeLevel,
    variant,
    clickedKeys,
    tilesInBuiltWord,
    parsedTiles: round.parsedTiles,
    parsedSyllables: round.parsedSyllables,
    refWord: { wordInLOP: round.word.wordInLOP, mixedDefs: round.word.mixedDefs },
    tiles: assets.tiles.rows,
    scriptType,
    placeholderCharacter: placeholderChar,
  });

  return (
    <ColombiaScreen
      wordImage={wordImage}
      wordLabel={round.word.wordInLWC}
      displayedText={displayEval.attemptText}
      status={status}
      keys={visibleKeys}
      paginated={round.paginated}
      page={page}
      totalScreens={round.totalScreens}
      interactionLocked={interactionLocked}
      onDelete={onDelete}
      onKeyPress={onKeyPress}
      onPageChange={onPageChange}
      onImagePress={onImagePress}
    />
  );
}

export function ColombiaContainer(props: RouteParams): React.JSX.Element {
  const router = useRouter();
  const assets = useLangAssets();

  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const rawLevel = parseInt((props.challengeLevel as string) ?? '1', 10);
  const challengeLevel = (rawLevel >= 1 && rawLevel <= 4 ? rawLevel : 1) as ChallengeLevel;
  const variant = ((props.syllableGame as string) === 'S' ? 'S' : 'T') as ColombiaVariant;

  // S-CL4 is unsupported per Java line 78. Bounce immediately.
  useEffect(() => {
    if (variant === 'S' && challengeLevel === 4) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/menu');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (variant === 'S' && challengeLevel === 4) {
    return <></>;
  }

  const game = assets.games.rows[gameNumber - 1];
  const instructionAudioId = game?.instructionAudio;
  const hasInstruction =
    !!instructionAudioId && instructionAudioId in assets.audio.instructions;

  return (
    <GameShellContainer
      showInstructionsButton={hasInstruction}
      instructionAudioId={hasInstruction ? instructionAudioId : undefined}
      confirmOnBack={false}
      icons={props.icons}
    >
      <ColombiaGame challengeLevel={challengeLevel} variant={variant} />
    </GameShellContainer>
  );
}
