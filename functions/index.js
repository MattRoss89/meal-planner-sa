// Tafel billing: Paystack subscriptions for the R20/month plan.
// - startTrial: records the 30-day trial the first time someone signs in (server time, can't be faked).
// - createCheckout: starts a Paystack checkout for the monthly plan and returns the payment page URL.
// - manageSubscription: returns Paystack's hosted page where a subscriber can cancel or update their card.
// - paystackWebhook: Paystack calls this after payments and cancellations; it updates the user's record.
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { newTrial, verifySignature, patchFor, uidFromMetadata } = require('./lib');

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: 'africa-south1', maxInstances: 5 });

const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');
const PAYSTACK_PLAN_CODE = defineString('PAYSTACK_PLAN_CODE');
const APP_URL = defineString('APP_URL', { default: 'https://meal-planner-sa.web.app' });

async function paystack(path, { method = 'GET', body } = {}) {
  const res = await fetch('https://api.paystack.co' + path, {
    method,
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) throw new HttpsError('unavailable', json.message || 'Paystack request failed');
  return json.data;
}

function requireUser(req) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return req.auth;
}

exports.startTrial = onCall(async (req) => {
  const { uid, token } = requireUser(req);
  const ref = db.doc(`accounts/${uid}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return snap.data();
    const data = newTrial(token.email);
    tx.set(ref, data);
    return data;
  });
});

exports.createCheckout = onCall({ secrets: [PAYSTACK_SECRET_KEY] }, async (req) => {
  const { uid, token } = requireUser(req);
  if (!token.email) throw new HttpsError('failed-precondition', 'Your Google account has no email address.');
  const acct = (await db.doc(`accounts/${uid}`).get()).data() || {};
  if (acct.subscription?.status === 'active') throw new HttpsError('already-exists', 'You already have an active subscription.');
  const data = await paystack('/transaction/initialize', {
    method: 'POST',
    body: {
      email: token.email,
      amount: 2000, // R20.00 in cents; the plan sets the recurring amount
      currency: 'ZAR',
      plan: PAYSTACK_PLAN_CODE.value(),
      callback_url: `${APP_URL.value()}/?subscribed=1`,
      metadata: { uid },
    },
  });
  return { url: data.authorization_url };
});

exports.manageSubscription = onCall({ secrets: [PAYSTACK_SECRET_KEY] }, async (req) => {
  const { uid } = requireUser(req);
  const sub = (await db.doc(`accounts/${uid}`).get()).data()?.subscription;
  if (!sub?.code) throw new HttpsError('not-found', 'No subscription found.');
  const data = await paystack(`/subscription/${sub.code}/manage/link`);
  return { url: data.link };
});

async function uidFor(event) {
  const fromMeta = uidFromMetadata(event);
  if (fromMeta) return fromMeta;
  const email = event.data?.customer?.email;
  if (!email) return null;
  const q = await db.collection('accounts').where('email', '==', email).limit(1).get();
  return q.empty ? null : q.docs[0].id;
}

exports.paystackWebhook = onRequest({ secrets: [PAYSTACK_SECRET_KEY] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!verifySignature(req.rawBody, req.get('x-paystack-signature') || '', PAYSTACK_SECRET_KEY.value())) {
    return res.status(401).send('Bad signature');
  }
  const event = req.body || {};
  try {
    const patch = patchFor(event);
    if (!patch) return res.status(200).send('Ignored');
    const uid = await uidFor(event);
    if (!uid) return res.status(200).send('No matching user');
    const ref = db.doc(`accounts/${uid}`);
    if (patch.set) await ref.set(patch.set, { merge: true });
    else if ((await ref.get()).data()?.subscription) await ref.update(patch.update);
    return res.status(200).send('OK');
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).send('Error');
  }
});
