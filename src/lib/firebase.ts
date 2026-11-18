import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { logError, logInfo, logWarn } from './logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'camblu.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'camblu',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'camblu.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '830416621306',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'camblufurb@gmail.com').toLowerCase();
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    logInfo('Firebase', 'SDK Firebase inicializado', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      appId: firebaseConfig.appId,
      apiBaseUrl: API_BASE_URL,
      hasStripeKey: Boolean(STRIPE_PUBLISHABLE_KEY),
    });
  } catch (err) {
    logError('Firebase', 'firebase.ts -> initializeApp', err, {
      projectId: firebaseConfig.projectId,
    });
  }
} else {
  logWarn('Firebase', 'Firebase não configurado (.env sem apiKey/appId); executando em modo demonstração local', {
    hasApiKey: Boolean(firebaseConfig.apiKey),
    hasProjectId: Boolean(firebaseConfig.projectId),
    hasAppId: Boolean(firebaseConfig.appId),
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      logError('Auth', 'firebase.ts -> getAuthHeaders.getIdToken', err, {
        uid: auth.currentUser.uid,
      });
    }
  }
  return headers;
}

export { app, auth, db, storage, firebaseConfig };
