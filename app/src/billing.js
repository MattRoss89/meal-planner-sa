// Tafel subscription rules shared by the app and the tests. No dependencies.
export const TRIAL_DAYS = 30;
export const PRICE = 'R20';
const DAY = 864e5;

// What an account can do right now, from its server-written record.
export function entitlement(acct, now = Date.now()) {
  if (!acct) return { ok: false, kind: 'unknown' };
  const sub = acct.subscription;
  if (sub?.status === 'active') return { ok: true, kind: 'subscribed', until: sub.nextPaymentAt };
  if (sub?.status === 'cancelling' && (sub.nextPaymentAt || 0) > now) return { ok: true, kind: 'cancelling', until: sub.nextPaymentAt };
  if (sub?.status === 'past_due' && (sub.nextPaymentAt || 0) + 3 * DAY > now) return { ok: true, kind: 'past_due', until: sub.nextPaymentAt };
  if ((acct.trialEndsAt || 0) > now) return { ok: true, kind: 'trial', until: acct.trialEndsAt, daysLeft: Math.ceil((acct.trialEndsAt - now) / DAY) };
  return { ok: false, kind: sub ? 'lapsed' : 'trial_over' };
}
