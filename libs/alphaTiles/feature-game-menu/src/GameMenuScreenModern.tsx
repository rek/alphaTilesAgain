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
import { readableAccentColor, readableTextColor, useScaledStyles } from '@shared/util-theme';
import type { MenuDoor } from './buildMenuDoors';
import { PlacementGuidanceSheet } from './PlacementGuidanceSheet';
import type { PlacementGuidanceStrings } from './PlacementGuidanceSheet';

/**
 * `name` is the pack's door label; absent → unlabelled door (number only).
 * `levelLabel` is the translated tier badge ("Level 2"); doors arrive in
 * ladder order, the number shown is still the raw `index`.
 */
type DoorData = Pick<MenuDoor, 'index' | 'colorHex' | 'visual' | 'textColorHex' | 'tracksProgress'> & {
  name?: string;
  levelLabel?: string;
};

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
  onSettings: () => void;
  /** "Where to start" explainer: open state + pre-translated copy. */
  guidance: {
    visible: boolean;
    onOpen: () => void;
    onClose: () => void;
    strings: PlacementGuidanceStrings;
  };
  a11y: {
    back: string;
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
    settings: string;
    score: string;
    howLevelsWork: string;
  };
  doorLabel: (door: DoorData) => string;
  /** Self-test entry below the door grid (#42); absent → not offered. */
  selfTest?: { label: string; a11yLabel: string; onPress: () => void };
  tabLabels: {
    about: string;
    share: string;
    resources: string;
    audioInstructions: string;
    settings: string;
  };
};

const GRID_PADDING = 12;
const CARD_GAP = 10;
const OUTER_RADIUS = 16;
/** Wide screens: cap the grid so doors stay finger-sized and more rows fit (U19). */
const MAX_GRID_WIDTH = 720;
/** Before the grid is measured, assume a desktop scrollbar may eat this much (U9). */
const SCROLLBAR_ALLOWANCE = Platform.OS === 'web' ? 16 : 0;
/** WCAG / platform minimum touch target. */
const MIN_TOUCH = 44;

// Fewer columns = bigger targets — important for non-literate audience
function getColumns(width: number): number {
  if (width >= 600) return 4;
  return 3;
}

type CardProps = {
  door: DoorData;
  size: number;
  onPress: () => void;
  label: string;
};

function ModernDoorCard({ door, size, onPress, label }: CardProps): React.JSX.Element {
  const styles = useScaledStyles(stylesFor);
  // Named doors shrink the number to make room for the label underneath.
  const fontSize = Math.floor(size * (door.name ? 0.26 : 0.38)); // geometry: scales with door size, not pack font scale
  const nameFontSize = Math.max(11, Math.floor(size * 0.13)); // geometry: scales with door size, not pack font scale

  const cardBg = door.visual === 'not-started'
    ? '#FFFFFF'
    : door.visual === 'in-process'
      ? door.colorHex
      : '#F0F0F0';

  const borderProps = door.visual !== 'in-process'
    ? { borderWidth: 3, borderColor: door.colorHex }
    : {};

  // Pack colours range from yellow to navy: never draw them unchecked (U3).
  const numberColor = door.visual === 'in-process'
    ? (door.textColorHex ?? readableTextColor(door.colorHex))
    : readableAccentColor(door.colorHex, cardBg);
  const levelFontSize = Math.max(11, Math.floor(size * 0.1)); // geometry: scales with door size, not pack font scale

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID="game-door-tile"
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
      {door.name ? (
        <Text
          style={[styles.doorName, { fontSize: nameFontSize, color: numberColor }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {door.name}
        </Text>
      ) : null}
      {door.levelLabel ? (
        <Text
          style={[styles.levelBadge, { color: numberColor, fontSize: levelFontSize }]}
          numberOfLines={1}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {door.levelLabel}
        </Text>
      ) : null}
      {door.visual === 'mastery' && (
        <Ionicons
          name="checkmark"
          size={14}
          color={numberColor}
          style={styles.masteryBadge}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
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
  onSettings,
  guidance,
  a11y,
  tabLabels,
  doorLabel,
  selfTest,
}: GameMenuScreenModernProps): React.JSX.Element {
  const styles = useScaledStyles(stylesFor);
  const { width } = useWindowDimensions();
  // Measured inner width of the scroll content (excludes a desktop scrollbar);
  // until measured, estimate from the window (U9).
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const gridWidth = measuredWidth > 0
    ? measuredWidth
    : Math.min(width - SCROLLBAR_ALLOWANCE, MAX_GRID_WIDTH) - GRID_PADDING * 2;
  const numColumns = getColumns(gridWidth + GRID_PADDING * 2);
  const totalGap = CARD_GAP * (numColumns - 1);
  const cardSize = Math.floor((gridWidth - totalGap) / numColumns);
  const onGridLayout = (w: number) => {
    const next = Math.floor(w);
    if (next > 0 && next !== measuredWidth) setMeasuredWidth(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={a11y.back}
          testID="menu-back-button"
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
        <Pressable
          onPress={guidance.onOpen}
          accessibilityRole="button"
          accessibilityLabel={a11y.howLevelsWork}
          hitSlop={8}
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
        >
          <Ionicons name="help-circle-outline" size={28} color="#1F2937" />
        </Pressable>
      </View>

      <PlacementGuidanceSheet
        visible={guidance.visible}
        strings={guidance.strings}
        onClose={guidance.onClose}
      />

      <FlatList
        key={numColumns}
        data={allDoors}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.index)}
        contentContainerStyle={[styles.grid, { padding: GRID_PADDING }]}
        ListHeaderComponent={
          <View
            style={styles.measure}
            onLayout={(e) => onGridLayout(e.nativeEvent.layout.width)}
          />
        }
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        renderItem={({ item }) => (
          <ModernDoorCard
            door={item}
            size={cardSize}
            onPress={() => { onDoorPress(item.index); }}
            label={doorLabel(item)}
          />
        )}
        ListFooterComponent={
          selfTest ? (
            <Pressable
              onPress={selfTest.onPress}
              accessibilityRole="button"
              accessibilityLabel={selfTest.a11yLabel}
          testID="self-test-button"
              style={({ pressed }) => [styles.selfTestButton, pressed && styles.pressed]}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={24}
                color="#FFFFFF"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={styles.selfTestLabel}>{selfTest.label}</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.tabBar}>
        {showAbout && (
          <TabButton
            icon="information-circle-outline"
            label={tabLabels.about}
            a11yLabel={a11y.about}
            testID="menu-tab-about"
            onPress={onAbout}
          />
        )}
        {showShare && (
          <TabButton
            icon="share-social-outline"
            label={tabLabels.share}
            a11yLabel={a11y.share}
            testID="menu-tab-share"
            onPress={onShare}
          />
        )}
        {showResources && (
          <TabButton
            icon="library-outline"
            label={tabLabels.resources}
            a11yLabel={a11y.resources}
            testID="menu-tab-resources"
            onPress={onResources}
          />
        )}
        {showAudioInstructions && (
          <TabButton
            icon="volume-high-outline"
            label={tabLabels.audioInstructions}
            a11yLabel={a11y.audioInstructions}
            testID="menu-tab-audio-instructions"
            onPress={onAudioInstructions}
          />
        )}
        <TabButton
          icon="settings-outline"
          label={tabLabels.settings}
          a11yLabel={a11y.settings}
          testID="menu-tab-settings"
          onPress={onSettings}
        />
      </View>
    </SafeAreaView>
  );
}

const stylesFor = (fs: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  columnWrapper: {
    gap: CARD_GAP,
  },
  itemSeparator: {
    height: CARD_GAP,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0) + 10,
    paddingBottom: 10,
  },
  backButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 4,
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
    fontSize: 16 * fs,
    fontWeight: '600',
  },
  score: {
    fontSize: 16 * fs,
    fontWeight: '700',
    marginStart: 8,
    fontVariant: ['tabular-nums'],
  },
  helpButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 8,
  },
  grid: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_GRID_WIDTH,
    alignSelf: 'center',
  },
  measure: {
    alignSelf: 'stretch',
    height: 0,
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
  doorName: {
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  levelBadge: {
    position: 'absolute',
    top: 6,
    start: 8,
    fontSize: 11 * fs,
    fontWeight: '700',
  },
  masteryBadge: {
    position: 'absolute',
    top: 6,
    end: 8,
  },
  pressed: {
    opacity: 0.55,
  },
  selfTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: OUTER_RADIUS,
    backgroundColor: '#1565C0',
  },
  selfTestLabel: {
    color: '#FFFFFF',
    fontSize: 18 * fs,
    fontWeight: '700',
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
    fontSize: 11 * fs,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 0.2,
  },
});

type TabButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  a11yLabel: string;
  testID: string;
  onPress: () => void;
};

function TabButton({ icon, label, a11yLabel, testID, onPress }: TabButtonProps): React.JSX.Element {
  const styles = useScaledStyles(stylesFor);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color="#374151" />
      <Text style={styles.tabLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
