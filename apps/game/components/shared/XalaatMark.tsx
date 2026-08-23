import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { palette } from '~/lib/theme/tokens';

export function XalaatMark({
  size = 36,
  color = palette.primaryInk,
  accent = palette.gold,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Path d="M18 2 L34 18 L18 34 L2 18 Z" fill={color} />
      <Path d="M18 8 L28 18 L18 28 L8 18 Z" fill={accent} opacity={0.85} />
      <Circle cx={18} cy={18} r={3} fill={color} />
    </Svg>
  );
}
