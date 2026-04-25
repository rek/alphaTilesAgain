import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function GamePlaceholderRoute() {
  const { classKey, doorIndex, challengeLevel } = useLocalSearchParams<{
    classKey: string;
    doorIndex: string;
    challengeLevel: string;
  }>();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{classKey}</Text>
      <Text style={styles.sub}>Door {doorIndex} · Level {challengeLevel}</Text>
      <Text style={styles.note}>Game not yet implemented</Text>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backLabel}>← Back</Text>
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
