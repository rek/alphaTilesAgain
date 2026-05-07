/**
 * Phase 1+2 spike for game-india-deva. Loads our extracted Devanagari stroke
 * JSON for any of 45 chars (12 vowels SVG + 33 consonants GIF) and feeds it
 * through @jamsch/react-native-hanzi-writer's `loader` prop.
 */
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import c0904 from '../../../tools/data/devanagari-strokes/ऄ.json';
import c0905 from '../../../tools/data/devanagari-strokes/अ.json';
import c0906 from '../../../tools/data/devanagari-strokes/आ.json';
import c0907 from '../../../tools/data/devanagari-strokes/इ.json';
import c0908 from '../../../tools/data/devanagari-strokes/ई.json';
import c0909 from '../../../tools/data/devanagari-strokes/उ.json';
import c090a from '../../../tools/data/devanagari-strokes/ऊ.json';
import c090b from '../../../tools/data/devanagari-strokes/ऋ.json';
import c090f from '../../../tools/data/devanagari-strokes/ए.json';
import c0910 from '../../../tools/data/devanagari-strokes/ऐ.json';
import c0913 from '../../../tools/data/devanagari-strokes/ओ.json';
import c0914 from '../../../tools/data/devanagari-strokes/औ.json';
import c0915 from '../../../tools/data/devanagari-strokes/क.json';
import c0916 from '../../../tools/data/devanagari-strokes/ख.json';
import c0917 from '../../../tools/data/devanagari-strokes/ग.json';
import c0918 from '../../../tools/data/devanagari-strokes/घ.json';
import c0919 from '../../../tools/data/devanagari-strokes/ङ.json';
import c091a from '../../../tools/data/devanagari-strokes/च.json';
import c091b from '../../../tools/data/devanagari-strokes/छ.json';
import c091c from '../../../tools/data/devanagari-strokes/ज.json';
import c091d from '../../../tools/data/devanagari-strokes/झ.json';
import c091e from '../../../tools/data/devanagari-strokes/ञ.json';
import c091f from '../../../tools/data/devanagari-strokes/ट.json';
import c0920 from '../../../tools/data/devanagari-strokes/ठ.json';
import c0921 from '../../../tools/data/devanagari-strokes/ड.json';
import c0922 from '../../../tools/data/devanagari-strokes/ढ.json';
import c0923 from '../../../tools/data/devanagari-strokes/ण.json';
import c0924 from '../../../tools/data/devanagari-strokes/त.json';
import c0925 from '../../../tools/data/devanagari-strokes/थ.json';
import c0926 from '../../../tools/data/devanagari-strokes/द.json';
import c0927 from '../../../tools/data/devanagari-strokes/ध.json';
import c0928 from '../../../tools/data/devanagari-strokes/न.json';
import c092a from '../../../tools/data/devanagari-strokes/प.json';
import c092b from '../../../tools/data/devanagari-strokes/फ.json';
import c092c from '../../../tools/data/devanagari-strokes/ब.json';
import c092d from '../../../tools/data/devanagari-strokes/भ.json';
import c092e from '../../../tools/data/devanagari-strokes/म.json';
import c092f from '../../../tools/data/devanagari-strokes/य.json';
import c0930 from '../../../tools/data/devanagari-strokes/र.json';
import c0932 from '../../../tools/data/devanagari-strokes/ल.json';
import c0935 from '../../../tools/data/devanagari-strokes/व.json';
import c0936 from '../../../tools/data/devanagari-strokes/श.json';
import c0937 from '../../../tools/data/devanagari-strokes/ष.json';
import c0938 from '../../../tools/data/devanagari-strokes/स.json';
import c0939 from '../../../tools/data/devanagari-strokes/ह.json';

type HanziModule = typeof import('@jamsch/react-native-hanzi-writer');

const CHARS: { char: string; data: { strokes: readonly string[]; medians: readonly (readonly number[])[] } }[] = [
  { char: 'ऄ', data: c0904 as never },
  { char: 'अ', data: c0905 as never },
  { char: 'आ', data: c0906 as never },
  { char: 'इ', data: c0907 as never },
  { char: 'ई', data: c0908 as never },
  { char: 'उ', data: c0909 as never },
  { char: 'ऊ', data: c090a as never },
  { char: 'ऋ', data: c090b as never },
  { char: 'ए', data: c090f as never },
  { char: 'ऐ', data: c0910 as never },
  { char: 'ओ', data: c0913 as never },
  { char: 'औ', data: c0914 as never },
  { char: 'क', data: c0915 as never },
  { char: 'ख', data: c0916 as never },
  { char: 'ग', data: c0917 as never },
  { char: 'घ', data: c0918 as never },
  { char: 'ङ', data: c0919 as never },
  { char: 'च', data: c091a as never },
  { char: 'छ', data: c091b as never },
  { char: 'ज', data: c091c as never },
  { char: 'झ', data: c091d as never },
  { char: 'ञ', data: c091e as never },
  { char: 'ट', data: c091f as never },
  { char: 'ठ', data: c0920 as never },
  { char: 'ड', data: c0921 as never },
  { char: 'ढ', data: c0922 as never },
  { char: 'ण', data: c0923 as never },
  { char: 'त', data: c0924 as never },
  { char: 'थ', data: c0925 as never },
  { char: 'द', data: c0926 as never },
  { char: 'ध', data: c0927 as never },
  { char: 'न', data: c0928 as never },
  { char: 'प', data: c092a as never },
  { char: 'फ', data: c092b as never },
  { char: 'ब', data: c092c as never },
  { char: 'भ', data: c092d as never },
  { char: 'म', data: c092e as never },
  { char: 'य', data: c092f as never },
  { char: 'र', data: c0930 as never },
  { char: 'ल', data: c0932 as never },
  { char: 'व', data: c0935 as never },
  { char: 'श', data: c0936 as never },
  { char: 'ष', data: c0937 as never },
  { char: 'स', data: c0938 as never },
  { char: 'ह', data: c0939 as never },
];

export default function SpikeDeva(): React.JSX.Element {
  const [mod, setMod] = useState<HanziModule | null>(null);
  const [idx, setIdx] = useState(1);
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
  const quizIndex = writer.quiz.useStore((s) => s.index);
  const quizMistakeCount = writer.quiz.useStore((s) =>
    Object.values(s.mistakes).reduce((a: number, b) => a + (b as number), 0),
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.col}>
        <Text style={styles.title}>
          spike-deva: {entry.char} — {entry.data.strokes.length} strokes
        </Text>
        <Text style={styles.title} aria-label="quiz-state">
          quiz active={String(quizActive)} index={quizIndex} mistakes={quizMistakeCount}
        </Text>
        <View style={styles.btnRow}>
          {CHARS.map((c, i) => (
            <Pressable
              key={c.char}
              onPress={() => setIdx(i)}
              style={[styles.charBtn, i === idx && styles.charBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={`Show ${c.char}`}
            >
              <Text style={[styles.charText, i === idx && styles.charTextActive]}>{c.char}</Text>
            </Pressable>
          ))}
        </View>
        <HanziWriter
          key={entry.char}
          writer={writer}
          loading={<Text>Loading…</Text>}
          error={<Text>Error loading character.</Text>}
          style={styles.writer}
        >
          <HanziWriter.GridLines color="#ddd" />
          <HanziWriter.Svg>
            <HanziWriter.Outline color="#ccc" />
            <HanziWriter.Character color="#1565c0" radicalColor="#2e7d32" />
            <HanziWriter.QuizStrokes />
            <HanziWriter.QuizMistakeHighlighter color="#e53935" strokeDuration={400} />
          </HanziWriter.Svg>
        </HanziWriter>
        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <Button
              onPress={
                quizActive
                  ? writer.quiz.stop
                  : () => writer.quiz.start({ leniency: 1.5, showHintAfterMisses: 3 })
              }
              title={quizActive ? 'Stop Quiz' : 'Start Quiz'}
            />
          </View>
          <View style={styles.actionBtn}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  col: { flex: 1, padding: 12, gap: 8 },
  title: { fontSize: 16 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  charBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#e0e0e0' },
  charBtnActive: { backgroundColor: '#1565c0' },
  charText: { fontSize: 16, color: '#222' },
  charTextActive: { color: '#fff' },
  writer: { alignSelf: 'center' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },
});
