/**
 * Pure presenter for the self-test (#42): a header (back + title + progress),
 * then either the current question (Thailand's 4-choice `ThailandScreen`),
 * the end-of-test score card, or an empty state. Pre-translated strings only.
 */
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThailandScreen } from '@alphaTiles/feature-game-thailand';

type QuestionProps = Parameters<typeof ThailandScreen>[0];

export type SelfTestScreenProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
  body:
    | { kind: 'question'; progressLabel: string; question: QuestionProps }
    | {
        kind: 'end';
        endTitle: string;
        scoreText: string;
        scoreA11yLabel: string;
        tryAgainLabel: string;
        backToMenuLabel: string;
        onTryAgain: () => void;
        onBackToMenu: () => void;
      }
    | { kind: 'empty'; message: string };
};

export function SelfTestScreen({ title, backLabel, onBack, body }: SelfTestScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#1F2937"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {body.kind === 'question' ? (
          <Text style={styles.progress}>{body.progressLabel}</Text>
        ) : null}
      </View>

      {body.kind === 'question' ? <ThailandScreen {...body.question} /> : null}

      {body.kind === 'end' ? (
        <View style={styles.center}>
          <Text style={styles.endTitle} accessibilityRole="header">
            {body.endTitle}
          </Text>
          <Text style={styles.score} accessibilityLabel={body.scoreA11yLabel}>
            {body.scoreText}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={body.onTryAgain}
              accessibilityRole="button"
              accessibilityLabel={body.tryAgainLabel}
              style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, styles.primaryText]}>{body.tryAgainLabel}</Text>
            </Pressable>
            <Pressable
              onPress={body.onBackToMenu}
              accessibilityRole="button"
              accessibilityLabel={body.backToMenuLabel}
              style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>{body.backToMenuLabel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {body.kind === 'empty' ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{body.message}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  endTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  score: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1565C0',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#1565C0',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565C0',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
  empty: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
  },
});
