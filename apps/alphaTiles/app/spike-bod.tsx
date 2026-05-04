/**
 * Synthetic Tibetan Uchen spike. Loads our extracted stroke JSON for the 5
 * base consonants and feeds them through `@jamsch/react-native-hanzi-writer`'s
 * `loader` prop. Lazy-imports the lib inside useEffect (web SSR rule —
 * see openspec/changes/game-taiwan/STATUS.md worklets-TDZ note).
 *
 * Tooling smoke only — stroke order is FABRICATED. See
 * tools/data/uchen-strokes/_attribution.json `warning` field.
 */
import { useEffect, useState } from 'react';
import { Button, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type HanziModule = typeof import('@jamsch/react-native-hanzi-writer');

import bodKa from '../../../tools/data/uchen-strokes/ཀ.json';
import bodKha from '../../../tools/data/uchen-strokes/ཁ.json';
import bodGa from '../../../tools/data/uchen-strokes/ག.json';
import bodNga from '../../../tools/data/uchen-strokes/ང.json';
import bodCa from '../../../tools/data/uchen-strokes/ཅ.json';

const CHARS: Array<{ char: string; data: { strokes: readonly string[]; medians: readonly (readonly number[])[] } }> = [
  { char: 'ཀ', data: bodKa as never },
  { char: 'ཁ', data: bodKha as never },
  { char: 'ག', data: bodGa as never },
  { char: 'ང', data: bodNga as never },
  { char: 'ཅ', data: bodCa as never },
];

export default function SpikeBod(): React.JSX.Element {
  const [mod, setMod] = useState<HanziModule | null>(null);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    import('@jamsch/react-native-hanzi-writer').then(setMod);
  }, []);
  if (!mod) return <Text>Loading hanzi-writer…</Text>;
  return <SpikeInner mod={mod} idx={idx} setIdx={setIdx} />;
}

function SpikeInner({ mod, idx, setIdx }: { mod: HanziModule; idx: number; setIdx: (i: number) => void }) {
  const { HanziWriter, useHanziWriter } = mod;
  const entry = CHARS[idx];
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
          spike-bod (SYNTHETIC): {entry.char} — {entry.data.strokes.length} strokes
        </Text>
        <Text style={{ fontSize: 12, color: '#b71c1c' }}>
          Stroke order is FABRICATED. Pending Tibetan-speaker review. Tooling smoke only.
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
