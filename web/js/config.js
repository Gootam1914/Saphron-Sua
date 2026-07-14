// Public runtime config. Firebase web keys are safe to expose in the browser.
// Because Express serves this frontend on the same origin as the API,
// API_BASE is empty and requests go to /api/... directly.
export const CONFIG = {
  API_BASE: '',
  DEMO_MODE: false, // set true only if the server also runs DEMO_MODE=true
  ALLOWED_EMAIL_DOMAIN: '', // e.g. 'yourschool.org' to restrict sign-in
  FIREBASE: {
    apiKey: 'AIzaSyBCXmCQ7NH6lOzbShg7yfK1wuRwUbW4S-w',
    authDomain: 'saphron-sua.firebaseapp.com',
    projectId: 'saphron-sua',
    storageBucket: 'saphron-sua.firebasestorage.app',
    messagingSenderId: '374198182475',
    appId: '1:374198182475:web:13d08f6cb7c64a041ae3ce',
  },
};
