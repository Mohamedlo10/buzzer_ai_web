import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';

export function PatternZigzag({
  color = '#FFFFFF',
  opacity = 0.15,
  size = 22,
}: {
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="zigzagPattern" width={size} height={size} patternUnits="userSpaceOnUse">
            <Path
              d={`M0 ${size * 0.7} L${size / 2} ${size * 0.3} L${size} ${size * 0.7}`}
              fill="none"
              stroke={color}
              strokeWidth="1.4"
              opacity={opacity}
              strokeLinejoin="round"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#zigzagPattern)" />
      </Svg>
    </View>
  );
}
