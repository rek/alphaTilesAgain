import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  GameShellContainer,
  useGameShell,
} from '@alphaTiles/feature-game-shell';
import { decodeThailandChallengeLevel } from './decodeThailandChallengeLevel';
import { setupThailandRound } from './setupThailandRound';
import type { ThailandRound, ThailandRef, ThailandChoice } from './setupThailandRound';
import { stripInstructionCharacters } from './stripInstructionCharacters';
import { ThailandScreen } from './ThailandScreen';
import type {
  ThailandRefDisplay,
  ThailandChoiceDisplay,
  ThailandChoiceFeedback,
} from './ThailandScreen';

type RouteParams = Record<string, string | string[] | undefined>;

const MAX_RECENT = 3;
const ADVANCE_DELAY_MS = 1200;
const MAX_INCORRECT_TRACKED = 3;

function buildRefDisplay(
  ref: ThailandRef,
  imageSource: ImageSourcePropType | undefined,
  refColor: string,
): ThailandRefDisplay {
  // Java 291-320 dictates per-display rendering. WORD_TEXT specifically
  // renders stripInstructionCharacters(wordInLOP) on a white background with
  // black text (Java 305-309); other text refs use refColor bg + white text.
  switch (ref.display) {
    case 'TILE_LOWER':
      return {
        type: 'text',
        text: ref.kind === 'tile' ? ref.tileRow.base : '',
        backgroundColor: refColor,
        textColor: '#FFFFFF',
      };
    case 'TILE_UPPER':
      return {
        type: 'text',
        text: ref.kind === 'tile' ? (ref.tileRow.upper || ref.tileRow.base) : '',
        backgroundColor: refColor,
        textColor: '#FFFFFF',
      };
    case 'TILE_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'WORD_TEXT':
      return {
        type: 'text',
        text: ref.kind === 'word' ? stripInstructionCharacters(ref.wordRow.wordInLOP) : '',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      };
    case 'WORD_IMAGE':
      return { type: 'image', imageSource, wordLabel: ref.kind === 'word' ? ref.wordRow.wordInLWC : '' };
    case 'WORD_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'SYLLABLE_TEXT':
      return {
        type: 'text',
        text: ref.kind === 'syllable' ? ref.syllableRow.syllable : '',
        backgroundColor: refColor,
        textColor: '#FFFFFF',
      };
    case 'SYLLABLE_AUDIO':
      return { type: 'audio', refType: ref.display };
    default:
      return { type: 'text', text: '', backgroundColor: refColor, textColor: '#FFFFFF' };
  }
}

function buildChoiceDisplay(
  choice: ThailandChoice,
  imageSource: ImageSourcePropType | undefined,
): ThailandChoiceDisplay {
  if (choice.kind === 'tile') {
    return { type: 'text', text: choice.displayText };
  }
  if (choice.kind === 'syllable') {
    return { type: 'text', text: choice.syllableRow.syllable };
  }
  const wordRow = choice.wordRow;
  if (imageSource !== undefined) {
    return { type: 'image', imageSource, wordLabel: wordRow.wordInLWC };
  }
  return { type: 'text', text: stripInstructionCharacters(wordRow.wordInLOP) };
}

function ThailandGame({ challengeLevel }: { challengeLevel: number }): React.JSX.Element {
  const shell = useGameShell();
  const audio = useAudio();
  const assets = useLangAssets();

  const { distractorStrategy, refType, choiceType } = decodeThailandChallengeLevel(challengeLevel);

  const [round, setRound] = useState<ThailandRound | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [error, setError] = useState<'insufficient-content' | null>(null);
  const [refColor, setRefColor] = useState<string>('#1565C0');
  const recentRefStrings = useRef<string[]>([]);
  // Java 618-630 parity: per-round set of distinct wrong-answer texts (cap 3).
  // Resets each round. We also keep a running level counter for diagnostics.
  const incorrectAnswersSelected = useRef<string[]>([]);
  const incorrectOnLevel = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const playRefAudio = useCallback(
    (ref: ThailandRef) => {
      if (ref.kind === 'tile') {
        audio.playTile(ref.tileRow.audioName);
      } else if (ref.kind === 'word') {
        audio.playWord(ref.wordRow.wordInLWC);
        shell.setRefWord({ wordInLOP: ref.wordRow.wordInLOP, wordInLWC: ref.wordRow.wordInLWC });
      } else if (ref.kind === 'syllable') {
        audio.playSyllable(ref.syllableRow.audioName);
      }
    },
    [audio, shell],
  );

  const startRound = useCallback(() => {
    const result = setupThailandRound({
      refType,
      choiceType,
      distractorStrategy,
      tiles: assets.tiles.rows,
      words: assets.words.rows,
      syllables: assets.syllables.rows,
      recentRefStrings: recentRefStrings.current,
    });

    if ('error' in result) {
      setError('insufficient-content');
      return;
    }

    const refKey =
      result.ref.kind === 'tile'
        ? result.ref.tileRow.base
        : result.ref.kind === 'word'
        ? result.ref.wordRow.wordInLOP
        : result.ref.syllableRow.syllable;

    recentRefStrings.current = [refKey, ...recentRefStrings.current].slice(0, MAX_RECENT);

    // Java 140: refColor = colorList[rand.nextInt(4)] — random of first 4 entries.
    const palette = assets.colors?.hexByIndex ?? [];
    if (palette.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(4, palette.length));
      setRefColor(palette[idx] ?? '#1565C0');
    }

    setRound(result);
    setCorrectIndex(null);
    setError(null);
    incorrectAnswersSelected.current = [];

    playRefAudio(result.ref);
  }, [refType, choiceType, distractorStrategy, assets, playRefAudio]);

  useEffect(() => {
    startRound();
  // mount-only — acceptable empty-deps useEffect per CODE_STYLE.md §Hooks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChoicePress = useCallback(
    (index: number) => {
      if (!round) return;
      if (shell.interactionLocked) return;
      // Java 588: once correct, all 4 buttons go non-clickable until next round.
      if (correctIndex !== null) return;

      if (index === round.correctIndex) {
        setCorrectIndex(index);
        shell.setInteractionLocked(true);
        shell.incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          playRefAudio(round.ref);
        });

        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            shell.setInteractionLocked(false);
            startRound();
          }
        }, ADVANCE_DELAY_MS);
        return () => clearTimeout(timer);
      }

      // Java 618-630: incorrect tap -> chime, incorrectOnLevel++, distinct
      // wrong-answer text appended (capped at 3); buttons stay clickable.
      audio.playIncorrect();
      incorrectOnLevel.current += 1;
      const chosen = round.choices[index];
      const chosenText =
        chosen.kind === 'tile'
          ? chosen.displayText
          : chosen.kind === 'syllable'
          ? chosen.syllableRow.syllable
          : stripInstructionCharacters(chosen.wordRow.wordInLOP);
      const list = incorrectAnswersSelected.current;
      if (!list.includes(chosenText) && list.length < MAX_INCORRECT_TRACKED) {
        incorrectAnswersSelected.current = [...list, chosenText];
      }
    },
    [round, shell, audio, playRefAudio, startRound, correctIndex],
  );

  const onRefPress = useCallback(() => {
    if (!round) return;
    playRefAudio(round.ref);
  }, [round, playRefAudio]);

  if (error === 'insufficient-content') {
    return (
      <ThailandScreen
        refDisplay={{ type: 'text', text: '?', backgroundColor: '#999', textColor: '#FFFFFF' }}
        choices={[
          { type: 'text', text: '' },
          { type: 'text', text: '' },
          { type: 'text', text: '' },
          { type: 'text', text: '' },
        ]}
        correctIndex={null}
        interactionLocked
        onChoicePress={() => undefined}
        onRefPress={() => undefined}
        accessibilityRefLabel="error"
        accessibilityChoiceLabels={['', '', '', '']}
      />
    );
  }

  if (!round) return <></>;

  const refImageSource =
    round.ref.kind === 'word' && round.ref.display === 'WORD_IMAGE'
      ? (assets.images.words[round.ref.wordRow.wordInLWC] as ImageSourcePropType | undefined)
      : undefined;

  const refDisplay = buildRefDisplay(round.ref, refImageSource, refColor);

  const choiceDisplays = round.choices.map((choice): ThailandChoiceDisplay => {
    if (choice.kind === 'word' && choiceType === 'WORD_IMAGE') {
      const imgSrc = assets.images.words[choice.wordRow.wordInLWC] as ImageSourcePropType | undefined;
      return { type: 'image', imageSource: imgSrc, wordLabel: choice.wordRow.wordInLWC };
    }
    return buildChoiceDisplay(choice, undefined);
  }) as [ThailandChoiceDisplay, ThailandChoiceDisplay, ThailandChoiceDisplay, ThailandChoiceDisplay];

  const choiceLabels = round.choices.map((c): string => {
    if (c.kind === 'tile') return c.displayText;
    if (c.kind === 'syllable') return c.syllableRow.syllable;
    return c.wordRow.wordInLWC;
  }) as [string, string, string, string];

  const refLabel =
    round.ref.kind === 'tile'
      ? round.ref.tileRow.base
      : round.ref.kind === 'word'
      ? round.ref.wordRow.wordInLWC
      : round.ref.syllableRow.syllable;

  // Java 588-595: encode the per-choice correct-tap feedback colours.
  //   - WORD_IMAGE: the THREE non-correct buttons get a white background.
  //   - other choiceTypes: the correct button gets refColor + white text.
  const buildFeedback = (i: 0 | 1 | 2 | 3): ThailandChoiceFeedback => {
    if (correctIndex === null) return null;
    if (choiceType === 'WORD_IMAGE') {
      return i === correctIndex ? null : { backgroundColor: '#FFFFFF' };
    }
    return i === correctIndex
      ? { backgroundColor: refColor, textColor: '#FFFFFF' }
      : null;
  };
  const choiceFeedback: [
    ThailandChoiceFeedback,
    ThailandChoiceFeedback,
    ThailandChoiceFeedback,
    ThailandChoiceFeedback,
  ] = [buildFeedback(0), buildFeedback(1), buildFeedback(2), buildFeedback(3)];

  return (
    <ThailandScreen
      refDisplay={refDisplay}
      choices={choiceDisplays}
      correctIndex={correctIndex}
      choiceFeedback={choiceFeedback}
      interactionLocked={shell.interactionLocked || correctIndex !== null}
      onChoicePress={onChoicePress}
      onRefPress={onRefPress}
      accessibilityRefLabel={refLabel}
      accessibilityChoiceLabels={choiceLabels}
    />
  );
}

export function ThailandContainer(props: RouteParams): React.JSX.Element {
  const assets = useLangAssets();
  const gameNumber = parseInt((props.gameNumber as string) ?? '1', 10);
  const challengeLevel = parseInt((props.challengeLevel as string) ?? '111', 10);
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
      <ThailandGame challengeLevel={challengeLevel} />
    </GameShellContainer>
  );
}
