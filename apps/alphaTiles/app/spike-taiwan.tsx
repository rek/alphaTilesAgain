import { Button, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HanziWriter, useHanziWriter } from '@jamsch/react-native-hanzi-writer';

export default function SpikeTaiwan(): React.JSX.Element {
  const writer = useHanziWriter({
    character: '醫',
    loader: (char) =>
      fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`).then((res) =>
        res.json(),
      ),
  });

  const quizActive = writer.quiz.useStore((s) => s.active);

  const startQuiz = () => {
    writer.quiz.start({
      leniency: 1,
      showHintAfterMisses: 2,
      onComplete({ totalMistakes }) {
        console.log(`spike-taiwan: complete, mistakes=${totalMistakes}`);
      },
      onMistake(strokeData) {
        console.log('spike-taiwan: mistake', strokeData);
      },
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 18 }}>spike-taiwan: 醫</Text>
        <HanziWriter
          writer={writer}
          loading={<Text>Loading…</Text>}
          error={
            <View>
              <Text>Error loading character.</Text>
              <Button title="Refetch" onPress={writer.refetch} />
            </View>
          }
          style={{ alignSelf: 'center' }}
        >
          <HanziWriter.GridLines color="#ddd" />
          <HanziWriter.Svg>
            <HanziWriter.Outline color="#ccc" />
            <HanziWriter.Character color="#555" radicalColor="green" />
            <HanziWriter.QuizStrokes />
            <HanziWriter.QuizMistakeHighlighter color="#539bf5" strokeDuration={400} />
          </HanziWriter.Svg>
        </HanziWriter>
        <Button
          onPress={quizActive ? writer.quiz.stop : startQuiz}
          title={quizActive ? 'Stop Quiz' : 'Start Quiz'}
        />
        <Button
          onPress={() =>
            writer.animator.animateCharacter({ delayBetweenStrokes: 600, strokeDuration: 600 })
          }
          title="Animate"
        />
      </View>
    </GestureHandlerRootView>
  );
}
