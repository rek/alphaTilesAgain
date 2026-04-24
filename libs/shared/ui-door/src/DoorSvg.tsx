import React from 'react';
import { Svg, Path, Text } from 'react-native-svg';

type DoorSvgProps = {
  fill: string;
  stroke: string;
  strokeWidth?: number;
  textColor: string;
  number: number;
  width: number;
  height: number;
};

export function DoorSvg({
  fill,
  stroke,
  strokeWidth = 2,
  textColor,
  number,
  width,
  height,
}: DoorSvgProps): React.JSX.Element {
  const d = `M 10,${height} L 10,40 A 40,40 0 0 1 ${width - 10},40 L ${width - 10},${height} Z`;
  const fontSize = width * 0.35;
  const textY = height * 0.5 + height / 3;

  return (
    <Svg width={width} height={height}>
      <Path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? strokeWidth : 0}
      />
      <Text
        x={width / 2}
        y={textY}
        textAnchor="middle"
        fontSize={fontSize}
        fill={textColor}
        fontWeight="bold"
      >
        {number}
      </Text>
    </Svg>
  );
}
