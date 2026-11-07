import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../shared/core.js';

const SLOTS = ['breakfast', 'lunch', 'dinner'];
const meals = plan => plan.days.flatMap(d => SLOTS.map(s => d[s]).filter(Boolean));
const plan = (settings, opts = {}) => C.generatePlan(settings, null, null, { seed: 11, iterations: 120, ...opts });

describe('data integrity', () => {
  test('every recipe and snack uses known ingredients with positive amounts', () => {
    for (const r of [...C.RECIPES, ...C.SNACKS]) {
      for (const [id, q] of Object.entries(r.ing)) {
        assert.ok(C.INGREDIENTS[id], `${r.id} uses unknown ingredient ${id}`);
        assert.ok(q > 0, `${r.id} has non-positive amount for ${id}`);
      }
    }
  });
  test('recipe ids are unique and every meal slot has recipes', () => {
    const ids = C.RECIPES.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const m of SLOTS) assert.ok(C.RECIPES.some(r => r.meal === m), `no ${m} recipes`);
  });
  test('kid-friendly list only names real recipes', () => {
    for (const id of C.KID_FRIENDLY) assert.ok(C.recipeById(id), `unknown kid-friendly recipe ${id}`);
  });
  test('ingredients have a price, pack size, aisle and nutrition', () => {
    for (const [id, i] of Object.entries(C.INGREDIENTS)) {
      assert.ok(i.price > 0 && i.pack > 0 && i.aisle, id);
      for (const k of ['protein', 'kcal', 'iron']) assert.ok(Number.isFinite(i[k]) && i[k] >= 0, `${id}.${k}`);
    }
  });
});

describe('dietary rules are never broken', () => {
  const combos = [...Object.keys(C.DIETS).map(d => [d]), ['vegan', 'gluten_free'], ['halal', 'nut_free', 'dairy_free'], ['pescatarian', 'egg_free']];
  for (const diets of combos) {
    test(diets.join(' + '), () => {
      const res = plan({ diets, weeklyBudget: 3000 });
      for (const id of meals(res.plan)) assert.ok(C.allowedRecipe(C.recipeById(id), diets), `${id} breaks ${diets}`);
      for (const d of res.plan.days) for (const s of d.snacks) assert.ok(C.allowedRecipe(C.recipeById(s), diets));
    });
  }
  test('vegan excludes every animal product', () => {
    const res = plan({ diets: ['vegan'] });
    for (const id of meals(res.plan)) {
      const flags = Object.keys(C.recipeById(id).ing).map(i => C.INGREDIENTS[i].flags).join('');
      assert.doesNotMatch(flags, /[mcpfde]/, id);
    }
  });
});

describe('budget, slots and kept meals', () => {
  test('stays within a comfortable budget', () => {
    const res = plan({ householdSize: 2, weeklyBudget: 1500 });
    assert.equal(res.overBudget, false);
    assert.ok(res.list.total <= 1500);
  });
  test('flags a budget that cannot be met instead of hiding it', () => {
    const res = plan({ householdSize: 6, weeklyBudget: 100 });
    assert.equal(res.overBudget, true);
    assert.ok(res.list.total > 100);
  });
  test('only plans the meals that are switched on', () => {
    const res = plan({ meals: { breakfast: false, lunch: false, dinner: true } });
    for (const d of res.plan.days) { assert.equal(d.breakfast, null); assert.equal(d.lunch, null); assert.ok(d.dinner); }
  });
  test('kept meals stay in place', () => {
    const res = plan({}, { locked: { '2:dinner': 'd_bobotie', '0:breakfast': 'b_oats_banana' } });
    assert.equal(res.plan.days[2].dinner, 'd_bobotie');
    assert.equal(res.plan.days[0].breakfast, 'b_oats_banana');
  });
  test('validLocks drops kept meals that no longer fit', () => {
    const locks = { '2:dinner': 'd_bobotie', '3:dinner': 'd_lentil_curry', '0:lunch': 'l_tuna_wraps' };
    const kept = C.validLocks(locks, C.mergeSettings({ diets: ['vegetarian'], meals: { lunch: false } }));
    assert.deepEqual(kept, { '3:dinner': 'd_lentil_curry' });
  });
  test('a swap changes only that slot', () => {
    const res = plan({});
    const swapped = C.applySwap(res.plan, 1, 'dinner', 'd_beef_stew', {});
    assert.equal(swapped.days[1].dinner, 'd_beef_stew');
    assert.equal(swapped.days[2].dinner, res.plan.days[2].dinner);
  });
  test('changing store does not change what feeds the planner', () => {
    assert.equal(C.planInputsKey({ store: 'checkers' }, {}), C.planInputsKey({ store: 'woolworths' }, {}));
    assert.notEqual(C.planInputsKey({ weeklyBudget: 900 }, {}), C.planInputsKey({ weeklyBudget: 1000 }, {}));
  });
});

describe('grocery list maths', () => {
  const s = C.mergeSettings({ householdSize: 2 });
  const res = plan({ householdSize: 2 });
  const list = C.buildList(res.plan, s, null, null);
  test('buys enough whole packs to cover what the recipes need', () => {
    for (const i of list.items) {
      assert.ok(Number.isInteger(i.packs) && i.packs >= 1, i.id);
      assert.ok(i.packs * C.packOf(i.id) + 1e-9 >= i.qty, `${i.id}: ${i.packs} packs < ${i.qty}`);
    }
  });
  test('total equals the sum of counted items', () => {
    const sum = list.items.filter(i => !i.staple).reduce((a, i) => a + i.cost, 0);
    assert.ok(Math.abs(sum - list.total) < 0.02);
  });
  test('store comparison follows the price index order', () => {
    const b = list.byStore;
    assert.ok(b.shoprite <= b.checkers && b.checkers <= b.pnp && b.pnp <= b.spar && b.spar <= b.woolworths);
  });
  test('your own prices override the estimates', () => {
    const cheap = C.buildList(res.plan, s, null, Object.fromEntries(list.items.map(i => [i.id, 1])));
    assert.ok(cheap.total < list.total);
  });
  test('price feed updates base prices and store index', () => {
    const feed = { items: { milk: { price: 100 } }, storeIndex: { woolworths: 2 } };
    assert.equal(C.priceOf('milk', 'checkers', feed, null), 100);
    assert.equal(C.priceOf('milk', 'woolworths', feed, null), 200);
  });
  test('the text list includes the total and every item', () => {
    const txt = C.listAsText(list, s);
    assert.match(txt, /~R\d+/);
    for (const i of list.items.filter(i => !i.staple)) assert.ok(txt.includes(i.name), i.name);
  });
});

describe('households with children', () => {
  test('children count as part portions', () => {
    const s = C.mergeSettings({ householdSize: 2, kids: { toddler: 1, child: 1, teen: 1 } });
    assert.ok(Math.abs(C.eaters(s) - (2 + 0.4 + 0.6 + 1.0)) < 1e-9);
    assert.equal(C.householdLabel(s), '2 adults, 3 children');
    assert.equal(C.householdLabel(C.mergeSettings({ householdSize: 1 })), '1 adult');
  });
  test('adding children grows the list and favours kid-friendly meals', () => {
    const a = plan({ householdSize: 2, weeklyBudget: 3000 });
    const b = plan({ householdSize: 2, kids: { child: 2 }, weeklyBudget: 3000 });
    const qty = p => p.list.items.reduce((t, i) => t + i.qty, 0);
    assert.ok(qty(b) > qty(a));
    const kf = p => meals(p.plan).filter(id => C.KID_FRIENDLY.has(id)).length;
    assert.ok(kf(b) >= kf(a));
  });
});

describe('training targets', () => {
  test('Mifflin-St Jeor maths for a known person', () => {
    const t = C.fitnessTargets({ ...C.DEFAULT_SETTINGS.fitness, weightKg: 70, heightCm: 175, age: 30, sex: 'male', goal: 'maintain', week: Array(7).fill('rest') });
    assert.equal(t.bmr, Math.round(10 * 70 + 6.25 * 175 - 5 * 30 + 5));
    assert.equal(t.protein, Math.round(70 * 1.4));
    assert.ok(t.days.every(d => d.kcal === t.restKcal));
  });
  test('training days get more energy than rest days', () => {
    const t = C.fitnessTargets({ ...C.DEFAULT_SETTINGS.fitness, week: ['long_run', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'] });
    assert.ok(t.days[0].kcal > t.days[1].kcal);
  });
  test('overrides win', () => {
    const t = C.fitnessTargets({ ...C.DEFAULT_SETTINGS.fitness, proteinOverride: 150, kcalOverride: 2000 });
    assert.equal(t.protein, 150); assert.equal(t.restKcal, 2000);
  });
  test('planning with targets adds snacks when protein falls short', () => {
    const res = plan({ householdSize: 1, weeklyBudget: 3000, fitness: { enabled: true, weightKg: 90, goal: 'gain' } });
    assert.ok(res.plan.days.some(d => d.snacks.length > 0));
  });
});

describe('cycle-aware planning', () => {
  const monday = new Date('2026-11-02T00:00:00');
  test('phases fall on the right days', () => {
    const w = C.cycleWeek({ enabled: true, lastStart: '2026-11-03', length: 28, periodDays: 5 }, monday);
    assert.deepEqual(w.map(x => x.phase), ['luteal', 'period', 'period', 'period', 'period', 'period', 'recovery']);
    assert.equal(w[1].day, 1); assert.equal(w[0].day, 28);
  });
  test('turned off or without a date means no cycle plan', () => {
    assert.equal(C.cycleWeek({ enabled: false, lastStart: '2026-11-03' }, monday), null);
    assert.equal(C.cycleWeek({ enabled: true, lastStart: null }, monday), null);
  });
  test('period days get more iron', () => {
    const w = C.cycleWeek({ enabled: true, lastStart: '2026-11-03', length: 28, periodDays: 5 }, monday);
    const base = plan({ weeklyBudget: 1500 });
    const cyc = plan({ weeklyBudget: 1500 }, { cycle: w });
    const iron = p => [1, 2, 3, 4, 5].reduce((a, i) => a + C.dayNutrition(p.plan.days[i]).iron, 0);
    assert.ok(iron(cyc) > iron(base), `${iron(cyc)} <= ${iron(base)}`);
  });
  test('days before a period get the small energy top-up', () => {
    const w = C.cycleWeek({ enabled: true, lastStart: '2026-10-10', length: 28, periodDays: 5 }, monday);
    const s = C.mergeSettings({ fitness: { enabled: true } });
    const plain = C.planTargets(s, null), cyc = C.planTargets(s, w);
    w.forEach((x, i) => assert.equal(cyc.days[i].kcal - plain.days[i].kcal, x.phase === 'luteal' ? C.LUTEAL_TOPUP_KCAL : 0));
  });
});

describe('favourites', () => {
  const favs = ['d_wors_pap', 'd_bobotie', 'd_mac_cheese'];
  test('favourites are suggested more often', () => {
    let withFav = 0, without = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const a = C.generatePlan({ weeklyBudget: 2500 }, null, null, { seed, iterations: 80 });
      const b = C.generatePlan({ weeklyBudget: 2500, favourites: favs }, null, null, { seed, iterations: 80 });
      without += meals(a.plan).filter(id => favs.includes(id)).length;
      withFav += meals(b.plan).filter(id => favs.includes(id)).length;
    }
    assert.ok(withFav > without * 2 && withFav >= 16, `${withFav} vs ${without}`);
  });
  test('favourites never override dietary rules', () => {
    const res = plan({ diets: ['vegetarian'], favourites: favs });
    for (const id of meals(res.plan)) assert.ok(C.allowedRecipe(C.recipeById(id), ['vegetarian']), id);
  });
  test('toggling a favourite adds and removes it, and does not re-plan the current week', () => {
    const s = C.mergeSettings({});
    const on = C.toggleFavourite(s, 'd_bobotie');
    assert.deepEqual(on, ['d_bobotie']);
    assert.deepEqual(C.toggleFavourite({ favourites: on }, 'd_bobotie'), []);
    assert.equal(C.planInputsKey(s, {}), C.planInputsKey({ ...s, favourites: on }, {}));
  });
  test('unknown recipe ids are dropped from favourites', () => {
    assert.deepEqual(C.mergeSettings({ favourites: ['d_bobotie', 'nope'] }).favourites, ['d_bobotie']);
  });
  test('swap options list favourites first', () => {
    const res = plan({});
    const alts = C.alternatives(res.plan, 0, 'dinner', { favourites: ['d_lemon_hake'] }, null, null);
    assert.equal(alts[0].recipe.id === 'd_lemon_hake' || res.plan.days[0].dinner === 'd_lemon_hake', true);
  });
});
