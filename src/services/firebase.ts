import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
  type DocumentData
} from 'firebase/firestore';
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

// Force long-polling so Safari (desktop/iOS ITP & iframes) receives real-time onSnapshot updates without WebChannel stalls
function createSafariSafeFirestore(): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

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

export const firestore = createSafariSafeFirestore();
export const auth = createSafariSafeAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: Record<string, any>;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    }
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

export {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser
};
