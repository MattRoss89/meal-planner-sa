// Draws a Tafel dish illustration with react-native-svg (same artwork as the web).
import React, { useMemo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { plateFor, shapePath, strokeOnly, strokeWidth } from './plate';

export default function Plate({ recipe, size = 56, theme, zoom = false }) {
  const shapes = useMemo(() => plateFor(recipe).shapes, [recipe.id]);
  const col = v => v === 'dish' ? theme.bg : v === 'rim' ? theme.line : v === 'shadow' ? '#0000001c' : v;
  return <Svg width={size} height={size} viewBox={zoom ? '16 16 168 168' : '0 0 200 200'} accessibilityLabel={`Illustration of ${recipe.name}`}>
    {shapes.map((s, i) => {
      const props = { fill: strokeOnly(s) ? 'none' : col(s.fill), stroke: s.stroke ? col(s.stroke) : 'none', strokeWidth: strokeWidth(s), strokeLinecap: 'round', strokeLinejoin: 'round' };
      return s.t === 'circle' ? <Circle key={i} cx={s.x} cy={s.y} r={s.r} {...props} /> : <Path key={i} d={shapePath(s)} {...props} />;
    })}
  </Svg>;
}
