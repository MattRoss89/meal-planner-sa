import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { entitlement, TRIAL_DAYS } from '../shared/billing.js';

const require = createRequire(import.meta.url);
const { newTrial, verifySignature, patchFor, uidFromMetadata } = require('../functions/lib.js');
const DAY = 864e5, NOW = Date.parse('2026-11-06T10:00:00Z');

describe('trial and access', () => {
  test('a new trial lasts 30 days', () => {
    const t = newTrial('a@b.co', NOW);
    assert.equal(t.trialEndsAt - t.trialStartedAt, TRIAL_DAYS * DAY);
    assert.equal(t.subscription, null);
  });
  test('during the trial: allowed, with days left', () => {
    const e = entitlement(newTrial('a@b.co', NOW - 25 * DAY), NOW);
    assert.equal(e.ok, true); assert.equal(e.kind, 'trial'); assert.equal(e.daysLeft, 5);
  });
  test('after the trial with no subscription: blocked', () => {
    assert.deepEqual(entitlement(newTrial('a@b.co', NOW - 31 * DAY), NOW), { ok: false, kind: 'trial_over' });
  });
  test('active subscription: allowed', () => {
    assert.equal(entitlement({ trialEndsAt: 0, subscription: { status: 'active' } }, NOW).ok, true);
  });
  test('cancelled but paid up: allowed until the period ends, then blocked', () => {
    const acct = { trialEndsAt: 0, subscription: { status: 'cancelling', nextPaymentAt: NOW + 3 * DAY } };
    assert.equal(entitlement(acct, NOW).ok, true);
    assert.equal(entitlement(acct, NOW + 4 * DAY).kind, 'lapsed');
  });
  test('failed payment gets a 3-day grace period', () => {
    const acct = { trialEndsAt: 0, subscription: { status: 'past_due', nextPaymentAt: NOW } };
    assert.equal(entitlement(acct, NOW + 2 * DAY).ok, true);
    assert.equal(entitlement(acct, NOW + 4 * DAY).ok, false);
  });
  test('no account record yet: not allowed by itself (the app fails open separately)', () => {
    assert.equal(entitlement(null, NOW).ok, false);
  });
});

describe('Paystack webhook', () => {
  const secret = 'sk_test_123', body = Buffer.from(JSON.stringify({ event: 'charge.success' }));
  const sign = b => crypto.createHmac('sha512', secret).update(b).digest('hex');
  test('accepts a correctly signed body', () => assert.equal(verifySignature(body, sign(body), secret), true));
  test('rejects a tampered body, wrong signature or missing parts', () => {
    assert.equal(verifySignature(Buffer.from('{"event":"x"}'), sign(body), secret), false);
    assert.equal(verifySignature(body, 'abc', secret), false);
    assert.equal(verifySignature(body, '', secret), false);
    assert.equal(verifySignature(undefined, sign(body), secret), false);
  });
  test('subscription.create stores the subscription as active', () => {
    const p = patchFor({ event: 'subscription.create', data: { subscription_code: 'SUB_1', customer: { customer_code: 'CUS_1' }, next_payment_date: '2026-12-06T10:00:00Z' } }, NOW);
    assert.equal(p.set.subscription.status, 'active');
    assert.equal(p.set.subscription.code, 'SUB_1');
    assert.equal(p.set.subscription.nextPaymentAt, Date.parse('2026-12-06T10:00:00Z'));
  });
  test('payments, failures and cancellations map to the right status', () => {
    assert.equal(patchFor({ event: 'charge.success', data: {} }, NOW).update['subscription.status'], 'active');
    assert.equal(patchFor({ event: 'invoice.payment_failed', data: {} }, NOW).update['subscription.status'], 'past_due');
    assert.equal(patchFor({ event: 'subscription.not_renew', data: {} }, NOW).update['subscription.status'], 'cancelling');
    assert.equal(patchFor({ event: 'subscription.disable', data: {} }, NOW).update['subscription.status'], 'cancelled');
  });
  test('unrelated events are ignored', () => {
    assert.equal(patchFor({ event: 'transfer.success', data: {} }), null);
    assert.equal(patchFor({}), null);
  });
  test('reads the Firebase uid from checkout metadata only when it is a string', () => {
    assert.equal(uidFromMetadata({ data: { metadata: { uid: 'u1' } } }), 'u1');
    assert.equal(uidFromMetadata({ data: { metadata: '{"uid":"u1"}' } }), null);
    assert.equal(uidFromMetadata({ data: {} }), null);
  });
});
