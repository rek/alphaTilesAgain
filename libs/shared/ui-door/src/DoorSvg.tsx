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
  const sw = stroke ? strokeWidth : 0;
  const pad = Math.max(10, sw);
  const arcR = (width - pad * 2) / 2;
  const archY = arcR + sw / 2;
  const bottomY = height - sw / 2;
  const d = `M ${pad},${bottomY} L ${pad},${archY} A ${arcR},${arcR} 0 0 1 ${width - pad},${archY} L ${width - pad},${bottomY} Z`;
  const fontSize = width * 0.35;
  const textY = height * 0.5 + height / 3;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
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
