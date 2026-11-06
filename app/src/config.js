// Fill these in from your Firebase project (Project settings > Your apps > Web app)
// and Google Cloud console (APIs & Services > Credentials). See README.md.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBThTS7-vgzlf7gat8Tpg0TZJV0tamEADc',
  authDomain: 'meal-planner-sa.firebaseapp.com',
  projectId: 'meal-planner-sa',
  storageBucket: 'meal-planner-sa.firebasestorage.app',
  messagingSenderId: '285871057121',
  appId: '1:285871057121:web:f2813a73f7564670b86fa0',
};

export const GOOGLE_CLIENT_IDS = {
  webClientId: '285871057121-sed1lpkspgf1cqc6ghcelfae62ikvlg9.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
};

// Optional public JSON price feed, refreshed monthly (same shape as prices.example.json).
// Leave empty to use the built-in estimates.
export const PRICE_FEED_URL = 'https://cdn.jsdelivr.net/gh/MattRoss89/meal-planner-sa@main/prices.json';
