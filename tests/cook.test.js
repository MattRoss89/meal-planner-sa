import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../shared/core.js';

const plan = (settings, opts = {}) => C.generatePlan(settings, null, null, { seed: 11, iterations: 120, ...opts });
const nonStaple = r => Object.keys(r.ing).filter(id => !C.INGREDIENTS[id].staple);
const ids = list => list.map(e => e.recipe.id);

describe('cook from what you have', () => {
  test('pantry choices cover every non-staple ingredient once, without pack sizes', () => {
    const all = C.pantryChoices().flatMap(g => g.items);
    const expected = Object.keys(C.INGREDIENTS).filter(id => !C.INGREDIENTS[id].staple);
    assert.deepEqual(all.map(i => i.id).sort(), expected.sort());
    for (const i of all) assert.doesNotMatch(i.name, /\(/, i.name);
    assert.equal(C.ingredientLabel('eggs'), 'Eggs');
  });

  test('nothing ticked means no suggestions', () => {
    const r = C.cookFromPantry([], {});
    assert.deepEqual([r.ready, r.almost, r.close].map(x => x.length), [0, 0, 0]);
  });

  test('a recipe whose ingredients are all in is ready, ignoring staples', () => {
    const r = C.recipeById('d_shakshuka'); // eggs, tinned tomato, onion, pepper, oil (staple)
    const res = C.cookFromPantry(nonStaple(r), {});
    const hit = res.ready.find(e => e.recipe.id === r.id);
    assert.ok(hit, 'shakshuka is ready');
    assert.equal(hit.missing.length, 0);
    assert.equal(hit.coverage, 1);
  });

  test('one or two missing are "almost", priced at the chosen store', () => {
    const r = C.recipeById('d_shakshuka');
    const have = nonStaple(r).filter(id => id !== 'eggs');
    const checkers = C.cookFromPantry(have, { store: 'checkers' }).almost.find(e => e.recipe.id === r.id);
    const woolies = C.cookFromPantry(have, { store: 'woolworths' }).almost.find(e => e.recipe.id === r.id);
    assert.deepEqual(checkers.missing.map(m => m.id), ['eggs']);
    assert.equal(checkers.missingCost, C.priceOf('eggs', 'checkers'));
    assert.ok(woolies.missingCost > checkers.missingCost, 'Woolworths costs more');
  });

  test('groups never overlap, and every entry respects its limits', () => {
    const res = C.cookFromPantry(['eggs', 'onion', 'tomato', 'mince', 'rice', 'potato', 'cheese', 'bread'], {});
    const all = [...ids(res.ready), ...ids(res.almost), ...ids(res.close)];
    assert.equal(new Set(all).size, all.length);
    for (const e of res.almost) assert.ok(e.missing.length >= 1 && e.missing.length <= 2);
    for (const e of res.close) assert.ok(e.missing.length >= 3 && e.missing.length <= 4 && e.coverage >= 0.5);
    assert.ok(res.ready.length + res.almost.length > 0);
  });

  test('diet rules still apply', () => {
    const res = C.cookFromPantry(['eggs', 'onion', 'tomato', 'mince', 'bacon', 'bread', 'chicken_breast'], { diets: ['vegetarian'] });
    for (const e of [...res.ready, ...res.almost, ...res.close]) assert.ok(C.allowedRecipe(e.recipe, ['vegetarian']), e.recipe.name);
  });

  test('favourites lead their group', () => {
    const have = ['eggs', 'onion', 'tomato', 'tomato_can', 'green_pepper', 'spinach', 'cheese', 'bread', 'milk', 'butter'];
    const plain = C.cookFromPantry(have, {});
    const last = plain.ready[plain.ready.length - 1];
    assert.ok(plain.ready.length > 1, 'needs at least two ready recipes');
    const fav = C.cookFromPantry(have, { favourites: [last.recipe.id] });
    assert.equal(fav.ready[0].recipe.id, last.recipe.id);
  });

  test('placing a recipe puts it in its own meal slot on that day', () => {
    const { plan: p } = plan({});
    const next = C.placeRecipe(p, 2, 'd_shakshuka', {});
    assert.equal(next.days[2].dinner, 'd_shakshuka');
    assert.notEqual(next, p, 'returns a new plan');
  });
});

test('quickest first, and the time filter drops slower meals', () => {
  const have = ['eggs', 'onion', 'tomato', 'tomato_can', 'green_pepper', 'spinach', 'cheese', 'bread', 'milk', 'butter', 'potato', 'rice', 'mince'];
  const res = C.cookFromPantry(have, {});
  for (let i = 1; i < res.ready.length; i++) {
    const a = res.ready[i - 1], b = res.ready[i];
    assert.ok(a.changes < b.changes || (a.changes === b.changes && a.recipe.mins <= b.recipe.mins), 'fewest changes, then quickest');
  }
  const quick = C.cookFromPantry(have, {}, null, null, 20);
  for (const e of [...quick.ready, ...quick.almost, ...quick.close]) assert.ok(e.recipe.mins <= 20, e.recipe.name);
});

describe('use up the pantry', () => {
  test('mergeSettings keeps only real, non-staple pantry ids', () => {
    const s = C.mergeSettings({ pantry: ['eggs', 'eggs', 'oil', 'unicorn'], useUpPantry: 1 });
    assert.deepEqual(s.pantry, ['eggs']);
    assert.equal(s.useUpPantry, true);
  });

  test('owned items leave the list total only when using up the pantry', () => {
    const { plan: p } = plan({});
    const base = C.buildList(p, C.mergeSettings({}));
    const item = base.items.find(i => !i.staple);
    const off = C.buildList(p, C.mergeSettings({ pantry: [item.id] }));
    const on = C.buildList(p, C.mergeSettings({ pantry: [item.id], useUpPantry: true }));
    assert.equal(off.total, base.total);
    assert.ok(Math.abs(on.total - (base.total - item.cost)) < 0.02);
    assert.equal(on.items.find(i => i.id === item.id).have, true);
    assert.match(C.listAsText(on, C.mergeSettings({ useUpPantry: true })), /ALREADY HAVE/);
  });

  test('the planner leans on what you have when asked', () => {
    const pantry = ['mince', 'cabbage', 'carrot', 'onion', 'potato', 'eggs', 'rice'];
    const usesPantry = p => p.days.reduce((n, d) => n + ['breakfast', 'lunch', 'dinner']
      .filter(sl => d[sl]).reduce((m, sl) => m + Object.keys(C.recipeById(d[sl]).ing).filter(id => pantry.includes(id)).length, 0), 0);
    const off = plan({ pantry });
    const on = plan({ pantry, useUpPantry: true });
    assert.ok(usesPantry(on.plan) >= usesPantry(off.plan), 'at least as many pantry uses');
    assert.ok(on.list.total <= off.list.total, 'and a smaller list');
  });

  test('ticking pantry items re-plans only when using up the pantry', () => {
    const a = C.planInputsKey({ pantry: ['eggs'] }), b = C.planInputsKey({ pantry: ['eggs', 'rice'] });
    assert.equal(a, b);
    const c = C.planInputsKey({ pantry: ['eggs'], useUpPantry: true }), d = C.planInputsKey({ pantry: ['eggs', 'rice'], useUpPantry: true });
    assert.notEqual(c, d);
  });
});

describe('making do', () => {
  test('eggs, rice and passata make a meal', () => {
    const res = C.cookFromPantry(['eggs', 'rice', 'passata'], {});
    const ready = ids(res.ready);
    assert.ok(ready.includes('r_tomato_egg_rice'), 'the rescue meal');
    const shak = res.ready.find(e => e.recipe.id === 'd_shakshuka');
    assert.ok(shak, 'shakshuka, making do');
    assert.deepEqual(shak.swaps.map(w => [w.id, w.with]), [['tomato_can', 'passata']]);
    assert.deepEqual(shak.skipped.map(x => x.id).sort(), ['green_pepper', 'onion']);
  });

  test("a dish named after an ingredient can't leave it out", () => {
    const r = C.recipeById('b_omelette'); // Spinach & cheese omelette
    assert.equal(C.canLeaveOut(r, 'spinach'), false);
    assert.equal(C.canLeaveOut(r, 'cheese'), false);
    assert.equal(C.canLeaveOut(r, 'tomato'), true);
    assert.equal(C.canLeaveOut(r, 'eggs'), false, 'eggs are never optional');
  });

  test('never more than three things left out, and an exact match beats making do', () => {
    const res = C.cookFromPantry(['eggs', 'rice', 'passata', 'onion', 'green_pepper'], {});
    for (const e of [...res.ready, ...res.almost, ...res.close]) assert.ok(e.skipped.length <= C.MAKE_DO_SKIP_MAX);
    const i = res.ready.findIndex(e => e.changes === 0), j = res.ready.findIndex(e => e.changes > 0);
    if (i >= 0 && j >= 0) assert.ok(i < j);
  });

  test('passata stands in for tinned tomatoes, not fresh ones in a salad', () => {
    const res = C.cookFromPantry(['passata', 'chicken_breast', 'avocado', 'spinach'], {});
    const salad = [...res.ready, ...res.almost].find(e => e.recipe.id === 'l_chicken_avo_salad');
    assert.ok(salad);
    assert.ok(!salad.swaps.some(w => w.id === 'tomato'), 'no passata in a salad');
  });

  test('a tin of tomatoes becomes about 410 g of passata', () => {
    assert.deepEqual(C.standInQty('tomato_can', 'passata', 1), { qty: 410, unit: 'g' });
    assert.deepEqual(C.standInQty('bread', 'wraps', 4), { qty: 4, unit: 'ea' });
  });

  test('rescue meals are never planned into a week', () => {
    for (let seed = 1; seed < 6; seed++) {
      const { plan: p } = C.generatePlan({}, null, null, { seed, iterations: 60 });
      for (const d of p.days) for (const sl of ['breakfast', 'lunch', 'dinner']) assert.ok(!d[sl] || !C.recipeById(d[sl]).rescue);
    }
    assert.ok(C.RECIPES.some(r => r.rescue));
  });
});
