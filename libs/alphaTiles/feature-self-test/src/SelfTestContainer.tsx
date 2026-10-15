/**
 * Self-test (#42): an ungraded self-check. Ten 4-choice questions from the
 * pack's Thailand doors, one answer each, own score at the end. Nothing is
 * stored or reported (design D5) — the run lives in this component's state
 * and is gone when the screen closes.
 */
import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useMountEffect } from '@shared/util-hooks';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useLadderDoors } from '@alphaTiles/data-doors';
import { useAudio, usePackSpeech } from '@alphaTiles/data-audio';
import { thailandRoundView } from '@alphaTiles/feature-game-thailand';
import type { ThailandChoiceFeedback, ThailandRef } from '@alphaTiles/feature-game-thailand';
import { buildSelfTest } from './buildSelfTest';
import type { SelfTestQuestion } from './buildSelfTest';
import { selfTestScore } from './selfTestScore';
import { selfTestSuggestion } from './selfTestSuggestion';
import { SelfTestScreen } from './SelfTestScreen';
import type { SelfTestScreenProps } from './SelfTestScreen';

/** Pause on the revealed answer before the next question (design D3). */
const REVEAL_MS = 1200;
const RIGHT = { backgroundColor: '#2E7D32' };
const WRONG = { backgroundColor: '#C62828' };
const FALLBACK_REF_COLOR = '#1565C0';

function isAudioPrompt(ref: ThailandRef) {
  return ref.display === 'TILE_AUDIO' || ref.display === 'WORD_AUDIO' || ref.display === 'SYLLABLE_AUDIO';
}

function promptSpeechItem(ref: ThailandRef) {
  if (ref.kind === 'tile') return { tile: ref.tileRow };
  if (ref.kind === 'word') return { word: ref.wordRow };
  return { syllable: ref.syllableRow };
}

function SelfTestRun({ onTryAgain }: { onTryAgain: () => void }): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const assets = useLangAssets();
  const doors = useLadderDoors();
  const audio = useAudio();
  const { speak } = usePackSpeech({ words: assets.words.rows, syllables: assets.syllables.rows });

  // One run per mount; "Try again" remounts via `key` (design D7).
  const [questions] = useState(() =>
    buildSelfTest({
      doors,
      tiles: assets.tiles.rows,
      words: assets.words.rows,
      syllables: assets.syllables.rows,
    }),
  );
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio prompts are spoken on show; visual prompts stay silent so the
  // learner is checked on reading, not listening.
  function speakPrompt(question: SelfTestQuestion | undefined) {
    if (question && isAudioPrompt(question.round.ref)) speak(promptSpeechItem(question.round.ref));
  }

  // mount-only: speak the first prompt; clear a pending advance on unmount.
  useMountEffect(() => {
    speakPrompt(questions[0]);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  });

  function onBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/menu');
  }

  const question = questions[current];
  const answered = answers.length > current;

  function onChoicePress(index: number) {
    if (!question || answered) return;
    setAnswers([...answers, index]);
    if (index === question.round.correctIndex) void audio.playCorrect();
    else void audio.playIncorrect();
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setCurrent(current + 1);
      speakPrompt(questions[current + 1]);
    }, REVEAL_MS);
  }

  const common = { title: t('chrome:selfTest.title'), backLabel: t('chrome:back'), onBack };

  if (questions.length === 0) {
    return <SelfTestScreen {...common} body={{ kind: 'empty', message: t('chrome:selfTest.empty') }} />;
  }

  if (!question) {
    const { correct, total } = selfTestScore({ questions, answers });
    const { band, step } = selfTestSuggestion({
      correct,
      total,
      tiers: doors.filter((d) => d.enabled).map((d) => d.tier),
    });
    return (
      <SelfTestScreen
        {...common}
        body={{
          kind: 'end',
          endTitle: t('chrome:selfTest.end_title'),
          scoreText: t('chrome:selfTest.score', { correct, total }),
          scoreA11yLabel: t('chrome:selfTest.a11y.score', { correct, total }),
          suggestion: t(`chrome:selfTest.suggestion_${band}`, { step }),
          tryAgainLabel: t('chrome:selfTest.try_again'),
          backToMenuLabel: t('chrome:selfTest.back_to_menu'),
          onTryAgain,
          onBackToMenu: onBack,
        }}
      />
    );
  }

  const palette = assets.colors?.hexByIndex ?? [];
  const refColor = palette[current % Math.min(4, palette.length || 1)] ?? FALLBACK_REF_COLOR;
  const { refDisplay, choices, choiceLabels } = thailandRoundView({
    round: question.round,
    choiceType: question.choiceType,
    wordImages: assets.images.words,
    refColor,
  });
  const chosen = answers[current];
  const feedbackFor = (i: number): ThailandChoiceFeedback =>
    i === question.round.correctIndex ? RIGHT : i === chosen ? WRONG : null;

  const body: SelfTestScreenProps['body'] = {
    kind: 'question',
    progressLabel: t('chrome:selfTest.progress', { current: current + 1, total: questions.length }),
    question: {
      refDisplay,
      choices,
      correctIndex: answered ? question.round.correctIndex : null,
      choiceFeedback: [feedbackFor(0), feedbackFor(1), feedbackFor(2), feedbackFor(3)],
      interactionLocked: answered,
      onChoicePress,
      onRefPress: () => speakPrompt(question),
      accessibilityRefLabel:
        refDisplay.type === 'audio'
          ? t('chrome:a11y.listen_again')
          : refDisplay.type === 'image'
          ? t('chrome:a11y.active_word_picture')
          : refDisplay.text,
      accessibilityChoiceLabels: choiceLabels,
    },
  };

  return <SelfTestScreen {...common} body={body} />;
}

export function SelfTestContainer(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return <SelfTestRun key={run} onTryAgain={() => setRun((n) => n + 1)} />;
}
