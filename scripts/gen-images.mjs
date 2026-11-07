// Generates a close-up "bite" photo for each recipe with Google's Nano Banana (Gemini image) model.
// Runs in GitHub Actions (see .github/workflows/images.yml) with the GEMINI_API_KEY secret.
//   ONLY=d_bobotie,d_wors_pap   just these recipes
//   FORCE=1                     redo recipes that already have a photo
//   GEMINI_IMAGE_MODEL=...      model id (default: gemini-2.5-flash-image)
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { RECIPES, INGREDIENTS } from '../shared/core.js';
import { isSpoonDish } from '../shared/plate.js';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('GEMINI_API_KEY is not set.'); process.exit(1); }
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ONLY = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const FORCE = process.env.FORCE === '1' || process.env.FORCE === 'true';
const root = new URL('..', import.meta.url).pathname;
const outDir = root + 'app/public/recipes/';
mkdirSync(outDir, { recursive: true });

function prompt(r) {
  const ingredients = Object.keys(r.ing).filter(id => !INGREDIENTS[id].staple).map(id => INGREDIENTS[id].name.replace(/ \(.*\)/, '').toLowerCase()).join(', ');
  const vessel = isSpoonDish(r) ? 'a single spoonful' : 'a single forkful';
  return [
    `Close-up food photograph of ${vessel} of ${r.name}, a South African home-cooked dish made with ${ingredients}.`,
    `The ${isSpoonDish(r) ? 'spoon' : 'fork'} is plain brushed stainless steel, held at a diagonal; the bite is generous, in sharp focus and centred.`,
    'Soft natural window light from the left, warm off-white linen background with muted sage-green tones, shallow depth of field, the rest of the plate softly blurred below.',
    'Editorial, appetising, realistic home cooking, like a premium cookbook. Square composition. No hands, no people, no text, no logos, no watermarks.',
  ].join(' ');
}

async function generate(r, attempt = 1) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt(r) }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } }),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const wait = 2000 * 2 ** attempt; console.log(`  ${res.status}, retrying in ${wait / 1000}s`);
    await new Promise(r => setTimeout(r, wait)); return generate(r, attempt + 1);
  }
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${json.error?.message || ''}`);
  const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!part) throw new Error('No image returned' + (json.candidates?.[0]?.finishReason ? ` (${json.candidates[0].finishReason})` : ''));
  return Buffer.from(part.inlineData.data, 'base64');
}

const todo = RECIPES.filter(r => (ONLY.length ? ONLY.includes(r.id) : true) && (FORCE || ONLY.length || !existsSync(outDir + r.id + '.webp')));
console.log(`Model ${MODEL}: ${todo.length} image(s) to make`);
let made = 0, failed = [];
for (const r of todo) {
  try {
    const raw = await generate(r);
    await sharp(raw).resize(640, 640, { fit: 'cover' }).webp({ quality: 80 }).toFile(outDir + r.id + '.webp');
    made++; console.log(`✓ ${r.id}`);
  } catch (e) { failed.push(r.id); console.log(`✗ ${r.id}: ${e.message}`); }
  await new Promise(r => setTimeout(r, 1500));
}

// Rewrite the list of recipes that have photos.
const have = RECIPES.map(r => r.id).filter(id => existsSync(outDir + id + '.webp'));
writeFileSync(root + 'shared/photos.js', `// Recipe ids that have a generated photo at /recipes/<id>.webp. Written by scripts/gen-images.mjs.\nexport const PHOTOS = ${JSON.stringify(have, null, 2)};\n`);
console.log(`Made ${made}, failed ${failed.length}${failed.length ? ': ' + failed.join(', ') : ''}. ${have.length}/${RECIPES.length} recipes now have photos.`);
if (made === 0 && failed.length) process.exit(1);
