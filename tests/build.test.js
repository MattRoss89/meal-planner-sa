import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as C from '../shared/core.js';
import { plateFor, plateSVG } from '../shared/plate.js';

const root = new URL('..', import.meta.url).pathname;

describe('app copies of shared code', () => {
  for (const f of ['core.js', 'plate.js', 'billing.js', 'photos.js']) {
    test(`app/src/${f} matches shared/${f} (run "npm run sync" if this fails)`, () => {
      assert.equal(readFileSync(root + 'app/src/' + f, 'utf8'), readFileSync(root + 'shared/' + f, 'utf8'));
    });
  }
});

describe('dish illustrations', () => {
  test('every recipe and snack draws without broken numbers', () => {
    for (const r of [...C.RECIPES]) {
      const { shapes } = plateFor(r);
      assert.ok(shapes.length >= 4, `${r.id} draws almost nothing`);
      const svg = plateSVG(r, { dish: '#fff', rim: '#ddd', shadow: '#0001' });
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, r.id);
    }
  });
  test('the same recipe always draws the same plate', () => {
    const r = C.RECIPES[5];
    assert.equal(JSON.stringify(plateFor(r)), JSON.stringify(plateFor(r)));
  });
});

describe('recipe photos', () => {
  test('every listed photo exists and belongs to a real recipe', async () => {
    const { PHOTOS } = await import('../shared/photos.js');
    for (const id of PHOTOS) {
      assert.ok(C.recipeById(id), `photo for unknown recipe ${id}`);
      assert.ok(existsSync(root + 'app/public/recipes/' + id + '.webp'), `missing photo file for ${id}`);
    }
  });
});

describe('pages build', () => {
  test('legal pages build and cover the required sections', () => {
    execFileSync('node', [root + 'legal/build.mjs']);
    const privacy = readFileSync(root + 'app/public/privacy.html', 'utf8');
    for (const s of ['Who we are', 'What we collect', 'Your rights', 'Information Regulator', 'Cycle dates']) assert.ok(privacy.includes(s), s);
    const terms = readFileSync(root + 'app/public/terms.html', 'utf8');
    for (const s of ['R20 per month', '30 days', 'cancel', 'Consumer Protection Act']) assert.ok(terms.includes(s), s);
    assert.ok(existsSync(root + 'app/public/paia.html'));
  });
  test('preview and website build with the planner inlined', () => {
    execFileSync('node', [root + 'web/build.mjs']);
    execFileSync('node', [root + 'site/build.mjs']);
    for (const f of ['web/index.html', 'site/index.html']) {
      const html = readFileSync(root + f, 'utf8');
      assert.ok(html.includes('function generatePlan'), f);
      assert.doesNotMatch(html, /^export /m, f);
      for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]); // every inline script parses
    }
  });
});

describe('swap demo', () => {
  test('the website inlines the prebuilt swap demo', () => {
    execFileSync('node', [root + 'site/build.mjs']);
    const html = readFileSync(root + 'site/index.html', 'utf8');
    assert.ok(html.includes('id="swap-demo"'), 'mount point');
    assert.ok(html.includes('.tf-sheet'), 'demo CSS inlined');
    assert.ok(html.includes('swap-replay'), 'demo JS inlined');
    assert.doesNotMatch(html, /\/\*__DEMO_(CSS|JS)__\*\//, 'placeholders replaced');
  });
});
