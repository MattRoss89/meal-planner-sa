import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Linking, Platform,
  StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  STORES, INGREDIENTS, DIETS, PREFERENCES, ACTIVITIES, GOALS, DAYS,
  mergeSettings, fitnessTargets, priceOf, buildList, formatQty, listAsText,
  recipeById, recipeNutrition, dayNutrition, generatePlan, alternatives, applySwap, storeSearchUrl,
} from './src/core';
import {
  firebaseReady, watchUser, signInWithGoogleWeb, signInWithGoogleIdToken, signOut,
  loadState, saveState, loadPriceFeed,
} from './src/backend';
import { GOOGLE_CLIENT_IDS } from './src/config';

WebBrowser.maybeCompleteAuthSession();

const money = n => 'R' + Math.round(n).toLocaleString('en-ZA');
const LIGHT = { bg: '#f6f5f1', card: '#fff', ink: '#1d2321', muted: '#68716d', line: '#e4e2dc', brand: '#1f7a4d', soft: '#e3f1e9', warn: '#b54708', warnSoft: '#fdf0e2' };
const DARK = { bg: '#121514', card: '#1b1f1e', ink: '#eef1ef', muted: '#9aa39f', line: '#2b302e', brand: '#4cc08a', soft: '#1d3329', warn: '#f2a65a', warnSoft: '#3a2a1a' };
const ThemeCtx = React.createContext(LIGHT);
const useT = () => React.useContext(ThemeCtx);

// ---------- small components ----------
function Card({ children, style }) { const t = useT(); return <View style={[{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 }, style]}>{children}</View>; }
function T({ children, style, muted, small, bold, ...p }) { const t = useT(); return <Text {...p} style={[{ color: muted ? t.muted : t.ink, fontSize: small ? 13 : 15 }, bold && { fontWeight: '700' }, style]}>{children}</Text>; }
function Btn({ title, onPress, primary, small, style }) {
  const t = useT();
  return <TouchableOpacity onPress={onPress} style={[{ borderWidth: 1, borderColor: primary ? t.brand : t.line, backgroundColor: primary ? t.brand : t.card, borderRadius: 10, paddingVertical: small ? 6 : 10, paddingHorizontal: small ? 10 : 14, alignItems: 'center' }, style]}>
    <Text style={{ color: primary ? '#fff' : t.ink, fontWeight: '600', fontSize: small ? 13 : 15 }}>{title}</Text></TouchableOpacity>;
}
function Chip({ label, on, onPress }) {
  const t = useT();
  return <TouchableOpacity onPress={onPress} style={{ borderWidth: 1, borderColor: on ? t.brand : t.line, backgroundColor: on ? t.brand : t.card, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 11, marginRight: 6, marginBottom: 6 }}>
    <Text style={{ color: on ? '#fff' : t.ink, fontSize: 13 }}>{label}</Text></TouchableOpacity>;
}
function Chips({ children }) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>{children}</View>; }
function Label({ children }) { return <T muted small style={{ marginTop: 10, marginBottom: 4 }}>{children}</T>; }
function NumField({ value, onChange, placeholder }) {
  const t = useT();
  const [v, setV] = useState(value == null ? '' : String(value));
  useEffect(() => { setV(value == null ? '' : String(value)); }, [value]);
  return <TextInput keyboardType="numeric" value={v} placeholder={placeholder} placeholderTextColor={t.muted}
    onChangeText={setV} onEndEditing={() => onChange(v)} onBlur={() => onChange(v)}
    style={{ borderWidth: 1, borderColor: t.line, borderRadius: 10, padding: 9, color: t.ink, backgroundColor: t.card }} />;
}

// ---------- login ----------
function LoginScreen({ onGuest }) {
  const t = useT();
  const [err, setErr] = useState(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);
  useEffect(() => {
    if (response?.type === 'success') {
      signInWithGoogleIdToken(response.params.id_token).catch(e => setErr(e.message));
    }
  }, [response]);
  const go = async () => {
    setErr(null);
    try { if (Platform.OS === 'web') await signInWithGoogleWeb(); else await promptAsync(); }
    catch (e) { setErr(e.message); }
  };
  return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    <T bold style={{ fontSize: 26, marginBottom: 6 }}>Meal Planner SA</T>
    <T muted style={{ marginBottom: 24 }}>Weekly meals on your budget and diet, a costed grocery list for South African stores, and fitness-aware portions.</T>
    <Btn primary title="Continue with Google" onPress={go} style={{ opacity: Platform.OS === 'web' || request ? 1 : 0.5 }} />
    <View style={{ height: 10 }} />
    <Btn title="Use without an account" onPress={onGuest} />
    {err && <T small style={{ color: t.warn, marginTop: 12 }}>{err}</T>}
    <T muted small style={{ marginTop: 18 }}>Signing in saves your settings and plans to your account so they follow you across phone and web.</T>
  </View>;
}

// ---------- budget card ----------
function BudgetCard({ list, settings, priceFeed, onStore }) {
  const t = useT();
  const b = settings.weeklyBudget, over = list.total > b, pct = Math.min(100, (list.total / b) * 100);
  return <Card>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View><T muted small>This week · {STORES[settings.store].name}</T><T bold style={{ fontSize: 28 }}>{money(list.total)}</T></View>
      <View style={{ backgroundColor: over ? t.warnSoft : t.soft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
        <Text style={{ color: over ? t.warn : t.brand, fontWeight: '700', fontSize: 12 }}>{over ? money(list.total - b) + ' over' : money(b - list.total) + ' left'} of {money(b)}</Text></View>
    </View>
    <View style={{ height: 8, backgroundColor: t.line, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}><View style={{ width: pct + '%', height: 8, backgroundColor: over ? t.warn : t.brand }} /></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginHorizontal: -4 }}>
      {Object.entries(STORES).map(([k, v]) => <TouchableOpacity key={k} onPress={() => onStore(k)} style={{ width: '50%', padding: 4 }}>
        <View style={{ borderWidth: settings.store === k ? 2 : 1, borderColor: settings.store === k ? t.brand : t.line, borderRadius: 10, padding: 8 }}>
          <T muted small>{v.name}</T><T bold style={{ fontSize: 16 }}>{money(list.byStore[k])}</T></View></TouchableOpacity>)}
    </View>
    <T muted small style={{ marginTop: 6 }}>{priceFeed?.updatedAt ? 'Prices updated ' + new Date(priceFeed.updatedAt).toLocaleDateString('en-ZA') : 'Estimated prices'} · other stores estimated from a price index</T>
  </Card>;
}

// ---------- screens ----------
function PlanScreen({ data, update, priceFeed, openSheet, regenerate }) {
  const t = useT();
  const s = data.settings;
  if (!data.plan) return <Card><T bold style={{ fontSize: 18 }}>Plan your week</T><T muted style={{ marginVertical: 8 }}>Set household, budget and diet in Settings, then generate a 7-day plan with a costed grocery list.</T><Btn primary title="Generate my week" onPress={() => regenerate(true)} /></Card>;
  const list = buildList(data.plan, s, priceFeed, data.overrides);
  const targets = s.fitness.enabled ? fitnessTargets(s.fitness) : null;
  const slots = ['breakfast', 'lunch', 'dinner'].filter(m => s.meals[m]);
  return <View>
    <BudgetCard list={list} settings={s} priceFeed={priceFeed} onStore={k => update(d => { d.settings.store = k; })} />
    <View style={{ flexDirection: 'row', marginBottom: 12 }}><Btn primary title="↻ New plan" onPress={() => regenerate(true)} /><View style={{ width: 8 }} /><Btn title="Reset locks" onPress={() => regenerate(false)} /></View>
    {data.plan.days.map((d, i) => {
      const n = dayNutrition(d);
      const tg = targets && targets.days[i];
      return <Card key={i}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <T bold>{DAYS[i]}</T>
          <T small muted>{tg ? `${ACTIVITIES[tg.activity].label} · ` : ''}<Text style={{ color: tg ? (n.protein >= tg.protein - 5 ? t.brand : t.warn) : t.muted }}>{n.protein}{tg ? '/' + tg.protein : ''} g protein</Text> · {n.kcal}{tg ? '/' + tg.kcal : ''} kcal</T>
        </View>
        {slots.map(m => {
          const r = d[m] && recipeById(d[m]); const key = i + ':' + m; const lk = !!data.locked[key];
          return <View key={m} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderColor: t.line }}>
            <T muted small style={{ width: 72, textTransform: 'uppercase', fontSize: 11 }}>{m}</T>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => r && openSheet({ type: 'recipe', id: r.id })}>
              <T>{r ? r.name : 'No matching recipe'}</T>
              {r && <T small muted>{r.mins} min · {Math.round(recipeNutrition(r).protein * (d.portion || 1))} g protein{d.portion && d.portion !== 1 ? ` · your portion ${d.portion}×` : ''}</T>}
            </TouchableOpacity>
            {r && <TouchableOpacity onPress={() => update(x => { if (lk) delete x.locked[key]; else x.locked[key] = d[m]; })} style={{ padding: 6 }}><Text style={{ fontSize: 17 }}>{lk ? '🔒' : '🔓'}</Text></TouchableOpacity>}
            {r && <TouchableOpacity onPress={() => openSheet({ type: 'swap', key })} style={{ padding: 6 }}><Text style={{ fontSize: 17, color: t.muted }}>⇄</Text></TouchableOpacity>}
          </View>;
        })}
        {d.snacks?.length > 0 && <View style={{ flexDirection: 'row', paddingTop: 8, borderTopWidth: 1, borderColor: t.line }}><T muted small style={{ width: 72, fontSize: 11 }}>SNACKS</T><T small muted style={{ flex: 1 }}>{d.snacks.map(x => recipeById(x).name).join(' · ')}</T></View>}
      </Card>;
    })}
  </View>;
}

function ListScreen({ data, update, priceFeed, openSheet, toast }) {
  const t = useT();
  const s = data.settings;
  if (!data.plan) return <Card><T muted>Generate a plan first.</T></Card>;
  const list = buildList(data.plan, s, priceFeed, data.overrides);
  const main = list.items.filter(i => s.includeStaples || !i.staple), staples = list.items.filter(i => i.staple && !s.includeStaples);
  let aisle = '';
  const copy = async () => { await Clipboard.setStringAsync(listAsText(list, s)); toast('List copied'); };
  return <View>
    <BudgetCard list={list} settings={s} priceFeed={priceFeed} onStore={k => update(d => { d.settings.store = k; })} />
    <Card>
      <T bold>Shop at {STORES[s.store].name}</T>
      <T small muted>Tap “find” to open the item on the store's site or app.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
        <Btn primary small title="Copy list" onPress={copy} /><View style={{ width: 8 }} />
        <Btn small title="Show as text" onPress={() => openSheet({ type: 'text' })} /><View style={{ width: 8 }} />
        <Btn small title="Uncheck all" onPress={() => update(d => { d.checked = {}; })} />
      </View>
      {main.map(i => {
        const head = i.aisle !== aisle ? (aisle = i.aisle) : null;
        const done = !!data.checked[i.id];
        return <View key={i.id}>
          {head && <T muted small bold style={{ marginTop: 14, textTransform: 'uppercase', fontSize: 12 }}>{head}</T>}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderColor: t.line }}>
            <TouchableOpacity onPress={() => update(d => { if (done) delete d.checked[i.id]; else d.checked[i.id] = true; })} style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: t.brand, backgroundColor: done ? t.brand : 'transparent', marginRight: 10, alignItems: 'center', justifyContent: 'center' }}>{done && <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text>}</TouchableOpacity>
            <View style={{ flex: 1 }}><T style={done && { textDecorationLine: 'line-through', color: t.muted }}>{i.name}</T><T small muted>× {i.packs} · need {formatQty(i)}</T></View>
            <T small style={{ marginRight: 10 }}>R{i.cost.toFixed(2)}</T>
            <TouchableOpacity onPress={() => Linking.openURL(storeSearchUrl(s.store, i))}><Text style={{ color: t.brand, fontSize: 13 }}>find ↗</Text></TouchableOpacity>
          </View></View>;
      })}
      {staples.length > 0 && <T muted small bold style={{ marginTop: 14, fontSize: 12 }}>CHECK YOUR PANTRY</T>}
      {staples.map(i => <View key={i.id} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: t.line }}><T muted style={{ flex: 1 }}>{i.name}</T><TouchableOpacity onPress={() => Linking.openURL(storeSearchUrl(s.store, i))}><Text style={{ color: t.brand, fontSize: 13 }}>find ↗</Text></TouchableOpacity></View>)}
    </Card>
    <Card><T small muted>Checkers Sixty60, Pick n Pay asap! and Woolworths Dash don't offer an API for other apps, so this app doesn't sign in to them. “Find” opens each product search on the store's own site, where you're signed in as usual.</T></Card>
  </View>;
}

function FitnessScreen({ data, update, regenerate }) {
  const t = useT();
  const f = data.settings.fitness;
  const setF = (k, v) => update(d => { d.settings.fitness[k] = v; });
  const num = (k, nullable) => v => setF(k, v === '' ? (nullable ? null : f[k]) : Number(v));
  const tg = fitnessTargets(f);
  return <View>
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><T bold>Fitness mode</T><Chip label={f.enabled ? 'On' : 'Off'} on={f.enabled} onPress={() => setF('enabled', !f.enabled)} /></View>
      <T small muted>Plans aim at your daily protein and calories, scale your portions on training days, and add protein snacks to the list when meals fall short. Targets are for one person in the household.</T>
    </Card>
    {f.enabled && <>
      <Card><T bold>Your targets</T>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <View style={{ flex: 1 }}><T muted small>Protein / day</T><T bold style={{ fontSize: 26 }}>{tg.protein} g</T><T muted small>{tg.perKg} g per kg</T></View>
          <View style={{ flex: 1 }}><T muted small>Rest-day calories</T><T bold style={{ fontSize: 26 }}>{tg.restKcal}</T><T muted small>BMR {tg.bmr} kcal</T></View>
        </View></Card>
      <Card><T bold>Body & goal</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Label>Weight (kg)</Label><NumField value={f.weightKg} onChange={num('weightKg')} /></View>
          <View style={{ flex: 1 }}><Label>Height (cm)</Label><NumField value={f.heightCm} onChange={num('heightCm')} /></View>
          <View style={{ flex: 1 }}><Label>Age</Label><NumField value={f.age} onChange={num('age')} /></View>
        </View>
        <Label>Sex (for the calorie formula)</Label>
        <Chips>{['male', 'female'].map(x => <Chip key={x} label={x === 'male' ? 'Male' : 'Female'} on={f.sex === x} onPress={() => setF('sex', x)} />)}</Chips>
        <Label>Goal</Label>
        <Chips>{Object.entries(GOALS).map(([k, v]) => <Chip key={k} label={v.label} on={f.goal === k} onPress={() => setF('goal', k)} />)}</Chips>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Label>Protein override (g/day)</Label><NumField value={f.proteinOverride} placeholder={String(tg.protein)} onChange={num('proteinOverride', true)} /></View>
          <View style={{ flex: 1 }}><Label>Rest-day kcal override</Label><NumField value={f.kcalOverride} placeholder={String(tg.restKcal)} onChange={num('kcalOverride', true)} /></View>
        </View>
        <Label>Protein snacks</Label>
        <Chips><Chip label={f.snacks ? 'Add snacks to close gaps' : 'No snacks'} on={f.snacks} onPress={() => setF('snacks', !f.snacks)} /></Chips>
      </Card>
      <Card><T bold>Weekly training</T><T small muted>Training days get more food.</T>
        {DAYS.map((d, i) => <View key={d} style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: t.line, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T bold>{d}</T><T small muted>{tg.days[i].kcal} kcal</T></View>
          <Chips>{Object.entries(ACTIVITIES).map(([k, v]) => <Chip key={k} label={v.label} on={f.week[i] === k} onPress={() => update(x => { x.settings.fitness.week[i] = k; })} />)}</Chips>
        </View>)}
      </Card>
      <Btn primary title="Re-plan with these targets" onPress={() => regenerate(true)} />
      <T small muted style={{ marginTop: 10 }}>Estimates only (Mifflin-St Jeor formula plus typical exercise burn), not medical advice.</T>
    </>}
  </View>;
}

function SettingsScreen({ data, update, priceFeed, user, onSignOut }) {
  const t = useT();
  const s = data.settings;
  const toggle = (k, v) => update(d => { const a = d.settings[k]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); });
  return <View>
    <Card><T bold>Household & budget</T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Label>People eating</Label><NumField value={s.householdSize} onChange={v => update(d => { d.settings.householdSize = Math.max(1, Number(v) || 1); })} /></View>
        <View style={{ flex: 1 }}><Label>Weekly budget (R)</Label><NumField value={s.weeklyBudget} onChange={v => update(d => { d.settings.weeklyBudget = Math.max(100, Number(v) || 100); })} /></View>
      </View>
      <Label>Main store</Label>
      <Chips>{Object.entries(STORES).map(([k, v]) => <Chip key={k} label={v.name} on={s.store === k} onPress={() => update(d => { d.settings.store = k; })} />)}</Chips>
      <Label>Meals to plan</Label>
      <Chips>{['breakfast', 'lunch', 'dinner'].map(m => <Chip key={m} label={m[0].toUpperCase() + m.slice(1)} on={s.meals[m]} onPress={() => update(d => { d.settings.meals[m] = !s.meals[m]; })} />)}</Chips>
      <Label>Pantry staples (oil, spices, flour)</Label>
      <Chips><Chip label={s.includeStaples ? 'Included in total' : 'Listed separately'} on={s.includeStaples} onPress={() => update(d => { d.settings.includeStaples = !s.includeStaples; })} /></Chips>
    </Card>
    <Card><T bold>Dietary requirements</T>
      <Label>Must avoid</Label><Chips>{Object.entries(DIETS).map(([k, v]) => <Chip key={k} label={v.label} on={s.diets.includes(k)} onPress={() => toggle('diets', k)} />)}</Chips>
      <Label>Preferences</Label><Chips>{Object.entries(PREFERENCES).map(([k, v]) => <Chip key={k} label={v.label} on={s.prefs.includes(k)} onPress={() => toggle('prefs', k)} />)}</Chips>
      <T small muted style={{ marginTop: 6 }}>Halal: buy halal-certified meat. Boerewors is treated as containing pork. Stock cubes, oats and soy sauce are treated as containing gluten.</T>
    </Card>
    <Card><T bold>Prices</T><T small muted>Base prices are Checkers{priceFeed?.updatedAt ? `, updated ${new Date(priceFeed.updatedAt).toLocaleDateString('en-ZA')}` : ' estimates'}. Type your own price to override.</T>
      {Object.entries(INGREDIENTS).map(([id, ing]) => <View key={id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderColor: t.line }}>
        <T style={{ flex: 1 }} small>{ing.name}</T>
        <View style={{ width: 100 }}><NumField value={data.overrides[id]} placeholder={priceOf(id, 'checkers', priceFeed, null).toFixed(2)} onChange={v => update(d => { if (v === '') delete d.overrides[id]; else d.overrides[id] = Number(v); })} /></View>
      </View>)}
    </Card>
    <Card>{user ? <><T>Signed in as {user.email}</T><View style={{ height: 8 }} /><Btn title="Sign out" onPress={onSignOut} /></> : <T small muted>{firebaseReady ? 'Not signed in: saved on this device only.' : 'Saved on this device (Firebase not configured).'}</T>}</Card>
  </View>;
}

function Sheet({ sheet, data, update, priceFeed, close }) {
  const t = useT();
  if (!sheet) return null;
  const s = data.settings;
  let body = null;
  if (sheet.type === 'swap') {
    const [d, slot] = sheet.key.split(':');
    const alts = alternatives(data.plan, +d, slot, s, priceFeed, data.overrides);
    body = <><T bold style={{ fontSize: 17, marginBottom: 8 }}>Swap {DAYS[d]} {slot}</T>
      {alts.map(a => <TouchableOpacity key={a.recipe.id} onPress={() => { update(x => { x.plan = applySwap(x.plan, +d, slot, a.recipe.id, s); x.locked[sheet.key] = a.recipe.id; }); close(); }}
        style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: t.line }}>
        <View style={{ flex: 1 }}><T>{a.recipe.name}</T><T small muted>{a.nutrition.protein} g protein · {a.nutrition.kcal} kcal · {a.recipe.mins} min</T></View>
        <T small>week {money(a.total)}</T></TouchableOpacity>)}</>;
  } else if (sheet.type === 'recipe') {
    const r = recipeById(sheet.id), n = recipeNutrition(r);
    body = <><T bold style={{ fontSize: 17 }}>{r.name}</T><T small muted>{r.mins} min · per person {n.protein} g protein · {n.kcal} kcal</T>
      <T bold small style={{ marginTop: 12 }}>Ingredients for {s.householdSize}</T>
      {Object.entries(r.ing).map(([id, q]) => <T small key={id}>• {INGREDIENTS[id].name} — {formatQty({ qty: q * s.householdSize / 4, unit: INGREDIENTS[id].unit })}</T>)}
      <T bold small style={{ marginTop: 12 }}>Method</T>
      {r.steps.map((x, i) => <T small key={i}>{i + 1}. {x}</T>)}</>;
  } else if (sheet.type === 'text') {
    body = <><T bold style={{ fontSize: 17, marginBottom: 8 }}>Grocery list</T><TextInput multiline editable={false} value={listAsText(buildList(data.plan, s, priceFeed, data.overrides), s)} style={{ color: t.ink, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, minHeight: 240 }} /></>;
  }
  return <Modal transparent animationType="slide" visible onRequestClose={close}>
    <TouchableOpacity activeOpacity={1} onPress={close} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
      <TouchableOpacity activeOpacity={1} style={{ backgroundColor: t.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '80%', padding: 16 }}>
        <ScrollView>{body}</ScrollView>
        <Btn title="Close" onPress={close} style={{ marginTop: 12 }} />
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>;
}

// ---------- root ----------
const TABS = [['plan', '🍽️', 'Plan'], ['list', '🛒', 'List'], ['fitness', '💪', 'Fitness'], ['settings', '⚙️', 'Settings']];

function Main() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [guest, setGuest] = useState(!firebaseReady);
  const [data, setData] = useState(null);
  const [priceFeed, setPriceFeed] = useState(null);
  const [tab, setTab] = useState('plan');
  const [sheet, setSheet] = useState(null);
  const [msg, setMsg] = useState(null);
  const scroll = useRef(null);

  useEffect(() => watchUser(u => setUser(u || null)), []);
  useEffect(() => { loadPriceFeed().then(setPriceFeed); }, []);
  useEffect(() => {
    if (user === undefined && firebaseReady) return;
    if (!user && !guest) return;
    loadState(user).then(saved => setData({
      settings: mergeSettings(saved?.settings), plan: saved?.plan || null,
      locked: saved?.locked || {}, overrides: saved?.overrides || {}, checked: saved?.checked || {},
    }));
  }, [user, guest]);

  const toast = m => { setMsg(m); setTimeout(() => setMsg(null), 2200); };
  const update = fn => setData(prev => {
    const next = JSON.parse(JSON.stringify(prev)); fn(next); saveState(user, next); return next;
  });
  const regenerate = keepLocks => {
    const res = generatePlan(data.settings, priceFeed, data.overrides, { locked: keepLocks ? data.locked : {} });
    update(d => { d.plan = res.plan; d.checked = {}; if (!keepLocks) d.locked = {}; });
    setTab('plan'); scroll.current?.scrollTo({ y: 0, animated: false });
    if (res.warning) toast(res.warning); else if (res.overBudget) toast('Cheapest plan found is over budget');
  };

  let content;
  if (firebaseReady && user === undefined) content = <ActivityIndicator style={{ marginTop: 80 }} />;
  else if (!user && !guest) content = <LoginScreen onGuest={() => setGuest(true)} />;
  else if (!data) content = <ActivityIndicator style={{ marginTop: 80 }} />;

  const s = data?.settings;
  return <ThemeCtx.Provider value={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {content || <>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.line }}>
          <T bold style={{ fontSize: 18 }}>Weekly Meal Planner SA</T>
          <T muted small>{s.householdSize} {s.householdSize === 1 ? 'person' : 'people'} · {money(s.weeklyBudget)}/week{s.diets.length ? ' · ' + s.diets.map(d => DIETS[d].label).join(', ') : ''}</T>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 14, paddingBottom: 30, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {tab === 'plan' && <PlanScreen data={data} update={update} priceFeed={priceFeed} openSheet={setSheet} regenerate={regenerate} />}
          {tab === 'list' && <ListScreen data={data} update={update} priceFeed={priceFeed} openSheet={setSheet} toast={toast} />}
          {tab === 'fitness' && <FitnessScreen data={data} update={update} regenerate={regenerate} />}
          {tab === 'settings' && <SettingsScreen data={data} update={update} priceFeed={priceFeed} user={user} onSignOut={async () => { await signOut(); setGuest(false); setData(null); }} />}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={{ flexDirection: 'row', backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.line }}>
          {TABS.map(([id, ic, l]) => <TouchableOpacity key={id} onPress={() => { setTab(id); scroll.current?.scrollTo({ y: 0, animated: false }); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 20 }}>{ic}</Text><Text style={{ fontSize: 12, color: tab === id ? theme.brand : theme.muted, fontWeight: tab === id ? '700' : '400' }}>{l}</Text></TouchableOpacity>)}
        </SafeAreaView>
        <Sheet sheet={sheet} data={data} update={update} priceFeed={priceFeed} close={() => setSheet(null)} />
        {msg && <View style={{ position: 'absolute', bottom: 90, alignSelf: 'center', backgroundColor: theme.ink, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 }}><Text style={{ color: theme.bg }}>{msg}</Text></View>}
      </>}
    </SafeAreaView>
  </ThemeCtx.Provider>;
}

export default function App() { return <SafeAreaProvider><Main /></SafeAreaProvider>; }
