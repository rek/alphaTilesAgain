import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';

/** Rendered by GameRouteContainer for a class missing from the game-class registry. */
export function GameUnavailable({ classKey }: { classKey: string }): React.JSX.Element {
  const { doorIndex, challengeLevel } = useLocalSearchParams<{
    doorIndex: string;
    challengeLevel: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{classKey}</Text>
      <Text style={styles.sub}>
        {t('chrome:game_door_level', { door: doorIndex, level: challengeLevel })}
      </Text>
      <Text style={styles.note}>{t('chrome:game_unavailable')}</Text>
      <Pressable
        style={styles.back}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('chrome:back')}
      >
        <Text style={styles.backLabel}>{t('chrome:back')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, textTransform: 'capitalize' },
  sub: { fontSize: 16, color: '#666', marginBottom: 24 },
  note: { fontSize: 14, color: '#999', marginBottom: 48 },
  back: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2196F3', borderRadius: 8 },
  backLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
