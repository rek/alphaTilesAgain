import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { UiDoorGrid } from '@shared/ui-door-grid';
import type { DoorItem } from '@shared/ui-door-grid';

export type GameMenuScreenProps = {
  doors: DoorItem[];
  page: number;
  totalPages: number;
  playerName: string;
  playerAvatarSrc: ImageSourcePropType | null;
  score: number;
  showShare: boolean;
  showResources: boolean;
  showAbout: boolean;
  showAudioInstructions: boolean;
  layout: 'classic' | 'modern';
  doorWidth?: number;
  doorHeight?: number;
  onDoorPress: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onAbout: () => void;
  onShare: () => void;
  onResources: () => void;
  onAudioInstructions: () => void;
  onToggleLayout: () => void;
  a11y: {
    prev: string;
    next: string;
    back: string;
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
    score: string;
    toggleLayout: string;
  };
};

export function GameMenuScreen({
  doors,
  page,
  totalPages,
  playerName,
  playerAvatarSrc,
  score,
  showShare,
  showResources,
  showAbout,
  showAudioInstructions,
  layout,
  doorWidth,
  doorHeight,
  onDoorPress,
  onPrev,
  onNext,
  onBack,
  onAbout,
  onShare,
  onResources,
  onAudioInstructions,
  onToggleLayout,
  a11y,
}: GameMenuScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={a11y.back}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>{'←'}</Text>
        </Pressable>
        {playerAvatarSrc !== null ? (
          <Image source={playerAvatarSrc} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <Text style={styles.playerName}>{playerName}</Text>
        <Text accessibilityLabel={a11y.score} style={styles.score}>{score}</Text>
      </View>

      <View style={styles.gridContainer}>
        <UiDoorGrid
          doors={doors}
          page={page}
          totalPages={totalPages}
          onDoorPress={onDoorPress}
          onPrev={onPrev}
          onNext={onNext}
          a11y={{ prev: a11y.prev, next: a11y.next }}
          doorWidth={doorWidth}
          doorHeight={doorHeight}
        />
      </View>

      <View style={styles.utilityRow}>
        <View style={styles.utilityCenter}>
          {showAbout && (
            <Pressable
              onPress={onAbout}
              accessibilityRole="button"
              accessibilityLabel={a11y.about}
              style={styles.utilityButton}
            >
              <Text style={styles.utilityText}>{'ℹ'}</Text>
            </Pressable>
          )}
          {showShare && (
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel={a11y.share}
              style={styles.utilityButton}
            >
              <Text style={styles.utilityText}>{'⤴'}</Text>
            </Pressable>
          )}
          {showResources && (
            <Pressable
              onPress={onResources}
              accessibilityRole="button"
              accessibilityLabel={a11y.resources}
              style={styles.utilityButton}
            >
              <Text style={styles.utilityText}>{'📚'}</Text>
            </Pressable>
          )}
          {showAudioInstructions && (
            <Pressable
              onPress={onAudioInstructions}
              accessibilityRole="button"
              accessibilityLabel={a11y.audioInstructions}
              style={styles.utilityButton}
            >
              <Text style={styles.utilityText}>{'🔊'}</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={onToggleLayout}
          accessibilityRole="button"
          accessibilityLabel={a11y.toggleLayout}
          style={styles.utilityButton}
        >
          <Text style={styles.utilityText}>{layout === 'classic' ? '⊞' : '▦'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    marginEnd: 8,
  },
  backArrow: {
    fontSize: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginEnd: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    marginEnd: 8,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    marginStart: 8,
  },
  gridContainer: {
    flex: 1,
    padding: 8,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  utilityCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  utilityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  utilityText: {
    fontSize: 22,
  },
});
