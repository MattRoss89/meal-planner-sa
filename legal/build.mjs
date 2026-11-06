// Builds Tafel's privacy policy, terms of use and PAIA manual as static pages in app/public/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const d = JSON.parse(readFileSync(here + 'details.json', 'utf8'));
const out = here + '../app/public/';
mkdirSync(out, { recursive: true });

const todo = v => v.startsWith('TODO') ? `<mark>[${v.replace('TODO: ', 'to be added: ')}]</mark>` : v;
const E = todo(d.email), A = todo(d.physicalAddress), P = todo(d.phone);
const mail = d.email.startsWith('TODO') ? E : `<a href="mailto:${d.email}">${d.email}</a>`;

const page = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Tafel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--paper:#fbf9f3;--ink:#3f4534;--soft:#666a5b;--hair:#dcd9cd;--sage:#dfe7d2;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--paper:#1b1e18;--ink:#ebe8dd;--soft:#a9ab9c;--hair:#33382d;--sage:#2f3729;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.65 "Hanken Grotesk","Helvetica Neue",Arial,sans-serif}
header{border-bottom:1px solid var(--ink)}header div,main,footer div{max-width:760px;margin:0 auto;padding:0 22px}
header div{height:56px;display:flex;align-items:center;justify-content:space-between}
.wm{letter-spacing:.42em;font-weight:500;text-decoration:none;color:inherit}
nav a{margin-left:18px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);text-decoration:none}
nav a[aria-current]{color:var(--ink)}
main{padding-top:48px;padding-bottom:80px}
h1{font:500 clamp(36px,6vw,56px)/1.05 "Bodoni Moda",Georgia,serif;font-variation-settings:"opsz" 18;margin:0 0 10px;letter-spacing:-.01em}
.meta{color:var(--soft);font-size:14px;margin-bottom:36px}
h2{font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:500;margin:40px 0 12px;padding-top:16px;border-top:1px solid var(--hair);display:flex;gap:10px;align-items:center}
h2::before{content:"";width:6px;height:6px;background:currentColor}
p,li{max-width:66ch}ul{padding-left:20px}li{margin:4px 0}
table{border-collapse:collapse;width:100%;font-size:15px;margin:8px 0}td,th{text-align:left;padding:8px 10px 8px 0;border-bottom:1px solid var(--hair);vertical-align:top}th{font-weight:500}
a{color:inherit}mark{background:var(--sage);color:inherit;padding:0 4px}
footer{border-top:1px solid var(--ink);font-size:13px;color:var(--soft)}footer div{padding:18px 22px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
</style></head><body>
<header><div><a class="wm" href="/">TAFEL</a><nav><a href="/privacy.html"${title.startsWith('Privacy') ? ' aria-current="page"' : ''}>Privacy</a><a href="/terms.html"${title.startsWith('Terms') ? ' aria-current="page"' : ''}>Terms</a><a href="/paia.html"${title.startsWith('PAIA') ? ' aria-current="page"' : ''}>PAIA</a></nav></div></header>
<main><h1>${title}</h1><p class="meta">Effective ${d.effectiveDate}</p>${body}</main>
<footer><div><span>${d.tradingAs}, operated by ${d.name}</span><span>${mail}</span></div></footer>
</body></html>`;

const who = `<table>
<tr><th>Responsible party</th><td>${d.name}, trading as ${d.tradingAs} (${d.legalStatus.toLowerCase()})</td></tr>
<tr><th>Information Officer</th><td>${d.name}</td></tr>
<tr><th>Email</th><td>${mail}</td></tr>
<tr><th>Phone</th><td>${P}</td></tr>
<tr><th>Physical address</th><td>${A}</td></tr></table>`;

const privacy = page('Privacy policy', `
<p>This policy explains what personal information Tafel collects, why, and what you can do about it, in line with the Protection of Personal Information Act, 2013 (POPIA).</p>
<h2>Who we are</h2>${who}
<h2>What we collect</h2>
<table>
<tr><th>Account</th><td>Your name, email address and a Google account identifier, when you sign in with Google.</td></tr>
<tr><th>Planner settings</th><td>Household size, weekly budget, preferred store, dietary requirements, meal choices, prices you enter, saved plans and ticked-off list items.</td></tr>
<tr><th>Training details (optional)</th><td>If you turn on training: weight, height, age, sex, goal and weekly sessions. Used only to calculate your food targets.</td></tr>
<tr><th>Subscription</th><td>Your trial start date, subscription status, next billing date and the Paystack customer and subscription references. We never see or store your card number.</td></tr>
<tr><th>Technical</th><td>Basic logs kept by our hosting provider (such as IP address and browser type) to run and secure the service.</td></tr></table>
<p>Providing this information is voluntary. Without an account you can't save plans or subscribe; without training details the training features stay off.</p>
<h2>Why we use it</h2>
<ul><li>To create your meal plans, grocery lists and targets, and keep them in sync between your devices.</li>
<li>To run your free trial and subscription, and tell you about billing.</li>
<li>To keep the service secure and fix problems.</li></ul>
<p>We rely on your consent and on performing our agreement with you. We don't sell your information, use it for advertising or send marketing without your separate consent.</p>
<h2>Who we share it with</h2>
<ul><li><b>Google (Firebase)</b> hosts the app, handles sign-in and stores your data. Your planner data is stored in Google's Johannesburg region; Google may process some data, such as sign-in, outside South Africa under its own data protection terms.</li>
<li><b>Paystack</b> processes subscription payments and receives your email address and payment details directly. Paystack may process data outside South Africa under its own privacy policy and card-industry security standards.</li></ul>
<p>We only share information with others where the law requires it.</p>
<h2>How long we keep it</h2>
<p>We keep your account and planner data while your account is active. If you ask us to delete your account, we delete it within 30 days. Records of payments are kept for five years, as tax law requires.</p>
<h2>Security</h2>
<p>Data travels over encrypted connections, and access rules mean only you can read or change your planner data. If a breach affects your information, we will tell you and the Information Regulator as POPIA requires.</p>
<h2>Your rights</h2>
<p>You can ask to see the personal information we hold about you, correct it, delete it or object to how we use it, by emailing ${mail}. We'll respond within 30 days. If you're unhappy with our response, you can complain to the Information Regulator at <a href="https://inforegulator.org.za">inforegulator.org.za</a>.</p>
<h2>Cookies and storage</h2>
<p>Tafel uses your browser's storage to keep you signed in and remember your plan. We don't use advertising or tracking cookies.</p>
<h2>Children</h2>
<p>Tafel is a paid service intended for people aged 18 and over.</p>
<h2>Changes</h2>
<p>If we change this policy in a way that matters, we'll tell you in the app before the change takes effect. Our PAIA manual is at <a href="/paia.html">/paia.html</a>.</p>`);

const terms = page('Terms of use', `
<p>These terms are an agreement between you and ${d.name}, trading as ${d.tradingAs}. By creating an account you agree to them.</p>
<h2>The service</h2>
<p>Tafel plans weekly meals around your budget, dietary needs and training, and builds a grocery list with estimated prices at South African stores.</p>
<h2>Estimates, not quotes</h2>
<ul><li>Prices are estimates based on regular shelf prices, refreshed monthly, and on a price index for comparing stores. Actual prices vary by store, region, specials and date.</li>
<li>Nutrition and training targets are general estimates. They are not medical or dietetic advice. Check with a qualified professional if you have a medical condition, allergy or specific dietary need, and always check food labels.</li>
<li>Tafel is not affiliated with or endorsed by Checkers, Shoprite, Pick n Pay, Spar or Woolworths. Store names are used only to describe where prices apply.</li></ul>
<h2>Free trial and subscription</h2>
<ul><li>Your first 30 days from your first sign-in are free. No card is needed for the trial.</li>
<li>After the trial, Tafel costs <b>R20 per month</b>, billed monthly in advance through Paystack until you cancel.</li>
<li>You can cancel at any time under Settings → Account → Manage subscription. Cancelling stops future payments, and you keep access until the end of the month you've paid for.</li>
<li>We'll give you at least 30 days' notice in the app and by email before any price change.</li>
<li>Nothing in these terms limits your rights under the Consumer Protection Act or the Electronic Communications and Transactions Act, including the cooling-off right where it applies.</li></ul>
<h2>Your account</h2>
<p>Keep your Google account secure; you're responsible for activity on your Tafel account. Don't misuse the service, try to access other people's data, or interfere with how it runs. We may suspend accounts that do.</p>
<h2>Liability</h2>
<p>We work to keep Tafel accurate and available but can't guarantee it will be error-free or uninterrupted. To the extent the law allows, our total liability to you is limited to the amount you paid us in the three months before the claim.</p>
<h2>Ending the agreement</h2>
<p>You can delete your account at any time by emailing ${mail}. We may end the service with 30 days' notice, and will refund any unused paid period.</p>
<h2>Law and contact</h2>
<p>These terms are governed by South African law.</p>${who}`);

const paia = page('PAIA manual', `
<p>This manual is published under section 51 of the Promotion of Access to Information Act, 2000 (PAIA), and describes how personal information is processed under POPIA.</p>
<h2>1. Contact details</h2>${who}
<h2>2. Guide by the Information Regulator</h2>
<p>The Information Regulator publishes a guide on how to use PAIA and POPIA. It is available at <a href="https://inforegulator.org.za">inforegulator.org.za</a> and from the Regulator on request.</p>
<h2>3. Records held</h2>
<table>
<tr><th>Customer records</th><td>Account details, planner settings, saved plans, optional training details, subscription status.</td></tr>
<tr><th>Financial records</th><td>Payment and subscription records received from Paystack; accounting and tax records.</td></tr>
<tr><th>Operational records</th><td>Recipe and price data, service logs, correspondence.</td></tr></table>
<h2>4. Records available without a request</h2>
<p>The privacy policy, terms of use and this manual are published on this website.</p>
<h2>5. How to request access</h2>
<p>Email ${mail} using the prescribed Form 2 (available from the Information Regulator), giving enough detail to identify the record, the form of access you want and how to contact you. We'll respond within 30 days. Requests for your own personal information are free; other requests may attract the prescribed fees, which we'll tell you about before proceeding.</p>
<h2>6. Processing of personal information</h2>
<table>
<tr><th>Purpose</th><td>Providing meal plans, grocery lists and targets; running trials and subscriptions; security and support.</td></tr>
<tr><th>Data subjects</th><td>Users of Tafel.</td></tr>
<tr><th>Information</th><td>As listed in the <a href="/privacy.html">privacy policy</a>.</td></tr>
<tr><th>Recipients</th><td>Google (Firebase hosting, sign-in and database) and Paystack (payments).</td></tr>
<tr><th>Cross-border transfers</th><td>Google and Paystack may process some information outside South Africa under their data protection terms.</td></tr>
<tr><th>Security</th><td>Encrypted connections, per-user access rules on the database, no storage of card numbers, access limited to the operator.</td></tr></table>
<h2>7. Availability</h2>
<p>This manual is available on this website and, on request, from the contact details above.</p>`);

writeFileSync(out + 'privacy.html', privacy);
writeFileSync(out + 'terms.html', terms);
writeFileSync(out + 'paia.html', paia);
const todos = Object.values(d).filter(v => typeof v === 'string' && v.startsWith('TODO')).length;
console.log(`built privacy, terms, paia${todos ? ` (${todos} details still to add)` : ''}`);
