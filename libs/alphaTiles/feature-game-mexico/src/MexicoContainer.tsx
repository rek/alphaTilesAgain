/**
 * Container for the Mexico matching/memory game.
 *
 * MexicoContainer renders GameShellContainer (outer); MexicoGame is the inner
 * component that calls useGameShell() and owns all game state.
 *
 * Port of Mexico.java — see design.md for the full mapping table.
 *
 * State machine:
 *   - cards: CardState[] (HIDDEN | REVEALED | PAIRED)
 *   - firstIdx: number | null — first selected card
 *   - secondIdx: number | null — second selected card
 *   - pairsCompleted: number
 *
 * On secondIdx set: 800ms delay, then match check.
 *   Match → mark PAIRED, play word audio, check win.
 *   No match → wait FLIP_BACK_DELAY (from settings, default 0), then flip back.
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { MexicoScreen } from './MexicoScreen';
import { setupMexicoBoard } from './setupMexicoBoard';
import type { CardState } from './setupMexicoBoard';
import type { MexicoData } from './buildMexicoData';

/** Mexico.java:86–106 — challengeLevel → pair count */
const PAIRS_BY_CHALLENGE: Record<number, number> = {
  1: 3,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
};

/** Time to show the second card before checking for a match (Mexico.java line 261: 800ms). */
const REVEAL_DELAY_MS = 800;

type RouteParams = Record<string, string | string[] | undefined>;

function MexicoGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();
  const mexicoData = usePrecompute<MexicoData>('mexico');

  const pairCount = PAIRS_BY_CHALLENGE[challengeLevel] ?? 3;

  // Read flip-back delay from settings (Mexico.java:331–337)
  const flipBackDelayMs = useMemo(
    () => assets.settings.findInt('View memory cards for _ milliseconds', 0),
    [assets.settings],
  );

  // Game state
  const [cards, setCards] = useState<CardState[]>([]);
  const [firstIdx, setFirstIdx] = useState<number | null>(null);
  const [error, setError] = useState<'insufficient-content' | null>(null);

  // Track interaction lock for the match-check delay window
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const startRound = useCallback(() => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);

    const result = setupMexicoBoard(mexicoData.validMatchingWords, pairCount);
    if ('error' in result) {
      setError('insufficient-content');
      return;
    }

    setCards(result.cards);
    setFirstIdx(null);
    setError(null);
    shell.setInteractionLocked(false);
  }, [mexicoData, pairCount, shell]);

  // One-shot mount kickoff
  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle match check after REVEAL_DELAY_MS.
   * Called via setTimeout — fIdx/sIdx captured via closure.
   */
  const checkMatch = useCallback(
    (fIdx: number, sIdx: number, currentCards: CardState[]) => {
      if (!isMountedRef.current) return;

      const cardA = currentCards[fIdx];
      const cardB = currentCards[sIdx];

      if (cardA.word.wordInLWC === cardB.word.wordInLWC) {
        // Match! Mark both as PAIRED
        const updated = currentCards.map((c, i) =>
          i === fIdx || i === sIdx ? { ...c, status: 'PAIRED' as const } : c,
        );
        const newPairsCompleted = updated.filter((c) => c.status === 'PAIRED').length / 2;

        setCards(updated);
        setFirstIdx(null);
        shell.setInteractionLocked(false);

        // Play word audio for the matched word (Mexico.java:313–322)
        audio.playWord(cardA.word.wordInLWC);

        if (newPairsCompleted >= pairCount) {
          // All pairs matched — win!
          shell.incrementPointsAndTracker(true);
          audio.playCorrectFinal();
        }
      } else {
        // No match — wait flipBackDelayMs, then flip cards back
        flipTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setCards((prev) =>
            prev.map((c, i) =>
              i === fIdx || i === sIdx ? { ...c, status: 'HIDDEN' as const } : c,
            ),
          );
          setFirstIdx(null);
          shell.setInteractionLocked(false);
        }, flipBackDelayMs);
      }
    },
    [audio, shell, pairCount, flipBackDelayMs],
  );

  const onCardPress = useCallback(
    (index: number) => {
      if (shell.interactionLocked) return;

      const card = cards[index];
      if (!card) return;

      // Ignore already-paired cards
      if (card.status === 'PAIRED') return;
      // Ignore already-revealed (same card tapped twice)
      if (card.status === 'REVEALED') return;

      if (firstIdx === null) {
        // First card selection
        const updated = cards.map((c, i) =>
          i === index ? { ...c, status: 'REVEALED' as const } : c,
        );
        setCards(updated);
        setFirstIdx(index);
      } else {
        // Second card selection — reveal and lock interaction
        const updated = cards.map((c, i) =>
          i === index ? { ...c, status: 'REVEALED' as const } : c,
        );
        setCards(updated);
        shell.setInteractionLocked(true);

        // Capture updated cards + indices for the timeout closure
        revealTimerRef.current = setTimeout(() => {
          checkMatch(firstIdx, index, updated);
        }, REVEAL_DELAY_MS);
      }
    },
    [cards, firstIdx, shell, checkMatch],
  );

  const wordImages = useMemo(() => {
    const map: Record<string, ImageSourcePropType | undefined> = {};
    for (const card of cards) {
      if (card.mode === 'IMAGE') {
        map[card.word.wordInLWC] = assets.images.words[card.word.wordInLWC] as
          | ImageSourcePropType
          | undefined;
      }
    }
    return map;
  }, [cards, assets.images.words]);

  // Game color for paired cards (Mexico.java:307: colorList.get(cardHitA % 5))
  const themeColor = useMemo(() => {
    // Use colorIndex 0 as the default theme color for paired cards
    return assets.colors.hexByIndex[0] ?? '#4CAF50';
  }, [assets.colors.hexByIndex]);

  // Logo source — static require, must not be dynamic (Metro constraint)
  const logoSource = assets.images.icon as ImageSourcePropType;

  if (error === 'insufficient-content') {
    return (
      <MexicoScreen
        cards={[]}
        wordImages={{}}
        logoSource={logoSource}
        themeColor={themeColor}
        interactionLocked
        onCardPress={() => undefined}
      />
    );
  }

  if (cards.length === 0) return <></>;

  return (
    <MexicoScreen
      cards={cards}
      wordImages={wordImages}
      logoSource={logoSource}
      themeColor={themeColor}
      interactionLocked={shell.interactionLocked}
      onCardPress={onCardPress}
    />
  );
}

export function MexicoContainer(props: RouteParams): React.JSX.Element {
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
      <MexicoGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
