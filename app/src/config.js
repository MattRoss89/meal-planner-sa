// Fill these in from your Firebase project (Project settings > Your apps > Web app)
// and Google Cloud console (APIs & Services > Credentials). See README.md.
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const GOOGLE_CLIENT_IDS = {
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
};

// Optional public JSON price feed, refreshed monthly (same shape as prices.example.json).
// Leave empty to use the built-in estimates.
export const PRICE_FEED_URL = 'https://cdn.jsdelivr.net/gh/MattRoss89/meal-planner-sa@main/prices.json';
