// Tafel dish illustrations: a stylised, top-down plate or bowl drawn from a recipe's real ingredients.
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

export function plateFor(recipe) {
  const rand = rng(recipe.id);
  const parts = Object.keys(recipe.ing).map(id => ({ id, m: MAP[id] })).filter(p => p.m);
  const has = role => parts.filter(p => p.m[0] === role);
  if (recipe.meal === 'breakfast' && recipe.ing.maize_meal) parts.push({ id: '_porridge', m: MAP._porridge });
  const bowl = recipe.meal === 'breakfast' && has('bowl').length > 0 || /soup/i.test(recipe.name);
  const S = []; // shapes: {t, ...}
  const C = 100, R = bowl ? 66 : 74;

  // Dish
  S.push({ t: 'circle', x: C, y: C + 3, r: R + 16, fill: 'shadow' });
  S.push({ t: 'circle', x: C, y: C, r: R + 16, fill: 'dish' });
  S.push({ t: 'circle', x: C, y: C, r: R + (bowl ? 4 : 9), fill: 'none', stroke: 'rim' });

  const soup = /soup/i.test(recipe.name);
  const sauce = has('sauce')[0];
  // Bowls fill with porridge/yoghurt/soup; plates get a bed of starch to one side.
  if (bowl) {
    const base = soup ? (recipe.ing.butternut ? PAL.squash : PAL.lentil) : PAL[(has('bowl')[0] || has('bed')[0] || { m: [0, 'oats'] }).m[1]];
    S.push({ t: 'circle', x: C, y: C, r: R, fill: base, stroke: '#00000014' });
    if (!soup && has('bowl').length > 1) S.push({ t: 'blob', x: C - 14, y: C + 8, r: R * 0.55, fill: PAL[has('bowl')[1].m[1]], rot: rand() * 360 });
    if (soup) for (let i = 0; i < 3; i++) S.push({ t: 'arc', x: C, y: C, r: 18 + i * 14, fill: 'none', stroke: '#ffffff55' });
  } else {
    const bed = has('bed')[0];
    if (sauce) S.push({ t: 'blob', x: C + R * 0.24, y: C - R * 0.04, r: R * 0.62, fill: PAL[sauce.m[1]], rot: rand() * 360 });
    if (bed) {
      const kind = bed.m[2];
      const bx = C - R * 0.36, by = C + R * 0.06, br = R * 0.52;
      if (kind === 'strand') {
        S.push({ t: 'blob', x: bx + 12, y: by - 6, r: br * 1.05, fill: PAL.pasta, rot: 0 });
        for (let i = 0; i < 14; i++) S.push({ t: 'curve', x: bx + 12 + (rand() - .5) * br * 1.4, y: by - 6 + (rand() - .5) * br * 1.4, r: 10 + rand() * 10, rot: rand() * 360, stroke: '#c9a44f' });
      } else {
        S.push({ t: 'blob', x: bx, y: by, r: br, fill: PAL[bed.m[1]], rot: rand() * 360, stroke: '#00000016' });
        if (kind === 'grain') for (const p of scatter(rand, 40, bx, by, br * 0.8)) S.push({ t: 'grain', ...p, rot: rand() * 180, fill: '#ffffffd9' });
        if (kind === 'mound') S.push({ t: 'curve', x: bx - 4, y: by - 4, r: br * 0.45, rot: 160, stroke: '#ffffff99' });
        if (bed.id === 'potato' && recipe.ing.potato >= 900 && /chips|wedge/i.test(recipe.name)) S.pop();
      }
    }
  }

  // Bread, wraps and toast sit on the side.
  for (const side of has('side')) {
    const n = recipe.ing[side.id] >= 4 ? 2 : 1;
    for (let i = 0; i < n; i++) S.push(side.m[2] === 'half'
      ? { t: 'half', x: C - R * 0.3 + i * 14, y: C - R * 0.2 + i * 18, r: 40, rot: -30 + i * 25, fill: PAL.wrap, stroke: '#cfae6f' }
      : { t: 'toast', x: C - R * 0.3 + i * 16, y: C - R * 0.12 + i * 20, r: 34, rot: -18 + i * 22, fill: PAL.bread, stroke: PAL.crust });
  }
  // Chips: wedges instead of mash
  if (/chips|wedge/i.test(recipe.name)) for (let i = 0; i < 11; i++) S.push({ t: 'wedge', x: C - R * 0.36 + (rand() - .5) * 46, y: C + R * 0.06 + (rand() - .5) * 46, r: 17, rot: rand() * 360, fill: '#e3b35c' });

  // Main protein
  const main = has('main');
  const sideOnly = has('bed').length === 0 && has('side').length > 0;
  const mx = bowl ? C : C + R * 0.3, my = bowl ? C : C - R * (sideOnly ? 0.02 : 0.1), mr = bowl ? R * 0.55 : R * 0.46;
  for (const [k, p] of main.entries()) {
    const col = PAL[p.m[1]], shape = p.m[2];
    const cx = mx + (k ? (rand() - .5) * 30 : 0), cy = my + (k ? 14 : 0);
    if (shape === 'crumble') for (const q of scatter(rand, 30, cx, cy, mr * 0.9, 5)) S.push({ t: 'blob', ...q, r: 5.5 + rand() * 4.5, fill: col, rot: rand() * 360 });
    else if (shape === 'piece' || shape === 'chunk' || shape === 'chop') for (const q of scatter(rand, shape === 'chop' ? 2 : 4, cx, cy, mr * 0.6, 22)) S.push({ t: 'blob', ...q, r: shape === 'chop' ? 26 : 16, fill: col, rot: rand() * 360, stroke: '#00000022' });
    else if (shape === 'slice') for (let i = 0; i < 5; i++) S.push({ t: 'pill', x: cx - 24 + i * 12, y: cy + (i % 2) * 3, r: 19, rot: 70, fill: col, stroke: '#00000018' });
    else if (shape === 'coil') S.push({ t: 'coil', x: cx, y: cy, r: mr * 0.75, fill: 'none', stroke: col });
    else if (shape === 'fillet') for (let i = 0; i < (p.id === 'hake' ? 2 : 3); i++) S.push({ t: 'fillet', x: cx - 12 + i * 16, y: cy - 8 + i * 10, r: 28, rot: -25 + i * 10, fill: col, stroke: '#00000022' });
    else if (shape === 'flake') for (const q of scatter(rand, 14, cx, cy, mr * 0.7, 8)) S.push({ t: 'blob', ...q, r: 8, fill: col, rot: rand() * 360 });
    else if (shape === 'egg') for (const q of scatter(rand, Math.min(3, Math.ceil((recipe.ing.eggs || 2) / 3)), cx, cy, mr * 0.55, 30)) { S.push({ t: 'blob', ...q, r: 20, fill: PAL.egg, rot: rand() * 360, stroke: '#0000001c' }); S.push({ t: 'circle', x: q.x + 2, y: q.y + 1, r: 8, fill: PAL.yolk }); }
    else for (const q of scatter(rand, shape === 'round' ? 16 : 34, cx, cy, mr * 0.85, shape === 'round' ? 8 : 4)) S.push({ t: 'circle', ...q, r: shape === 'round' ? 6 : 3.4, fill: col, stroke: '#00000018' });
  }

  // Vegetables and fruit around the main
  for (const v of has('veg')) {
    const col = PAL[v.m[1]], shape = v.m[2];
    const n = { leaf: 6, floret: 5, coin: 6, round: 5, cube: 7, shred: 14, strip: 6, ring: 4, slice: 4, dot: 14 }[shape] || 5;
    const vx = bowl ? C + 12 : C + R * 0.05, vy = bowl ? C - 18 : C + R * 0.5;
    for (const q of scatter(rand, n, vx, vy, bowl ? R * 0.5 : R * 0.42, 10)) {
      const rot = rand() * 360;
      if (shape === 'leaf') S.push({ t: 'leaf', ...q, r: 14, rot, fill: col });
      else if (shape === 'floret') S.push({ t: 'floret', ...q, r: 10, fill: col });
      else if (shape === 'cube') S.push({ t: 'square', ...q, r: 7, rot, fill: col, stroke: '#00000018' });
      else if (shape === 'shred') S.push({ t: 'curve', ...q, r: 11, rot, stroke: col });
      else if (shape === 'strip') S.push({ t: 'pill', ...q, r: 12, rot, fill: col });
      else if (shape === 'ring') S.push({ t: 'circle', ...q, r: 9, fill: 'none', stroke: col });
      else if (shape === 'slice') S.push({ t: 'fillet', ...q, r: 15, rot, fill: col, stroke: '#00000018' });
      else if (shape === 'round') { S.push({ t: 'circle', ...q, r: 8.5, fill: col, stroke: '#00000018' }); if (v.id === 'tomato') S.push({ t: 'circle', x: q.x - 2.5, y: q.y - 2.5, r: 2, fill: '#ffffff66' }); }
      else S.push({ t: 'circle', ...q, r: shape === 'coin' ? 7 : 3.6, fill: col, stroke: '#00000018' });
    }
  }
  // Toppings
  for (const tp of has('top')) {
    if (tp.m[2] === 'smear') S.push({ t: 'blob', x: C + 26, y: C - 26, r: 18, fill: PAL.pb, rot: rand() * 360 });
    else for (const q of scatter(rand, 16, mx, my, mr * 0.8)) S.push({ t: 'curve', ...q, r: 6, rot: rand() * 360, stroke: PAL.cheese });
  }
  return { shapes: S, bowl };
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
export const strokeWidth = s => s.t === 'coil' ? 11 : s.t === 'curve' ? (s.stroke === '#c9a44f' ? 2.4 : 3.2) : s.t === 'arc' ? 1.5 : s.fill === 'none' && s.t === 'circle' && s.stroke !== 'rim' ? 2.4 : 1;

// Web: an SVG string. theme = { dish, rim, shadow }
export function plateSVG(recipe, theme, size = 200, label = '') {
  const { shapes } = plateFor(recipe);
  const col = v => v === 'dish' ? theme.dish : v === 'rim' ? theme.rim : v === 'shadow' ? theme.shadow : v;
  const out = shapes.map(s => {
    const fill = strokeOnly(s) ? 'none' : col(s.fill);
    const stroke = s.stroke ? col(s.stroke) : 'none';
    const sw = strokeWidth(s);
    const extra = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    if (s.t === 'circle') return `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r}" ${extra}/>`;
    return `<path d="${shapePath(s)}" ${extra}/>`;
  }).join('');
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${label || 'Illustration of ' + recipe.name}">${out}</svg>`;
}
