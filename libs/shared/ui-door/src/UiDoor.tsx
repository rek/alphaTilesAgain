import React from 'react';
import { Pressable } from 'react-native';
import { DoorSvg } from './DoorSvg';

export type DoorVisual = 'not-started' | 'in-process' | 'mastery';

type UiDoorProps = {
  index: number;
  colorHex: string;
  visual: DoorVisual;
  textColorHex?: string;
  onPress: () => void;
  a11yLabel: string;
  width?: number;
  height?: number;
};

function resolveColors(
  visual: DoorVisual,
  colorHex: string,
  textColorHex?: string,
): { fill: string; stroke: string; textColor: string } {
  switch (visual) {
    case 'not-started':
      return { fill: '#FFFFFF', stroke: colorHex, textColor: colorHex };
    case 'in-process':
      return { fill: colorHex, stroke: '', textColor: textColorHex ?? '#FFFFFF' };
    case 'mastery':
      return { fill: '#E0E0E0', stroke: colorHex, textColor: colorHex };
  }
}

export function UiDoor({
  index,
  colorHex,
  visual,
  textColorHex,
  onPress,
  a11yLabel,
  width = 64,
  height = 88,
}: UiDoorProps): React.JSX.Element {
  const { fill, stroke, textColor } = resolveColors(visual, colorHex, textColorHex);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
    >
      <DoorSvg
        fill={fill}
        stroke={stroke}
        textColor={textColor}
        number={index}
        width={width}
        height={height}
      />
    </Pressable>
  );
}
