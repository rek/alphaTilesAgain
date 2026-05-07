import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onDoorPress: (index: number) => void;
  onBack: () => void;
  onAbout: () => void;
  onShare: () => void;
  onResources: () => void;
  onAudioInstructions: () => void;
  a11y: {
    back: string;
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
    score: string;
  };
  tabLabels: {
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
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
  onDoorPress,
  onBack,
  onAbout,
  onShare,
  onResources,
  onAudioInstructions,
  a11y,
  tabLabels,
}: GameMenuScreenModernProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const numColumns = getColumns(width);
  const totalGap = CARD_GAP * (numColumns - 1);
  const cardSize = Math.floor((width - GRID_PADDING * 2 - totalGap) / numColumns);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={a11y.back}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
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

      <View style={styles.tabBar}>
        {showAbout && (
          <TabButton
            icon="information-circle-outline"
            label={tabLabels.about}
            a11yLabel={a11y.about}
            onPress={onAbout}
          />
        )}
        {showShare && (
          <TabButton
            icon="share-social-outline"
            label={tabLabels.share}
            a11yLabel={a11y.share}
            onPress={onShare}
          />
        )}
        {showResources && (
          <TabButton
            icon="library-outline"
            label={tabLabels.resources}
            a11yLabel={a11y.resources}
            onPress={onResources}
          />
        )}
        {showAudioInstructions && (
          <TabButton
            icon="volume-high-outline"
            label={tabLabels.audioInstructions}
            a11yLabel={a11y.audioInstructions}
            onPress={onAudioInstructions}
          />
        )}
      </View>
    </SafeAreaView>
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
    paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0) + 10,
    paddingBottom: 10,
  },
  backButton: {
    marginEnd: 8,
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
  pressed: {
    opacity: 0.55,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 0.2,
  },
});

type TabButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  a11yLabel: string;
  onPress: () => void;
};

function TabButton({ icon, label, a11yLabel, onPress }: TabButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      hitSlop={6}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color="#374151" />
      <Text style={styles.tabLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
