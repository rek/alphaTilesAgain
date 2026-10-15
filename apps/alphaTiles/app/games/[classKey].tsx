import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useDoor } from '@alphaTiles/data-doors';
import { gameClasses } from '../../src/gameClasses';
import { gameClassKeys, type GameClassKey } from '../../src/gameClassKeys';
import { gameIcons } from '../../src/gameIcons';

/** Web static export: one prerendered page per class (`/games/<classKey>.html`). */
export function generateStaticParams(): { classKey: GameClassKey }[] {
  return gameClassKeys.map((classKey) => ({ classKey }));
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The one game route: `/games/<classKey>?doorIndex=…`. The routed Door (by
 * `doorIndex`) names the class; the game-class registry supplies its container,
 * and app chrome icons are injected here once for every game.
 */
export default function GameRoute(): React.JSX.Element {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const door = useDoor(params);
  // Door is authoritative; an unknown doorIndex still mounts the URL's class so
  // the shell can bounce to /menu.
  const classKey = door?.classKey ?? first(params.classKey);
  const gameClass = gameClassKeys.find((k) => k === classKey);

  if (gameClass === undefined) return <GameUnavailable classKey={classKey ?? ''} />;

  const { Container } = gameClasses[gameClass];
  return <Container key={`${gameClass}-${door?.index}`} {...params} icons={gameIcons} />;
}

function GameUnavailable({ classKey }: { classKey: string }): React.JSX.Element {
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
