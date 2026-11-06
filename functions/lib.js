// Pure billing logic for the Cloud Functions, kept separate so it can be unit tested.
const crypto = require('node:crypto');

const TRIAL_DAYS = 30;

function newTrial(email, now = Date.now()) {
  return { email: email || null, trialStartedAt: now, trialEndsAt: now + TRIAL_DAYS * 864e5, subscription: null };
}

// Paystack signs each webhook with HMAC-SHA512 of the raw body using your secret key.
function verifySignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Works out what to change on accounts/{uid} for a Paystack event.
//  { set: {...} }    replace/merge the subscription object
//  { update: {...} } dotted-field update of an existing subscription
//  null              ignore this event
function patchFor(event, now = Date.now()) {
  const d = (event && event.data) || {};
  switch (event && event.event) {
    case 'subscription.create':
      return { set: { subscription: {
        status: 'active', code: d.subscription_code || null, customer: (d.customer && d.customer.customer_code) || null,
        nextPaymentAt: d.next_payment_date ? Date.parse(d.next_payment_date) : null, updatedAt: now,
      } } };
    case 'charge.success':
    case 'invoice.update': {
      const u = { 'subscription.status': 'active', 'subscription.lastPaidAt': now, 'subscription.updatedAt': now };
      const next = d.subscription && d.subscription.next_payment_date;
      if (next) u['subscription.nextPaymentAt'] = Date.parse(next);
      return { update: u };
    }
    case 'invoice.payment_failed': return { update: { 'subscription.status': 'past_due', 'subscription.updatedAt': now } };
    case 'subscription.not_renew': return { update: { 'subscription.status': 'cancelling', 'subscription.updatedAt': now } };
    case 'subscription.disable': return { update: { 'subscription.status': 'cancelled', 'subscription.updatedAt': now } };
    default: return null;
  }
}

// The Firebase uid Paystack sends back in metadata (set at checkout), if any.
function uidFromMetadata(event) {
  const meta = event && event.data && event.data.metadata;
  return meta && typeof meta === 'object' && typeof meta.uid === 'string' ? meta.uid : null;
}

module.exports = { TRIAL_DAYS, newTrial, verifySignature, patchFor, uidFromMetadata };
