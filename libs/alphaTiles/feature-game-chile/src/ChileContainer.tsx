/**
 * Container for the Chile Wordle game.
 *
 * ChileContainer renders GameShellContainer (outer); ChileGame is the inner
 * component that calls useGameShell() and owns all game state.
 *
 * Port of Chile.java — see design.md for the full mapping table.
 *
 * State machine:
 *   - secret: string[]       — current target word tiles
 *   - guessTiles: ColorTile[] — flat grid: guessCount × secret.length cells
 *   - keyTiles: ColorTile[]   — keyboard tiles
 *   - currentRow: number     — active guess row (0-based)
 *   - finished: boolean
 *   - wordList: string[][]   — remaining unplayed words (shuffled)
 *
 * Win: all tiles in current row GREEN → incrementPointsAndTracker(true), showReset.
 * Lose: last row, no win → append secret in GREEN, showReset.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { ChileScreen } from './ChileScreen';
import { evaluateGuess, countGreens } from './evaluateGuess';
import { updateKeyboard } from './updateKeyboard';
import type { ColorTile } from './evaluateGuess';
import type { ChileData } from './chilePreProcess';

const DEFAULT_BASE_GUESS_COUNT = 8;

type RouteParams = Record<string, string | string[] | undefined>;

function buildInitialGuessTiles(guessCount: number, wordLength: number): ColorTile[] {
  return Array.from({ length: guessCount * wordLength }, () => ({ text: '', color: 'EMPTY' as const }));
}

function buildKeyTiles(keys: string[]): ColorTile[] {
  return keys.map((text) => ({ text, color: 'KEY' as const }));
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j] as T;
    out[j] = tmp as T;
  }
  return out;
}

function ChileGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const assets = useLangAssets();
  const audio = useAudio();
  const chileData = usePrecompute<ChileData>('chile');

  // Read baseGuessCount from settings (Chile.java:309)
  const baseGuessCount = useMemo(
    () => assets.settings.findInt('Chile base guess count', DEFAULT_BASE_GUESS_COUNT),
    [assets.settings],
  );

  const guessCount = Math.max(1, baseGuessCount - challengeLevel + 1);

  // Initialize shuffled word list and pop initial secret from the SAME shuffle
  // (Chile.java:111-114 — single shuffle, then remove last as secret).
  const initialShuffle = useMemo(() => shuffleArray(chileData.words), [chileData.words]);
  const [secret, setSecret] = useState<string[]>(
    () => initialShuffle[initialShuffle.length - 1] ?? [],
  );
  const [wordList, setWordList] = useState<string[][]>(
    () => initialShuffle.slice(0, -1),
  );

  const [guessTiles, setGuessTiles] = useState<ColorTile[]>(() =>
    buildInitialGuessTiles(guessCount, secret.length),
  );

  const [keyTiles, setKeyTiles] = useState<ColorTile[]>(() =>
    buildKeyTiles(chileData.keys),
  );

  const [currentRow, setCurrentRow] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const wordLength = secret.length;

  const onKeyPress = useCallback(
    (tileText: string) => {
      if (finished) return;
      setGuessTiles((prev) => {
        const next = [...prev];
        const rowStart = currentRow * wordLength;
        const rowEnd = rowStart + wordLength;
        for (let i = rowStart; i < rowEnd; i++) {
          if (next[i]?.text === '') {
            next[i] = { text: tileText, color: 'EMPTY' };
            break;
          }
        }
        return next;
      });
    },
    [finished, currentRow, wordLength],
  );

  const onBackspace = useCallback(() => {
    if (finished) return;
    setGuessTiles((prev) => {
      const next = [...prev];
      const rowStart = currentRow * wordLength;
      const rowEnd = rowStart + wordLength;
      for (let i = rowEnd - 1; i >= rowStart; i--) {
        if (next[i]?.text !== '') {
          next[i] = { text: '', color: 'EMPTY' };
          break;
        }
      }
      return next;
    });
  }, [finished, currentRow, wordLength]);

  const onSubmitGuess = useCallback(() => {
    if (finished) return;

    // Extract current row tiles
    const rowStart = currentRow * wordLength;
    const rowTiles = guessTiles.slice(rowStart, rowStart + wordLength);

    // Guard: row must be fully filled
    if (rowTiles.some((t) => t.text === '')) return;

    const guess = rowTiles.map((t) => t.text);
    const evaluated = evaluateGuess(guess, secret);
    const greens = countGreens(evaluated);

    // Apply evaluated colors to guessTiles
    setGuessTiles((prev) => {
      const next = [...prev];
      for (let i = 0; i < wordLength; i++) {
        next[rowStart + i] = evaluated[i] ?? { text: guess[i] ?? '', color: 'GRAY' };
      }
      return next;
    });

    // Update keyboard
    setKeyTiles((prev) => updateKeyboard(prev, evaluated));

    const isWin = greens === wordLength;
    const isLastRow = currentRow === guessCount - 1;

    if (isWin) {
      setFinished(true);
      setShowReset(true);
      shell.incrementPointsAndTracker(true);
      void audio.playCorrect();
    } else if (isLastRow) {
      // Append secret row in REVEAL color: GREEN bg + YELLOW text (Chile.java:268–271).
      const answerTiles: ColorTile[] = secret.map((text) => ({ text, color: 'REVEAL' as const }));
      setGuessTiles((prev) => [...prev, ...answerTiles]);
      setFinished(true);
      setShowReset(true);
      void audio.playIncorrect();
    } else {
      setCurrentRow((r) => r + 1);
    }
  }, [finished, currentRow, wordLength, guessTiles, secret, guessCount, shell, audio]);

  // Wire the shell's advance arrow to onReset (Chile.java:282 setOptionsRowClickable parity).
  // Defined below; registered via effect after declaration.
  // TODO(chile-spec-drift): DEFERRED — needs game-engine-base extension.
  //   GameShellContextValue (libs/alphaTiles/feature-game-shell/src/lib/GameShellContext.tsx)
  //   exposes only setOnAdvance / setOnRepeat — no APIs for advance-arrow color or
  //   options-row clickability. Spec D7 (Win) and D8 (Lose) require:
  //     - shell.setAdvanceArrowToBlue() on win/lose, setAdvanceArrowToGray() on reset
  //     - shell.setOptionsRowClickable() / setOptionsRowUnclickable() to gate footer chrome
  //   Per agent protocol, do NOT add new shell APIs from here; track as a separate
  //   game-engine-base proposal (extend GameShellContextValue with
  //   setAdvanceArrowColor + setOptionsRowEnabled, then re-wire here).
  const onReset = useCallback(() => {
    if (!finished) return;

    // Refill wordList if empty
    let list = wordList;
    if (list.length === 0) {
      list = shuffleArray(chileData.words);
    }

    const newSecret = list[list.length - 1] ?? secret;
    const newList = list.slice(0, list.length - 1);

    setSecret(newSecret);
    setWordList(newList);
    setGuessTiles(buildInitialGuessTiles(guessCount, newSecret.length));
    setKeyTiles(buildKeyTiles(chileData.keys));
    setCurrentRow(0);
    setFinished(false);
    setShowReset(false);
  }, [finished, wordList, chileData.words, chileData.keys, guessCount, secret]);

  // Register onReset as the shell's advance handler (Chile.java reset = advance arrow).
  useEffect(() => {
    shell.setOnAdvance(onReset);
    return () => shell.setOnAdvance(null);
  }, [shell, onReset]);

  // RTL icon flip — Chile.java:87–90. Mirror the backspace/reset glyphs when
  // the language pack's "Script direction" is RTL. Same pattern as
  // feature-game-iraq (IraqContainer.tsx) and feature-game-malaysia.
  const scriptDirection = assets.langInfo.find('Script direction') ?? 'LTR';
  const rtl = scriptDirection.toUpperCase() === 'RTL';

  return (
    <ChileScreen
      guessTiles={guessTiles}
      keyTiles={keyTiles}
      wordLength={wordLength}
      guessCount={guessCount}
      keyboardWidth={chileData.keyboardWidth}
      onKeyPress={onKeyPress}
      onBackspace={onBackspace}
      onSubmitGuess={onSubmitGuess}
      showReset={showReset}
      onReset={onReset}
      rtl={rtl}
    />
  );
}

export function ChileContainer(props: RouteParams): React.JSX.Element {
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
      <ChileGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
