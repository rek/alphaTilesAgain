import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { DoorData } from './useDoors';

export type GameMenuScreenModernProps = {
  allDoors: DoorData[];
  playerName: string;
  playerAvatarSrc: ImageSourcePropType | null;
  score: number;
  showShare: boolean;
  showResources: boolean;
  showAbout: boolean;
  showAudioInstructions: boolean;
  layout: 'classic' | 'modern';
  onDoorPress: (index: number) => void;
  onBack: () => void;
  onAbout: () => void;
  onShare: () => void;
  onResources: () => void;
  onAudioInstructions: () => void;
  onToggleLayout: () => void;
  a11y: {
    back: string;
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
    score: string;
    toggleLayout: string;
  };
};

const GRID_PADDING = 12;
const CARD_GAP = 10;
const OUTER_RADIUS = 16;

// Fewer columns = bigger targets — important for non-literate audience
function getColumns(width: number): number {
  if (width >= 900) return 5;
  if (width >= 600) return 4;
  return 3;
}

type CardProps = {
  door: DoorData;
  size: number;
  onPress: () => void;
};

function ModernDoorCard({ door, size, onPress }: CardProps): React.JSX.Element {
  const fontSize = Math.floor(size * 0.38);

  const cardBg = door.visual === 'not-started'
    ? '#FFFFFF'
    : door.visual === 'in-process'
      ? door.colorHex
      : '#F0F0F0';

  const borderProps = door.visual !== 'in-process'
    ? { borderWidth: 3, borderColor: door.colorHex }
    : {};

  const numberColor = door.visual === 'in-process'
    ? (door.textColorHex ?? '#FFFFFF')
    : door.colorHex;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        borderProps,
        {
          width: size,
          height: size,
          backgroundColor: cardBg,
          borderRadius: OUTER_RADIUS,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          styles.doorNumber,
          { fontSize, color: numberColor },
        ]}
      >
        {door.index}
      </Text>
      {door.visual === 'mastery' && (
        <Text style={[styles.masteryBadge, { color: door.colorHex }]}>{'✓'}</Text>
      )}
    </Pressable>
  );
}

export function GameMenuScreenModern({
  allDoors,
  playerName,
  playerAvatarSrc,
  score,
  showShare,
  showResources,
  showAbout,
  showAudioInstructions,
  layout,
  onDoorPress,
  onBack,
  onAbout,
  onShare,
  onResources,
  onAudioInstructions,
  onToggleLayout,
  a11y,
}: GameMenuScreenModernProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const numColumns = getColumns(width);
  const totalGap = CARD_GAP * (numColumns - 1);
  const cardSize = Math.floor((width - GRID_PADDING * 2 - totalGap) / numColumns);

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

      <FlatList
        key={numColumns}
        data={allDoors}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.index)}
        contentContainerStyle={[styles.grid, { padding: GRID_PADDING }]}
        columnWrapperStyle={numColumns > 1 ? { gap: CARD_GAP } : undefined}
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        renderItem={({ item }) => (
          <ModernDoorCard
            door={item}
            size={cardSize}
            onPress={() => { onDoorPress(item.index); }}
          />
        )}
      />

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
          <Text style={styles.utilityText}>{layout === 'modern' ? '▦' : '⊞'}</Text>
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
    fontVariant: ['tabular-nums'],
  },
  grid: {
    flexGrow: 1,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    // DESIGN_V2: layered shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  doorNumber: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  masteryBadge: {
    position: 'absolute',
    top: 6,
    end: 8,
    fontSize: 14,
    fontWeight: '700',
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
