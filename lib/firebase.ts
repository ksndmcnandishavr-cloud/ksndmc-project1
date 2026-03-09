import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let app;
let db: any;
let IS_FIREBASE_CONNECTED = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    IS_FIREBASE_CONNECTED = true;
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase config missing, falling back to local storage mode if supported.');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { db, IS_FIREBASE_CONNECTED };
