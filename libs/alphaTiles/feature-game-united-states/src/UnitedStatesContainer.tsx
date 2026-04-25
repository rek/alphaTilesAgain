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


function UnitedStatesGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
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
    shell.setInteractionLocked(false);
    shell.setRefWord({
      wordInLOP: result.word.wordInLOP,
      wordInLWC: result.word.wordInLWC,
    });
  }, [unitedStatesData, challengeLevel, assets, shell]);

  // One-shot mount kickoff
  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTilePress = useCallback(
    (pairIndex: number, tileIndex: 0 | 1) => {
      if (shell.interactionLocked) return;
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
            shell.setInteractionLocked(true);
            shell.incrementPointsAndTracker(true);
            audio.playCorrectFinal();
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
    [shell, roundData, audio, startRound],
  );

  const onImagePress = useCallback(() => {
    if (!roundData) return;
    audio.playWord(roundData.word.wordInLWC);
  }, [roundData, audio]);

  // Derived: constructed word string; use "_" for unselected positions
  const constructedWord = useMemo(() => {
    if (!roundData) return '';
    return roundData.pairs
      .map((pair, idx) => {
        const sel = selections[idx];
        if (sel === null) return '_';
        return sel === 0 ? pair.top : pair.bottom;
      })
      .join('');
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

  if (error === 'insufficient-content') {
    return (
      <UnitedStatesScreen
        pairs={[]}
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
      selections={selections}
      constructedWord={constructedWord}
      themeColors={themeColors}
      wordImageSrc={wordImageSrc}
      wordLabel={roundData.word.wordInLWC}
      interactionLocked={shell.interactionLocked}
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
