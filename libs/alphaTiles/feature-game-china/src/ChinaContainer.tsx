/**
 * Container for the China sliding-tile game.
 *
 * ChinaContainer renders GameShellContainer (outer); ChinaGame is the inner component
 * that calls useGameShell() and owns all game state.
 *
 * Port of China.java — see design.md for the full mapping table.
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
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
import type { TileEntry } from '@shared/util-phoneme';
import { ChinaScreen } from './ChinaScreen';
import { chooseWords } from './chooseWords';
import { setUpTiles } from './setUpTiles';
import { checkRowSolved } from './checkRowSolved';
import { isSlideable } from './isSlideable';
import { swapTiles } from './swapTiles';
import type { ChinaData } from './buildChinaData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];

type CurrentWords = {
  threeTileWord: Word;
  four: [Word, Word, Word];
};

const MOVES_BY_CHALLENGE: Record<number, number> = { 1: 5, 2: 10, 3: 15 };

type RouteParams = Record<string, string | string[] | undefined>;

function ChinaGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const chinaData = usePrecompute<ChinaData>('china');

  const scriptType = assets.langInfo.find('Script type') ?? 'Roman';
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileRows = assets.tiles.rows;
  const moves = MOVES_BY_CHALLENGE[challengeLevel] ?? 5;

  const tileMap = useMemo(
    () => buildTileHashMap(tileRows, placeholderChar),
    [tileRows, placeholderChar],
  );
  const multitypeTiles = useMemo(() => getMultitypeTiles(tileRows), [tileRows]);

  const parseTiles = useCallback(
    (word: Word): string[] | null => {
      const parsed = parseWordIntoTilesPreliminary(
        word.wordInLOP,
        word.mixedDefs,
        tileMap,
        multitypeTiles,
        placeholderChar,
      );
      return parsed ? parsed.map((t) => t.base) : null;
    },
    [tileMap, multitypeTiles, placeholderChar],
  );

  const [board, setBoard] = useState<string[]>([]);
  const [blankIndex, setBlankIndex] = useState(15);
  const [solvedLines, setSolvedLines] = useState<boolean[]>([false, false, false, false]);
  const [currentWords, setCurrentWords] = useState<CurrentWords | null>(null);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startRound = useCallback(() => {
    const chosen = chooseWords({
      threeTileWords: chinaData.threeTileWords,
      fourTileWords: chinaData.fourTileWords,
    });
    if ('error' in chosen) {
      setError('insufficient-content');
      return;
    }

    let boardResult: { boardText: string[]; blankIndex: number } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      boardResult = setUpTiles({
        threeTileWord: chosen.threeTileWord,
        fourTileWords: chosen.fourTileWords,
        parseTiles,
        moves,
      });
      if (boardResult !== null) break;
    }

    if (!boardResult) {
      setError('insufficient-content');
      return;
    }

    setBoard(boardResult.boardText);
    setBlankIndex(boardResult.blankIndex);
    setSolvedLines([false, false, false, false]);
    setCurrentWords({ threeTileWord: chosen.threeTileWord, four: chosen.fourTileWords });
    shell.setRefWord({
      wordInLOP: chosen.threeTileWord.wordInLOP,
      wordInLWC: chosen.threeTileWord.wordInLWC,
    });
    setError(null);
  }, [chinaData, parseTiles, moves, shell]);

  // One-shot mount kickoff (useMountEffect pattern)
  useEffect(() => {
    startRound();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTilePress = useCallback(
    (index: number) => {
      if (shell.interactionLocked) return;
      if (!currentWords) return;
      if (blankIndex === index) return;
      if (!isSlideable(index, blankIndex)) return;

      const { board: newBoard, blankIndex: newBlankIndex } = swapTiles(board, index, blankIndex);

      setBoard(newBoard);
      setBlankIndex(newBlankIndex);

      const newSolvedLines = [
        checkRowSolved({
          board: newBoard, row: 0, targetWord: currentWords.four[0],
          blankIndex: newBlankIndex, tileMap, placeholderCharacter: placeholderChar, scriptType,
        }),
        checkRowSolved({
          board: newBoard, row: 1, targetWord: currentWords.four[1],
          blankIndex: newBlankIndex, tileMap, placeholderCharacter: placeholderChar, scriptType,
        }),
        checkRowSolved({
          board: newBoard, row: 2, targetWord: currentWords.four[2],
          blankIndex: newBlankIndex, tileMap, placeholderCharacter: placeholderChar, scriptType,
        }),
        checkRowSolved({
          board: newBoard, row: 3, targetWord: currentWords.threeTileWord,
          blankIndex: newBlankIndex, tileMap, placeholderCharacter: placeholderChar, scriptType,
        }),
      ];
      setSolvedLines(newSolvedLines);

      if (newSolvedLines.every(Boolean)) {
        shell.setInteractionLocked(true);
        audio.playCorrectFinal();
        shell.incrementPointsAndTracker(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            startRound();
            shell.setInteractionLocked(false);
          }
        }, 1200);
      }
    },
    [
      shell, blankIndex, board, currentWords, tileMap, placeholderChar,
      scriptType, audio, startRound,
    ],
  );

  const onImagePress = useCallback(
    (i: number) => {
      if (!currentWords) return;
      const word = i === 3 ? currentWords.threeTileWord : currentWords.four[i];
      shell.setRefWord({ wordInLOP: word.wordInLOP, wordInLWC: word.wordInLWC });
      audio.playWord(word.wordInLWC);
    },
    [currentWords, shell, audio],
  );

  const rowColors: ('solved' | 'unsolved' | 'blank')[][] = [0, 1, 2, 3].map((row) => {
    const start = row * 4;
    return [0, 1, 2, 3].map((col) => {
      const idx = start + col;
      if (idx === blankIndex) return 'blank';
      if (solvedLines[row]) return 'solved';
      return 'unsolved';
    });
  });

  const wordImagesData: Array<{ src: ImageSourcePropType | undefined; label: string }> = currentWords
    ? [currentWords.four[0], currentWords.four[1], currentWords.four[2], currentWords.threeTileWord].map(
        (word) => ({
          src: assets.images.words[word.wordInLWC] as ImageSourcePropType | undefined,
          label: word.wordInLWC,
        }),
      )
    : [];

  if (error === 'insufficient-content') {
    return (
      <ChinaScreen
        board={Array(16).fill('')}
        blankIndex={15}
        rowColors={Array(4).fill(Array(4).fill('unsolved'))}
        wordImages={[]}
        interactionLocked
        onTilePress={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  if (board.length === 0 || !currentWords) return <></>;

  return (
    <>
      <ChinaScreen
        board={board}
        blankIndex={blankIndex}
        rowColors={rowColors}
        wordImages={wordImagesData}
        interactionLocked={shell.interactionLocked}
        onTilePress={onTilePress}
        onImagePress={onImagePress}
      />
    </>
  );
}

export function ChinaContainer(props: RouteParams): React.JSX.Element {
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
      <ChinaGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
