import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, Modal, Linking, Platform, Switch, useColorScheme,
  ActivityIndicator, useWindowDimensions, TextInput,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useFonts, HankenGrotesk_400Regular, HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk';
import * as Bodoni from '@expo-google-fonts/bodoni-moda';
import {
  STORES, INGREDIENTS, DIETS, PREFERENCES, ACTIVITIES, GOALS, DAYS,
  cycleWeek, planTargets, planInputsKey, validLocks, isFavourite, toggleFavourite, CYCLE_LABELS, KID_GROUPS, eaters, householdLabel, DEFAULT_CYCLE, IRON_TARGET_MG, LUTEAL_TOPUP_KCAL,
  mergeSettings, fitnessTargets, priceOf, buildList, formatQty, listAsText,
  recipeById, recipeNutrition, dayNutrition, generatePlan, alternatives, applySwap, storeSearchUrl,
  pantryChoices, cookFromPantry, placeRecipe,
} from './src/core';
import {
  firebaseReady, watchUser, signInWithGoogleWeb, signInWithGoogleIdToken, signOut,
  loadState, saveState, loadPriceFeed,
  startTrial, createCheckout, manageSubscription, watchAccount, entitlement, TRIAL_DAYS, PRICE, APP_URL,
} from './src/backend';
import { GOOGLE_CLIENT_IDS } from './src/config';
import Plate from './src/Plate';
import {
  LIGHT, DARK, FONTS, ThemeCtx, useT, shadow, Icon, T, H, Btn, Chip, Chips, Section, Field, NumInput, Meter, Dashed, ZigZag,
} from './src/ui';

WebBrowser.maybeCompleteAuthSession();

const money = n => 'R' + Math.round(n).toLocaleString('en-ZA').replace(/ /g, ' ');
const money2 = n => 'R' + n.toFixed(2);
const plural = (n, w) => n === 1 ? `1 ${w}` : `${n} ${w === 'person' ? 'people' : w + 's'}`;
const shortStore = k => ({ shoprite: 'Shoprite', checkers: 'Checkers', pnp: 'Pick n Pay', spar: 'Spar', woolworths: 'Woolworths' }[k]);
const todayIdx = () => (new Date().getDay() + 6) % 7;
const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - todayIdx()); return d; };
const dayDate = i => { const d = weekStart(); d.setDate(d.getDate() + i); return d; };
const cap = s => s[0].toUpperCase() + s.slice(1);
const openLegal = page => Linking.openURL(`${APP_URL}/${page}.html`);
const fmtDate = ms => new Date(ms).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' });
async function openUrl(url) { if (Platform.OS === 'web') window.location.assign(url); else await WebBrowser.openBrowserAsync(url); }

// ---------- login ----------
function LoginScreen() {
  const t = useT();
  const [err, setErr] = useState(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);
  useEffect(() => {
    if (response?.type === 'success') signInWithGoogleIdToken(response.params.id_token).catch(e => setErr(e.message));
  }, [response]);
  const go = async () => {
    setErr(null);
    try { if (Platform.OS === 'web') await signInWithGoogleWeb(); else await promptAsync(); }
    catch (e) { setErr('Google sign-in didn\'t finish. Try again, or continue without an account.'); }
  };
  return <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center', gap: 12 }}>
    <T font="semi" size={15} style={{ letterSpacing: 6, marginBottom: 24 }}>TAFEL</T>
    <H size={38} style={{ letterSpacing: -0.5 }}>Your week of meals, costed before you shop.</H>
    <T muted size={16} style={{ marginBottom: 16 }}>Plans that fit your budget and diet, a grocery list priced for Checkers, Pick n Pay, Woolworths, Shoprite and Spar, and portions sized to your training.</T>
    <Btn kind="primary" title="Continue with Google" onPress={go} style={{ opacity: Platform.OS === 'web' || request ? 1 : 0.5, paddingVertical: 14 }} />
    {err && <T size={13.5} color={t.bad}>{err}</T>}
    <T muted size={13}>Your first {TRIAL_DAYS} days are free, with no card needed. After that Tafel is {PRICE} a month, and you can cancel any time.</T>
    <T muted size={13}>By continuing you agree to the <T muted size={13} style={{ textDecorationLine: 'underline' }} onPress={() => openLegal('terms')}>terms of use</T> and <T muted size={13} style={{ textDecorationLine: 'underline' }} onPress={() => openLegal('privacy')}>privacy policy</T>.</T>
  </View>;
}

// ---------- plan ----------
function Summary({ list, settings }) {
  const t = useT();
  const b = settings.weeklyBudget, total = list.total, over = total > b;
  const cheapest = Object.entries(list.byStore).sort((a, c) => a[1] - c[1])[0];
  const saving = list.byStore[settings.store] - cheapest[1];
  return <View style={{ paddingTop: 24, gap: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
      <View>
        <T muted size={11} style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>Groceries this week at {shortStore(settings.store)}</T>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <H size={56} style={{ letterSpacing: -1 }}>{money(total)}</H><T muted font="semi">of {money(b)}</T>
        </View>
      </View>
      <T color={over ? t.bad : t.ink}>{over ? money(total - b) + ' over budget' : money(b - total) + ' to spare'}</T>
    </View>
    <Meter value={total} max={b} over={over} />
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <T muted size={14} style={{ flex: 1 }}>{saving > 5
        ? `We estimate the same list costs about ${money(saving)} less at ${shortStore(cheapest[0])}.`
        : `${shortStore(settings.store)} is the most affordable store for this list.`}</T>
    </View>
  </View>;
}

function WeekStrip({ day, setDay, plan, settings, targets, cyc }) {
  const t = useT();
  return <View style={{ flexDirection: 'row', marginTop: 28, marginBottom: 14 }}>
    {DAYS.map((nm, i) => {
      const sel = i === day;
      const train = targets && settings.fitness.week[i] !== 'rest';
      const short = targets && dayNutrition(plan.days[i]).protein < targets.days[i].protein - 5;
      return <TouchableOpacity key={nm} onPress={() => setDay(i)} accessibilityRole="button" accessibilityState={{ selected: sel }}
        accessibilityLabel={`${nm} ${dayDate(i).getDate()}${train ? ', training day' : ''}`}
        style={{ flex: 1, alignItems: 'center', paddingTop: 9, paddingBottom: 8, borderRadius: 0, backgroundColor: sel ? t.accentSoft : 'transparent', borderLeftWidth: i ? 1 : 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.line, ...(sel ? { borderBottomWidth: 3, borderBottomColor: t.ink, paddingBottom: 6 } : null) }}>
        <T size={11} color={sel ? t.ink : t.muted} style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>{nm}</T>
        <H size={20}>{dayDate(i).getDate()}</H>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 3, height: 6 }}>
          {(short || train) && <View style={{ width: 6, height: 6, backgroundColor: short ? t.bad : t.train }} />}
          {cyc && cyc[i].phase !== 'mid' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cyc[i].phase === 'luteal' ? 'transparent' : t.cycle, borderWidth: 1, borderColor: t.cycle }} />}
        </View>
      </TouchableOpacity>;
    })}
  </View>;
}

function PlanScreen({ data, update, priceFeed, openSheet, regenerate, day, setDay, narrow, cyc, toast }) {
  const t = useT();
  const s = data.settings;
  const list = buildList(data.plan, s, priceFeed, data.overrides);
  const tg = planTargets(s, cyc);
  const slots = ['breakfast', 'lunch', 'dinner'].filter(m => s.meals[m]);
  const d = data.plan.days[day], n = dayNutrition(d), date = dayDate(day), act = s.fitness.week[day];
  const ph = cyc ? cyc[day].phase : 'mid';
  const locks = Object.keys(data.locked).length;
  return <View>
    <Summary list={list} settings={s} />
    <WeekStrip day={day} setDay={setDay} plan={data.plan} settings={s} targets={tg} cyc={cyc} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
      <H size={24}>{date.toLocaleDateString('en-ZA', { weekday: 'long' })} {date.getDate()} {date.toLocaleDateString('en-ZA', { month: 'long' })}</H>
      {tg && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: act !== 'rest' ? t.trainSoft : t.sunk, borderRadius: 0, paddingVertical: 4, paddingHorizontal: 10 }}>
        <Icon name="run" size={16} color={act !== 'rest' ? t.train : t.muted} /><T size={13} font="semi" color={act !== 'rest' ? t.train : t.muted}>{ACTIVITIES[act].label}</T></View>}
      {ph !== 'mid' && <View style={{ backgroundColor: t.cycleSoft, paddingVertical: 4, paddingHorizontal: 10 }}><T size={13} color={t.cycle}>{CYCLE_LABELS[ph]}, day {cyc[day].day}</T></View>}
    </View>
    {(ph === 'period' || ph === 'recovery') && <View style={{ borderLeftWidth: 2, borderColor: t.cycle, paddingLeft: 12, marginBottom: 12, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}><H size={20}>{n.iron} mg</H><T muted size={13}>iron of about {IRON_TARGET_MG} mg</T></View>
      <Meter value={n.iron} max={IRON_TARGET_MG} height={3} color={t.cycle} />
      <T muted size={13}>Iron-rich meals are favoured on these days. Eating them with tomato, peppers or broccoli helps your body absorb the iron.</T>
    </View>}
    {ph === 'luteal' && <T muted size={13} style={{ marginBottom: 12 }}>{tg ? `Appetite often runs higher before a period, so today's target includes about ${LUTEAL_TOPUP_KCAL} kcal extra.` : 'Appetite often runs higher before a period. A filling dinner and a snack you enjoy are fine.'}</T>}
    {tg && <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
      {[['Protein', n.protein, tg.days[day].protein, 'g', 95], ['Energy', n.kcal, tg.days[day].kcal, 'kcal', 90]].map(([label, v, target, unit, okPct]) => {
        const pct = Math.min(100, (v / target) * 100);
        return <View key={label} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 0, padding: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T muted size={13}>{label}</T><T muted size={13}>{Math.round(pct)}%</T></View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}><H size={20}>{v.toLocaleString('en-ZA')}{unit === 'g' ? ' g' : ''}</H><T muted size={13}>of {target.toLocaleString('en-ZA')} {unit}</T></View>
          <Meter value={v} max={target} height={6} color={pct < okPct ? t.train : t.accent} />
        </View>;
      })}
    </View>}
    <View style={{ borderTopWidth: 1, borderColor: t.rule }}>
      {slots.map((m, idx) => {
        const r = d[m] && recipeById(d[m]); const key = day + ':' + m; const lk = !!data.locked[key];
        const rn = r && recipeNutrition(r), p = d.portion || 1;
        const when = <T muted size={11} style={[{ letterSpacing: 1.6, textTransform: 'uppercase' }, !narrow && { width: 96 }]}>{m}</T>;
        return <View key={m} style={{ paddingVertical: 18, borderBottomWidth: 1, borderColor: t.line, gap: 6 }}>
          {narrow && when}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!narrow && when}
            {r && <TouchableOpacity onPress={() => openSheet({ type: 'recipe', id: r.id })} accessibilityLabel={`Open recipe: ${r.name}`}><Plate recipe={r} size={60} theme={t} /></TouchableOpacity>}
            <TouchableOpacity style={{ flex: 1, gap: 3 }} disabled={!r} onPress={() => openSheet({ type: 'recipe', id: r.id })}>
              {r ? <H size={19}>{r.name}</H> : <T muted>No recipe fits your requirements</T>}
              {r && <T muted size={13.5}>{r.mins} min  •  {Math.round(rn.protein * p)} g protein{p !== 1 ? <T size={13.5} color={t.train}>  •  Your portion ×{p}</T> : null}</T>}
            </TouchableOpacity>
            {r && <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: isFavourite(s, r.id) }} accessibilityLabel={isFavourite(s, r.id) ? `Remove ${r.name} from favourites` : `Add ${r.name} to favourites`}
              onPress={() => { const fav = isFavourite(s, r.id); update(x => { x.settings.favourites = toggleFavourite(x.settings, r.id); }); toast(fav ? 'Removed from favourites' : 'Added to favourites. It will come up more often'); }}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Icon name="heart" size={18} color={isFavourite(s, r.id) ? t.cycle : t.muted} filled={isFavourite(s, r.id)} /></TouchableOpacity>}
            {r && <TouchableOpacity accessibilityLabel={lk ? `Unlock ${r.name}` : `Keep ${r.name} when re-planning`} onPress={() => update(x => { if (lk) delete x.locked[key]; else x.locked[key] = d[m]; })}
              accessibilityRole="button" accessibilityState={{ selected: !!lk }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <T size={13.5} color={lk ? t.train : t.ink} style={{ textDecorationLine: 'underline' }}>{lk ? 'Kept' : 'Keep'}</T></TouchableOpacity>}
            {r && <TouchableOpacity accessibilityLabel={`Swap ${m}`} accessibilityRole="button" onPress={() => openSheet({ type: 'swap', key })} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><T size={13.5} style={{ textDecorationLine: 'underline' }}>Swap</T></TouchableOpacity>}
          </View>
        </View>;
      })}
      {d.snacks?.length > 0 && <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: t.line, gap: 6 }}>
        <T size={11} color={t.train} style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>Snacks</T>
        <T>{d.snacks.map(x => recipeById(x).name).join('  •  ')}</T>
      </View>}
    </View>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
      <Btn kind="primary" icon="refresh" title="Plan a new week" onPress={() => regenerate(true)} />
      {locks > 0 && <Btn kind="ghost" title={`Clear ${plural(locks, 'kept meal')}`} onPress={() => regenerate(false)} />}
    </View>
    {!tg && <T muted size={13} style={{ marginTop: 14 }}>{n.protein} g protein and {n.kcal.toLocaleString('en-ZA')} kcal per person today. Turn on Fitness to plan around your training.</T>}
  </View>;
}

// ---------- groceries ----------
function ListScreen({ data, update, priceFeed, openSheet, toast }) {
  const t = useT();
  const s = data.settings;
  const list = buildList(data.plan, s, priceFeed, data.overrides);
  const main = list.items.filter(i => !i.have && (s.includeStaples || !i.staple)), staples = list.items.filter(i => i.staple && !s.includeStaples && !i.have);
  const owned = list.items.filter(i => i.have);
  const left = main.filter(i => !data.checked[i.id]).length;
  const max = Math.max(...Object.values(list.byStore));
  let aisle = '';
  const copy = async () => { await Clipboard.setStringAsync(listAsText(list, s)); toast('List copied'); };
  const P = { color: t.paperInk };
  return <View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {Object.keys(STORES).map(k => {
        const on = s.store === k;
        return <TouchableOpacity key={k} onPress={() => update(d => { d.settings.store = k; })} accessibilityState={{ selected: on }}
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, borderWidth: on ? 2 : 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.accentSoft : 'transparent', borderRadius: 0, paddingVertical: on ? 9 : 10, paddingHorizontal: on ? 13 : 14, marginRight: -7, minHeight: 44 }}>
          <T size={13.5}>{shortStore(k)}</T><T size={13.5} color={t.muted}>{money(list.byStore[k])}</T>
        </TouchableOpacity>;
      })}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
      <Btn kind="primary" icon="copy" title="Copy list" onPress={copy} />
      <Btn icon="text" title="View as text" onPress={() => openSheet({ type: 'text' })} />
      {Object.keys(data.checked).length > 0 && <Btn kind="ghost" title="Untick all" onPress={() => update(d => { d.checked = {}; })} />}
    </View>

    <View style={[{ marginTop: 16 }, shadow]}>
      <View style={{ backgroundColor: t.paper, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14 }}>
        <View style={{ alignItems: 'center', gap: 2, paddingBottom: 10 }}>
          <T font="slipSemi" size={14} style={[P, { letterSpacing: 5 }]}>TAFEL</T><T font="slip" size={11} color={t.paperMuted} style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>Shopping list, {shortStore(s.store)}</T>
          <T font="slip" size={12} color={t.paperMuted}>Week of {weekStart().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}, {householdLabel(s)}</T>
          <T font="slip" size={12} color={t.paperMuted}>{left} of {plural(main.length, 'item')} still to get</T>
        </View>
        <Dashed color={t.paperLine} />
        {main.map(i => {
          const head = i.aisle !== aisle ? (aisle = i.aisle) : null;
          const done = !!data.checked[i.id];
          return <View key={i.id}>
            {head && <T font="slipSemi" size={12.5} color={t.paperMuted} style={{ marginTop: 14, marginBottom: 2 }}>{head}</T>}
            <TouchableOpacity onPress={() => update(d => { if (done) delete d.checked[i.id]; else d.checked[i.id] = true; })} accessibilityRole="checkbox" accessibilityState={{ checked: done }}
              style={{ flexDirection: 'row', gap: 8, paddingVertical: 5, alignItems: 'flex-start' }}>
              <View style={{ width: 16, height: 16, borderRadius: 0, borderWidth: 1.5, borderColor: done ? t.paperInk : '#8b8e8f', backgroundColor: done ? t.paperInk : 'transparent', marginTop: 2, alignItems: 'center', justifyContent: 'center' }}>
                {done && <Icon name="check" size={12} color={t.paper} />}</View>
              <View style={{ flex: 1 }}>
                <T font="slip" size={13.5} style={[P, done && { textDecorationLine: 'line-through', color: '#8b8e8f' }]}>{i.packs > 1 ? i.packs + ' × ' : ''}{i.name}</T>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <T font="slip" size={12} color={t.paperMuted}>uses {i.unit === 'ea' ? Math.ceil(i.qty - 0.05) : formatQty(i)}</T>
                  <TouchableOpacity onPress={() => Linking.openURL(storeSearchUrl(s.store, i))} accessibilityLabel={`Find ${i.name} at ${shortStore(s.store)}`}>
                    <T font="slip" size={12} color="#1e6b4a" style={{ textDecorationLine: 'underline' }}>find</T></TouchableOpacity>
                </View>
              </View>
              <T font="slip" size={13.5} style={P}>{money2(i.cost)}</T>
            </TouchableOpacity>
          </View>;
        })}
        <View style={{ marginTop: 12 }}><Dashed color={t.paperLine} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
          <T font="slipSemi" size={16} style={P}>Estimated total</T><T font="slipSemi" size={16} style={P}>{money2(list.total)}</T></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T font="slip" size={12} color={t.paperMuted}>Budget {money(s.weeklyBudget)}</T>
          <T font="slip" size={12} color={t.paperMuted}>{list.total > s.weeklyBudget ? money(list.total - s.weeklyBudget) + ' over' : money(s.weeklyBudget - list.total) + ' under'}</T></View>
        {staples.length > 0 && <><View style={{ marginTop: 12 }}><Dashed color={t.paperLine} /></View>
          <T font="slip" size={12.5} color={t.paperMuted} style={{ marginTop: 8 }}>Check your cupboard for {staples.map(i => i.name.replace(/ \(.*\)/, '').toLowerCase()).join(', ')}.</T></>}
        {owned.length > 0 && <T font="slip" size={12.5} color={t.paperMuted} style={{ marginTop: 8 }}>Already in your kitchen, so not counted: {owned.map(i => i.name.replace(/ \(.*\)/, '').toLowerCase()).join(', ')}.</T>}
      </View>
      <ZigZag color={t.paper} />
    </View>

    <View style={{ backgroundColor: t.surface, borderRadius: 0, padding: 18, marginTop: 16, gap: 10 }}>
      <H size={16}>Same list at other stores</H>
      {Object.entries(list.byStore).sort((a, c) => a[1] - c[1]).map(([k, v]) => {
        const cur = k === s.store;
        return <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T size={13.5} font={cur ? 'semi' : 'body'} style={{ width: 96 }}>{shortStore(k)}</T>
          <View style={{ flex: 1 }}><Meter value={v} max={max} height={12} color={cur ? t.accent : t.line} /></View>
          <T size={13.5} font={cur ? 'semi' : 'body'} style={{ width: 66, textAlign: 'right' }}>{money(v)}</T>
        </View>;
      })}
    </View>
    <T muted size={13} style={{ marginTop: 14 }}>{priceFeed?.updatedAt ? `Prices last refreshed ${new Date(priceFeed.updatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}. ` : 'Prices are estimates until the first monthly refresh. '}Other stores are estimated with an index from PriceCheck's March 2025 basket comparison, so specials and regional prices will differ. Tafel isn't affiliated with any retailer. Store accounts can't be linked because Sixty60, PnP asap! and Woolworths Dash don't offer that to other apps, so each item links to the store's own search.</T>
  </View>;
}

// ---------- fitness ----------
function SwitchRow({ title, sub, value, onChange, big }) {
  const t = useT();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <View style={{ flex: 1, gap: 2 }}>{big ? <H>{title}</H> : <T font="semi">{title}</T>}{sub && <T muted size={13}>{sub}</T>}</View>
    <Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent, false: t.control }} thumbColor="#fff" ios_backgroundColor={t.control} accessibilityLabel={title} />
  </View>;
}

function CycleSection({ cycle, setCycle, regenerate }) {
  const t = useT();
  const c = cycle || DEFAULT_CYCLE;
  const [date, setDate] = useState(c.lastStart || '');
  useEffect(() => { setDate(c.lastStart || ''); }, [c.lastStart]);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date + 'T00:00:00')) && new Date(date + 'T00:00:00') <= new Date();
  const set = patch => setCycle({ ...c, ...patch });
  return <Section title="Cycle-aware planning" lead="For anyone who menstruates. Optional, and you can turn it off or clear it any time.">
    <SwitchRow title="Plan around my cycle" sub={`Iron-rich meals on period days and just after, and about ${LUTEAL_TOPUP_KCAL} kcal extra on higher-appetite days before a period when training targets are on.`}
      value={c.enabled} onChange={v => set({ enabled: v })} />
    {c.enabled && <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Field label="Last period started (YYYY-MM-DD)">
          <View style={{ borderBottomWidth: 1, borderColor: t.ink }}>
            <TextInput value={date} onChangeText={setDate} placeholder="2026-11-01" placeholderTextColor={t.muted} autoCapitalize="none"
              onEndEditing={() => valid && set({ lastStart: date })} onBlur={() => valid && set({ lastStart: date })}
              style={{ paddingVertical: 8, color: t.ink, fontFamily: FONTS.body, fontSize: 17 }} accessibilityLabel="Date your last period started" />
          </View>
          {date.length >= 10 && !valid && <T size={12.5} color={t.bad}>Use a past date written as year-month-day, e.g. 2026-11-01.</T>}
        </Field>
        <Field label="Cycle length (days)"><NumInput value={c.length} onChange={v => set({ length: Math.min(45, Math.max(20, Number(v) || 28)) })} /></Field>
        <Field label="Period length (days)"><NumInput value={c.periodDays} onChange={v => set({ periodDays: Math.min(10, Math.max(2, Number(v) || 5)) })} /></Field>
      </View>
    </>}
    <T muted size={13}>Your cycle dates stay on this device only. Tafel never sends them to our servers, so they won't sync to your other devices. This is general guidance, not medical advice; see a doctor about very heavy periods or ongoing tiredness.</T>
    {(c.enabled || c.lastStart) && <Btn title="Clear cycle data from this device" onPress={() => setCycle(DEFAULT_CYCLE)} />}
  </Section>;
}

function FitnessScreen({ data, update, regenerate, cycle, setCycle }) {
  const t = useT();
  const f = data.settings.fitness;
  const setF = (k, v) => update(d => { d.settings.fitness[k] = v; });
  const num = (k, nullable) => v => setF(k, v === '' ? (nullable ? null : f[k]) : Number(v));
  const tg = fitnessTargets(f);
  return <View>
    <Section><SwitchRow big title="Plan around training" sub="Bigger portions on training days, a daily protein target, and protein snacks on the list when meals fall short."
      value={f.enabled} onChange={v => setF('enabled', v)} /></Section>
    <CycleSection cycle={cycle} setCycle={setCycle} regenerate={regenerate} />
    {!f.enabled ? <T muted size={13}>Targets apply to one person in the household. Everyone else eats standard portions.</T> : <>
      <Section title="Daily targets">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[[`${tg.protein} g`, `protein a day (${tg.perKg} g per kg)`], [tg.restKcal.toLocaleString('en-ZA'), 'kcal on a rest day']].map(([v, l]) =>
            <View key={l} style={{ flex: 1, backgroundColor: t.sunk, borderRadius: 0, padding: 14 }}><H size={30} heavy>{v}</H><T muted size={13}>{l}</T></View>)}
        </View>
      </Section>
      <Section title="Your week of training" lead="Training days get more food, sized to the session.">
        {DAYS.map((d, i) => <View key={d} style={{ gap: 8, paddingTop: i ? 10 : 0, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T font="semi">{d}</T><T muted size={13}>{tg.days[i].kcal.toLocaleString('en-ZA')} kcal</T></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {Object.entries(ACTIVITIES).map(([k, v]) => <Chip key={k} label={v.label} on={f.week[i] === k} onPress={() => update(x => { x.settings.fitness.week[i] = k; })} />)}
          </ScrollView>
        </View>)}
      </Section>
      <Section title="About you">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Field label="Weight (kg)"><NumInput value={f.weightKg} onChange={num('weightKg')} /></Field>
          <Field label="Height (cm)"><NumInput value={f.heightCm} onChange={num('heightCm')} /></Field>
          <Field label="Age"><NumInput value={f.age} onChange={num('age')} /></Field>
        </View>
        <Field label="Sex, for the calorie formula"><Chips>{['male', 'female'].map(x => <Chip key={x} label={cap(x)} on={f.sex === x} onPress={() => setF('sex', x)} />)}</Chips></Field>
        <Field label="Goal"><Chips>{Object.entries(GOALS).map(([k, v]) => <Chip key={k} label={v.label} on={f.goal === k} onPress={() => setF('goal', k)} />)}</Chips></Field>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Field label="Set your own protein (g/day)"><NumInput value={f.proteinOverride} placeholder={String(tg.protein)} onChange={num('proteinOverride', true)} /></Field>
          <Field label="Set your own rest-day kcal"><NumInput value={f.kcalOverride} placeholder={String(tg.restKcal)} onChange={num('kcalOverride', true)} /></Field>
        </View>
        <SwitchRow title="Add protein snacks" sub="Eggs, yoghurt, milk or tuna, added to the list when meals fall short" value={f.snacks} onChange={v => setF('snacks', v)} />
      </Section>
      <T muted size={13} style={{ marginTop: 14 }}>Targets are estimates from the Mifflin-St Jeor formula plus typical session burn. They're a starting point, not medical advice.</T>
    </>}
  </View>;
}

// ---------- settings ----------
function SettingsScreen({ data, update, priceFeed, user, onSignOut, ent, billing }) {
  const t = useT();
  const s = data.settings;
  const toggle = (k, v) => update(d => { const a = d.settings[k]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); });
  const step = n => update(d => { d.settings.householdSize = Math.min(12, Math.max(1, s.householdSize + n)); });
  const stepKid = (g, n) => update(d => { d.settings.kids[g] = Math.min(8, Math.max(0, (s.kids[g] || 0) + n)); });
  const Stepper = ({ value, onMinus, onPlus, label }) => <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: t.ink, minWidth: 130 }}>
    <TouchableOpacity accessibilityLabel={`Fewer ${label}`} onPress={onMinus} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><T muted size={20}>−</T></TouchableOpacity>
    <T font="bold" size={16} style={{ flex: 1, textAlign: 'center' }}>{value}</T>
    <TouchableOpacity accessibilityLabel={`More ${label}`} onPress={onPlus} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><T muted size={20}>+</T></TouchableOpacity>
  </View>;
  let aisle = '';
  return <View>
    <Section title="Household and budget">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Field label="Adults"><Stepper value={s.householdSize} label="adults" onMinus={() => step(-1)} onPlus={() => step(1)} /></Field>
        <Field label="Weekly grocery budget"><NumInput prefix="R" value={s.weeklyBudget} onChange={v => update(d => { d.settings.weeklyBudget = Math.max(100, Number(v) || 100); })} /></Field>
      </View>
      <Field label="Children">
        <View style={{ borderTopWidth: 1, borderColor: t.line }}>
          {Object.entries(KID_GROUPS).map(([g, v]) => <View key={g} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: t.line, paddingVertical: 2 }}>
            <View><T>{v.label}</T><T muted size={12.5}>{Math.round(v.factor * 100)}% of an adult portion</T></View>
            <Stepper value={s.kids[g] || 0} label={`children ${v.label.toLowerCase()}`} onMinus={() => stepKid(g, -1)} onPlus={() => stepKid(g, 1)} />
          </View>)}
        </View>
        <T muted size={12.5}>With children at the table, Tafel leans towards mild, familiar meals.</T>
      </Field>
      <Field label="Where you shop"><Chips>{Object.keys(STORES).map(k => <Chip key={k} label={shortStore(k)} on={s.store === k} onPress={() => update(d => { d.settings.store = k; })} />)}</Chips></Field>
      <Field label="Meals to plan"><Chips>{['breakfast', 'lunch', 'dinner'].map(m => <Chip key={m} label={cap(m)} on={s.meals[m]} onPress={() => update(d => { d.settings.meals[m] = !s.meals[m]; })} />)}</Chips></Field>
      <SwitchRow title="Count pantry staples in the total" sub="Oil, spices, flour, stock cubes and sauces" value={s.includeStaples} onChange={v => update(d => { d.settings.includeStaples = v; })} />
    </Section>
    <Section title="Dietary needs" lead="Recipes with anything you avoid are left out of every plan.">
      <Field label="Avoid"><Chips>{Object.entries(DIETS).map(([k, v]) => <Chip key={k} label={v.label} on={s.diets.includes(k)} onPress={() => toggle('diets', k)} />)}</Chips></Field>
      <Field label="Lean towards"><Chips>{Object.entries(PREFERENCES).map(([k, v]) => <Chip key={k} label={v.label} on={s.prefs.includes(k)} onPress={() => toggle('prefs', k)} />)}</Chips></Field>
      <T muted size={13}>For halal, buy halal-certified meat. Boerewors counts as containing pork; stock cubes, oats and soy sauce count as containing gluten.</T>
    </Section>
    <Section title="Favourites" lead="Tap the heart on any meal or recipe. Favourites come up more often when you plan a new week, and they're listed first when you swap a meal.">
      {s.favourites.length === 0 ? <T muted size={13.5}>No favourites yet.</T> :
        <View style={{ borderTopWidth: 1, borderColor: t.line }}>{s.favourites.map(id => { const r = recipeById(id); return <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: t.line }}>
          <Plate recipe={r} size={40} theme={t} /><T style={{ flex: 1 }}>{r.name}</T>
          <TouchableOpacity onPress={() => update(x => { x.settings.favourites = toggleFavourite(x.settings, id); })} accessibilityLabel={`Remove ${r.name} from favourites`}><T muted size={13.5} style={{ textDecorationLine: 'underline' }}>Remove</T></TouchableOpacity>
        </View>; })}</View>}
    </Section>
    <Section title="Your prices" lead="Base prices are Checkers. Type what you actually pay and the plan will use it.">
      <View style={{ borderWidth: 1, borderColor: t.line, borderRadius: 0, overflow: 'hidden' }}>
        {Object.entries(INGREDIENTS).sort((a, c) => a[1].aisle.localeCompare(c[1].aisle)).map(([id, ing]) => {
          const head = ing.aisle !== aisle ? (aisle = ing.aisle) : null;
          return <View key={id}>
            {head && <T muted size={13} font="bold" style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}>{head}</T>}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: head ? 0 : 1, borderColor: t.line }}>
              <T size={14} style={{ flex: 1 }}>{ing.name}</T>
              <View style={{ width: 110 }}><NumInput align="right" value={data.overrides[id]} placeholder={priceOf(id, 'checkers', priceFeed, null).toFixed(2)} onChange={v => update(d => { if (v === '') delete d.overrides[id]; else d.overrides[id] = Number(v); })} /></View>
            </View>
          </View>;
        })}
      </View>
    </Section>
    {user ? <AccountSection user={user} ent={ent} billing={billing} onSignOut={onSignOut} />
      : <Section title="Account"><T muted size={13.5}>Plans are saved on this device.</T></Section>}
  </View>;
}

// ---------- cook from what you have ----------
const COOK_GROUPS = [
  ['ready', 'Ready to cook', 'Everything is in your kitchen.'],
  ['almost', 'One or two things to buy', 'Short of a little. Prices are at your chosen store.'],
  ['close', 'Worth a quick shop', 'Most of it is in. A few things to pick up.'],
];
const COOK_SHOW = { ready: 12, almost: 8, close: 6 };

function CookScreen({ data, update, priceFeed, openSheet }) {
  const t = useT();
  const s = data.settings;
  const [q, setQ] = useState('');
  const [more, setMore] = useState({});
  const have = new Set(s.pantry);
  const toggle = id => update(d => { const a = d.settings.pantry; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); });
  const query = q.trim().toLowerCase();
  const groups = pantryChoices().map(g => ({ ...g, items: query ? g.items.filter(i => i.name.toLowerCase().includes(query)) : g.items })).filter(g => g.items.length);
  const res = cookFromPantry(s.pantry, s, priceFeed, data.overrides);
  const found = res.ready.length + res.almost.length + res.close.length;
  return <View>
    <Section title="What's in your kitchen" lead="Tick what you have. Oil, flour, spices, stock cubes and sauces are taken as given.">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: t.ink }}>
        <Icon name="search" size={18} />
        <TextInput value={q} onChangeText={setQ} placeholder="Find an ingredient" placeholderTextColor={t.muted} accessibilityLabel="Find an ingredient"
          style={{ flex: 1, paddingVertical: 10, color: t.ink, fontFamily: FONTS.body, fontSize: 16 }} />
        {q ? <TouchableOpacity onPress={() => setQ('')} accessibilityRole="button" style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><T muted style={{ textDecorationLine: 'underline' }}>Clear</T></TouchableOpacity> : null}
      </View>
      {groups.length === 0 && <T muted size={13.5}>No ingredient called "{q.trim()}". Try a shorter word.</T>}
      {groups.map(g => <Field key={g.aisle} label={g.aisle}><Chips>{g.items.map(i => <Chip key={i.id} label={i.name} on={have.has(i.id)} onPress={() => toggle(i.id)} />)}</Chips></Field>)}
      {s.pantry.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T muted size={13.5}>{s.pantry.length} ticked</T>
        <Btn title="Untick everything" kind="ghost" onPress={() => update(d => { d.settings.pantry = []; })} />
      </View>}
      <SwitchRow title="Plan my week around these" sub="New weeks lean on what you have, and those items come off your shopping list total." value={s.useUpPantry} onChange={v => update(d => { d.settings.useUpPantry = v; })} />
    </Section>
    {s.pantry.length === 0 ? <Section title="What you can make"><T muted>Tick a few things you have, like eggs, onions or rice, and Tafel shows what you can cook with them.</T></Section>
      : found === 0 ? <Section title="What you can make"><T muted>Nothing fits yet. Add a few more things, like an onion, eggs or a tin of tomatoes.</T></Section>
      : COOK_GROUPS.map(([k, title, lead]) => res[k].length === 0 ? null : <Section key={k} title={`${title} (${res[k].length})`} lead={lead}>
        <View style={{ borderTopWidth: 1, borderColor: t.line }}>
          {res[k].slice(0, more[k] ? undefined : COOK_SHOW[k]).map(e => <View key={e.recipe.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: t.line }}>
            <TouchableOpacity onPress={() => openSheet({ type: 'recipe', id: e.recipe.id })} accessibilityLabel={`Open recipe: ${e.recipe.name}`}><Plate recipe={e.recipe} size={52} theme={t} /></TouchableOpacity>
            <View style={{ flex: 1, gap: 3 }}>
              <TouchableOpacity onPress={() => openSheet({ type: 'recipe', id: e.recipe.id })}><H size={18}>{e.favourite ? '♥ ' : ''}{e.recipe.name}</H></TouchableOpacity>
              <T muted size={13}>{cap(e.recipe.meal)}  •  {e.recipe.mins} min</T>
              {e.missing.length > 0 && <T size={13} color={t.train}>Need {e.missing.map(m => `${m.name.toLowerCase()} (${money2(m.cost)})`).join(', ')}</T>}
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Add ${e.recipe.name} to the week`} onPress={() => openSheet({ type: 'place', id: e.recipe.id })}
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><T size={13.5} style={{ textDecorationLine: 'underline' }}>Add to week</T></TouchableOpacity>
          </View>)}
        </View>
        {res[k].length > COOK_SHOW[k] && !more[k] && <Btn title={`Show all ${res[k].length}`} onPress={() => setMore(m => ({ ...m, [k]: true }))} />}
      </Section>)}
  </View>;
}

// ---------- sheet ----------
function Sheet({ sheet, data, update, priceFeed, close, toast, cyc }) {
  const t = useT();
  const { width } = useWindowDimensions();
  if (!sheet) return null;
  const s = data.settings;
  let body = null;
  if (sheet.type === 'swap') {
    const [d, slot] = sheet.key.split(':');
    const cur = buildList(data.plan, s, priceFeed, data.overrides).total;
    const alts = alternatives(data.plan, +d, slot, s, priceFeed, data.overrides, cyc);
    body = <><H size={22}>Swap {DAYS[d]} {slot}</H><T muted size={14} style={{ marginBottom: 10 }}>Sorted by what it does to this week's total.</T>
      {alts.map(a => {
        const dl = Math.round(a.total - cur);
        return <TouchableOpacity key={a.recipe.id} onPress={() => { update(x => { x.plan = applySwap(x.plan, +d, slot, a.recipe.id, s, cyc); x.locked[sheet.key] = a.recipe.id; }); close(); toast('Meal swapped and kept'); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: t.line }}>
          <View style={{ flex: 1 }}><T font="semi">{a.favourite ? '♥ ' : ''}{a.recipe.name}</T><T muted size={13}>{a.recipe.mins} min, {a.nutrition.protein} g protein, {a.nutrition.kcal} kcal{cyc && (cyc[+d].phase === 'period' || cyc[+d].phase === 'recovery') ? `, ${a.nutrition.iron} mg iron` : ''}</T></View>
          <T size={13.5} font="semi" color={dl > 0 ? t.bad : dl < 0 ? t.accent : t.muted}>{dl === 0 ? 'Same cost' : (dl > 0 ? '+' : '−') + money(Math.abs(dl))}</T>
        </TouchableOpacity>;
      })}</>;
  } else if (sheet.type === 'place') {
    const r = recipeById(sheet.id), slot = r.meal;
    const cur = buildList(data.plan, s, priceFeed, data.overrides).total;
    body = <><H size={22}>Add {r.name} to the week</H><T muted size={14} style={{ marginBottom: 10 }}>Pick a day for it as {slot}. Each shows what it does to this week's total.</T>
      {!s.useUpPantry && <T muted size={13} style={{ marginBottom: 10 }}>These count everything as bought. Turn on Plan my week around these, on the Cook tab, to leave what you have off the list.</T>}
      {!s.meals[slot] ? <T muted>You aren't planning {slot} at the moment. Turn it on under Settings, Meals to plan.</T> : DAYS.map((nm, d) => {
        const trial = placeRecipe(data.plan, d, r.id, s, cyc);
        const dl = Math.round(buildList(trial, s, priceFeed, data.overrides).total - cur);
        const now = data.plan.days[d][slot] && recipeById(data.plan.days[d][slot]);
        return <TouchableOpacity key={nm} accessibilityRole="button" onPress={() => { update(x => { x.plan = placeRecipe(x.plan, d, r.id, s, cyc); x.locked[`${d}:${slot}`] = r.id; }); close(); toast(`Added to ${nm} and kept`); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, minHeight: 44, borderBottomWidth: 1, borderColor: t.line }}>
          <View style={{ flex: 1 }}><T font="semi">{nm}</T><T muted size={13}>{now ? (now.id === r.id ? 'Already planned' : `Instead of ${now.name}`) : `No ${slot} planned`}</T></View>
          <T size={13.5} font="semi" color={dl > 0 ? t.bad : dl < 0 ? t.accent : t.muted}>{dl === 0 ? 'Same cost' : (dl > 0 ? '+' : '−') + money(Math.abs(dl))}</T>
        </TouchableOpacity>;
      })}</>;
  } else if (sheet.type === 'recipe') {
    const r = recipeById(sheet.id), n = recipeNutrition(r), hh = eaters(s);
    body = <><View style={{ backgroundColor: t.accentSoft, alignItems: 'center', paddingVertical: 22, marginHorizontal: -20, marginBottom: 18, borderBottomWidth: 1, borderColor: t.rule }}><Plate recipe={r} size={Math.min(240, width * 0.6)} theme={t} /></View>
      <H size={24}>{r.name}</H><T muted size={14}>{r.mins} minutes. Per person: {n.protein} g protein, {n.kcal} kcal.</T>
      <TouchableOpacity onPress={() => { const fav = isFavourite(s, r.id); update(x => { x.settings.favourites = toggleFavourite(x.settings, r.id); }); toast(fav ? 'Removed from favourites' : 'Added to favourites. It will come up more often'); }}
        accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, alignSelf: 'flex-start' }}>
        <Icon name="heart" size={18} color={isFavourite(s, r.id) ? t.cycle : t.ink} filled={isFavourite(s, r.id)} />
        <T style={{ textDecorationLine: 'underline' }}>{isFavourite(s, r.id) ? 'In your favourites' : 'Add to favourites'}</T></TouchableOpacity>
      <H size={15} style={{ marginTop: 18, marginBottom: 8 }}>Ingredients for {householdLabel(s)}</H>
      {Object.entries(r.ing).map(([id, q]) => <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: t.line }}>
        <T>{INGREDIENTS[id].name.replace(/ \(.*\)/, '')}</T><T muted>{formatQty({ qty: q * hh / 4, unit: INGREDIENTS[id].unit })}</T></View>)}
      <H size={15} style={{ marginTop: 18, marginBottom: 8 }}>Method</H>
      {r.steps.map((x, i) => <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
        <View style={{ width: 24, height: 24, borderRadius: 0, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}><T size={13} font="bold" color={t.accent}>{i + 1}</T></View>
        <T style={{ flex: 1 }}>{x}</T></View>)}</>;
  } else if (sheet.type === 'text') {
    body = <><H size={22}>Grocery list</H><T muted size={14} style={{ marginBottom: 10 }}>Select all and paste into WhatsApp or Notes.</T>
      <TextInput multiline editable={false} value={listAsText(buildList(data.plan, s, priceFeed, data.overrides), s)}
        style={{ color: t.ink, fontFamily: FONTS.slip, fontSize: 12.5, minHeight: 260, backgroundColor: t.bg, borderRadius: 0, padding: 12 }} /></>;
  }
  const wide = width >= 820;
  return <Modal transparent animationType={wide ? 'fade' : 'slide'} visible onRequestClose={close}>
    <TouchableOpacity activeOpacity={1} onPress={close} style={{ flex: 1, backgroundColor: 'rgba(10,18,14,0.45)', justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
      <TouchableOpacity activeOpacity={1} style={{ backgroundColor: t.surface, width: '100%', maxWidth: 560, maxHeight: wide ? '80%' : '86%', borderRadius: 0, borderBottomLeftRadius: wide ? 24 : 0, borderBottomRightRadius: wide ? 24 : 0, padding: 20, paddingTop: wide ? 22 : 10 }}>
        {!wide && <View style={{ width: 40, height: 4, borderRadius: 0, backgroundColor: t.line, alignSelf: 'center', marginBottom: 14 }} />}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>{body}</ScrollView>
        <Btn title="Close" onPress={close} style={{ marginTop: 14, alignSelf: 'flex-start' }} />
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>;
}

// ---------- billing ----------
function useBilling(user, toast) {
  const [busy, setBusy] = useState(false);
  const subscribe = async () => {
    setBusy(true);
    try { const { url } = await createCheckout(); await openUrl(url); }
    catch (e) { toast(e?.message?.includes('already') ? 'You already have an active subscription' : 'Couldn\'t open checkout. Try again in a moment.'); }
    finally { setBusy(false); }
  };
  const manage = async () => {
    setBusy(true);
    try { const { url } = await manageSubscription(); await openUrl(url); }
    catch (e) { toast('Couldn\'t open subscription settings. Try again in a moment.'); }
    finally { setBusy(false); }
  };
  return { busy, subscribe, manage };
}

function Paywall({ ent, billing, onSignOut }) {
  const t = useT();
  const web = Platform.OS === 'web';
  return <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center', gap: 14 }}>
    <T font="semi" size={15} style={{ letterSpacing: 6, marginBottom: 20 }}>TAFEL</T>
    <H size={36}>{ent.kind === 'lapsed' ? 'Your subscription has ended.' : 'Your free month is up.'}</H>
    <T muted size={16}>Keep planning your weeks for {PRICE} a month. Your settings, prices and plans are saved and waiting.</T>
    {web ? <Btn kind="primary" title={billing.busy ? 'Opening checkout…' : `Subscribe for ${PRICE} a month`} onPress={billing.subscribe} />
      : <T>Subscribe at {APP_URL.replace('https://', '')}, then come back to the app.</T>}
    <T muted size={13}>Payments are handled securely by Paystack. Cancel any time from Settings.</T>
    <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
      <Btn title="Terms" onPress={() => openLegal('terms')} /><Btn title="Privacy" onPress={() => openLegal('privacy')} /><Btn title="Sign out" onPress={onSignOut} />
    </View>
  </View>;
}

function AccountSection({ user, ent, billing, onSignOut }) {
  const t = useT();
  const web = Platform.OS === 'web';
  let status;
  if (ent.kind === 'trial') status = `Free trial: ${ent.daysLeft} ${ent.daysLeft === 1 ? 'day' : 'days'} left, until ${fmtDate(ent.until)}.`;
  else if (ent.kind === 'subscribed') status = `Subscribed at ${PRICE} a month.${ent.until ? ` Next payment ${fmtDate(ent.until)}.` : ''}`;
  else if (ent.kind === 'cancelling') status = `Cancelled. You have access until ${fmtDate(ent.until)}.`;
  else if (ent.kind === 'past_due') status = 'Your last payment didn\'t go through. Update your card to keep access.';
  else status = 'Checking your plan…';
  const hasSub = ['subscribed', 'cancelling', 'past_due'].includes(ent.kind);
  return <Section title="Account">
    <T>Signed in as {user.email}.</T>
    <T muted size={14}>{status}</T>
    <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
      {web && ent.kind === 'trial' && <Btn kind="primary" title={`Subscribe now, ${PRICE} a month`} onPress={billing.subscribe} />}
      {web && hasSub && <Btn title="Manage subscription" onPress={billing.manage} />}
      <Btn title="Sign out" onPress={onSignOut} />
    </View>
    <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
      <Btn title="Terms of use" onPress={() => openLegal('terms')} /><Btn title="Privacy policy" onPress={() => openLegal('privacy')} /><Btn title="PAIA manual" onPress={() => openLegal('paia')} />
    </View>
  </Section>;
}

// ---------- root ----------
const TABS = [['plan', 'The week'], ['cook', 'Cook'], ['list', 'Groceries'], ['fitness', 'Training'], ['settings', 'Settings']];

function TabBar({ tab, setTab, wide }) {
  const t = useT();
  if (wide) return <View style={{ flexDirection: 'row', backgroundColor: t.sunk, borderRadius: 0, padding: 4 }}>
    {TABS.map(([id, l]) => { const on = tab === id; return <TouchableOpacity key={id} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 0, backgroundColor: on ? t.surface : 'transparent' }, on && shadow]}>
      <Icon name={id} size={18} color={on ? t.accent : t.muted} /><T size={13.5} font="semi" color={on ? t.accent : t.muted}>{l}</T></TouchableOpacity>; })}
  </View>;
  return <SafeAreaView edges={['bottom']} style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line, paddingHorizontal: 8, paddingTop: 6 }}>
    {TABS.map(([id, l]) => { const on = tab === id; return <TouchableOpacity key={id} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: 'center', gap: 2, paddingBottom: 6 }}>
      <View style={{ width: 52, height: 30, borderRadius: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.accentSoft : 'transparent' }}><Icon name={id} color={on ? t.accent : t.muted} /></View>
      <T size={12} font="semi" color={on ? t.accent : t.muted}>{l}</T></TouchableOpacity>; })}
  </SafeAreaView>;
}

function Main() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let el = document.getElementById('tafel-scrollbars');
    if (!el) { el = document.createElement('style'); el.id = 'tafel-scrollbars'; document.head.appendChild(el); }
    el.textContent = `*{scrollbar-width:thin;scrollbar-color:${theme.line} transparent}
      *::-webkit-scrollbar{width:6px;height:6px}*::-webkit-scrollbar-track{background:transparent}
      *::-webkit-scrollbar-thumb{background:${theme.line};border-radius:3px}*::-webkit-scrollbar-thumb:hover{background:${theme.muted}}`;
  }, [theme]);
  const { width } = useWindowDimensions();
  const wide = width >= 820, narrow = width < 560;
  const [user, setUser] = useState(undefined);
  const [guest, setGuest] = useState(!firebaseReady); // without Firebase (local dev) there are no accounts or billing
  const [account, setAccount] = useState(undefined);
  // Cycle data is health information: kept on this device only, never in the cloud.
  const cycleRef = useRef(DEFAULT_CYCLE);
  const replanToast = useRef(null);
  const [cycle, setCycleRaw] = useState(DEFAULT_CYCLE);
  useEffect(() => { AsyncStorage.getItem('tafel-cycle').then(v => { if (v) try { { const c = { ...DEFAULT_CYCLE, ...JSON.parse(v) }; cycleRef.current = c; setCycleRaw(c); } } catch (e) {} }).catch(() => {}); }, []);
  const setCycle = c => {
    const before = JSON.stringify(cycleWeek(cycleRef.current, weekStart()));
    cycleRef.current = c; setCycleRaw(c); AsyncStorage.setItem('tafel-cycle', JSON.stringify(c)).catch(() => {});
    if (JSON.stringify(cycleWeek(c, weekStart())) !== before) setTimeout(() => regenerate(true, true), 0); // re-plan when the week's phases change
  };
  const cyc = cycleWeek(cycle, weekStart());
  const [data, setData] = useState(null);
  const [priceFeed, setPriceFeed] = useState(null);
  const [tab, setTabRaw] = useState('plan');
  const [day, setDay] = useState(todayIdx());
  const [sheet, setSheet] = useState(null);
  const [msg, setMsg] = useState(null);
  const scroll = useRef(null);
  const setTab = id => { setTabRaw(id); scroll.current?.scrollTo({ y: 0, animated: false }); };

  useEffect(() => watchUser(u => setUser(u || null)), []);
  useEffect(() => {
    if (!user) { setAccount(undefined); return; }
    startTrial().catch(() => {}); // creates the 30-day trial on first sign-in; does nothing afterwards
    return watchAccount(user, setAccount);
  }, [user]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.includes('subscribed=1')) {
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => toast('Payment received. Your subscription will show in Settings shortly.'), 800);
    }
  }, []);
  useEffect(() => { loadPriceFeed().then(setPriceFeed); }, []);
  useEffect(() => {
    if (user === undefined && firebaseReady) return;
    if (!user && !guest) return;
    loadState(user).then(saved => {
      const d = { settings: mergeSettings(saved?.settings), plan: saved?.plan || null, locked: saved?.locked || {}, overrides: saved?.overrides || {}, checked: saved?.checked || {} };
      if (!d.plan) d.plan = generatePlan(d.settings, null, d.overrides, {}).plan; // open on a real week, not an empty screen
      setData(d);
    });
  }, [user, guest]);

  const toast = m => { setMsg(m); setTimeout(() => setMsg(null), 2400); };
  // Any change to settings or prices that affects meals re-plans the week straight away, keeping Kept meals that still fit.
  const update = fn => setData(prev => {
    const next = JSON.parse(JSON.stringify(prev)); fn(next);
    if (next.plan && planInputsKey(prev.settings, prev.overrides) !== planInputsKey(next.settings, next.overrides)) {
      next.locked = validLocks(next.locked, next.settings);
      next.plan = generatePlan(next.settings, priceFeed, next.overrides, { locked: next.locked, cycle: cycleWeek(cycleRef.current, weekStart()) }).plan;
      next.checked = {};
      clearTimeout(replanToast.current); replanToast.current = setTimeout(() => toast('Week updated'), 400);
    }
    saveState(user, next); return next;
  });
  const regenerate = (keepLocks, quiet) => {
    setData(prev => {
      const locked = keepLocks ? validLocks(prev.locked, prev.settings) : {};
      const res = generatePlan(prev.settings, priceFeed, prev.overrides, { locked, cycle: cycleWeek(cycleRef.current, weekStart()) });
      const next = { ...prev, plan: res.plan, checked: {}, locked };
      saveState(user, next);
      if (!quiet) setTimeout(() => toast(res.warning || (res.overBudget ? 'This is the cheapest week we could find, and it\'s still over budget' : 'New week planned')), 0);
      return next;
    });
    if (!quiet) setTab('plan');
  };

  const billing = useBilling(user, toast);
  // Fail open: until an account record exists (or if billing is offline), never block someone out.
  const ent = user ? (account ? entitlement(account) : { ok: true, kind: 'unknown' }) : { ok: true, kind: 'guest' };
  const doSignOut = async () => { await signOut(); setData(null); };
  let gate = null;
  if (firebaseReady && user === undefined) gate = <ActivityIndicator style={{ marginTop: 80 }} color={theme.accent} />;
  else if (!user && !guest) gate = <LoginScreen />;
  else if (user && !ent.ok) gate = <Paywall ent={ent} billing={billing} onSignOut={doSignOut} />;
  else if (!data) gate = <ActivityIndicator style={{ marginTop: 80 }} color={theme.accent} />;

  const s = data?.settings;
  return <ThemeCtx.Provider value={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {gate || <>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: wide ? 22 : 12, paddingBottom: wide ? 18 : 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
              <View style={{ flexShrink: 1 }}><T font="semi" size={15} style={{ letterSpacing: 6 }}>TAFEL</T>
                <T muted size={12.5} numberOfLines={1}>{householdLabel(s)}, {money(s.weeklyBudget)} a week{s.diets.length ? ', ' + s.diets.map(d => DIETS[d].label.toLowerCase()).join(', ') : ''}</T></View>
            </View>
            {wide && <TabBar tab={tab} setTab={setTab} wide />}
          </View>
          {ent.kind === 'trial' && ent.daysLeft <= 7 && <TouchableOpacity onPress={() => setTab('settings')} style={{ backgroundColor: theme.accentSoft, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 4 }}>
            <T size={13.5}>{ent.daysLeft} {ent.daysLeft === 1 ? 'day' : 'days'} left in your free month. Subscribe in Settings to keep going.</T></TouchableOpacity>}
          {ent.kind === 'past_due' && <TouchableOpacity onPress={() => setTab('settings')} style={{ backgroundColor: theme.badSoft, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 4 }}>
            <T size={13.5} color={theme.bad}>Your last payment didn't go through. Update your card in Settings.</T></TouchableOpacity>}
          {tab === 'plan' && <PlanScreen data={data} update={update} priceFeed={priceFeed} openSheet={setSheet} regenerate={regenerate} day={day} setDay={setDay} narrow={narrow} cyc={cyc} toast={toast} />}
          {tab === 'cook' && <CookScreen data={data} update={update} priceFeed={priceFeed} openSheet={setSheet} />}
          {tab === 'list' && <ListScreen data={data} update={update} priceFeed={priceFeed} openSheet={setSheet} toast={toast} />}
          {tab === 'fitness' && <FitnessScreen data={data} update={update} regenerate={regenerate} cycle={cycle} setCycle={setCycle} />}
          {tab === 'settings' && <SettingsScreen data={data} update={update} priceFeed={priceFeed} user={user} onSignOut={doSignOut} ent={ent} billing={billing} />}
        </ScrollView>
        {!wide && <TabBar tab={tab} setTab={setTab} />}
        <Sheet sheet={sheet} data={data} update={update} priceFeed={priceFeed} close={() => setSheet(null)} toast={toast} cyc={cyc} />
        {msg && <View pointerEvents="none" accessibilityLiveRegion="polite" style={[{ position: 'absolute', bottom: wide ? 32 : 96, alignSelf: 'center', backgroundColor: theme.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 0 }, shadow]}>
          <T font="semi" size={14} color={theme.bg}>{msg}</T></View>}
      </>}
    </SafeAreaView>
  </ThemeCtx.Provider>;
}

export default function App() {
  const [loaded, fontError] = useFonts({
    HankenGrotesk_400Regular, HankenGrotesk_500Medium,
    ...(Bodoni.BodoniModa_500Medium ? { BodoniModa_500Medium: Bodoni.BodoniModa_500Medium } : {}),
  });
  const [waited, setWaited] = useState(false);
  useEffect(() => { const id = setTimeout(() => setWaited(true), 3000); return () => clearTimeout(id); }, []);
  // Never block the app on fonts: fall back to system fonts on error or after 3 s.
  if (!loaded && !fontError && !waited) return null;
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}
