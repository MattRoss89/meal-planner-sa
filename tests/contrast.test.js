// WCAG 2.1 AA colour contrast for the app's theme tokens and the web preview's CSS variables.
// Reads the colours from source so a palette change that breaks contrast fails CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Pull `NAME = { key: '#hex', ... }` out of app/src/ui.js without importing React Native.
function theme(name) {
  const src = read('app/src/ui.js');
  const body = src.match(new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\};`))[1];
  return Object.fromEntries([...body.matchAll(/(\w+): '(#[0-9a-f]{6})'/gi)].map((m) => [m[1], m[2]]));
}
// Pull the CSS custom properties from a block of the preview's stylesheet.
function cssVars(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const TEXT = 4.5; // normal-size text
const UI = 3; // UI components and graphics (1.4.11)

for (const name of ['LIGHT', 'DARK']) {
  const t = theme(name);
  const pairs = [
    ['ink', 'bg', TEXT], ['muted', 'bg', TEXT], ['muted', 'sunk', TEXT],
    ['train', 'bg', TEXT], ['bad', 'bg', TEXT], ['cycle', 'bg', TEXT],
    ['paperInk', 'paper', TEXT], ['paperMuted', 'paper', TEXT], ['ink', 'accentSoft', TEXT],
    ['accentInk', 'accent', TEXT],
    ['control', 'bg', UI], // off switch track
  ];
  for (const [fg, bg, min] of pairs) {
    test(`app ${name}: ${fg} on ${bg} ≥ ${min}:1`, () => {
      assert.ok(t[fg] && t[bg], `missing token ${fg} or ${bg}`);
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= min, `${fg} ${t[fg]} on ${bg} ${t[bg]} is ${r.toFixed(2)}:1`);
    });
  }
}

const html = read('web/template.html');
const light = cssVars(html.match(/:root\{([^}]*)\}/)[1]);
const dark = cssVars(html.match(/:root\[data-theme="dark"\]\{([^}]*)\}/)[1]);
for (const [name, v] of [['light', light], ['dark', dark]]) {
  const pairs = [
    ['ink', 'paper', TEXT], ['soft', 'paper', TEXT], ['soft', 'sage', TEXT], ['sage-ink', 'sage', TEXT],
    ['oil', 'paper', TEXT], ['brick', 'paper', TEXT], ['rose', 'paper', TEXT],
  ];
  for (const [fg, bg, min] of pairs) {
    test(`preview ${name}: --${fg} on --${bg} ≥ ${min}:1`, () => {
      const r = ratio(v[fg], v[bg]);
      assert.ok(r >= min, `--${fg} ${v[fg]} on --${bg} ${v[bg]} is ${r.toFixed(2)}:1`);
    });
  }
}

test('the preview and the app use the same light palette', () => {
  const t = theme('LIGHT');
  assert.equal(light.paper, t.bg);
  assert.equal(light.ink, t.ink);
  assert.equal(light.soft, t.muted);
  assert.equal(light.oil, t.train);
});
