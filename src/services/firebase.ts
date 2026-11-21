import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyBAi4HqZ5QecgGl2TGPmrEBGwGu8u7edKs',
  authDomain: 'baba-fde57.firebaseapp.com',
  projectId: 'baba-fde57',
  storageBucket: 'baba-fde57.firebasestorage.app',
  messagingSenderId: '601963979331',
  appId: '1:601963979331:web:34f886a20767f1b33e6af6'
};

// Initialize Firebase safely
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Resilient Auth persistence chain so Safari Private Mode / iframe ITP never throws on init
function createSafariSafeAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence
      ]
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = createSafariSafeAuth();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser
};
