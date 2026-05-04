/**
 * Phase 1 spike for game-india-deva. Loads our extracted Devanagari stroke
 * JSON for any of the 12 covered chars and feeds it through
 * @jamsch/react-native-hanzi-writer's `loader` prop. Lazy-imports the lib
 * inside useEffect (web SSR rule — see openspec/changes/game-taiwan/STATUS.md).
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type HanziModule = typeof import('@jamsch/react-native-hanzi-writer');

import devaACaret from '../../../tools/data/devanagari-strokes/ऄ.json';
import devaA from '../../../tools/data/devanagari-strokes/अ.json';
import devaAA from '../../../tools/data/devanagari-strokes/आ.json';
import devaI from '../../../tools/data/devanagari-strokes/इ.json';
import devaII from '../../../tools/data/devanagari-strokes/ई.json';
import devaU from '../../../tools/data/devanagari-strokes/उ.json';
import devaUU from '../../../tools/data/devanagari-strokes/ऊ.json';
import devaR from '../../../tools/data/devanagari-strokes/ऋ.json';
import devaE from '../../../tools/data/devanagari-strokes/ए.json';
import devaAI from '../../../tools/data/devanagari-strokes/ऐ.json';
import devaO from '../../../tools/data/devanagari-strokes/ओ.json';
import devaAU from '../../../tools/data/devanagari-strokes/औ.json';

const CHARS: Array<{ char: string; data: { strokes: readonly string[]; medians: readonly (readonly number[])[] } }> = [
  { char: 'ऄ', data: devaACaret as never },
  { char: 'अ', data: devaA as never },
  { char: 'आ', data: devaAA as never },
  { char: 'इ', data: devaI as never },
  { char: 'ई', data: devaII as never },
  { char: 'उ', data: devaU as never },
  { char: 'ऊ', data: devaUU as never },
  { char: 'ऋ', data: devaR as never },
  { char: 'ए', data: devaE as never },
  { char: 'ऐ', data: devaAI as never },
  { char: 'ओ', data: devaO as never },
  { char: 'औ', data: devaAU as never },
];

export default function SpikeDeva(): React.JSX.Element {
  const [mod, setMod] = useState<HanziModule | null>(null);
  const [idx, setIdx] = useState(1); // start on अ
  useEffect(() => {
    import('@jamsch/react-native-hanzi-writer').then(setMod);
  }, []);
  if (!mod) return <Text>Loading hanzi-writer…</Text>;
  return <SpikeInner mod={mod} idx={idx} setIdx={setIdx} />;
}

function SpikeInner({ mod, idx, setIdx }: { mod: HanziModule; idx: number; setIdx: (i: number) => void }) {
  const { HanziWriter, useHanziWriter } = mod;
  const entry = CHARS[idx];
  // Re-create writer per char via key-based remount.
  const writer = useHanziWriter({
    character: entry.char,
    loader: () => ({
      strokes: entry.data.strokes as unknown as string[],
      medians: entry.data.medians as unknown as number[][][],
    }),
  });
  const quizActive = writer.quiz.useStore((s) => s.active);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18 }}>
          spike-deva: {entry.char} — {entry.data.strokes.length} strokes
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {CHARS.map((c, i) => (
            <Pressable
              key={c.char}
              onPress={() => setIdx(i)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 4,
                backgroundColor: i === idx ? '#1565c0' : '#e0e0e0',
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show ${c.char}`}
            >
              <Text style={{ fontSize: 18, color: i === idx ? '#fff' : '#222' }}>{c.char}</Text>
            </Pressable>
          ))}
        </View>
        <HanziWriter
          key={entry.char}
          writer={writer}
          loading={<Text>Loading…</Text>}
          error={<Text>Error loading character.</Text>}
          style={{ alignSelf: 'center' }}
        >
          <HanziWriter.GridLines color="#ddd" />
          <HanziWriter.Svg>
            <HanziWriter.Outline color="#ccc" />
            <HanziWriter.Character color="#1565c0" radicalColor="#2e7d32" />
            <HanziWriter.QuizStrokes />
            <HanziWriter.QuizMistakeHighlighter color="#e53935" strokeDuration={400} />
          </HanziWriter.Svg>
        </HanziWriter>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              onPress={
                quizActive
                  ? writer.quiz.stop
                  : () => writer.quiz.start({ leniency: 1.5, showHintAfterMisses: 3 })
              }
              title={quizActive ? 'Stop Quiz' : 'Start Quiz'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              onPress={() =>
                writer.animator.animateCharacter({ delayBetweenStrokes: 600, strokeDuration: 600 })
              }
              title="Animate"
            />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
