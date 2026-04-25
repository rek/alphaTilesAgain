import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { UiDoor } from '@shared/ui-door';

export type DoorItem = {
  index: number;
  colorHex: string;
  visual: 'not-started' | 'in-process' | 'mastery';
  textColorHex?: string;
  a11yLabel: string;
};

type UiDoorGridProps = {
  doors: DoorItem[];
  columns?: number;
  page: number;
  totalPages: number;
  onDoorPress: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  a11y: { prev: string; next: string };
  doorWidth?: number;
  doorHeight?: number;
};

export function UiDoorGrid({
  doors,
  page,
  totalPages,
  onDoorPress,
  onPrev,
  onNext,
  a11y,
  doorWidth = 64,
  doorHeight = 88,
}: UiDoorGridProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {doors.map((door) => (
          <UiDoor
            key={door.index}
            index={door.index}
            colorHex={door.colorHex}
            visual={door.visual}
            textColorHex={door.textColorHex}
            onPress={() => onDoorPress(door.index)}
            a11yLabel={door.a11yLabel}
            width={doorWidth}
            height={doorHeight}
          />
        ))}
      </ScrollView>
      {totalPages > 1 && (
        <View style={styles.pagination}>
          {page > 0 && (
            <Pressable
              onPress={onPrev}
              accessibilityRole="button"
              accessibilityLabel={a11y.prev}
            >
              <Text style={styles.arrow}>{'←'}</Text>
            </Pressable>
          )}
          <Text style={styles.pageIndicator}>{`${page + 1} / ${totalPages}`}</Text>
          {page < totalPages - 1 && (
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel={a11y.next}
            >
              <Text style={styles.arrow}>{'→'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  arrow: {
    fontSize: 24,
    paddingHorizontal: 16,
  },
  pageIndicator: {
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
});
