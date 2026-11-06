// Draws a Tafel dish illustration (a bite on a fork, or a spoonful) with react-native-svg.
import React, { useMemo } from 'react';
import Svg, { Circle, Path, G, Defs, ClipPath } from 'react-native-svg';
import { plateFor, shapePath, strokeOnly, strokeWidth, biteTransform, METAL } from './plate';

export default function Plate({ recipe, size = 56, theme }) {
  const { shapes, rotate } = useMemo(() => plateFor(recipe), [recipe.id]);
  const col = v => v === 'dish' ? theme.bg : v === 'rim' ? theme.line : v === 'shadow' ? '#0000001c' : METAL[v] || v;
  const draw = (s, i) => {
    const props = { fill: strokeOnly(s) ? 'none' : col(s.fill), stroke: s.stroke ? col(s.stroke) : 'none', strokeWidth: strokeWidth(s), strokeLinecap: 'round', strokeLinejoin: 'round' };
    return s.t === 'circle' ? <Circle key={i} cx={s.x} cy={s.y} r={s.r} {...props} /> : <Path key={i} d={shapePath(s)} {...props} />;
  };
  const clipId = `tc-${recipe.id}-${size}`;
  return <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel={`Illustration of ${recipe.name}`}>
    <Defs><ClipPath id={clipId}><Circle cx={100} cy={100} r={92} /></ClipPath></Defs>
    {shapes.filter(s => s.norot).map(draw)}
    <G clipPath={`url(#${clipId})`}><G transform={biteTransform(rotate)}>{shapes.filter(s => !s.norot).map(draw)}</G></G>
  </Svg>;
}
