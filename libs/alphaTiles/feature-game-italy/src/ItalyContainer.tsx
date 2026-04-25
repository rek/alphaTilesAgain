/**
 * Container for the Italy Lotería game.
 *
 * Port of Italy.java (~328 LOC) — see openspec/changes/game-italy/design.md.
 *
 * State machine:
 *   - source list = wordList for T variant, syllableList for S variant.
 *   - On mount: setupRound builds board (16) + deck (deckSize). deckIndex=0.
 *     If source < deckSize, navigate back to /earth (Italy.java:204-211).
 *   - onTilePress: text-match check. Correct → cover + win check. Wrong → incorrect chime.
 *   - On lotería: mark winning sequence, +4 points, play celebration audio.
 *   - On non-winning correct: auto-advance after a short pause.
 *   - On advance after deckIndex === deckSize - 1 without lotería: incorrect ×2 + reset.
 *   - On advance after lotería: reset (new round).
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { ItalyScreen } from './ItalyScreen';
import type { ItalyBoardCell } from './ItalyScreen';
import { setupRound } from './setupRound';
import { checkWin } from './checkWin';

const CARDS_ON_BOARD = 16;
const DEFAULT_DECK_SIZE = 54;
const ADVANCE_DELAY_MS = 800;

type Word = LangAssets['words']['rows'][number];
type Syllable = LangAssets['syllables']['rows'][number];

type SourceItem =
  | { kind: 'word'; word: Word }
  | { kind: 'syllable'; syllable: Syllable };

type RouteParams = Record<string, string | string[] | undefined>;

function getCallText(item: SourceItem): string {
  return item.kind === 'word' ? item.word.wordInLOP : item.syllable.syllable;
}

function ItalyGame({ syllableGame }: { syllableGame: string }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const router = useRouter();
  const { t } = useTranslation('chrome');

  const isSyllable = syllableGame === 'S';

  // Italy.java:111-119 — read deckSize, clamp >= CARDS_ON_BOARD.
  const deckSize = useMemo(() => {
    const raw = assets.settings.findInt('Italy Deck Size', DEFAULT_DECK_SIZE);
    return Math.max(CARDS_ON_BOARD, raw);
  }, [assets.settings]);

  // Italy.java:224 — text color cycles colorList[i % 5].
  const cellTextColors = useMemo(() => {
    const palette = assets.colors.hexByIndex;
    return Array.from({ length: CARDS_ON_BOARD }, (_, i) => palette[i % 5] ?? '#000000');
  }, [assets.colors.hexByIndex]);

  const sourceItems = useMemo<SourceItem[]>(() => {
    if (isSyllable) {
      return assets.syllables.rows.map((syllable) => ({ kind: 'syllable', syllable }));
    }
    return assets.words.rows.map((word) => ({ kind: 'word', word }));
  }, [isSyllable, assets.syllables.rows, assets.words.rows]);

  const [board, setBoard] = useState<ItalyBoardCell[]>([]);
  const [deck, setDeck] = useState<SourceItem[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [won, setWon] = useState(false);
  const [insufficient, setInsufficient] = useState(false);

  const isMountedRef = useRef(true);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playCallAudio = useCallback(
    (item: SourceItem) => {
      if (item.kind === 'word') {
        audio.playWord(item.word.wordInLWC);
      } else {
        audio.playSyllable(item.syllable.audioName);
      }
    },
    [audio],
  );

  const buildBoardCells = useCallback(
    (items: readonly SourceItem[]): ItalyBoardCell[] => {
      return items.map((item, i) => {
        const text = getCallText(item);
        const image: ImageSourcePropType | undefined =
          item.kind === 'word'
            ? (assets.images.wordsAlt[item.word.wordInLWC] as ImageSourcePropType | undefined)
            : undefined;
        return {
          text,
          image,
          covered: false,
          loteria: false,
          textColor: cellTextColors[i] ?? '#000000',
        };
      });
    },
    [assets.images.wordsAlt, cellTextColors],
  );

  const startRound = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    const result = setupRound(sourceItems, deckSize, CARDS_ON_BOARD);
    if ('error' in result) {
      setInsufficient(true);
      // Italy.java:209 — navigate back to country menu / earth.
      router.replace('/earth' as Parameters<typeof router.replace>[0]);
      return;
    }
    setBoard(buildBoardCells(result.board));
    setDeck(result.deck);
    setDeckIndex(0);
    setWon(false);
    setInsufficient(false);
    shell.setInteractionLocked(false);
    playCallAudio(result.deck[0]);
  }, [sourceItems, deckSize, buildBoardCells, router, shell, playCallAudio]);

  // Mount-only kickoff (useMountEffect pattern)
  useEffect(() => {
    startRound();
    return () => {
      isMountedRef.current = false;
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCall = deck[deckIndex] ?? null;

  const advanceCaller = useCallback(() => {
    if (deckIndex >= deck.length - 1) {
      // Italy.java:248-253 — went through the deck without lotería.
      audio.playIncorrect();
      audio.playIncorrect();
      startRound();
      return;
    }
    const next = deck[deckIndex + 1];
    setDeckIndex((i) => i + 1);
    playCallAudio(next);
  }, [deckIndex, deck, audio, playCallAudio, startRound]);

  const onAdvance = useCallback(() => {
    if (insufficient) return;
    if (won) {
      // Lotería reached — advance arrow now resets the round.
      startRound();
      return;
    }
    advanceCaller();
  }, [insufficient, won, advanceCaller, startRound]);

  const onRepeat = useCallback(() => {
    if (currentCall) playCallAudio(currentCall);
  }, [currentCall, playCallAudio]);

  // Wire shell advance arrow + repeat button to our handlers.
  // Re-registers whenever the callbacks' identity changes so the shell
  // always invokes the latest closure.
  useEffect(() => {
    shell.setOnAdvance(onAdvance);
    shell.setOnRepeat(onRepeat);
    return () => {
      shell.setOnAdvance(null);
      shell.setOnRepeat(null);
    };
  }, [shell, onAdvance, onRepeat]);

  const onTilePress = useCallback(
    (boardIndex: number) => {
      if (won || shell.interactionLocked) return;
      const cell = board[boardIndex];
      if (!cell || cell.covered) return;
      if (!currentCall) return;

      if (cell.text !== getCallText(currentCall)) {
        audio.playIncorrect();
        return;
      }

      const nextBoard = board.map((c, i) =>
        i === boardIndex ? { ...c, covered: true } : c,
      );
      const winSeq = checkWin(nextBoard.map((c) => c.covered));

      if (winSeq) {
        const winning = new Set(winSeq);
        const finalBoard = nextBoard.map((c, i) =>
          winning.has(i) ? { ...c, loteria: true } : c,
        );
        setBoard(finalBoard);
        setWon(true);
        // Italy.java:321-324 respondToLoteria() — +4 points, celebration audio.
        shell.incrementPointsAndTracker(true, 4);
        audio.playCorrect().then(() => {
          if (isMountedRef.current) playCallAudio(currentCall);
        });
        return;
      }

      setBoard(nextBoard);
      audio.playCorrect().then(() => {
        if (isMountedRef.current) playCallAudio(currentCall);
      });
      // Auto-advance to the next call after a brief delay so the user hears the chime.
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) advanceCaller();
      }, ADVANCE_DELAY_MS);
    },
    [won, shell, board, currentCall, audio, playCallAudio, advanceCaller],
  );

  const callerLabel = t('replay');

  if (insufficient || board.length === 0 || !currentCall) {
    return (
      <ItalyScreen
        board={[]}
        currentCallText=""
        currentCallImage={undefined}
        won={false}
        disabled
        callerLabel={callerLabel}
        onTilePress={() => undefined}
        onCallerPress={() => undefined}
      />
    );
  }

  const currentCallImage =
    currentCall.kind === 'word'
      ? (assets.images.wordsAlt[currentCall.word.wordInLWC] as ImageSourcePropType | undefined)
      : undefined;

  return (
    <ItalyScreen
      board={board}
      currentCallText={getCallText(currentCall)}
      currentCallImage={currentCallImage}
      won={won}
      disabled={shell.interactionLocked}
      callerLabel={callerLabel}
      onTilePress={onTilePress}
      onCallerPress={onRepeat}
    />
  );
}

export function ItalyContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const syllableGame = (props.syllableGame as string) ?? '';
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
      <ItalyGame syllableGame={syllableGame} />
    </GameShellContainer>
  );
}
