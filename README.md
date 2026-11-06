# Meal Planner SA

Weekly meal planner for South Africa: budget-aware meal plans, dietary filters, costed grocery lists for Checkers, Pick n Pay, Woolworths, Shoprite and Spar, fitness-based protein/calorie targets, and Google sign-in.

- `app/`: Expo (React Native) app for Android, iPhone and web. Start with [app/README.md](app/README.md).
- `shared/core.js`: recipes, prices, nutrition and the planner (copied into `app/src/core.js` with `npm run sync-core`).
- `web/`: single-page preview build (`node web/build.mjs`).
- `prices.json`: public price feed, refreshed monthly. Point `PRICE_FEED_URL` in `app/src/config.js` at
  `https://cdn.jsdelivr.net/gh/MattRoss89/meal-planner-sa@main/prices.json` (already set)
