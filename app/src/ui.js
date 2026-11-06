// Design tokens and shared UI pieces, matching the web preview.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Tafel palette: paper ground, olive ink, sage label colour, amber for training, brick for over budget.
export const LIGHT = {
  bg: '#fbf9f3', surface: '#fbf9f3', sunk: '#f2efe6', ink: '#454b39', muted: '#7d8172', line: '#dedbd0', rule: '#454b39',
  accent: '#454b39', accentInk: '#fbf9f3', accentSoft: '#dfe7d2',
  train: '#a87b2c', trainSoft: '#f3ead8', bad: '#9a4a35', badSoft: '#f3e2dc',
  paper: '#dfe7d2', paperInk: '#3d4433', paperLine: '#a9b39a', paperMuted: '#5d6651',
};
export const DARK = {
  bg: '#1d201a', surface: '#1d201a', sunk: '#252920', ink: '#e9e6db', muted: '#a3a596', line: '#353a2f', rule: '#e9e6db',
  accent: '#e9e6db', accentInk: '#1d201a', accentSoft: '#323a2b',
  train: '#d6a956', trainSoft: '#2f2a1e', bad: '#e08a73', badSoft: '#3a231d',
  paper: '#323a2b', paperInk: '#e4ead9', paperLine: '#56604a', paperMuted: '#b7bfa9',
};
const SANS = ', "Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = ', "Bodoni 72", Didot, Georgia, serif';
const f = (name, stack = SANS) => (Platform.OS === 'web' ? name + stack : name);
export const FONTS = {
  display: f('BodoniModa_500Medium', SERIF), displayHeavy: f('BodoniModa_500Medium', SERIF),
  body: f('HankenGrotesk_400Regular'), medium: f('HankenGrotesk_400Regular'), semi: f('HankenGrotesk_500Medium'), bold: f('HankenGrotesk_500Medium'),
  slip: f('HankenGrotesk_400Regular'), slipSemi: f('HankenGrotesk_500Medium'),
};
export const ThemeCtx = React.createContext(LIGHT);
export const useT = () => React.useContext(ThemeCtx);

export const shadow = {}; // Tafel uses hairlines, not shadows

const PATHS = {
  plan: [['rect', { x: 3.5, y: 5, width: 17, height: 15, rx: 2.5 }], ['path', 'M3.5 10h17M8 3v4M16 3v4']],
  list: [['path', 'M5 11h14l-1.4 7.2A2 2 0 0 1 15.6 20H8.4a2 2 0 0 1-2-1.8L5 11Z'], ['path', 'M9 11V8a3 3 0 0 1 6 0v3']],
  fitness: [['path', 'M3 12h4l2.5-6 4 12 2.5-6H21']],
  settings: [['path', 'M4 7h10M18 7h2M4 17h4M12 17h8'], ['circle', { cx: 16, cy: 7, r: 2 }], ['circle', { cx: 10, cy: 17, r: 2 }]],
  swap: [['path', 'M7 7h11l-3-3M17 17H6l3 3']],
  lock: [['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }], ['path', 'M8 11V8a4 4 0 0 1 8 0v3']],
  unlock: [['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }], ['path', 'M8 11V8a4 4 0 0 1 7.5-2']],
  clock: [['circle', { cx: 12, cy: 12, r: 8 }], ['path', 'M12 8v4l2.5 2']],
  protein: [['path', 'M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10Z']],
  refresh: [['path', 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5']],
  copy: [['rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }], ['path', 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2']],
  text: [['path', 'M5 6h14M5 10h14M5 14h9M5 18h6']],
  check: [['path', 'm5 12.5 4.5 4.5L19 7.5']],
  run: [['circle', { cx: 14, cy: 4.5, r: 1.8 }], ['path', 'm8 21 3-6 3 2v4M6 12l3-4 4 1 2 3 3 1']],
};
export function Icon({ name, size = 20, color }) {
  const t = useT();
  const c = color || t.muted;
  const common = { stroke: c, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return <Svg width={size} height={size} viewBox="0 0 24 24">
    {PATHS[name].map(([k, v], i) => k === 'path' ? <Path key={i} d={v} {...common} />
      : k === 'rect' ? <Rect key={i} {...v} {...common} /> : <Circle key={i} {...v} {...common} />)}
  </Svg>;
}

export function T({ children, style, muted, size = 15, font = 'body', color, ...p }) {
  const t = useT();
  return <Text {...p} style={[{ color: color || (muted ? t.muted : t.ink), fontSize: size, fontFamily: FONTS[font] }, style]}>{children}</Text>;
}
// Serif for headlines and big figures, matching the Tafel website.
export function H({ children, size = 18, style, heavy }) {
  return <T size={size} font={heavy ? 'displayHeavy' : 'display'} style={[{ letterSpacing: -0.3, lineHeight: Math.round(size * 1.08) }, style]}>{children}</T>;
}

export function Btn({ title, icon, onPress, kind = 'default', style }) {
  const t = useT();
  const primary = kind === 'primary', ghost = kind === 'ghost';
  const fg = primary ? t.accentInk : ghost ? t.muted : t.ink;
  if (!primary) return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[{ paddingVertical: 12 }, style]}>
    <T color={fg} style={{ textDecorationLine: 'underline' }}>{title}</T></TouchableOpacity>;
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[{
    alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 22, backgroundColor: t.ink,
  }, style]}>
    <T font="semi" size={11.5} color={t.bg} style={{ letterSpacing: 1.8, textTransform: 'uppercase' }}>{title}</T>
  </TouchableOpacity>;
}

export function Chip({ label, on, onPress }) {
  const t = useT();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={{
    borderWidth: 1, borderColor: t.line, backgroundColor: on ? t.accentSoft : 'transparent', paddingVertical: 10, paddingHorizontal: 14, marginRight: -1, marginBottom: -1,
  }}>
    <T size={14}>{label}</T>
  </TouchableOpacity>;
}
export function Chips({ children }) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{children}</View>; }

export function Section({ title, lead, children, style }) {
  const t = useT();
  return <View style={[{ borderTopWidth: 1, borderColor: t.rule, paddingTop: 16, marginTop: 28, gap: 16 }, style]}>
    {title && <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 6, height: 6, backgroundColor: t.ink }} />
        <T size={11.5} muted style={{ letterSpacing: 1.8, textTransform: 'uppercase' }}>{title}</T></View>
      {lead && <T muted size={13.5}>{lead}</T>}</View>}
    {children}
  </View>;
}
export function Field({ label, children, style }) {
  return <View style={[{ gap: 8, flex: 1, minWidth: 140 }, style]}><T muted size={11} style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</T>{children}</View>;
}

export function NumInput({ value, onChange, placeholder, prefix, align }) {
  const t = useT();
  const [v, setV] = useState(value == null ? '' : String(value));
  useEffect(() => { setV(value == null ? '' : String(value)); }, [value]);
  const commit = () => onChange(v.trim());
  return <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: t.ink }}>
    {prefix && <T muted font="semi" style={{ marginRight: 4 }}>{prefix}</T>}
    <TextInput keyboardType="decimal-pad" value={v} placeholder={placeholder} placeholderTextColor={t.muted}
      onChangeText={setV} onEndEditing={commit} onBlur={commit} returnKeyType="done"
      style={{ flex: 1, paddingVertical: 8, color: t.ink, fontFamily: FONTS.body, fontSize: 17, textAlign: align || 'left' }} />
  </View>;
}

export function Meter({ value, max, over, height = 10, color }) {
  const t = useT();
  return <View style={{ height: 3, justifyContent: 'center' }}>
    <View style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: t.line }} />
    <View style={{ width: Math.min(100, (value / max) * 100) + '%', height: 3, backgroundColor: color || (over ? t.bad : t.ink) }} />
  </View>;
}

export function Dashed({ color }) {
  return <View style={{ height: 1, backgroundColor: color, marginVertical: 2 }} />;
}

// Torn-receipt bottom edge.
export function ZigZag() { return null; }
