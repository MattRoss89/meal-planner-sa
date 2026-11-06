// Tafel dish illustrations: a stylised bite of each recipe on a fork (or a spoonful), drawn from its real ingredients.
// Returns plain shape data so the web (SVG strings) and the app (react-native-svg) can both draw it.
// Coordinates are in a 200 x 200 box.

const PAL = {
  rice: '#e8e0cb', pap: '#e5dbc2', pasta: '#e6c675', mash: '#e7c987', oats: '#d6bf93', samp: '#dfcfab',
  mince: '#7a4b33', chicken: '#d4a26a', wors: '#8a4634', hake: '#efe2c8', tuna: '#cdb69a', pilchard: '#b4523b',
  egg: '#fbf7ee', yolk: '#e9b23c', lentil: '#c4693a', chickpea: '#dbb46c', soya: '#a3794f', beans: '#a5513c', pork: '#d9a582', stew: '#6f3f2b',
  tomato: '#c8432f', leaf: '#557d3b', carrot: '#df7a38', squash: '#e49a3b', cabbage: '#cbd8a4', pepper: '#6e9b3d', mushroom: '#b9a589',
  onion: '#e9dfcc', sweet: '#d77f39', avo: '#8fb04f', pea: '#7da84b', banana: '#efd36c', apple: '#c84a3c', cheese: '#ebc561',
  curry: '#d3913a', coconut: '#efe4c9', redsauce: '#b8432f', yoghurt: '#f6f1e6', milk: '#f7f3ea', bread: '#d6ad78', crust: '#a9763f', wrap: '#e7cf9b', pb: '#a8723f',
};

// ingredient -> { role, color, shape }
const MAP = {
  rice: ['bed', 'rice', 'grain'], maize_meal: ['bed', 'pap', 'mound'], _porridge: ['bowl', 'pap', 'pool'], pasta: ['bed', 'pasta', 'strand'], potato: ['bed', 'mash', 'mound'],
  oats: ['bowl', 'oats', 'grain'], samp: ['bed', 'samp', 'grain'], yoghurt: ['bowl', 'yoghurt', 'pool'], milk: ['bowl', 'milk', 'pool'],
  mince: ['main', 'mince', 'crumble'], chicken_pieces: ['main', 'chicken', 'piece'], chicken_breast: ['main', 'chicken', 'slice'],
  boerewors: ['main', 'wors', 'coil'], beef_stew: ['main', 'stew', 'chunk'], pork_chops: ['main', 'pork', 'chop'], hake: ['main', 'hake', 'fillet'],
  tuna: ['main', 'tuna', 'flake'], pilchards: ['main', 'pilchard', 'fillet'], eggs: ['main', 'egg', 'egg'], lentils: ['main', 'lentil', 'dot'],
  chickpeas: ['main', 'chickpea', 'round'], soya: ['main', 'soya', 'crumble'], baked_beans: ['main', 'beans', 'dot'],
  tomato: ['veg', 'tomato', 'round'], spinach: ['veg', 'leaf', 'leaf'], broccoli: ['veg', 'leaf', 'floret'], carrot: ['veg', 'carrot', 'coin'],
  butternut: ['veg', 'squash', 'cube'], cabbage: ['veg', 'cabbage', 'shred'], green_pepper: ['veg', 'pepper', 'strip'], mushrooms: ['veg', 'mushroom', 'round'],
  onion: ['veg', 'onion', 'ring'], sweet_potato: ['veg', 'sweet', 'cube'], avocado: ['veg', 'avo', 'slice'], frozen_peas: ['veg', 'pea', 'dot'],
  frozen_veg: ['veg', 'carrot', 'cube'], banana: ['veg', 'banana', 'coin'], apple: ['veg', 'apple', 'slice'], cheese: ['top', 'cheese', 'shred'],
  chakalaka: ['sauce', 'redsauce', 'pool'], tomato_can: ['sauce', 'redsauce', 'pool'], coconut_milk: ['sauce', 'coconut', 'pool'], curry: ['sauce', 'curry', 'pool'],
  bread: ['side', 'bread', 'slice'], wraps: ['side', 'wrap', 'half'], peanut_butter: ['top', 'pb', 'smear'],
};

function rng(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

// Points inside a circle sector, packed loosely.
function scatter(rand, n, cx, cy, r, minD = 0) {
  const pts = [];
  for (let i = 0, tries = 0; pts.length < n && tries < n * 40; tries++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r;
    const p = { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
    if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= minD)) pts.push(p);
  }
  return pts;
}

// A single bite: the dish's ingredients speared on a fork (or a spoonful for porridge, yoghurt and soup).
// Drawn upright, then tilted by `rotate` degrees around the centre.
export function plateFor(recipe) {
  const rand = rng(recipe.id);
  const parts = Object.keys(recipe.ing).map(id => ({ id, m: MAP[id] })).filter(p => p.m);
  const has = role => parts.filter(p => p.m[0] === role);
  const soup = /soup/i.test(recipe.name);
  if (recipe.meal === 'breakfast' && recipe.ing.maize_meal) parts.push({ id: '_porridge', m: MAP._porridge });
  const spoon = soup || (recipe.meal === 'breakfast' && has('bowl').length > 0);
  const S = [];
  const X = 100;
  S.push({ t: 'circle', x: 100, y: 100, r: 92, fill: 'dish', norot: true });

  if (spoon) {
    // Spoon: handle, neck and an oval bowl holding the food.
    S.push({ t: 'rr', x: X - 6, y: 112, w: 12, h: 82, rx: 6, fill: 'metal', stroke: 'metalEdge' });
    S.push({ t: 'ellipse', x: X, y: 70, rx: 38, ry: 48, fill: 'metal', stroke: 'metalEdge' });
    S.push({ t: 'ellipse', x: X, y: 70, rx: 32, ry: 41, fill: 'metalDeep' });
    const base = soup ? (recipe.ing.butternut ? PAL.squash : PAL.lentil) : PAL[(has('bowl')[0] || { m: [0, 'oats'] }).m[1]];
    S.push({ t: 'ellipse', x: X, y: 72, rx: 30, ry: 37, fill: base, stroke: '#00000012' });
    if (!soup && has('bowl').length > 1) S.push({ t: 'blob', x: X - 6, y: 80, r: 18, fill: PAL[has('bowl')[1].m[1]], rot: rand() * 360 });
    if (soup) { S.push({ t: 'curve', x: X - 4, y: 64, r: 14, rot: 200, stroke: '#ffffff66' }); S.push({ t: 'circle', x: X + 8, y: 82, r: 3, fill: '#ffffff55' }); }
    for (const v of [...has('veg'), ...has('main')].slice(0, 3)) {
      const col = PAL[v.m[1]];
      for (const q of scatter(rand, v.m[2] === 'coin' || v.m[2] === 'slice' ? 3 : 4, X + 2, 64, 18, 9)) {
        if (v.m[2] === 'slice') S.push({ t: 'fillet', ...q, r: 10, rot: rand() * 360, fill: col, stroke: '#00000018' });
        else if (v.m[2] === 'leaf') S.push({ t: 'leaf', ...q, r: 9, rot: rand() * 360, fill: col });
        else S.push({ t: 'circle', ...q, r: v.m[2] === 'coin' ? 6 : 4.5, fill: col, stroke: '#00000018' });
      }
    }
    for (const tp of has('top')) S.push(tp.m[2] === 'smear' ? { t: 'blob', x: X + 8, y: 58, r: 10, fill: PAL.pb, rot: 30 } : { t: 'curve', x: X, y: 60, r: 8, rot: 20, stroke: PAL.cheese });
    S.push({ t: 'curve', x: X - 18, y: 44, r: 10, rot: 300, stroke: '#ffffff99' });
    return { shapes: S, rotate: -32 };
  }

  // Fork: handle, neck, head and four tines.
  S.push({ t: 'rr', x: X - 7, y: 118, w: 14, h: 76, rx: 7, fill: 'metal', stroke: 'metalEdge' });
  S.push({ t: 'rr', x: X - 4, y: 96, w: 8, h: 30, rx: 4, fill: 'metal' });
  S.push({ t: 'rr', x: X - 27, y: 78, w: 54, h: 24, rx: 12, fill: 'metal', stroke: 'metalEdge' });
  for (let i = 0; i < 4; i++) S.push({ t: 'rr', x: X - 26 + i * 15, y: 16, w: 7, h: 72, rx: 3.5, fill: 'metal', stroke: 'metalEdge' });

  // The bite sits on the tines, leaving the tips showing above it.
  const by = 54;
  const sauce = has('sauce')[0];
  const bed = has('bed')[0];
  const main = has('main');
  const veg = has('veg');
  if (bed) {
    const k = bed.m[2];
    if (k === 'strand') {
      S.push({ t: 'blob', x: X, y: by + 6, r: 27, fill: PAL.pasta, stroke: '#c9a44f' });
      for (let i = 0; i < 4; i++) S.push({ t: 'arc', x: X, y: by + 2 + i * 6, r: 22 - i * 2, stroke: '#c9a44f' });
    } else {
      S.push({ t: 'blob', x: X, y: by + 6, r: 27, fill: PAL[bed.m[1]], rot: rand() * 360, stroke: '#00000018' });
      if (k === 'grain') for (const q of scatter(rand, 26, X, by + 6, 22)) S.push({ t: 'grain', ...q, rot: rand() * 180, fill: '#ffffffd9' });
      if (k === 'mound') S.push({ t: 'curve', x: X - 6, y: by + 2, r: 12, rot: 160, stroke: '#ffffff99' });
    }
  } else if (has('side')[0]) {
    const side = has('side')[0];
    S.push(side.m[2] === 'half'
      ? { t: 'rr', x: X - 28, y: by - 8, w: 56, h: 34, rx: 17, fill: PAL.wrap, stroke: '#cfae6f' }
      : { t: 'toast', x: X, y: by + 4, r: 26, rot: 0, fill: PAL.bread, stroke: PAL.crust });
  } else if (/chips|wedge/i.test(recipe.name)) {
    S.push({ t: 'wedge', x: X, y: by + 8, r: 24, rot: -8, fill: '#e3b35c', stroke: '#c48f3a' });
  }
  if (sauce) {
    S.push({ t: 'blob', x: X + 3, y: by - 2, r: 22, fill: PAL[sauce.m[1]], rot: rand() * 360 });
    S.push({ t: 'drop', x: X + 14, y: by + 36, r: 6, fill: PAL[sauce.m[1]] }); // a drip falling from the bite
  }
  // Main pieces on top, front and centre.
  for (const [k, p] of main.slice(0, 2).entries()) {
    const col = PAL[p.m[1]], sh = p.m[2], cx = X - 4 + k * 16, cy = by - 8 + k * 6;
    if (sh === 'crumble') for (const q of scatter(rand, 12, cx, cy, 15, 5)) S.push({ t: 'blob', ...q, r: 5 + rand() * 3.5, fill: col, rot: rand() * 360 });
    else if (sh === 'piece' || sh === 'chunk' || sh === 'chop' || sh === 'slice') S.push({ t: 'blob', x: cx, y: cy, r: 16, fill: col, rot: rand() * 360, stroke: '#00000022' });
    else if (sh === 'coil') S.push({ t: 'pill', x: cx, y: cy, r: 22, rot: -10, fill: col, stroke: '#00000022' });
    else if (sh === 'fillet') S.push({ t: 'fillet', x: cx, y: cy, r: 22, rot: -15, fill: col, stroke: '#00000022' });
    else if (sh === 'flake') for (const q of scatter(rand, 5, cx, cy, 11, 7)) S.push({ t: 'blob', ...q, r: 7, fill: col, rot: rand() * 360 });
    else if (sh === 'egg') { S.push({ t: 'blob', x: cx, y: cy, r: 16, fill: PAL.egg, rot: rand() * 360, stroke: '#0000001c' }); S.push({ t: 'circle', x: cx + 2, y: cy + 1, r: 6.5, fill: PAL.yolk }); }
    else for (const q of scatter(rand, sh === 'round' ? 7 : 12, cx, cy, 14, sh === 'round' ? 7 : 4)) S.push({ t: 'circle', ...q, r: sh === 'round' ? 5 : 3.2, fill: col, stroke: '#00000018' });
  }
  // A couple of vegetable pieces tucked in.
  for (const [k, v] of veg.slice(0, 3).entries()) {
    const col = PAL[v.m[1]], sh = v.m[2];
    const q = { x: X - 20 + k * 19 + (rand() - .5) * 6, y: by - 18 + (k % 2) * 30 + (rand() - .5) * 6 };
    const rot = rand() * 360;
    if (sh === 'leaf') S.push({ t: 'leaf', ...q, r: 12, rot, fill: col });
    else if (sh === 'floret') S.push({ t: 'floret', ...q, r: 9, fill: col });
    else if (sh === 'cube') S.push({ t: 'square', ...q, r: 6.5, rot, fill: col, stroke: '#00000018' });
    else if (sh === 'shred') S.push({ t: 'curve', ...q, r: 10, rot, stroke: col });
    else if (sh === 'strip') S.push({ t: 'pill', ...q, r: 10, rot, fill: col });
    else if (sh === 'ring') S.push({ t: 'circle', ...q, r: 7, fill: 'none', stroke: col });
    else if (sh === 'slice') S.push({ t: 'fillet', ...q, r: 12, rot, fill: col, stroke: '#00000018' });
    else if (sh === 'dot') for (const d of scatter(rand, 4, q.x, q.y, 7, 5)) S.push({ t: 'circle', ...d, r: 3.4, fill: col, stroke: '#00000018' });
    else { S.push({ t: 'circle', ...q, r: sh === 'coin' ? 6.5 : 7.5, fill: col, stroke: '#00000018' }); if (v.id === 'tomato') S.push({ t: 'circle', x: q.x - 2, y: q.y - 2, r: 1.8, fill: '#ffffff66' }); }
  }
  for (const tp of has('top')) S.push(tp.m[2] === 'smear' ? { t: 'blob', x: X, y: by - 4, r: 16, fill: PAL.pb, rot: 10 } : { t: 'curve', x: X + 2, y: by - 12, r: 9, rot: 15, stroke: PAL.cheese });
  // Tine tips poke through the top of the bite.
  for (let i = 0; i < 4; i++) S.push({ t: 'rr', x: X - 26 + i * 15, y: 16, w: 7, h: 14, rx: 3.5, fill: 'metal', stroke: 'metalEdge' });
  return { shapes: S, rotate: -32 };
}

// Path helpers shared by renderers (all in plate coordinates).
export function shapePath(s) {
  const { x, y, r } = s;
  const rot = (px, py) => { const a = (s.rot || 0) * Math.PI / 180; const dx = px - x, dy = py - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const P = pts => 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L') + ' Z';
  switch (s.t) {
    case 'blob': {
      const n = 9, pts = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 0.82 + 0.18 * Math.sin(i * 2.3 + r); pts.push(rot(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.92)); }
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], f = v => v.toFixed(1);
      const m0 = mid(pts[0], pts[1]);
      let d = `M${f(m0[0])} ${f(m0[1])}`;
      for (let i = 1; i <= n; i++) { const p = pts[i % n], m = mid(p, pts[(i + 1) % n]); d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`; }
      return d + ' Z';
    }
    case 'rr': { const { w, h, rx } = s; return `M${x + rx} ${y} H${x + w - rx} A${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V${y + h - rx} A${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} A${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V${y + rx} A${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`; }
    case 'ellipse': { const { rx, ry } = s; return `M${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} Z`; }
    case 'drop': return `M${x} ${y - r * 2.2} C${x + r * 0.9} ${y - r * 0.6} ${x + r} ${y + r} ${x} ${y + r} C${x - r} ${y + r} ${x - r * 0.9} ${y - r * 0.6} ${x} ${y - r * 2.2} Z`;
    case 'grain': return P([rot(x - 3, y), rot(x, y - 1.2), rot(x + 3, y), rot(x, y + 1.2)]);
    case 'square': return P([rot(x - r, y - r), rot(x + r, y - r), rot(x + r, y + r), rot(x - r, y + r)]);
    case 'pill': return P([rot(x - r, y - r * 0.28), rot(x + r, y - r * 0.28), rot(x + r * 1.1, y), rot(x + r, y + r * 0.28), rot(x - r, y + r * 0.28), rot(x - r * 1.1, y)]);
    case 'fillet': return P([rot(x - r, y), rot(x - r * 0.5, y - r * 0.42), rot(x + r * 0.6, y - r * 0.34), rot(x + r, y), rot(x + r * 0.6, y + r * 0.34), rot(x - r * 0.5, y + r * 0.42)]);
    case 'leaf': { const [a, b] = rot(x - r, y), [c, d] = rot(x + r, y), [e, f] = rot(x, y - r * 0.7), [g, h] = rot(x, y + r * 0.7); return `M${a.toFixed(1)} ${b.toFixed(1)} Q${e.toFixed(1)} ${f.toFixed(1)} ${c.toFixed(1)} ${d.toFixed(1)} Q${g.toFixed(1)} ${h.toFixed(1)} ${a.toFixed(1)} ${b.toFixed(1)} Z`; }
    case 'wedge': return P([rot(x - r, y - r * 0.25), rot(x + r, y - r * 0.18), rot(x + r * 0.8, y + r * 0.3), rot(x - r * 0.9, y + r * 0.2)]);
    case 'toast': return P([rot(x - r * 0.8, y - r * 0.55), rot(x - r * 0.4, y - r * 0.85), rot(x + r * 0.4, y - r * 0.85), rot(x + r * 0.8, y - r * 0.55), rot(x + r * 0.8, y + r * 0.8), rot(x - r * 0.8, y + r * 0.8)]);
    case 'half': { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; pts.push(rot(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9)); } return P(pts); }
    case 'curve': { const [a, b] = rot(x - r, y), [c, d] = rot(x, y - r * 0.6), [e, f] = rot(x + r, y); return `M${a.toFixed(1)} ${b.toFixed(1)} Q${c.toFixed(1)} ${d.toFixed(1)} ${e.toFixed(1)} ${f.toFixed(1)}`; }
    case 'coil': { let d = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 5.2, rr = r * (0.18 + 0.82 * i / 60); d += (i ? ' L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); } return d; }
    case 'arc': return `M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}`;
    case 'floret': { let d = ''; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, cx = x + Math.cos(a) * r * 0.55, cy = y + Math.sin(a) * r * 0.55, rr = r * 0.55; d += `M${(cx - rr).toFixed(1)} ${cy.toFixed(1)} a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(2 * rr).toFixed(1)} 0 a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(-2 * rr).toFixed(1)} 0 `; } return d; }
    default: return null; // circles are drawn as circles
  }
}

const STROKED = new Set(['curve', 'coil', 'arc']);
export const strokeOnly = s => STROKED.has(s.t) || s.fill === 'none';
export const strokeWidth = s => s.t === 'coil' ? 11 : s.t === 'curve' ? (s.stroke === '#c9a44f' ? 2.4 : 3.2) : s.t === 'arc' ? (s.stroke === '#c9a44f' ? 2 : 1.5) : s.stroke === 'metalEdge' ? 1.2 : s.fill === 'none' && s.t === 'circle' && s.stroke !== 'rim' ? 2.4 : 1;

// Web: an SVG string. theme = { dish, rim, shadow }
// Close-up: centre the bite in the circle and let the handle run off the edge.
export const BITE = { x: 98, y: 90, scale: 1.55, focusY: 60 };
export const biteTransform = rotate => `translate(${BITE.x} ${BITE.y}) rotate(${rotate || 0}) scale(${BITE.scale}) translate(-100 -${BITE.focusY})`;
export const METAL = { metal: '#c3c7bd', metalEdge: '#8f948a', metalDeep: '#aeb3a8' };
export function plateSVG(recipe, theme, size = 200, label = '') {
  const { shapes, rotate } = plateFor(recipe);
  const col = v => v === 'dish' ? theme.dish : v === 'rim' ? theme.rim : v === 'shadow' ? theme.shadow : METAL[v] || v;
  const out = shapes.map(s => {
    const fill = strokeOnly(s) ? 'none' : col(s.fill);
    const stroke = s.stroke ? col(s.stroke) : 'none';
    const sw = strokeWidth(s);
    const extra = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    if (s.t === 'circle') return `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r}" ${extra}/>`;
    return `<path d="${shapePath(s)}" ${extra}/>`;
  });
  const bg = shapes.findIndex(s => s.norot);
  const back = bg >= 0 ? out[bg] : '', front = out.filter((_, i) => i !== bg).join('');
  const clip = 'tc-' + recipe.id + '-' + size;
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${label || 'Illustration of ' + recipe.name}"><defs><clipPath id="${clip}"><circle cx="100" cy="100" r="92"/></clipPath></defs>${back}<g clip-path="url(#${clip})"><g transform="${biteTransform(rotate)}">${front}</g></g></svg>`;
}
