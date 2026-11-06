// Firebase auth (Google sign-in) + per-user storage in Firestore, with a local fallback.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, initializeAuth, onAuthStateChanged, signOut as fbSignOut,
  GoogleAuthProvider, signInWithPopup, signInWithCredential,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_CONFIG, PRICE_FEED_URL } from './config';

export const firebaseReady = !FIREBASE_CONFIG.apiKey.startsWith('YOUR_');

let app, auth, db, fns;
if (firebaseReady) {
  app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // React Native persistence keeps people signed in between launches.
    // eslint-disable-next-line import/no-unresolved
    const { getReactNativePersistence } = require('firebase/auth');
    try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
    catch (e) { auth = getAuth(app); }
  }
  db = getFirestore(app);
  fns = getFunctions(app, 'africa-south1');
}

export function watchUser(cb) {
  if (!firebaseReady) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

// Web: Google popup. Native: id token from expo-auth-session (see LoginScreen).
export async function signInWithGoogleWeb() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function signInWithGoogleIdToken(idToken) {
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
export async function signOut() { if (auth) await fbSignOut(auth); }

const LOCAL_KEY = 'mealplanner-sa-state';

export async function loadState(user) {
  if (user && db) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) return snap.data();
    } catch (e) { console.warn('load failed', e); }
  }
  try { const raw = await AsyncStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}

let timer = null;
export function saveState(user, data) {
  const clean = JSON.parse(JSON.stringify(data));
  AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(clean)).catch(() => {});
  if (!user || !db) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    setDoc(doc(db, 'users', user.uid), { ...clean, updatedAt: new Date().toISOString() })
      .catch(e => console.warn('save failed', e));
  }, 800);
}

export async function loadPriceFeed() {
  if (db) {
    try { const snap = await getDoc(doc(db, 'prices', 'current')); if (snap.exists()) return snap.data(); }
    catch (e) { /* fall through */ }
  }
  if (!PRICE_FEED_URL) return null;
  try { const r = await fetch(PRICE_FEED_URL); return r.ok ? await r.json() : null; }
  catch (e) { return null; }
}

// ---------- Trial and subscription ----------
export const TRIAL_DAYS = 30;
export const PRICE = 'R20';
export const APP_URL = 'https://meal-planner-sa.web.app';

const call = name => async data => (await httpsCallable(fns, name)(data)).data;
export const startTrial = () => call('startTrial')();
export const createCheckout = () => call('createCheckout')();
export const manageSubscription = () => call('manageSubscription')();

// The account record (trial dates, subscription) is written only by the server.
export function watchAccount(user, cb) {
  if (!db || !user) { cb(null); return () => {}; }
  return onSnapshot(doc(db, 'accounts', user.uid), s => cb(s.exists() ? s.data() : null), () => cb(null));
}

// What this account can do right now.
export function entitlement(acct, now = Date.now()) {
  if (!acct) return { ok: false, kind: 'unknown' };
  const sub = acct.subscription;
  const day = 864e5;
  if (sub?.status === 'active') return { ok: true, kind: 'subscribed', until: sub.nextPaymentAt };
  if (sub?.status === 'cancelling' && (sub.nextPaymentAt || 0) > now) return { ok: true, kind: 'cancelling', until: sub.nextPaymentAt };
  if (sub?.status === 'past_due' && (sub.nextPaymentAt || 0) + 3 * day > now) return { ok: true, kind: 'past_due', until: sub.nextPaymentAt };
  if ((acct.trialEndsAt || 0) > now) return { ok: true, kind: 'trial', until: acct.trialEndsAt, daysLeft: Math.ceil((acct.trialEndsAt - now) / day) };
  return { ok: false, kind: sub ? 'lapsed' : 'trial_over' };
}
