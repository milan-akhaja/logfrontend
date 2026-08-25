import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let app = null;
let auth = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { auth };

let recaptchaVerifier = null;

export const initRecaptcha = (containerId = 'recaptcha-container') => {
  if (!auth) return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {}
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch {}
        recaptchaVerifier = null;
      }
    }
  });

  return recaptchaVerifier;
};

export const sendFirebasePhoneOtp = async (fullPhoneNumber, containerId = 'recaptcha-container') => {
  if (!auth) {
    throw new Error('Firebase Phone Auth is not configured. Please add your VITE_FIREBASE_* credentials to .env');
  }
  const appVerifier = initRecaptcha(containerId);
  if (!appVerifier) {
    throw new Error('reCAPTCHA container missing');
  }
  const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
  return confirmationResult;
};
