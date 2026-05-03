/**
 * Pure presenter for game-taiwan. Zero hook imports, zero i18n imports.
 *
 * Wraps `@jamsch/react-native-hanzi-writer` <HanziWriter />. The CL switches
 * (`outlineVisible`, `characterVisible`) gate whether the corresponding
 * compositional children are rendered — these are NOT props on <HanziWriter />,
 * only children. <HanziWriter.QuizMistakeHighlighter /> is always rendered so
 * the upstream's `showHintAfterMisses` mechanism has a place to draw.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HanziWriter, type useHanziWriter } from '@jamsch/react-native-hanzi-writer';

export type TaiwanScreenProps = {
  writer: ReturnType<typeof useHanziWriter>;
  outlineVisible: boolean;
  characterVisible: boolean;
  /** Pre-translated label, e.g. "Character 2 of 5". */
  progressLabel: string;
  /** Pre-translated label for the "Try again" button shown if the writer errors. */
  retryLabel: string;
  /** Pre-translated label for the loading state. */
  loadingLabel: string;
};

export function TaiwanScreen(props: TaiwanScreenProps): React.JSX.Element {
  const { writer, outlineVisible, characterVisible, progressLabel, retryLabel, loadingLabel } = props;
  return (
    <View style={styles.root}>
      <Text style={styles.progress}>{progressLabel}</Text>
      <HanziWriter
        writer={writer}
        loading={
          <View style={styles.feedback}>
            <Text>{loadingLabel}</Text>
          </View>
        }
        error={
          <View style={styles.feedback}>
            <Pressable
              onPress={writer.refetch}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel={retryLabel}
            >
              <Text style={styles.retryText}>{retryLabel}</Text>
            </Pressable>
          </View>
        }
        style={styles.writer}
      >
        <HanziWriter.GridLines color="#e5e5e5" />
        <HanziWriter.Svg>
          {outlineVisible ? <HanziWriter.Outline color="#bdbdbd" /> : null}
          {characterVisible ? <HanziWriter.Character color="#1565c0" radicalColor="#2e7d32" /> : null}
          <HanziWriter.QuizStrokes />
          <HanziWriter.QuizMistakeHighlighter color="#e53935" strokeDuration={400} />
        </HanziWriter.Svg>
      </HanziWriter>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  progress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  writer: {
    alignSelf: 'center',
  },
  feedback: {
    padding: 24,
    alignItems: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#1565c0',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
