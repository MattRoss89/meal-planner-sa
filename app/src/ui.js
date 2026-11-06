// Design tokens and shared UI pieces, matching the web preview.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const LIGHT = {
  bg: '#eef2ef', surface: '#ffffff', sunk: '#e4eae6', ink: '#13201a', muted: '#5b6a62', line: '#d6ded9',
  accent: '#1e6b4a', accentInk: '#ffffff', accentSoft: '#dbeee4',
  train: '#c9821f', trainSoft: '#f8ead3', bad: '#c0392b', badSoft: '#f9e1de',
  paper: '#fffdf8', paperInk: '#24282a', paperLine: '#cfcac0', paperMuted: '#6b6f70',
};
export const DARK = {
  bg: '#0e1512', surface: '#16201b', sunk: '#1c2822', ink: '#e8efeb', muted: '#94a39b', line: '#26332c',
  accent: '#4fbf88', accentInk: '#06231a', accentSoft: '#1a3529',
  train: '#efb35a', trainSoft: '#3a2c17', bad: '#f0806f', badSoft: '#3d1f1b',
  paper: '#f4f0e6', paperInk: '#24282a', paperLine: '#c9c3b6', paperMuted: '#6b6f70',
};
const SANS = ', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = ', ui-monospace, Menlo, Consolas, monospace';
// On the web, add fallback stacks so text stays sans-serif if a font file is slow or missing.
const f = (name, stack) => (Platform.OS === 'web' ? name + stack : name);
export const FONTS = {
  display: f('BricolageGrotesque_700Bold', SANS), displayHeavy: f('BricolageGrotesque_800ExtraBold', SANS),
  body: f('Figtree_400Regular', SANS), medium: f('Figtree_500Medium', SANS), semi: f('Figtree_600SemiBold', SANS), bold: f('Figtree_700Bold', SANS),
  slip: f('IBMPlexMono_400Regular', MONO), slipSemi: f('IBMPlexMono_600SemiBold', MONO),
};
export const ThemeCtx = React.createContext(LIGHT);
export const useT = () => React.useContext(ThemeCtx);

export const shadow = Platform.select({
  ios: { shadowColor: '#13201a', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 3 },
  default: { boxShadow: '0 1px 2px rgba(19,32,26,.06), 0 8px 24px -12px rgba(19,32,26,.18)' },
});

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
export function H({ children, size = 18, style, heavy }) {
  return <T size={size} font={heavy ? 'displayHeavy' : 'display'} style={[{ letterSpacing: -0.2 }, style]}>{children}</T>;
}

export function Btn({ title, icon, onPress, kind = 'default', style }) {
  const t = useT();
  const primary = kind === 'primary', ghost = kind === 'ghost';
  const fg = primary ? t.accentInk : ghost ? t.muted : t.ink;
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[{
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 1, borderColor: primary ? t.accent : ghost ? 'transparent' : t.line, backgroundColor: primary ? t.accent : ghost ? 'transparent' : t.surface,
  }, style]}>
    {icon && <Icon name={icon} size={18} color={fg} />}
    <T font="semi" color={fg}>{title}</T>
  </TouchableOpacity>;
}

export function Chip({ label, on, onPress }) {
  const t = useT();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={{
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: on ? t.accent : t.line,
    backgroundColor: on ? t.accentSoft : t.surface, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 13,
  }}>
    {on && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent }} />}
    <T size={14} font={on ? 'semi' : 'medium'} color={on ? t.accent : t.ink}>{label}</T>
  </TouchableOpacity>;
}
export function Chips({ children }) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>; }

export function Section({ title, lead, children, style }) {
  const t = useT();
  return <View style={[{ backgroundColor: t.surface, borderRadius: 20, padding: 18, marginBottom: 14, gap: 14 }, style]}>
    {title && <View style={{ gap: 4 }}><H>{title}</H>{lead && <T muted size={13.5}>{lead}</T>}</View>}
    {children}
  </View>;
}
export function Field({ label, children, style }) {
  return <View style={[{ gap: 6, flex: 1, minWidth: 130 }, style]}><T muted size={13} font="semi">{label}</T>{children}</View>;
}

export function NumInput({ value, onChange, placeholder, prefix, align }) {
  const t = useT();
  const [v, setV] = useState(value == null ? '' : String(value));
  useEffect(() => { setV(value == null ? '' : String(value)); }, [value]);
  const commit = () => onChange(v.trim());
  return <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.line, borderRadius: 12, backgroundColor: t.bg, paddingHorizontal: 12 }}>
    {prefix && <T muted font="semi" style={{ marginRight: 4 }}>{prefix}</T>}
    <TextInput keyboardType="decimal-pad" value={v} placeholder={placeholder} placeholderTextColor={t.muted}
      onChangeText={setV} onEndEditing={commit} onBlur={commit} returnKeyType="done"
      style={{ flex: 1, paddingVertical: 10, color: t.ink, fontFamily: FONTS.body, fontSize: 15, textAlign: align || 'left' }} />
  </View>;
}

export function Meter({ value, max, over, height = 10, color }) {
  const t = useT();
  return <View style={{ height, borderRadius: 99, backgroundColor: t.sunk, overflow: 'hidden' }}>
    <View style={{ width: Math.min(100, (value / max) * 100) + '%', height, borderRadius: 99, backgroundColor: color || (over ? t.bad : t.accent) }} />
  </View>;
}

export function Dashed({ color }) {
  return <View style={{ height: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: color, marginVertical: 2 }} />;
}

// Torn-receipt bottom edge.
export function ZigZag({ color }) {
  const teeth = Array.from({ length: 60 });
  return <View style={{ height: 8, overflow: 'hidden', flexDirection: 'row' }}>
    {teeth.map((_, i) => <View key={i} style={{ width: 14, height: 14, backgroundColor: color, transform: [{ translateY: -7 }, { rotate: '45deg' }], marginRight: -0.0 }} />)}
  </View>;
}
