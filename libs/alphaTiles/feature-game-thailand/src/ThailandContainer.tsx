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
import { ThailandScreen } from './ThailandScreen';
import type { ThailandRefDisplay, ThailandChoiceDisplay } from './ThailandScreen';

type RouteParams = Record<string, string | string[] | undefined>;

const MAX_RECENT = 3;
const ADVANCE_DELAY_MS = 1200;

function buildRefDisplay(
  ref: ThailandRef,
  imageSource: ImageSourcePropType | undefined,
  refColor: string,
): ThailandRefDisplay {
  // TODO(thailand-spec-drift): WORD_TEXT must strip instruction chars (#,.) and render
  // black text on white bg per Java 305-309. Currently uses raw wordInLOP and the
  // global refText style is white (should be black for WORD_TEXT).
  switch (ref.display) {
    case 'TILE_LOWER':
      return { type: 'text', text: ref.kind === 'tile' ? ref.tileRow.base : '', refColor };
    case 'TILE_UPPER':
      return { type: 'text', text: ref.kind === 'tile' ? (ref.tileRow.upper || ref.tileRow.base) : '', refColor };
    case 'TILE_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'WORD_TEXT':
      return { type: 'text', text: ref.kind === 'word' ? ref.wordRow.wordInLOP : '', refColor: '#FFFFFF' };
    case 'WORD_IMAGE':
      return { type: 'image', imageSource, wordLabel: ref.kind === 'word' ? ref.wordRow.wordInLWC : '' };
    case 'WORD_AUDIO':
      return { type: 'audio', refType: ref.display };
    case 'SYLLABLE_TEXT':
      return { type: 'text', text: ref.kind === 'syllable' ? ref.syllableRow.syllable : '', refColor };
    case 'SYLLABLE_AUDIO':
      return { type: 'audio', refType: ref.display };
    default:
      return { type: 'text', text: '', refColor };
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
  return { type: 'text', text: wordRow.wordInLOP };
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
  // TODO(thailand-spec-drift): track incorrectAnswersSelected (cap 3 distinct entries) and
  // incorrectOnLevel per Java 618-630; lock all 4 buttons after correct tap and apply
  // refColor (non-WORD_IMAGE) or whiten others (WORD_IMAGE) per Java 588-595.
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

      if (index === round.correctIndex) {
        setCorrectIndex(index);
        shell.incrementPointsAndTracker(true);
        audio.playCorrect().then(() => {
          playRefAudio(round.ref);
        });

        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            startRound();
          }
        }, ADVANCE_DELAY_MS);
        return () => clearTimeout(timer);
      } else {
        audio.playIncorrect();
      }
    },
    [round, shell, audio, playRefAudio, startRound],
  );

  const onRefPress = useCallback(() => {
    if (!round) return;
    playRefAudio(round.ref);
  }, [round, playRefAudio]);

  if (error === 'insufficient-content') {
    return (
      <ThailandScreen
        refDisplay={{ type: 'text', text: '?', refColor: '#999' }}
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

  return (
    <ThailandScreen
      refDisplay={refDisplay}
      choices={choiceDisplays}
      correctIndex={correctIndex}
      interactionLocked={shell.interactionLocked}
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
