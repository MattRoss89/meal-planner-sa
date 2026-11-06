# Meal Planner SA: Android, iPhone and web

One Expo (React Native) codebase builds the Android app, the iPhone app and the public website.

**What it does**
- Builds a 7-day meal plan (breakfast, lunch and dinner) that fits your weekly rand budget, household size and dietary needs: vegetarian, vegan, pescatarian, halal/no pork, gluten-, dairy-, egg-, nut- or fish-free, plus low-carb or high-protein preferences.
- Produces a grocery list grouped by aisle and costed in whole packs. It compares Shoprite, Checkers, Pick n Pay, Spar and Woolworths, and has a "find" link per item that opens the store's own search.
- **Fitness mode:** takes your weight, height, age, goal and weekly training (easy run, speed session, long run, strength, etc.) and sets daily protein and calorie targets. Your portions scale up on training days, and protein snacks are added to the list when meals fall short.
- Lets you lock and swap meals, override prices, and copy the list for WhatsApp.
- Uses Google sign-in (Firebase Auth) and saves each person's settings and plans to Firestore. It also works without an account, saving on the device.

## 1. Run it on your computer
Requires Node 20+.
```bash
cd app
npm install --legacy-peer-deps
npx expo install --fix      # aligns every package with the installed Expo SDK (run once)
npx expo start --web        # opens the web version
```
To try it on your phone, install a development build (step 4), or run `npx expo start` and scan the QR code. Google sign-in needs a development build; everything else works in Expo Go.

## 2. Set up Firebase (free Spark plan)
1. Go to https://console.firebase.google.com, choose **Add project**, then add a **Web app**. Copy its config into `src/config.js` (`FIREBASE_CONFIG`).
2. **Authentication → Sign-in method → Google → Enable.**
3. **Firestore Database → Create database** (production mode, region `africa-south1` if offered).
4. Google Cloud console → **APIs & Services → Credentials**. Firebase has already created a *Web client*; copy its ID into `GOOGLE_CLIENT_IDS.webClientId`. Then create:
   - an **Android** OAuth client (package `za.mealplanner.app` plus your signing SHA-1 from `eas credentials`),
   - an **iOS** OAuth client (bundle ID `za.mealplanner.app`),
   and paste their IDs into `src/config.js`.
5. Change `za.mealplanner.app` in `app.json` to your own unique ID first if you like. Keep it the same everywhere.

## 3. Publish the website (Firebase Hosting, free)
```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
npm run deploy:web            # builds to dist/ and deploys hosting + Firestore rules
```
The site is then live at `https://YOUR_PROJECT.web.app`. Add that domain under **Authentication → Settings → Authorized domains** (it's usually added automatically).

## 4. Build the Android and iPhone apps (Expo EAS)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview      # installable APK to test
eas build -p android --profile production   # .aab for Google Play
eas build -p ios --profile production       # needs an Apple Developer account
eas submit -p android   # / eas submit -p ios
```
- **Google Play:** $25 one-off developer registration. Upload the `.aab`, fill in the store listing, content rating and data-safety form (the app stores email and meal settings), and add a privacy policy URL.
- **Apple App Store:** $99/year Apple Developer Program. EAS builds iOS in the cloud, so you don't need a Mac. Apps that offer Google sign-in must also offer **Sign in with Apple** to pass App Store review. Add it with `expo-apple-authentication` before you submit.

## 5. Monthly price updates
Prices come from, in order:
1. Firestore document `prices/current` (same shape as `prices.example.json`). Edit it in the Firebase console, or let a script update it.
2. Otherwise the JSON at `PRICE_FEED_URL` in `src/config.js`. For example, a `prices.json` in a GitHub repo served via `https://cdn.jsdelivr.net/gh/USER/REPO@main/prices.json`.
3. Otherwise the built-in estimates in `src/core.js`.

Each person can also override any price in Settings.

## Store accounts (Sixty60, PnP asap!, Woolworths Dash)
None of these retailers offers a public API for outside apps to sign in or fill a cart. Logging in on your behalf would mean storing your password and breaking their terms of use, so the app links to each product search on the store's site or app instead.

## Code layout
- `src/core.js`: recipes, ingredients, prices, nutrition, diet rules, fitness maths, planner. Shared with the web preview (`../shared/core.js`; run `npm run sync-core` after editing it there).
- `src/backend.js`: Firebase auth, Firestore storage, price feed.
- `src/config.js`: your keys.
- `App.js`: all screens.
- `firestore.rules`: each user can only read and write their own data.

Prices are estimates and the nutrition figures are approximate. This is not medical or dietary advice.

## Billing: 30 days free, then R20/month (Paystack)
Billing runs on the web app. Apple and Google require their own in-app purchase systems for digital subscriptions inside store apps, so the phone apps send people to the website to subscribe. Add Apple/Google in-app purchases (e.g. with RevenueCat) before submitting to the stores.

How it works: on first Google sign-in the `startTrial` function records a 30-day trial in `accounts/{uid}`, using server time. When the trial ends, the app shows a paywall. **Subscribe** opens Paystack checkout for your monthly plan, and Paystack's webhook updates `accounts/{uid}.subscription`. Settings → Account → **Manage subscription** opens Paystack's page for cancelling or changing the card. Only the server can write `accounts/*`.

One-time setup:
1. **Paystack:** create an account at paystack.com and complete business verification (sole proprietor is fine). Then go to Products → Plans → **Create plan**: R20, monthly, ZAR. Copy the plan code (`PLN_…`).
2. **Firebase Blaze plan:** Firebase console → Upgrade → Blaze (pay-as-you-go). Cloud Functions need it, but usage at this size stays within the free allowance.
3. **Secret key:** Google Cloud console → Security → **Secret Manager** → Create secret named `PAYSTACK_SECRET_KEY`, with your Paystack **live secret key** as the value. Never commit it or paste it into chat.
4. **Deploy permissions:** in IAM, give the `firebase-adminsdk-…` service account these extra roles: Cloud Functions Admin, Service Account User, Secret Manager Secret Accessor, Firebase Rules Admin, Cloud Build Editor, Artifact Registry Administrator.
5. **GitHub variables** (repo → Settings → Secrets and variables → Actions → Variables): `PAYSTACK_PLAN_CODE` = your plan code, and `DEPLOY_BILLING` = `true`. The next push deploys the functions and the database rules.
6. **Webhook:** Paystack → Settings → API Keys & Webhooks → Webhook URL: `https://africa-south1-meal-planner-sa.cloudfunctions.net/paystackWebhook`

## Legal pages
`legal/details.json` holds the public contact details. Fill in the TODO values; the pages (`/privacy.html`, `/terms.html`, `/paia.html`) rebuild on every deploy.

## Testing and deployment
- `npm test` at the repo root runs the unit tests (Node's built-in test runner, no installs needed).
- `npm run sync` copies `shared/*.js` into `app/src/` (a test fails if they drift apart).
- **CI / CD** (`.github/workflows/ci-cd.yml`): every push and pull request runs the tests, then builds the web app. Pull requests deploy to a temporary Firebase preview link, posted as a comment. Pushes to `main` deploy live, and only after the tests and build pass.
- **Lockfiles:** run the *Refresh lockfiles* workflow from the Actions tab and merge the `chore/lockfiles` branch. Builds then use `npm ci` for repeatable installs.
- **Dependabot** opens weekly update PRs (Expo and React Native packages are excluded; update those together with `npx expo install --fix`).
- **Working on changes:** make a branch, open a pull request, check the preview link and the green checks, then merge.
