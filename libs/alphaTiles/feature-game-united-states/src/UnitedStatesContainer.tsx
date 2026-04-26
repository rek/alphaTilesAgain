/**
 * Container for the United States pairing/spelling game.
 *
 * UnitedStatesContainer renders GameShellContainer (outer);
 * UnitedStatesGame is the inner component that calls useGameShell()
 * and owns all game state.
 *
 * Port of UnitedStates.java — see design.md for the full mapping table.
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { UnitedStatesScreen } from './UnitedStatesScreen';
import { setupRound } from './setupRound';
import type { RoundData } from './setupRound';
import type { UnitedStatesData } from './buildUnitedStatesData';

type RouteParams = Record<string, string | string[] | undefined>;


/**
 * Java fixes the slot count per layout (UnitedStates.java:130-139):
 *   cl1 → 10 buttons (5 pairs), cl2 → 14 (7 pairs), cl3 → 18 (9 pairs).
 * The loop renders all slots and hides extras via View.INVISIBLE (lines 186-191).
 * We mirror that pre-render+hide pattern by passing a fixed `slotCount` to the
 * presenter; trailing slots become invisible placeholders.
 */
function slotCountForLevel(challengeLevel: number): number {
  if (challengeLevel >= 3) return 9;
  if (challengeLevel === 2) return 7;
  return 5;
}

// TODO(united-states-spec-drift): Syllable-mode (Java `syllableGame.equals("S")`,
// lines 137-139, 163-165, 173-175, 192, 202, 221-231) is unimplemented. Scope:
//   1. Precompute: parse refWord into syllables (parsedRefWordSyllableArray) and
//      surface a per-syllable distractor list, gated on pack mode `S`.
//   2. setupRound: branch tile vs syllable selection per-pair, honoring the
//      Java SAD_STRINGS exclusion that falls back to tile mode for sad syllables.
//   3. buildWord: when in syllable mode the constructed string concatenates two
//      `selections[]` cells per pair (Java 222-228) instead of one.
//   4. Pack assets: requires syllable list + audio + the SAD_STRINGS data hook.
// Defer until a syllable-mode pack ships and util-phoneme exposes a syllable parse.
function UnitedStatesGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const {
    setRefWord, setInteractionLocked, incrementPointsAndTracker,
    interactionLocked,
  } = shell;
  const audio = useAudio();
  const assets = useLangAssets();
  const unitedStatesData = usePrecompute<UnitedStatesData>('united-states');

  const [roundData, setRoundData] = useState<RoundData | null>(null);
  /** Per-pair selection: index 0 = top selected, 1 = bottom selected, null = none */
  const [selections, setSelections] = useState<(0 | 1 | null)[]>([]);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const isMountedRef = useRef(true);
  const nextRoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (nextRoundTimer.current) clearTimeout(nextRoundTimer.current);
    };
  }, []);

  const startRound = useCallback(() => {
    if (nextRoundTimer.current) clearTimeout(nextRoundTimer.current);

    const result = setupRound({ unitedStatesData, challengeLevel, assets });
    if ('error' in result) {
      setError('insufficient-content');
      return;
    }

    setRoundData(result);
    setSelections(new Array(result.pairs.length).fill(null));
    setError(null);
    setInteractionLocked(false);
    setRefWord({
      wordInLOP: result.word.wordInLOP,
      wordInLWC: result.word.wordInLWC,
    });
  }, [unitedStatesData, challengeLevel, assets, setInteractionLocked, setRefWord]);

  // One-shot mount kickoff
  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTilePress = useCallback(
    (pairIndex: number, tileIndex: 0 | 1) => {
      if (interactionLocked) return;
      if (!roundData) return;

      setSelections((prev) => {
        const next = [...prev];
        next[pairIndex] = tileIndex;

        // Check win condition after this selection
        const allSelected = next.every((s) => s !== null);
        if (allSelected) {
          const win = next.every((sel, idx) => {
            const pair = roundData.pairs[idx];
            if (!pair) return false;
            const selectedText = sel === 0 ? pair.top : pair.bottom;
            const correctText = pair.correct === 'top' ? pair.top : pair.bottom;
            return selectedText === correctText;
          });

          if (win) {
            setInteractionLocked(true);
            incrementPointsAndTracker(true);
            // Java line 296: playCorrectSoundThenActiveWordClip(false) — chime + word, NO final fanfare
            void (async () => {
              await audio.playCorrect();
              if (!isMountedRef.current) return;
              await audio.playWord(roundData.word.wordInLWC);
            })();
            nextRoundTimer.current = setTimeout(() => {
              if (isMountedRef.current) {
                startRound();
              }
            }, 1200);
          }
        }

        return next;
      });
    },
    [interactionLocked, setInteractionLocked, incrementPointsAndTracker, roundData, audio, startRound],
  );

  const onImagePress = useCallback(() => {
    if (!roundData) return;
    audio.playWord(roundData.word.wordInLWC);
  }, [roundData, audio]);

  // Derived: constructed word string; "__" (double underscore) per unselected pair
  // per Java line 229-231 — initial display = N copies of "__"
  const constructedWord = useMemo(() => {
    if (!roundData) return '';
    return roundData.pairs
      .map((pair, idx) => {
        const sel = selections[idx];
        if (sel === null) return '__';
        return sel === 0 ? pair.top : pair.bottom;
      })
      .join('');
  }, [roundData, selections]);

  // Win iff every pair has the correct slot selected (Java 282-296)
  const isWin = useMemo(() => {
    if (!roundData || selections.length === 0) return false;
    return selections.every((sel, idx) => {
      if (sel === null) return false;
      const pair = roundData.pairs[idx];
      return (sel === 0 ? 'top' : 'bottom') === pair.correct;
    });
  }, [roundData, selections]);

  // Theme colors for each pair (cycle through first 5 colors)
  const themeColors = useMemo(
    () => assets.colors.hexByIndex.slice(0, 5),
    [assets.colors.hexByIndex],
  );

  const wordImageSrc = useMemo((): ImageSourcePropType | undefined => {
    if (!roundData) return undefined;
    return assets.images.words[roundData.word.wordInLWC] as ImageSourcePropType | undefined;
  }, [roundData, assets.images.words]);

  const slotCount = slotCountForLevel(challengeLevel);

  if (error === 'insufficient-content') {
    return (
      <UnitedStatesScreen
        pairs={[]}
        slotCount={slotCount}
        selections={[]}
        constructedWord={''}
        themeColors={[]}
        wordImageSrc={undefined}
        wordLabel={''}
        interactionLocked
        onTilePress={() => undefined}
        onImagePress={() => undefined}
      />
    );
  }

  if (!roundData) return <></>;

  return (
    <UnitedStatesScreen
      pairs={roundData.pairs}
      slotCount={slotCount}
      selections={selections}
      constructedWord={constructedWord}
      themeColors={themeColors}
      wordImageSrc={wordImageSrc}
      wordLabel={roundData.word.wordInLWC}
      interactionLocked={interactionLocked}
      isWin={isWin}
      onTilePress={onTilePress}
      onImagePress={onImagePress}
    />
  );
}

export function UnitedStatesContainer(props: RouteParams): React.JSX.Element {
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
      <UnitedStatesGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
