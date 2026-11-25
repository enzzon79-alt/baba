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
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';

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

function createSafariSafeFirestore(): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const auth = createSafariSafeAuth();
export const firestore = createSafariSafeFirestore();
export const db = firestore;

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
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function formatFirestoreErrorForUser(error: unknown): string {
  const errObj = error as { code?: string; message?: string } | null;
  const code = String(errObj?.code || '');
  const msg = String(errObj?.message || error || 'Erro no Cloud Firestore');
  if (code === 'permission-denied' || msg.toLowerCase().includes('missing or insufficient permissions')) {
    if (!auth.currentUser) {
      return 'Permissão negada no Cloud Firestore: sessão Firebase Auth não iniciada. Faz login com uma conta de Administrador autorizada no Firebase.';
    }
    return `Permissão negada no Cloud Firestore para o utilizador ${auth.currentUser.email || auth.currentUser.uid}. Confirma que este utilizador tem role "admin" e regras publicadas.`;
  }
  if (code === 'unauthenticated') {
    return 'Autenticação necessária no Firebase para aceder ao Cloud Firestore.';
  }
  if (code === 'unavailable') {
    return 'Cloud Firestore temporariamente indisponível ou sem ligação à internet.';
  }
  return msg;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  shouldThrow = true
): FirestoreErrorInfo {
  const errObj = error as { code?: string; message?: string } | null;
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errObj?.message || String(error),
    code: errObj?.code,
    operationType,
    path,
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo: (current?.providerData || []).map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      }))
    }
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    const wrapped = new Error(formatFirestoreErrorForUser(error));
    (wrapped as any).code = errObj?.code;
    (wrapped as any).firestoreInfo = errInfo;
    throw wrapped;
  }
  return errInfo;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'products', '__connection_check__'));
    return true;
  } catch (error: any) {
    const msg = String(error?.message || '');
    if (msg.includes('the client is offline')) {
      console.warn('Cloud Firestore: o cliente está offline ou sem resposta do servidor.');
      return false;
    }
    return true;
  }
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  type Auth,
  type FirebaseUser,
  type Firestore,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData
};

