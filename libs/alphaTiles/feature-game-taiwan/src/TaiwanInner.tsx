/**
 * Container for game-taiwan. Renders <GameShellContainer> wrapping the inner
 * game component (which calls useGameShell). This file is dynamically imported
 * by `TaiwanContainer.tsx` so the static-prerender pass never evaluates the
 * `@jamsch/react-native-hanzi-writer` worklet code path (TDZ on
 * `getPathString` in Node SSR — see openspec/changes/game-taiwan/STATUS.md).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLangAssets, usePrecompute } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import { useCallback } from 'react';
import {
  GameShellContainer,
  useGameShell,
  useShellRepeat,
  type GameShellIcons,
} from '@alphaTiles/feature-game-shell';
import { TaiwanScreen } from './TaiwanScreen';
import { pickTaiwanCharacters } from './pickTaiwanCharacters';
import type { TaiwanData } from './buildTaiwanData';
import type { StrokeData } from '@alphaTiles/data-stroke-data';

const GOAL_COUNT = 5;
const MISTAKE_HINT_THRESHOLD = 3;

type CLConfig = { outlineVisible: boolean; characterVisible: boolean; leniency: number };

const CL_TABLE: Record<number, CLConfig> = {
  1: { outlineVisible: true, characterVisible: true, leniency: 1.5 },
  2: { outlineVisible: true, characterVisible: false, leniency: 1.0 },
  3: { outlineVisible: false, characterVisible: false, leniency: 0.7 },
};

function decodeCl(value: unknown): CLConfig {
  const n = typeof value === 'string' ? parseInt(value, 10) : (value as number);
  return CL_TABLE[n] ?? CL_TABLE[1];
}

export type TaiwanInnerProps = {
  icons: GameShellIcons;
  challengeLevel?: string | string[];
};

export function TaiwanInner(props: TaiwanInnerProps): React.JSX.Element {
  const cl = decodeCl(Array.isArray(props.challengeLevel) ? props.challengeLevel[0] : props.challengeLevel);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <GameShellContainer icons={props.icons} showInstructionsButton={false}>
        <TaiwanGame cl={cl} />
      </GameShellContainer>
    </GestureHandlerRootView>
  );
}

function TaiwanGame({ cl }: { cl: CLConfig }): React.JSX.Element {
  const shell = useGameShell();
  const assets = useLangAssets();
  const audio = useAudio();
  const taiwanData = usePrecompute<TaiwanData>('taiwan');
  const { t } = useTranslation('chrome');

  // `roundSeed` increments after each round completes, forcing a fresh
  // `pickTaiwanCharacters` shuffle. The `useMemo` recomputes whenever the
  // seed changes — same trick as other games' `startRound()` reset.
  const [roundSeed, setRoundSeed] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const roundChars = useMemo(
    () => pickTaiwanCharacters(taiwanData.availableTiles, GOAL_COUNT),
    // roundSeed deliberately included so a new round picks new chars.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taiwanData.availableTiles, roundSeed],
  );

  const currentChar = roundChars[currentCharIndex] ?? roundChars[0] ?? '';

  const onRepeat = useCallback(() => {
    const audioId = taiwanData.audioForChar[currentChar];
    if (audioId) void audio.playWord(audioId);
  }, [audio, currentChar, taiwanData.audioForChar]);
  useShellRepeat(onRepeat);

  if (roundChars.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('taiwan.no_content')}</Text>
      </View>
    );
  }

  function handleCharComplete(strokeCount: number): void {
    shell.incrementPointsAndTracker(true, strokeCount);
    const audioId = taiwanData.audioForChar[currentChar];
    if (audioId) {
      void audio.playWord(audioId);
    }
    if (currentCharIndex + 1 >= roundChars.length) {
      // Round complete — reshuffle and start over. The 12-correct celebration
      // fires automatically once the shell tracker hits its threshold (D5).
      setRoundSeed((s) => s + 1);
      setCurrentCharIndex(0);
    } else {
      setCurrentCharIndex((idx) => idx + 1);
    }
  }

  return (
    <CharRound
      // Seed-prefixed key ensures a remount even if the next round happens to
      // pick the same character at the same index (low odds, but possible).
      key={`${roundSeed}-${currentCharIndex}`}
      character={currentChar}
      strokeData={assets.strokes[currentChar]}
      cl={cl}
      progressLabel={t('taiwan.progress', {
        current: currentCharIndex + 1,
        total: roundChars.length,
      })}
      retryLabel={t('retry')}
      loadingLabel={t('loading_short')}
      onComplete={handleCharComplete}
    />
  );
}

/**
 * One character's quiz lifecycle. Re-mounts on every `key={character}` change,
 * so the auto-start effect runs with empty deps (mount-only kickoff per
 * `docs/GAME_PATTERNS.md` § "useMountEffect is a pattern, not a hook").
 *
 * Why split: keeps `shell`, `audio`, etc. out of the auto-start dep array —
 * those identities are unstable but the parent's `onComplete` callback already
 * captures everything we need to fire on completion.
 */
function CharRound({
  character,
  strokeData,
  cl,
  progressLabel,
  retryLabel,
  loadingLabel,
  onComplete,
}: {
  character: string;
  strokeData: StrokeData | undefined;
  cl: CLConfig;
  progressLabel: string;
  retryLabel: string;
  loadingLabel: string;
  onComplete: (strokeCount: number) => void;
}): React.JSX.Element {
  const writer = useHanziWriter({
    character,
    loader: () => {
      if (!strokeData) throw new Error(`No stroke data for "${character}"`);
      // Upstream `CharacterJson` uses mutable arrays; our `StrokeData` declares
      // them readonly. Shape matches at runtime — cast through `unknown` rather
      // than copying every nested array.
      return strokeData as unknown as { strokes: string[]; medians: number[][][] };
    },
  });
  const startedRef = useRef(false);
  const characterClass = writer.characterClass;

  // Auto-start once the upstream signals load. `characterClass` flips null →
  // Character one render after the loader resolves; the ref guard ensures we
  // only start once even if the effect re-runs on identity changes.
  useEffect(() => {
    if (!characterClass || startedRef.current) return;
    startedRef.current = true;
    writer.quiz.start({
      leniency: cl.leniency,
      showHintAfterMisses: MISTAKE_HINT_THRESHOLD,
      onMistake() {
        // Spec § Stroke Lifecycle Events: increment a mistake counter for
        // diagnostics / analytics. No-op until analytics is wired.
      },
      onComplete() {
        onComplete(characterClass.strokes.length);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterClass]);

  return (
    <TaiwanScreen
      writer={writer}
      outlineVisible={cl.outlineVisible}
      characterVisible={cl.characterVisible}
      progressLabel={progressLabel}
      retryLabel={retryLabel}
      loadingLabel={loadingLabel}
    />
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#616161',
    textAlign: 'center',
  },
});
