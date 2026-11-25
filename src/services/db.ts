import {
  Product,
  User,
  UserProduct,
  ResaleListing,
  Wallet,
  Transaction,
  Order,
  OrderStatus,
  DepositRequest,
  WithdrawalRequest,
  Notification,
  Negotiation,
  AssistantConversation,
  AssistantMessage
} from '../types';
import {
  CURRENCIES,
  getActiveCurrency,
  setActiveCurrency,
  convertFromKz,
  formatCurrencyAmount,
  CurrencyCode,
  CURRENCY_CHANGE_EVENT
} from './currency';
import { CATALOG_IMPORT_TEMPLATES } from '../data/mockData';
import {
  auth,
  firestore,
  getFirebaseIdToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  OperationType,
  handleFirestoreError,
  formatFirestoreErrorForUser,
  type Unsubscribe
} from './firebase';

// ==========================================
// CONSTANTS & ADMIN GUARD
// ==========================================
export const DB_STATE_EVENT = 'baba_db_state_changed';
export const ADMIN_UID = 'oYHKf9Uvp5Sm0aPyUefjM8aNrrK2';
export const MIN_WITHDRAWAL_AMOUNT = 0;

const ONBOARDING_PREF_KEY = 'baba_onboarding_completed';

export interface ReferralRecord {
  id: string;
  referrerId: string;
  invitedUserId: string;
  invitedName: string;
  invitedProvince: string;
  idNumber: string;
  status: 'em_processamento' | 'validado' | 'rejeitado';
  rewardPaid: boolean;
  rewardAmount: number;
  createdAt: string;
}

export interface AdminRealtimeOptions {
  onCollectionSync?: (collectionName: string) => void;
  onError?: (collectionName: string, message: string, code?: string) => void;
}

export function isAdminUserRecord(u?: Partial<User> | null): boolean {
  if (!u) return false;
  return u.id === ADMIN_UID || u.role === 'admin';
}

export function dispatchDbChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DB_STATE_EVENT));
  }
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ONBOARDING_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(completed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (completed) {
      window.localStorage.setItem(ONBOARDING_PREF_KEY, 'true');
    } else {
      window.localStorage.removeItem(ONBOARDING_PREF_KEY);
    }
  } catch {}
}

export function toIsoTimestamp(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (typeof val?.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      return '';
    }
  }
  if (typeof val?.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  return '';
}

function sortByCreatedAtDesc<T extends { createdAt?: any; updatedAt?: any; purchaseDate?: any }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ta = new Date(toIsoTimestamp(a.createdAt || a.updatedAt || a.purchaseDate) || 0).getTime();
    const tb = new Date(toIsoTimestamp(b.createdAt || b.updatedAt || b.purchaseDate) || 0).getTime();
    return tb - ta;
  });
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

function sanitizeUserForFirestore(user: Partial<User> & { id: string }): User {
  const clean: any = stripUndefined({ ...user });
  delete clean.password;
  if (clean.id === ADMIN_UID) {
    clean.role = 'admin';
    clean.accountStatus = 'ativo';
  }
  return clean as User;
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizePhoneKey(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('244') && digits.length > 9) {
    return `phone_${digits}`;
  }
  if (digits.length === 9 && digits.startsWith('9')) {
    return `phone_244${digits}`;
  }
  return `phone_${digits}`;
}

function normalizeBiKey(idNumber: string): string {
  const clean = String(idNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean ? `bi_${clean}` : '';
}

function formatMoney(amountKz: number): string {
  return formatCurrencyAmount(amountKz);
}

// ==========================================
// IN-MEMORY REAL-TIME STORE (CLOUD FIRESTORE BACKED)
// ==========================================
let memoryProducts: Product[] = [];
let memoryUsers: User[] = [];
let memoryDeletedUsers: Record<string, any> = {};
let memoryWallets: Record<string, Wallet> = {};
let memoryResaleListings: ResaleListing[] = [];
let memoryUserProducts: UserProduct[] = [];
let memoryNegotiations: Negotiation[] = [];
let memoryNotifications: Notification[] = [];
let memoryDeposits: DepositRequest[] = [];
let memoryWithdrawals: WithdrawalRequest[] = [];
let memoryTransactions: Transaction[] = [];
let memoryOrders: Order[] = [];
let memoryAssistantConversations: AssistantConversation[] = [];
let memoryReferrals: ReferralRecord[] = [];

let currentUserRecord: User | null = null;
let databaseInitialized = false;
let authReadyState = false;
let isRegisteringTransition = false;

const authReadyListeners = new Set<(ready: boolean) => void>();
let publicUnsubscribes: Unsubscribe[] = [];
let userScopedUnsubscribes: Unsubscribe[] = [];
let activeScopedUid: string | null = null;

// Split maps for dual-query collections (public/owner/buyer/seller)
const resalePublicMap = new Map<string, ResaleListing>();
const resaleOwnedMap = new Map<string, ResaleListing>();
const ordersBuyerMap = new Map<string, Order>();
const ordersSellerMap = new Map<string, Order>();
const negBuyerMap = new Map<string, Negotiation>();
const negSellerMap = new Map<string, Negotiation>();

function rebuildResaleListingsFromMaps(): void {
  const merged = new Map<string, ResaleListing>();
  resalePublicMap.forEach((v, k) => merged.set(k, v));
  resaleOwnedMap.forEach((v, k) => merged.set(k, v));
  memoryResaleListings = sortByCreatedAtDesc(Array.from(merged.values()));
}

function rebuildOrdersFromMaps(): void {
  const merged = new Map<string, Order>();
  ordersBuyerMap.forEach((v, k) => merged.set(k, v));
  ordersSellerMap.forEach((v, k) => merged.set(k, v));
  memoryOrders = sortByCreatedAtDesc(Array.from(merged.values()));
}

function rebuildNegotiationsFromMaps(): void {
  const merged = new Map<string, Negotiation>();
  negBuyerMap.forEach((v, k) => merged.set(k, v));
  negSellerMap.forEach((v, k) => merged.set(k, v));
  memoryNegotiations = sortByCreatedAtDesc(Array.from(merged.values()));
}

function notifyAuthReady(ready: boolean): void {
  authReadyState = ready;
  authReadyListeners.forEach(cb => {
    try {
      cb(ready);
    } catch {}
  });
}

export function isAuthReady(): boolean {
  return authReadyState;
}

export function subscribeAuthReady(cb: (ready: boolean) => void): () => void {
  authReadyListeners.add(cb);
  return () => {
    authReadyListeners.delete(cb);
  };
}

function clearUserScopedListeners(): void {
  userScopedUnsubscribes.forEach(unsub => {
    try {
      unsub();
    } catch {}
  });
  userScopedUnsubscribes = [];
  activeScopedUid = null;
}

function clearUserScopedMemory(): void {
  currentUserRecord = null;
  memoryUsers = [];
  memoryDeletedUsers = {};
  memoryWallets = {};
  memoryUserProducts = [];
  memoryNegotiations = [];
  memoryNotifications = [];
  memoryDeposits = [];
  memoryWithdrawals = [];
  memoryTransactions = [];
  memoryOrders = [];
  memoryAssistantConversations = [];
  memoryReferrals = [];
  resaleOwnedMap.clear();
  ordersBuyerMap.clear();
  ordersSellerMap.clear();
  negBuyerMap.clear();
  negSellerMap.clear();
  rebuildResaleListingsFromMaps();
}

function zeroWallet(userId: string): Wallet {
  return {
    userId,
    availableBalance: 0,
    pendingBalance: 0,
    reservedBalance: 0,
    totalDeposited: 0,
    totalSpent: 0,
    totalEarned: 0,
    totalWithdrawn: 0
  };
}

function normalizeFirestoreDoc<T extends Record<string, any>>(docId: string, raw: any): T {
  const out: any = { ...(raw || {}), id: raw?.id || docId };
  if ('createdAt' in out) {
    out.createdAt = toIsoTimestamp(out.createdAt) || new Date().toISOString();
  }
  if ('updatedAt' in out) {
    out.updatedAt = toIsoTimestamp(out.updatedAt) || out.createdAt || new Date().toISOString();
  }
  if ('purchaseDate' in out) {
    out.purchaseDate = toIsoTimestamp(out.purchaseDate) || new Date().toISOString();
  }
  if ('verifiedAt' in out && out.verifiedAt) {
    out.verifiedAt = toIsoTimestamp(out.verifiedAt);
  }
  if ('escalatedAt' in out && out.escalatedAt) {
    out.escalatedAt = toIsoTimestamp(out.escalatedAt);
  }
  return out as T;
}

// ==========================================
// STRICT FIRESTORE WRITE HELPERS
// ==========================================
export async function writeDocToCloudFirestore(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  merge = true
): Promise<void> {
  const payload = stripUndefined({
    ...data,
    ...(collectionName !== 'wallets' && collectionName !== 'login_hints' ? { id: data.id || docId } : {})
  });
  if (collectionName === 'users') {
    delete (payload as any).password;
  }
  await setDoc(doc(firestore, collectionName, docId), payload, { merge });
}

export async function persistDocToFirestoreStrict(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  merge = true
): Promise<void> {
  try {
    await writeDocToCloudFirestore(collectionName, docId, data, merge);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`, true);
  }
}

export async function flushSyncOutbox(): Promise<void> {
  // No-op: all operations persist directly to Cloud Firestore.
}

function assertAdminCaller(): void {
  const fbUid = auth.currentUser?.uid;
  if (fbUid === ADMIN_UID) return;
  if (currentUserRecord && isAdminUserRecord(currentUserRecord) && fbUid) return;
  if (!fbUid) {
    throw new Error('Sessão Firebase Admin não iniciada. Faz login como Administrador para confirmar esta operação.');
  }
  throw new Error('Apenas o Administrador autorizado pode executar esta operação.');
}

async function publishLoginHints(user: Pick<User, 'id' | 'email' | 'phone' | 'idNumber'>): Promise<void> {
  const email = normalizeEmail(user.email);
  if (!email) return;
  const writes: Promise<void>[] = [];
  const pKey = normalizePhoneKey(user.phone);
  if (pKey) {
    writes.push(
      setDoc(doc(firestore, 'login_hints', pKey), { email, userId: user.id }, { merge: true }).catch(() => {})
    );
  }
  const bKey = normalizeBiKey(user.idNumber);
  if (bKey) {
    writes.push(
      setDoc(doc(firestore, 'login_hints', bKey), { email, userId: user.id }, { merge: true }).catch(() => {})
    );
  }
  await Promise.all(writes);
}

async function publishReferralCodeMap(user: Pick<User, 'id' | 'name'>): Promise<void> {
  const code = getUserInviteCode(user);
  await setDoc(
    doc(firestore, 'referral_codes', code),
    { code, userId: user.id, userName: user.name },
    { merge: true }
  ).catch(() => {});
}

async function ensureAdminProfileAndWallet(fbUser: { uid: string; email?: string | null; displayName?: string | null }): Promise<User> {
  const userRef = doc(firestore, 'users', fbUser.uid);
  const walletRef = doc(firestore, 'wallets', fbUser.uid);

  const [userSnap, walletSnap] = await Promise.all([
    getDoc(userRef).catch(() => null),
    getDoc(walletRef).catch(() => null)
  ]);

  const nowIso = new Date().toISOString();
  let adminUser: User;

  if (userSnap && userSnap.exists()) {
    const data = userSnap.data() as Partial<User>;
    adminUser = sanitizeUserForFirestore({
      ...data,
      id: fbUser.uid,
      name: data.name || fbUser.displayName || 'Administrador BABA',
      email: data.email || fbUser.email || '',
      phone: data.phone || '',
      province: data.province || 'Luanda',
      city: data.city || 'Luanda',
      role: 'admin',
      accountStatus: 'ativo',
      idNumber: data.idNumber || '',
      birthDate: data.birthDate || '',
      createdAt: toIsoTimestamp(data.createdAt) || nowIso
    });
    if (data.role !== 'admin' || data.accountStatus !== 'ativo') {
      await setDoc(userRef, adminUser, { merge: true }).catch(() => {});
    }
  } else {
    adminUser = sanitizeUserForFirestore({
      id: fbUser.uid,
      name: fbUser.displayName || 'Administrador BABA',
      email: fbUser.email || '',
      phone: '',
      province: 'Luanda',
      city: 'Luanda',
      role: 'admin',
      accountStatus: 'ativo',
      idNumber: '',
      birthDate: '',
      createdAt: nowIso
    });
    await setDoc(userRef, adminUser, { merge: true }).catch(() => {});
  }

  if (!walletSnap || !walletSnap.exists()) {
    const newWallet = zeroWallet(fbUser.uid);
    newWallet.updatedAt = nowIso;
    await setDoc(walletRef, newWallet, { merge: true }).catch(() => {});
    memoryWallets[fbUser.uid] = newWallet;
  } else {
    memoryWallets[fbUser.uid] = { ...zeroWallet(fbUser.uid), ...(walletSnap.data() as Wallet), userId: fbUser.uid };
  }

  await Promise.all([publishLoginHints(adminUser), publishReferralCodeMap(adminUser)]);
  return adminUser;
}

// ==========================================
// REAL-TIME LISTENERS ATTACHMENT
// ==========================================
function attachPublicListeners(): void {
  if (publicUnsubscribes.length > 0) return;

  const unsubProducts = onSnapshot(
    collection(firestore, 'products'),
    snap => {
      const list: Product[] = [];
      snap.forEach(d => {
        const item = normalizeFirestoreDoc<Product>(d.id, d.data());
        if (item.name) list.push(item);
      });
      memoryProducts = list;
      dispatchDbChange();
    },
    err => {
      console.warn('Products snapshot note:', err);
    }
  );

  const unsubPublicResale = onSnapshot(
    query(collection(firestore, 'resale_listings'), where('status', '==', 'ativo')),
    snap => {
      resalePublicMap.clear();
      snap.forEach(d => {
        const item = normalizeFirestoreDoc<ResaleListing>(d.id, d.data());
        resalePublicMap.set(item.id, item);
      });
      rebuildResaleListingsFromMaps();
      dispatchDbChange();
    },
    err => {
      console.warn('Resale public snapshot note:', err);
    }
  );

  publicUnsubscribes.push(unsubProducts, unsubPublicResale);
}

function attachAdminListeners(uid: string, opts?: AdminRealtimeOptions): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  const handleErr = (col: string, err: any) => {
    const msg = formatFirestoreErrorForUser(err);
    const code = String(err?.code || '');
    console.error(`Admin realtime error [${col}]:`, msg);
    opts?.onError?.(col, msg, code);
  };

  unsubs.push(
    onSnapshot(
      collection(firestore, 'users'),
      snap => {
        const list: User[] = [];
        snap.forEach(d => {
          list.push(sanitizeUserForFirestore(normalizeFirestoreDoc<User>(d.id, d.data())));
        });
        memoryUsers = sortByCreatedAtDesc(list);
        const me = memoryUsers.find(u => u.id === uid);
        if (me) currentUserRecord = me;
        opts?.onCollectionSync?.('users');
        dispatchDbChange();
      },
      err => handleErr('users', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'wallets'),
      snap => {
        const map: Record<string, Wallet> = {};
        snap.forEach(d => {
          const w = d.data() as Wallet;
          map[d.id] = { ...zeroWallet(d.id), ...w, userId: w.userId || d.id };
        });
        memoryWallets = map;
        opts?.onCollectionSync?.('wallets');
        dispatchDbChange();
      },
      err => handleErr('wallets', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'deposits'),
      snap => {
        const list: DepositRequest[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<DepositRequest>(d.id, d.data())));
        memoryDeposits = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('deposits');
        dispatchDbChange();
      },
      err => handleErr('deposits', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'withdrawals'),
      snap => {
        const list: WithdrawalRequest[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<WithdrawalRequest>(d.id, d.data())));
        memoryWithdrawals = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('withdrawals');
        dispatchDbChange();
      },
      err => handleErr('withdrawals', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'orders'),
      snap => {
        ordersBuyerMap.clear();
        ordersSellerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Order>(d.id, d.data());
          ordersBuyerMap.set(item.id, item);
        });
        rebuildOrdersFromMaps();
        opts?.onCollectionSync?.('orders');
        dispatchDbChange();
      },
      err => handleErr('orders', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'user_products'),
      snap => {
        const list: UserProduct[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<UserProduct>(d.id, d.data())));
        memoryUserProducts = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('user_products');
        dispatchDbChange();
      },
      err => handleErr('user_products', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'resale_listings'),
      snap => {
        resaleOwnedMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<ResaleListing>(d.id, d.data());
          resaleOwnedMap.set(item.id, item);
        });
        rebuildResaleListingsFromMaps();
        opts?.onCollectionSync?.('resale_listings');
        dispatchDbChange();
      },
      err => handleErr('resale_listings', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'negotiations'),
      snap => {
        negBuyerMap.clear();
        negSellerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Negotiation>(d.id, d.data());
          negBuyerMap.set(item.id, item);
        });
        rebuildNegotiationsFromMaps();
        opts?.onCollectionSync?.('negotiations');
        dispatchDbChange();
      },
      err => handleErr('negotiations', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'transactions'),
      snap => {
        const list: Transaction[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<Transaction>(d.id, d.data())));
        memoryTransactions = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('transactions');
        dispatchDbChange();
      },
      err => handleErr('transactions', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'notifications'),
      snap => {
        const list: Notification[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<Notification>(d.id, d.data())));
        memoryNotifications = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('notifications');
        dispatchDbChange();
      },
      err => handleErr('notifications', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'assistant_conversations'),
      snap => {
        const list: AssistantConversation[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<AssistantConversation>(d.id, d.data())));
        memoryAssistantConversations = list.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
        opts?.onCollectionSync?.('assistant_conversations');
        dispatchDbChange();
      },
      err => handleErr('assistant_conversations', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'referrals'),
      snap => {
        const list: ReferralRecord[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<ReferralRecord>(d.id, d.data())));
        memoryReferrals = sortByCreatedAtDesc(list);
        opts?.onCollectionSync?.('referrals');
        dispatchDbChange();
      },
      err => handleErr('referrals', err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'deleted_users'),
      snap => {
        const map: Record<string, any> = {};
        snap.forEach(d => {
          map[d.id] = d.data();
        });
        memoryDeletedUsers = map;
        dispatchDbChange();
      },
      err => handleErr('deleted_users', err)
    )
  );

  return unsubs;
}

function attachClientListeners(uid: string): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(firestore, 'users', uid),
      snap => {
        if (snap.exists()) {
          const u = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(snap.id, snap.data()));
          currentUserRecord = u;
          const idx = memoryUsers.findIndex(x => x.id === u.id);
          if (idx !== -1) memoryUsers[idx] = u;
          else memoryUsers = [u, ...memoryUsers];
        } else {
          currentUserRecord = null;
        }
        dispatchDbChange();
      },
      err => console.warn('User profile snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(firestore, 'wallets', uid),
      snap => {
        if (snap.exists()) {
          const w = snap.data() as Wallet;
          memoryWallets[uid] = { ...zeroWallet(uid), ...w, userId: uid };
        } else {
          memoryWallets[uid] = zeroWallet(uid);
        }
        dispatchDbChange();
      },
      err => console.warn('Wallet snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'deposits'), where('userId', '==', uid)),
      snap => {
        const list: DepositRequest[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<DepositRequest>(d.id, d.data())));
        memoryDeposits = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('Deposits snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'withdrawals'), where('userId', '==', uid)),
      snap => {
        const list: WithdrawalRequest[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<WithdrawalRequest>(d.id, d.data())));
        memoryWithdrawals = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('Withdrawals snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'orders'), where('buyerId', '==', uid)),
      snap => {
        ordersBuyerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Order>(d.id, d.data());
          ordersBuyerMap.set(item.id, item);
        });
        rebuildOrdersFromMaps();
        dispatchDbChange();
      },
      err => console.warn('Orders buyer snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'orders'), where('sellerId', '==', uid)),
      snap => {
        ordersSellerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Order>(d.id, d.data());
          ordersSellerMap.set(item.id, item);
        });
        rebuildOrdersFromMaps();
        dispatchDbChange();
      },
      err => console.warn('Orders seller snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'user_products'), where('currentOwnerId', '==', uid)),
      snap => {
        const list: UserProduct[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<UserProduct>(d.id, d.data())));
        memoryUserProducts = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('User products snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'resale_listings'), where('sellerId', '==', uid)),
      snap => {
        resaleOwnedMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<ResaleListing>(d.id, d.data());
          resaleOwnedMap.set(item.id, item);
        });
        rebuildResaleListingsFromMaps();
        dispatchDbChange();
      },
      err => console.warn('Resale owned snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'negotiations'), where('buyerId', '==', uid)),
      snap => {
        negBuyerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Negotiation>(d.id, d.data());
          negBuyerMap.set(item.id, item);
        });
        rebuildNegotiationsFromMaps();
        dispatchDbChange();
      },
      err => console.warn('Neg buyer snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'negotiations'), where('sellerId', '==', uid)),
      snap => {
        negSellerMap.clear();
        snap.forEach(d => {
          const item = normalizeFirestoreDoc<Negotiation>(d.id, d.data());
          negSellerMap.set(item.id, item);
        });
        rebuildNegotiationsFromMaps();
        dispatchDbChange();
      },
      err => console.warn('Neg seller snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'transactions'), where('userId', '==', uid)),
      snap => {
        const list: Transaction[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<Transaction>(d.id, d.data())));
        memoryTransactions = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('Transactions snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'notifications'), where('recipientId', '==', uid)),
      snap => {
        const list: Notification[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<Notification>(d.id, d.data())));
        memoryNotifications = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('Notifications snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'assistant_conversations'), where('userId', '==', uid)),
      snap => {
        const list: AssistantConversation[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<AssistantConversation>(d.id, d.data())));
        memoryAssistantConversations = list.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
        dispatchDbChange();
      },
      err => console.warn('Assistant snapshot note:', err)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(firestore, 'referrals'), where('referrerId', '==', uid)),
      snap => {
        const list: ReferralRecord[] = [];
        snap.forEach(d => list.push(normalizeFirestoreDoc<ReferralRecord>(d.id, d.data())));
        memoryReferrals = sortByCreatedAtDesc(list);
        dispatchDbChange();
      },
      err => console.warn('Referrals snapshot note:', err)
    )
  );

  return unsubs;
}

export function initDatabase(): void {
  if (databaseInitialized) return;
  databaseInitialized = true;

  attachPublicListeners();

  onAuthStateChanged(auth, async fbUser => {
    if (isRegisteringTransition) return;

    if (!fbUser) {
      clearUserScopedListeners();
      clearUserScopedMemory();
      notifyAuthReady(true);
      dispatchDbChange();
      return;
    }

    if (activeScopedUid === fbUser.uid && currentUserRecord) {
      notifyAuthReady(true);
      return;
    }

    clearUserScopedListeners();
    clearUserScopedMemory();
    activeScopedUid = fbUser.uid;

    try {
      if (fbUser.uid === ADMIN_UID) {
        const adminUser = await ensureAdminProfileAndWallet(fbUser);
        currentUserRecord = adminUser;
        if (!memoryUsers.some(u => u.id === adminUser.id)) {
          memoryUsers = [adminUser];
        }
        userScopedUnsubscribes = attachAdminListeners(fbUser.uid);
      } else {
        const userSnap = await getDoc(doc(firestore, 'users', fbUser.uid)).catch(() => null);
        if (userSnap && userSnap.exists()) {
          const loaded = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(userSnap.id, userSnap.data()));
          currentUserRecord = loaded;
          memoryUsers = [loaded];
          if (loaded.role === 'admin') {
            userScopedUnsubscribes = attachAdminListeners(fbUser.uid);
          } else {
            userScopedUnsubscribes = attachClientListeners(fbUser.uid);
          }
          await Promise.all([publishLoginHints(loaded), publishReferralCodeMap(loaded)]);
        } else {
          userScopedUnsubscribes = attachClientListeners(fbUser.uid);
        }
      }
    } catch (err) {
      console.warn('Auth restore note:', err);
    } finally {
      notifyAuthReady(true);
      dispatchDbChange();
    }
  });
}

export async function forceSyncFromSharedServer(): Promise<boolean> {
  try {
    if (auth.currentUser && (auth.currentUser.uid === ADMIN_UID || isAdminUserRecord(currentUserRecord))) {
      await syncAdminCollectionsFromFirestore();
    } else if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const [uSnap, wSnap] = await Promise.all([
        getDoc(doc(firestore, 'users', uid)),
        getDoc(doc(firestore, 'wallets', uid))
      ]);
      if (uSnap.exists()) {
        currentUserRecord = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(uSnap.id, uSnap.data()));
      }
      if (wSnap.exists()) {
        memoryWallets[uid] = { ...zeroWallet(uid), ...(wSnap.data() as Wallet), userId: uid };
      }
    }
    dispatchDbChange();
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// PRODUCTS (OFFICIAL MARKET)
// ==========================================
export function getProducts(): Product[] {
  return [...memoryProducts];
}

export function updateProduct(id: string, updates: Partial<Product>): Product {
  assertAdminCaller();
  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Produto não encontrado no catálogo.');
  const updated: Product = { ...memoryProducts[idx], ...updates, id };
  memoryProducts[idx] = updated;
  dispatchDbChange();
  writeDocToCloudFirestore('products', id, updated, true).catch(err => {
    console.error('Erro ao atualizar produto no Firestore:', err);
  });
  return updated;
}

export function createProduct(productData: Omit<Product, 'id'>): Product {
  assertAdminCaller();
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  memoryProducts = [newProduct, ...memoryProducts];
  dispatchDbChange();
  writeDocToCloudFirestore('products', newProduct.id, newProduct, false).catch(err => {
    console.error('Erro ao criar produto no Firestore:', err);
  });
  return newProduct;
}

export async function seedStarterCatalogToFirestore(): Promise<number> {
  assertAdminCaller();
  const existingIds = new Set(memoryProducts.map(p => p.id));
  const missing = CATALOG_IMPORT_TEMPLATES.filter(p => !existingIds.has(p.id));
  if (missing.length === 0) return 0;

  let added = 0;
  const chunkSize = 25;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async prod => {
        await persistDocToFirestoreStrict('products', prod.id, prod, true);
        added += 1;
      })
    );
  }
  dispatchDbChange();
  return added;
}

// ==========================================
// USERS & CLOUD FIRESTORE ADMIN QUERIES
// ==========================================
export function getUsers(): User[] {
  return [...memoryUsers];
}

export function getReferrals(referrerId?: string): ReferralRecord[] {
  if (!referrerId) return [...memoryReferrals];
  return memoryReferrals.filter(r => r.referrerId === referrerId);
}

export function getUserInviteCode(user?: Pick<User, 'id' | 'name'> | null): string {
  if (!user) return 'BABA-AMIGO94';
  const firstName =
    String(user.name || 'AMIGO')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase() || 'AMIGO';
  const suffix =
    String(user.id || '94')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(-3)
      .toUpperCase() || '94';
  return `BABA-${firstName}${suffix}`;
}

export async function fetchCloudFirestoreCollection<T = Record<string, any>>(colName: string): Promise<T[]> {
  const snap = await getDocs(collection(firestore, colName));
  const list: T[] = [];
  snap.forEach(d => {
    list.push(normalizeFirestoreDoc(d.id, d.data()) as T);
  });
  return list;
}

export function subscribeAdminFirestoreRealtime(options?: AdminRealtimeOptions): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser || (fbUser.uid !== ADMIN_UID && !isAdminUserRecord(currentUserRecord))) {
    options?.onError?.(
      'auth',
      'Sessão Firebase Admin necessária para ler os pedidos em tempo real no Cloud Firestore.',
      'permission-denied'
    );
    return () => {};
  }
  const unsubs = attachAdminListeners(fbUser.uid, options);
  return () => {
    unsubs.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
}

export async function signInAdminFirebaseAuth(email: string, password: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) {
    throw new Error('Insere o email e a palavra-passe do Administrador.');
  }
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  if (cred.user.uid !== ADMIN_UID) {
    const snap = await getDoc(doc(firestore, 'users', cred.user.uid)).catch(() => null);
    if (!snap || !snap.exists() || snap.data()?.role !== 'admin') {
      await signOut(auth).catch(() => {});
      throw new Error('Esta conta não tem permissões de Administrador na plataforma.');
    }
  }
  const adminUser = await ensureAdminProfileAndWallet(cred.user);
  currentUserRecord = adminUser;
  await syncAdminCollectionsFromFirestore();
  dispatchDbChange();
}

export async function syncUsersFromFirestore(): Promise<User[]> {
  if (auth.currentUser?.uid === ADMIN_UID || isAdminUserRecord(currentUserRecord)) {
    const users = await fetchCloudFirestoreCollection<User>('users');
    memoryUsers = sortByCreatedAtDesc(users.map(u => sanitizeUserForFirestore(u)));
    dispatchDbChange();
    return memoryUsers;
  }
  if (auth.currentUser) {
    const snap = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
    if (snap.exists()) {
      const u = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(snap.id, snap.data()));
      currentUserRecord = u;
      memoryUsers = [u];
      dispatchDbChange();
      return [u];
    }
  }
  return [];
}

export async function syncAdminCollectionsFromFirestore(): Promise<{
  users: number;
  deposits: number;
  withdrawals: number;
  orders: number;
  resale_listings: number;
  negotiations: number;
  assistant_conversations: number;
  transactions: number;
  firestoreErrors: Array<{ collection: string; message: string; code?: string }>;
}> {
  const firestoreErrors: Array<{ collection: string; message: string; code?: string }> = [];
  const safeFetch = async <T = any>(col: string): Promise<T[] | null> => {
    try {
      return await fetchCloudFirestoreCollection<T>(col);
    } catch (err: any) {
      firestoreErrors.push({
        collection: col,
        message: formatFirestoreErrorForUser(err),
        code: String(err?.code || '')
      });
      return null;
    }
  };

  const [
    users,
    wallets,
    deposits,
    withdrawals,
    orders,
    listings,
    userProds,
    negs,
    txs,
    notifs,
    convs,
    refs,
    prods
  ] = await Promise.all([
    safeFetch<User>('users'),
    safeFetch<Wallet>('wallets'),
    safeFetch<DepositRequest>('deposits'),
    safeFetch<WithdrawalRequest>('withdrawals'),
    safeFetch<Order>('orders'),
    safeFetch<ResaleListing>('resale_listings'),
    safeFetch<UserProduct>('user_products'),
    safeFetch<Negotiation>('negotiations'),
    safeFetch<Transaction>('transactions'),
    safeFetch<Notification>('notifications'),
    safeFetch<AssistantConversation>('assistant_conversations'),
    safeFetch<ReferralRecord>('referrals'),
    safeFetch<Product>('products')
  ]);

  if (users) {
    memoryUsers = sortByCreatedAtDesc(users.map(u => sanitizeUserForFirestore(u)));
    const me = auth.currentUser ? memoryUsers.find(u => u.id === auth.currentUser?.uid) : null;
    if (me) currentUserRecord = me;
  }
  if (wallets) {
    const map: Record<string, Wallet> = {};
    wallets.forEach((w: any) => {
      const id = w.userId || w.id;
      if (id) map[id] = { ...zeroWallet(id), ...w, userId: id };
    });
    memoryWallets = map;
  }
  if (deposits) memoryDeposits = sortByCreatedAtDesc(deposits);
  if (withdrawals) memoryWithdrawals = sortByCreatedAtDesc(withdrawals);
  if (orders) {
    ordersBuyerMap.clear();
    ordersSellerMap.clear();
    orders.forEach(o => ordersBuyerMap.set(o.id, o));
    rebuildOrdersFromMaps();
  }
  if (listings) {
    resaleOwnedMap.clear();
    listings.forEach(l => resaleOwnedMap.set(l.id, l));
    rebuildResaleListingsFromMaps();
  }
  if (userProds) memoryUserProducts = sortByCreatedAtDesc(userProds);
  if (negs) {
    negBuyerMap.clear();
    negSellerMap.clear();
    negs.forEach(n => negBuyerMap.set(n.id, n));
    rebuildNegotiationsFromMaps();
  }
  if (txs) memoryTransactions = sortByCreatedAtDesc(txs);
  if (notifs) memoryNotifications = sortByCreatedAtDesc(notifs);
  if (convs) {
    memoryAssistantConversations = [...convs].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
    );
  }
  if (refs) memoryReferrals = sortByCreatedAtDesc(refs);
  if (prods) memoryProducts = prods;

  dispatchDbChange();

  return {
    users: memoryUsers.length,
    deposits: memoryDeposits.length,
    withdrawals: memoryWithdrawals.length,
    orders: memoryOrders.length,
    resale_listings: memoryResaleListings.length,
    negotiations: memoryNegotiations.length,
    assistant_conversations: memoryAssistantConversations.length,
    transactions: memoryTransactions.length,
    firestoreErrors
  };
}

// ==========================================
// SESSION & AUTHENTICATION
// ==========================================
export function getCurrentUser(): User | null {
  return currentUserRecord ? { ...currentUserRecord } : null;
}

export async function logoutUser(): Promise<void> {
  clearUserScopedListeners();
  clearUserScopedMemory();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out note:', err);
  }
  dispatchDbChange();
}

export function setCurrentUser(userIdOrUser: string | User): User {
  if (typeof userIdOrUser === 'object' && userIdOrUser?.id) {
    const clean = sanitizeUserForFirestore(userIdOrUser);
    currentUserRecord = clean;
    const idx = memoryUsers.findIndex(u => u.id === clean.id);
    if (idx !== -1) memoryUsers[idx] = clean;
    else memoryUsers = [clean, ...memoryUsers];
    dispatchDbChange();
    return clean;
  }
  const found = memoryUsers.find(u => u.id === userIdOrUser);
  if (!found) {
    throw new Error('Sessão de utilizador não encontrada. Inicia sessão novamente.');
  }
  currentUserRecord = found;
  dispatchDbChange();
  return found;
}

function assertAccountApproved(user: User): void {
  if (isAdminUserRecord(user)) return;
  if (user.accountStatus === 'suspenso') {
    throw new Error(
      `A tua conta está suspensa pelo Administrador. Motivo: ${user.suspensionReason || user.rejectionReason || 'Violação das regras da plataforma'}.`
    );
  }
  if (user.accountStatus === 'rejeitado') {
    throw new Error(
      `A validação do teu Bilhete de Identidade foi recusada. Motivo: ${user.rejectionReason || 'Documento ilegível ou inválido'}.`
    );
  }
  if (user.accountStatus !== 'ativo') {
    throw new Error(
      'A tua conta ainda está em análise pelo Administrador. Aguarda a validação do teu Bilhete de Identidade para poderes entrar.'
    );
  }
}

export async function registerUser(
  name: string,
  email: string,
  phone: string,
  password: string,
  province: string,
  city: string,
  idNumber: string,
  birthDate: string,
  idCardFront: string,
  idCardBack: string,
  referredByCode?: string
): Promise<User> {
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = String(phone || '').trim();
  const cleanPass = String(password || '').trim();
  const cleanBI = String(idNumber || '').trim().toUpperCase();

  if (!cleanName || !cleanEmail || !cleanPhone || !cleanPass || !cleanBI) {
    throw new Error('Preenche todos os campos obrigatórios para criar a conta.');
  }
  if (cleanPass.length < 6) {
    throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
  }
  if (!idCardFront || !idCardBack) {
    throw new Error('Anexa ambas as fotografias do Bilhete de Identidade (Frente e Verso).');
  }

  // Resolve optional referral code cleanly before signup
  const cleanRefCode = String(referredByCode || '').trim().toUpperCase();
  let referrerId = '';
  if (cleanRefCode) {
    try {
      const refSnap = await getDoc(doc(firestore, 'referral_codes', cleanRefCode));
      if (refSnap.exists()) {
        referrerId = String(refSnap.data()?.userId || '');
      }
    } catch {}
  }

  // Check if phone or BI already registered via login_hints
  const phoneKey = normalizePhoneKey(cleanPhone);
  if (phoneKey) {
    const existingPhoneHint = await getDoc(doc(firestore, 'login_hints', phoneKey)).catch(() => null);
    if (existingPhoneHint && existingPhoneHint.exists()) {
      throw new Error('Já existe uma conta registada com este número de telefone.');
    }
  }
  const biKey = normalizeBiKey(cleanBI);
  if (biKey) {
    const existingBiHint = await getDoc(doc(firestore, 'login_hints', biKey)).catch(() => null);
    if (existingBiHint && existingBiHint.exists()) {
      throw new Error('Já existe uma conta registada com este Nº de Bilhete de Identidade.');
    }
  }

  isRegisteringTransition = true;
  let createdUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    createdUid = cred.user.uid;
    await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});

    const nowIso = new Date().toISOString();
    const newUser = sanitizeUserForFirestore({
      id: createdUid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      province,
      city,
      role: 'client',
      idNumber: cleanBI,
      birthDate: birthDate || '1997-04-12',
      accountStatus: 'em_processamento',
      idCardFront,
      idCardBack,
      referredBy: referrerId || undefined,
      referralRewardPaid: false,
      createdAt: nowIso
    });

    const initialWallet: Wallet = {
      userId: createdUid,
      availableBalance: 500,
      pendingBalance: 0,
      reservedBalance: 0,
      totalDeposited: 500,
      totalSpent: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      updatedAt: nowIso
    };

    const welcomeTx: Transaction = {
      id: `tx_welcome_${createdUid}`,
      userId: createdUid,
      userName: cleanName,
      type: 'carregamento',
      amount: 500,
      status: 'confirmada',
      reference: `WELCOME-${createdUid.slice(-6).toUpperCase()}`,
      description: 'Bónus de Boas-Vindas BABA SHOPPING (Ativado após validação do BI)',
      paymentMethod: 'bonus_plataforma',
      createdAt: nowIso
    };

    const userNotif: Notification = {
      id: `notif_reg_${Date.now()}_u`,
      recipientId: createdUid,
      title: 'Registo Recebido — BI em Análise 📋',
      message: 'Os teus dados e fotografias do BI foram enviados para o Painel do Administrador. Receberás confirmação assim que a conta for validada.',
      type: 'sistema',
      read: false,
      createdAt: nowIso
    };

    const adminNotif: Notification = {
      id: `notif_reg_${Date.now()}_adm`,
      recipientId: ADMIN_UID,
      title: 'Novo Bilhete de Identidade para Validar 🪪',
      message: `${cleanName} (${province}) submeteu o BI ${cleanBI} e aguarda validação no Painel Adm.`,
      type: 'sistema',
      read: false,
      linkType: 'admin',
      linkId: createdUid,
      createdAt: nowIso
    };

    await persistDocToFirestoreStrict('users', createdUid, newUser, false);
    await persistDocToFirestoreStrict('wallets', createdUid, initialWallet, false);
    await Promise.all([
      persistDocToFirestoreStrict('transactions', welcomeTx.id, welcomeTx, false).catch(() => {}),
      persistDocToFirestoreStrict('notifications', userNotif.id, userNotif, false).catch(() => {}),
      persistDocToFirestoreStrict('notifications', adminNotif.id, adminNotif, false).catch(() => {}),
      publishLoginHints(newUser),
      publishReferralCodeMap(newUser),
      referrerId
        ? persistDocToFirestoreStrict(
            'referrals',
            createdUid,
            {
              id: createdUid,
              referrerId,
              invitedUserId: createdUid,
              invitedName: cleanName,
              invitedProvince: province,
              idNumber: cleanBI,
              status: 'em_processamento',
              rewardPaid: false,
              rewardAmount: 1000,
              createdAt: nowIso
            },
            false
          ).catch(() => {})
        : Promise.resolve()
    ]);

    // Accounts start in 'em_processamento' — sign out until Admin approves BI
    await signOut(auth).catch(() => {});
    clearUserScopedListeners();
    clearUserScopedMemory();
    return newUser;
  } catch (err: any) {
    if (createdUid) {
      await signOut(auth).catch(() => {});
    }
    const code = String(err?.code || '');
    if (code === 'auth/email-already-in-use') {
      throw new Error('Já existe uma conta registada com este endereço de email. Por favor, inicia sessão.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('O endereço de email introduzido é inválido.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('A palavra-passe é demasiado fraca. Usa pelo menos 6 caracteres.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('O método Email/Palavra-passe não está ativado na Consola Firebase (Authentication > Sign-in method).');
    }
    throw new Error(err?.message || 'Não foi possível concluir o registo no Firebase.');
  } finally {
    isRegisteringTransition = false;
  }
}

export async function loginUser(identifier: string, password?: string): Promise<User> {
  const idTerm = String(identifier || '').trim();
  const passTerm = String(password || '').trim();
  if (!idTerm) throw new Error('Insere o teu email, número de telefone ou Nº do BI.');
  if (!passTerm) throw new Error('Por favor, insere a tua palavra-passe.');

  let resolvedEmail = '';
  if (idTerm.includes('@')) {
    resolvedEmail = normalizeEmail(idTerm);
  } else {
    const pKey = normalizePhoneKey(idTerm);
    const bKey = normalizeBiKey(idTerm);
    const tryKeys = [pKey, bKey].filter(Boolean);
    for (const key of tryKeys) {
      try {
        const hintSnap = await getDoc(doc(firestore, 'login_hints', key));
        if (hintSnap.exists() && hintSnap.data()?.email) {
          resolvedEmail = normalizeEmail(String(hintSnap.data()?.email));
          break;
        }
      } catch {}
    }
    if (!resolvedEmail) {
      throw new Error('Conta não encontrada para este número de telefone ou BI. Tenta entrar com o teu email registado.');
    }
  }

  let fbUid = '';
  try {
    const cred = await signInWithEmailAndPassword(auth, resolvedEmail, passTerm);
    fbUid = cred.user.uid;
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
      throw new Error('Email/identificador ou palavra-passe incorretos.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Demasiadas tentativas seguidas. Aguarda alguns instantes e tenta novamente.');
    }
    throw new Error(err?.message || 'Erro ao autenticar no Firebase.');
  }

  if (fbUid === ADMIN_UID) {
    const adminUser = await ensureAdminProfileAndWallet({
      uid: fbUid,
      email: auth.currentUser?.email || resolvedEmail,
      displayName: auth.currentUser?.displayName
    });
    currentUserRecord = adminUser;
    clearUserScopedListeners();
    activeScopedUid = fbUid;
    userScopedUnsubscribes = attachAdminListeners(fbUid);
    await syncAdminCollectionsFromFirestore().catch(() => {});
    dispatchDbChange();
    return adminUser;
  }

  // Regular user: verify not deleted and inspect KYC status
  const [deletedSnap, userSnap] = await Promise.all([
    getDoc(doc(firestore, 'deleted_users', fbUid)).catch(() => null),
    getDoc(doc(firestore, 'users', fbUid))
  ]);

  if (deletedSnap && deletedSnap.exists()) {
    await signOut(auth).catch(() => {});
    throw new Error('Esta conta foi encerrada pelo Administrador da plataforma.');
  }

  if (!userSnap.exists()) {
    await signOut(auth).catch(() => {});
    throw new Error('Registo de perfil não encontrado no Cloud Firestore. Contacta o Administrador.');
  }

  const loadedUser = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(userSnap.id, userSnap.data()));

  try {
    assertAccountApproved(loadedUser);
  } catch (statusErr) {
    await signOut(auth).catch(() => {});
    throw statusErr;
  }

  await Promise.all([publishLoginHints(loadedUser), publishReferralCodeMap(loadedUser)]);
  currentUserRecord = loadedUser;
  clearUserScopedListeners();
  activeScopedUid = fbUid;
  userScopedUnsubscribes =
    loadedUser.role === 'admin' ? attachAdminListeners(fbUid) : attachClientListeners(fbUid);
  dispatchDbChange();
  return loadedUser;
}

// ==========================================
// KYC VALIDATION & USER MANAGEMENT (ADMIN)
// ==========================================
export function getPendingKYCUsers(): User[] {
  return memoryUsers.filter(
    u => !isAdminUserRecord(u) && (u.accountStatus === 'em_processamento' || !u.accountStatus)
  );
}

export function approveKYC(userId: string): User {
  assertAdminCaller();
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado.');
  const existing = memoryUsers[idx];
  const nowIso = new Date().toISOString();

  const updated: User = sanitizeUserForFirestore({
    ...existing,
    accountStatus: 'ativo',
    rejectionReason: '',
    verifiedAt: nowIso
  });

  if (existing.referredBy && !existing.referralRewardPaid) {
    updated.referralRewardPaid = true;
    const inviterId = existing.referredBy;
    const bonus = 1000;
    const inviterBase = memoryWallets[inviterId] || zeroWallet(inviterId);
    const updatedInviterWallet: Wallet = {
      ...inviterBase,
      availableBalance: (Number(inviterBase.availableBalance) || 0) + bonus,
      totalDeposited: (Number(inviterBase.totalDeposited) || 0) + bonus,
      totalEarned: (Number(inviterBase.totalEarned) || 0) + bonus,
      updatedAt: nowIso
    };
    memoryWallets[inviterId] = updatedInviterWallet;
    const refTx: Transaction = {
      id: `tx_ref_${userId}`,
      userId: inviterId,
      userName: memoryUsers.find(u => u.id === inviterId)?.name || 'Parceiro',
      type: 'carregamento',
      amount: bonus,
      status: 'confirmada',
      reference: `REF-${userId.slice(-6).toUpperCase()}`,
      description: `Bónus de Indicação (+1.000 Kz) pela validação do BI de ${existing.name}`,
      paymentMethod: 'bonus_indicacao',
      createdAt: nowIso
    };
    memoryTransactions = [refTx, ...memoryTransactions];
    const refIdx = memoryReferrals.findIndex(r => r.invitedUserId === userId);
    if (refIdx !== -1) {
      memoryReferrals[refIdx] = { ...memoryReferrals[refIdx], status: 'validado', rewardPaid: true };
    }
    createNotification(
      inviterId,
      'Bónus de Convite Creditado (+1.000 Kz)! 🎁',
      `O amigo ${existing.name} que convidaste teve o BI validado! Recebeste +1.000 Kz na tua carteira.`,
      'venda',
      'carteira'
    );
    writeDocToCloudFirestore('wallets', inviterId, updatedInviterWallet, true).catch(() => {});
    writeDocToCloudFirestore('transactions', refTx.id, refTx, false).catch(() => {});
    writeDocToCloudFirestore(
      'referrals',
      userId,
      { status: 'validado', rewardPaid: true },
      true
    ).catch(() => {});
  }

  memoryUsers[idx] = updated;
  createNotification(
    userId,
    'Conta & Bilhete Validados! ✅',
    'O teu Bilhete de Identidade foi aprovado pelo Administrador. A tua conta BABA SHOPPING está ativa!',
    'sistema',
    'carteira'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('users', userId, updated, true).catch(() => {});
  return updated;
}

export async function approveKYCAsync(userId: string): Promise<User> {
  assertAdminCaller();
  const userSnap = await getDoc(doc(firestore, 'users', userId));
  if (!userSnap.exists()) {
    throw new Error('Utilizador não encontrado no Cloud Firestore.');
  }
  const existing = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(userSnap.id, userSnap.data()));
  const nowIso = new Date().toISOString();
  const updated: User = sanitizeUserForFirestore({
    ...existing,
    accountStatus: 'ativo',
    rejectionReason: '',
    verifiedAt: nowIso
  });

  if (existing.referredBy && !existing.referralRewardPaid) {
    updated.referralRewardPaid = true;
    const inviterId = existing.referredBy;
    const bonus = 1000;
    const inviterWalletSnap = await getDoc(doc(firestore, 'wallets', inviterId)).catch(() => null);
    const inviterBase: Wallet =
      inviterWalletSnap && inviterWalletSnap.exists()
        ? { ...zeroWallet(inviterId), ...(inviterWalletSnap.data() as Wallet), userId: inviterId }
        : memoryWallets[inviterId] || zeroWallet(inviterId);
    const updatedInviterWallet: Wallet = {
      ...inviterBase,
      availableBalance: (Number(inviterBase.availableBalance) || 0) + bonus,
      totalDeposited: (Number(inviterBase.totalDeposited) || 0) + bonus,
      totalEarned: (Number(inviterBase.totalEarned) || 0) + bonus,
      updatedAt: nowIso
    };
    memoryWallets[inviterId] = updatedInviterWallet;
    await persistDocToFirestoreStrict('wallets', inviterId, updatedInviterWallet, true);

    const refTx: Transaction = {
      id: `tx_ref_${userId}`,
      userId: inviterId,
      userName: memoryUsers.find(u => u.id === inviterId)?.name || 'Parceiro',
      type: 'carregamento',
      amount: bonus,
      status: 'confirmada',
      reference: `REF-${userId.slice(-6).toUpperCase()}`,
      description: `Bónus de Indicação (+1.000 Kz) pela validação do BI de ${existing.name}`,
      paymentMethod: 'bonus_indicacao',
      createdAt: nowIso
    };
    await persistDocToFirestoreStrict('transactions', refTx.id, refTx, false);
    await persistDocToFirestoreStrict(
      'referrals',
      userId,
      { status: 'validado', rewardPaid: true },
      true
    ).catch(() => {});

    createNotification(
      inviterId,
      'Bónus de Convite Creditado (+1.000 Kz)! 🎁',
      `O amigo ${existing.name} que convidaste teve o BI validado! Recebeste +1.000 Kz na tua carteira.`,
      'venda',
      'carteira'
    );
  }

  await persistDocToFirestoreStrict('users', userId, updated, true);
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx !== -1) memoryUsers[idx] = updated;
  else memoryUsers = [updated, ...memoryUsers];

  createNotification(
    userId,
    'Conta & Bilhete Validados! ✅',
    'O teu Bilhete de Identidade foi aprovado pelo Administrador. A tua conta BABA SHOPPING está ativa!',
    'sistema',
    'carteira'
  );
  dispatchDbChange();
  return updated;
}

export function rejectKYC(userId: string, reason: string): User {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Documento ilegível ou inválido.';
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado.');
  const updated: User = sanitizeUserForFirestore({
    ...memoryUsers[idx],
    accountStatus: 'rejeitado',
    rejectionReason: cleanReason
  });
  memoryUsers[idx] = updated;
  createNotification(
    userId,
    'Validação de BI Recusada ❌',
    `O teu Bilhete de Identidade não foi aceite. Motivo: ${cleanReason}`,
    'sistema'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('users', userId, updated, true).catch(() => {});
  writeDocToCloudFirestore('referrals', userId, { status: 'rejeitado' }, true).catch(() => {});
  return updated;
}

export async function rejectKYCAsync(userId: string, reason: string): Promise<User> {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Documento ilegível ou inválido.';
  const userSnap = await getDoc(doc(firestore, 'users', userId));
  if (!userSnap.exists()) throw new Error('Utilizador não encontrado no Cloud Firestore.');
  const existing = sanitizeUserForFirestore(normalizeFirestoreDoc<User>(userSnap.id, userSnap.data()));
  const updated: User = sanitizeUserForFirestore({
    ...existing,
    accountStatus: 'rejeitado',
    rejectionReason: cleanReason
  });
  await persistDocToFirestoreStrict('users', userId, updated, true);
  await persistDocToFirestoreStrict('referrals', userId, { status: 'rejeitado' }, true).catch(() => {});
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx !== -1) memoryUsers[idx] = updated;
  createNotification(
    userId,
    'Validação de BI Recusada ❌',
    `O teu Bilhete de Identidade não foi aceite. Motivo: ${cleanReason}`,
    'sistema'
  );
  dispatchDbChange();
  return updated;
}

export function resubmitKYCDocuments(
  userId: string,
  idCardFront: string,
  idCardBack: string,
  idNumber?: string
): User {
  const idx = memoryUsers.findIndex(u => u.id === userId);
  const base = idx !== -1 ? memoryUsers[idx] : currentUserRecord;
  if (!base || base.id !== userId) throw new Error('Utilizador não encontrado.');
  const updated: User = sanitizeUserForFirestore({
    ...base,
    idCardFront,
    idCardBack,
    idNumber: (idNumber || base.idNumber || '').trim().toUpperCase(),
    accountStatus: 'em_processamento',
    rejectionReason: ''
  });
  if (idx !== -1) memoryUsers[idx] = updated;
  if (currentUserRecord?.id === userId) currentUserRecord = updated;
  dispatchDbChange();
  writeDocToCloudFirestore('users', userId, updated, true).catch(() => {});
  return updated;
}

export function suspendUser(userId: string, reason?: string): User {
  assertAdminCaller();
  if (userId === ADMIN_UID) throw new Error('Não é possível suspender o Administrador Principal.');
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado.');
  const cleanReason = (reason || '').trim() || 'Suspensão administrativa.';
  const updated: User = sanitizeUserForFirestore({
    ...memoryUsers[idx],
    accountStatus: 'suspenso',
    suspensionReason: cleanReason,
    rejectionReason: cleanReason
  });
  memoryUsers[idx] = updated;
  createNotification(
    userId,
    'Conta Suspensa Temporariamente ⚠️',
    `A tua conta foi suspensa. Motivo: ${cleanReason}`,
    'sistema'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('users', userId, updated, true).catch(() => {});
  return updated;
}

export function reactivateUser(userId: string): User {
  assertAdminCaller();
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado.');
  const updated: User = sanitizeUserForFirestore({
    ...memoryUsers[idx],
    accountStatus: 'ativo',
    suspensionReason: '',
    rejectionReason: ''
  });
  memoryUsers[idx] = updated;
  createNotification(
    userId,
    'Conta Reativada ✅',
    'A tua conta BABA SHOPPING foi reativada pelo Administrador.',
    'sistema'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('users', userId, updated, true).catch(() => {});
  return updated;
}

export function deleteUserAccount(userId: string): void {
  assertAdminCaller();
  if (userId === ADMIN_UID) throw new Error('Não é possível apagar a conta do Administrador Principal.');
  const target = memoryUsers.find(u => u.id === userId);
  const deletedMeta = {
    id: userId,
    name: target?.name || '',
    email: target?.email || '',
    deletedAt: new Date().toISOString()
  };
  memoryDeletedUsers[userId] = deletedMeta;
  memoryUsers = memoryUsers.filter(u => u.id !== userId);
  delete memoryWallets[userId];
  dispatchDbChange();

  writeDocToCloudFirestore('deleted_users', userId, deletedMeta, false).catch(() => {});
  deleteDoc(doc(firestore, 'users', userId)).catch(() => {});
  deleteDoc(doc(firestore, 'wallets', userId)).catch(() => {});
}

// ==========================================
// WALLETS & TRANSACTIONS
// ==========================================
export function getWallets(): Record<string, Wallet> {
  return { ...memoryWallets };
}

export function getWallet(userId: string): Wallet {
  return memoryWallets[userId] ? { ...memoryWallets[userId] } : zeroWallet(userId);
}

export function getPendingReservedAmount(userId: string): number {
  const pendingWithdrawals = memoryWithdrawals
    .filter(w => w && w.userId === userId && w.status === 'pendente')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const pendingOrders = memoryOrders
    .filter(o => o && o.buyerId === userId && o.status === 'aguardando_aprovacao')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  return pendingWithdrawals + pendingOrders;
}

export function getSpendableBalance(userId: string): number {
  const wallet = getWallet(userId);
  return Math.max(0, (Number(wallet.availableBalance) || 0) - getPendingReservedAmount(userId));
}

export function getAllTransactions(): Transaction[] {
  return [...memoryTransactions];
}

export function getTransactions(userId: string): Transaction[] {
  return memoryTransactions.filter(t => t.userId === userId);
}

export function adjustUserBalance(
  userId: string,
  amount: number,
  type: 'add' | 'remove',
  reason: string,
  adminId: string = ADMIN_UID
): { wallet: Wallet; transaction: Transaction } {
  assertAdminCaller();
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Montante inválido para ajuste.');
  }
  const user = memoryUsers.find(u => u.id === userId);
  const base = getWallet(userId);
  const nowIso = new Date().toISOString();

  if (type === 'remove' && base.availableBalance < numericAmount) {
    throw new Error('Saldo disponível insuficiente para debitar este montante.');
  }

  const updatedWallet: Wallet = {
    ...base,
    availableBalance:
      type === 'add'
        ? (Number(base.availableBalance) || 0) + numericAmount
        : Math.max(0, (Number(base.availableBalance) || 0) - numericAmount),
    totalDeposited:
      type === 'add' ? (Number(base.totalDeposited) || 0) + numericAmount : Number(base.totalDeposited) || 0,
    totalWithdrawn:
      type === 'remove' ? (Number(base.totalWithdrawn) || 0) + numericAmount : Number(base.totalWithdrawn) || 0,
    updatedAt: nowIso
  };
  memoryWallets[userId] = updatedWallet;

  const tx: Transaction = {
    id: `tx_adj_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    userId,
    userName: user?.name || 'Cliente',
    type: type === 'add' ? 'carregamento' : 'levantamento',
    amount: type === 'add' ? numericAmount : -numericAmount,
    status: 'confirmada',
    reference: `ADM-${adminId.slice(-4).toUpperCase()}-${Date.now().toString().slice(-5)}`,
    description: `${type === 'add' ? 'Crédito' : 'Débito'} Administrativo: ${reason}`,
    paymentMethod: 'ajuste_administrativo',
    createdAt: nowIso
  };
  memoryTransactions = [tx, ...memoryTransactions];

  createNotification(
    userId,
    type === 'add' ? 'Saldo Adicionado na Carteira 💰' : 'Ajuste de Saldo Efetuado',
    `${type === 'add' ? 'Foram creditados' : 'Foram debitados'} ${formatMoney(numericAmount)} na tua carteira. Nota: ${reason}`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  writeDocToCloudFirestore('wallets', userId, updatedWallet, true).catch(() => {});
  writeDocToCloudFirestore('transactions', tx.id, tx, false).catch(() => {});
  return { wallet: updatedWallet, transaction: tx };
}

// ==========================================
// DEPOSITS & WITHDRAWALS
// ==========================================
export function getDeposits(): DepositRequest[] {
  return [...memoryDeposits];
}

export function getWithdrawals(): WithdrawalRequest[] {
  return [...memoryWithdrawals];
}

export function requestDeposit(
  userId: string,
  amount: number,
  paymentMethod: string,
  reference: string,
  _autoApprove = false,
  receiptProof?: string
): DepositRequest {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Insere um valor de depósito válido em Kz.');
  }
  const cleanRef = String(reference || '').trim() || `REF-${Date.now().toString().slice(-6)}`;
  const user = memoryUsers.find(u => u.id === userId) || (currentUserRecord?.id === userId ? currentUserRecord : null);
  const nowIso = new Date().toISOString();
  const depId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const dep: DepositRequest = {
    id: depId,
    userId,
    userName: user?.name || 'Cliente BABA',
    amount: numericAmount,
    paymentMethod: paymentMethod || 'multicaixa_express',
    reference: cleanRef,
    receiptProof: receiptProof || undefined,
    status: 'pendente',
    createdAt: nowIso
  };

  const pendingTx: Transaction = {
    id: `tx_dep_${depId}`,
    userId,
    userName: dep.userName,
    type: 'carregamento',
    amount: numericAmount,
    status: 'pendente',
    reference: cleanRef,
    description: `Carregamento de Carteira (${dep.paymentMethod}) — Aguardando Aprovação`,
    paymentMethod: dep.paymentMethod,
    createdAt: nowIso
  };

  memoryDeposits = [dep, ...memoryDeposits];
  memoryTransactions = [pendingTx, ...memoryTransactions];

  createNotification(
    ADMIN_UID,
    'Novo Pedido de Depósito 💰',
    `${dep.userName} solicitou carregamento de ${formatMoney(numericAmount)} (Ref: ${cleanRef}).`,
    'sistema',
    'admin',
    depId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('deposits', depId, dep, false).catch(() => {});
  writeDocToCloudFirestore('transactions', pendingTx.id, pendingTx, false).catch(() => {});
  return dep;
}

export function approveDeposit(depositId: string): DepositRequest {
  assertAdminCaller();
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de depósito não encontrado.');
  const existing = memoryDeposits[idx];
  if (existing.status !== 'pendente') return existing;

  const nowIso = new Date().toISOString();
  const updated: DepositRequest = { ...existing, status: 'aprovado' };
  memoryDeposits[idx] = updated;

  const baseWallet = getWallet(existing.userId);
  const updatedWallet: Wallet = {
    ...baseWallet,
    availableBalance: (Number(baseWallet.availableBalance) || 0) + Number(existing.amount),
    totalDeposited: (Number(baseWallet.totalDeposited) || 0) + Number(existing.amount),
    updatedAt: nowIso
  };
  memoryWallets[existing.userId] = updatedWallet;

  const txId = `tx_dep_${existing.id}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === txId);
  const confirmedTx: Transaction =
    txIdx !== -1
      ? {
          ...memoryTransactions[txIdx],
          status: 'confirmada',
          description: `Carregamento Aprovado (${existing.paymentMethod})`
        }
      : {
          id: txId,
          userId: existing.userId,
          userName: existing.userName,
          type: 'carregamento',
          amount: Number(existing.amount),
          status: 'confirmada',
          reference: existing.reference,
          description: `Carregamento Aprovado (${existing.paymentMethod})`,
          paymentMethod: existing.paymentMethod,
          createdAt: existing.createdAt || nowIso
        };
  if (txIdx !== -1) memoryTransactions[txIdx] = confirmedTx;
  else memoryTransactions = [confirmedTx, ...memoryTransactions];

  createNotification(
    existing.userId,
    'Depósito Aprovado & Creditado! ✅',
    `O teu carregamento de ${formatMoney(existing.amount)} (Ref: ${existing.reference}) foi validado e creditado na carteira.`,
    'compra',
    'carteira'
  );

  dispatchDbChange();
  writeDocToCloudFirestore('deposits', depositId, updated, true).catch(() => {});
  writeDocToCloudFirestore('wallets', existing.userId, updatedWallet, true).catch(() => {});
  writeDocToCloudFirestore('transactions', confirmedTx.id, confirmedTx, true).catch(() => {});
  return updated;
}

export async function approveDepositAsync(depositId: string): Promise<DepositRequest> {
  assertAdminCaller();
  const depSnap = await getDoc(doc(firestore, 'deposits', depositId));
  if (!depSnap.exists()) throw new Error('Pedido de depósito não encontrado no Cloud Firestore.');
  const existing = normalizeFirestoreDoc<DepositRequest>(depSnap.id, depSnap.data());
  if (existing.status !== 'pendente') return existing;

  const nowIso = new Date().toISOString();
  const updated: DepositRequest = { ...existing, status: 'aprovado' };

  const walletSnap = await getDoc(doc(firestore, 'wallets', existing.userId)).catch(() => null);
  const baseWallet: Wallet =
    walletSnap && walletSnap.exists()
      ? { ...zeroWallet(existing.userId), ...(walletSnap.data() as Wallet), userId: existing.userId }
      : getWallet(existing.userId);

  const updatedWallet: Wallet = {
    ...baseWallet,
    availableBalance: (Number(baseWallet.availableBalance) || 0) + Number(existing.amount),
    totalDeposited: (Number(baseWallet.totalDeposited) || 0) + Number(existing.amount),
    updatedAt: nowIso
  };

  const txId = `tx_dep_${existing.id}`;
  const confirmedTx: Transaction = {
    id: txId,
    userId: existing.userId,
    userName: existing.userName,
    type: 'carregamento',
    amount: Number(existing.amount),
    status: 'confirmada',
    reference: existing.reference,
    description: `Carregamento Aprovado (${existing.paymentMethod})`,
    paymentMethod: existing.paymentMethod,
    createdAt: existing.createdAt || nowIso
  };

  await persistDocToFirestoreStrict('deposits', depositId, updated, true);
  await persistDocToFirestoreStrict('wallets', existing.userId, updatedWallet, true);
  await persistDocToFirestoreStrict('transactions', txId, confirmedTx, true).catch(() => {});

  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx !== -1) memoryDeposits[idx] = updated;
  memoryWallets[existing.userId] = updatedWallet;

  createNotification(
    existing.userId,
    'Depósito Aprovado & Creditado! ✅',
    `O teu carregamento de ${formatMoney(existing.amount)} (Ref: ${existing.reference}) foi validado e creditado na carteira.`,
    'compra',
    'carteira'
  );
  dispatchDbChange();
  return updated;
}

export function rejectDeposit(depositId: string, reason?: string): DepositRequest {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Comprovativo inválido ou referência não localizada.';
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de depósito não encontrado.');
  const existing = memoryDeposits[idx];
  if (existing.status !== 'pendente') return existing;

  const updated: DepositRequest = { ...existing, status: 'rejeitado', rejectionReason: cleanReason };
  memoryDeposits[idx] = updated;

  const txId = `tx_dep_${existing.id}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === txId);
  if (txIdx !== -1) {
    memoryTransactions[txIdx] = {
      ...memoryTransactions[txIdx],
      status: 'recusada',
      rejectionReason: cleanReason,
      description: `Depósito Recusado — Motivo: ${cleanReason}`
    };
    writeDocToCloudFirestore('transactions', txId, memoryTransactions[txIdx], true).catch(() => {});
  }

  createNotification(
    existing.userId,
    'Depósito Não Aprovado ❌',
    `O teu carregamento de ${formatMoney(existing.amount)} foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  writeDocToCloudFirestore('deposits', depositId, updated, true).catch(() => {});
  return updated;
}

export async function rejectDepositAsync(depositId: string, reason?: string): Promise<DepositRequest> {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Comprovativo inválido ou referência não localizada.';
  const depSnap = await getDoc(doc(firestore, 'deposits', depositId));
  if (!depSnap.exists()) throw new Error('Pedido de depósito não encontrado no Cloud Firestore.');
  const existing = normalizeFirestoreDoc<DepositRequest>(depSnap.id, depSnap.data());
  if (existing.status !== 'pendente') return existing;

  const updated: DepositRequest = { ...existing, status: 'rejeitado', rejectionReason: cleanReason };
  await persistDocToFirestoreStrict('deposits', depositId, updated, true);

  const txId = `tx_dep_${existing.id}`;
  await persistDocToFirestoreStrict(
    'transactions',
    txId,
    {
      id: txId,
      userId: existing.userId,
      userName: existing.userName,
      type: 'carregamento',
      amount: Number(existing.amount),
      status: 'recusada',
      reference: existing.reference,
      rejectionReason: cleanReason,
      description: `Depósito Recusado — Motivo: ${cleanReason}`,
      createdAt: existing.createdAt
    },
    true
  ).catch(() => {});

  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx !== -1) memoryDeposits[idx] = updated;
  createNotification(
    existing.userId,
    'Depósito Não Aprovado ❌',
    `O teu carregamento de ${formatMoney(existing.amount)} foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'carteira'
  );
  dispatchDbChange();
  return updated;
}

export function requestWithdrawal(
  userId: string,
  amount: number,
  iban: string,
  bankName: string,
  accountHolder?: string
): WithdrawalRequest {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor, insere um valor de levantamento superior a 0 Kz.');
  }
  const cleanIban = String(iban || '').trim();
  if (cleanIban.length < 5) {
    throw new Error('Por favor, insere um IBAN angolano válido.');
  }
  const spendable = getSpendableBalance(userId);
  if (numericAmount > spendable) {
    throw new Error(`Saldo disponível insuficiente. Podes levantar até ${formatMoney(spendable)}.`);
  }

  const user = memoryUsers.find(u => u.id === userId) || (currentUserRecord?.id === userId ? currentUserRecord : null);
  const nowIso = new Date().toISOString();
  const wthId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const withdrawal: WithdrawalRequest = {
    id: wthId,
    userId,
    userName: user?.name || 'Cliente BABA',
    amount: numericAmount,
    bankName: String(bankName || 'Banco Angolano').trim(),
    iban: cleanIban,
    accountHolder: String(accountHolder || user?.name || 'Titular').trim(),
    status: 'pendente',
    createdAt: nowIso
  };

  const pendingTx: Transaction = {
    id: `tx_wth_${wthId}`,
    userId,
    userName: withdrawal.userName,
    type: 'levantamento',
    amount: -numericAmount,
    status: 'pendente',
    reference: `SAQ-${wthId.slice(-6).toUpperCase()}`,
    description: `Pedido de Levantamento para ${withdrawal.bankName} — Aguardando Adm`,
    paymentMethod: 'transferencia_iban',
    createdAt: nowIso
  };

  memoryWithdrawals = [withdrawal, ...memoryWithdrawals];
  memoryTransactions = [pendingTx, ...memoryTransactions];

  createNotification(
    ADMIN_UID,
    'Novo Pedido de Levantamento 🏦',
    `${withdrawal.userName} solicitou levantamento de ${formatMoney(numericAmount)} (${withdrawal.bankName}).`,
    'sistema',
    'admin',
    wthId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('withdrawals', wthId, withdrawal, false).catch(() => {});
  writeDocToCloudFirestore('transactions', pendingTx.id, pendingTx, false).catch(() => {});
  return withdrawal;
}

export function processWithdrawal(
  withdrawalId: string,
  status: 'processado' | 'rejeitado',
  reason?: string
): WithdrawalRequest {
  assertAdminCaller();
  const idx = memoryWithdrawals.findIndex(w => w.id === withdrawalId);
  if (idx === -1) throw new Error('Pedido de levantamento não encontrado.');
  const existing = memoryWithdrawals[idx];
  if (existing.status !== 'pendente') return existing;

  const nowIso = new Date().toISOString();
  const cleanReason = (reason || '').trim() || 'Dados bancários inválidos ou pedido recusado.';

  if (status === 'processado') {
    const baseWallet = getWallet(existing.userId);
    if (baseWallet.availableBalance < Number(existing.amount)) {
      throw new Error('Saldo disponível do cliente insuficiente para processar este levantamento.');
    }
    const updatedWallet: Wallet = {
      ...baseWallet,
      availableBalance: Math.max(0, (Number(baseWallet.availableBalance) || 0) - Number(existing.amount)),
      totalWithdrawn: (Number(baseWallet.totalWithdrawn) || 0) + Number(existing.amount),
      updatedAt: nowIso
    };
    memoryWallets[existing.userId] = updatedWallet;
    writeDocToCloudFirestore('wallets', existing.userId, updatedWallet, true).catch(() => {});
  }

  const updated: WithdrawalRequest = {
    ...existing,
    status,
    rejectionReason: status === 'rejeitado' ? cleanReason : ''
  };
  memoryWithdrawals[idx] = updated;

  const txId = `tx_wth_${existing.id}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === txId);
  if (txIdx !== -1) {
    memoryTransactions[txIdx] = {
      ...memoryTransactions[txIdx],
      status: status === 'processado' ? 'confirmada' : 'recusada',
      rejectionReason: status === 'rejeitado' ? cleanReason : undefined,
      description:
        status === 'processado'
          ? `Levantamento Pago para ${existing.bankName}`
          : `Levantamento Recusado — Motivo: ${cleanReason}`
    };
    writeDocToCloudFirestore('transactions', txId, memoryTransactions[txIdx], true).catch(() => {});
  }

  createNotification(
    existing.userId,
    status === 'processado' ? 'Levantamento Processado & Pago! 💸' : 'Levantamento Recusado ❌',
    status === 'processado'
      ? `A transferência de ${formatMoney(existing.amount)} para o teu IBAN (${existing.bankName}) foi confirmada!`
      : `O teu pedido de levantamento de ${formatMoney(existing.amount)} foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  writeDocToCloudFirestore('withdrawals', withdrawalId, updated, true).catch(() => {});
  return updated;
}

export async function processWithdrawalAsync(
  withdrawalId: string,
  status: 'processado' | 'rejeitado',
  reason?: string
): Promise<WithdrawalRequest> {
  assertAdminCaller();
  const wSnap = await getDoc(doc(firestore, 'withdrawals', withdrawalId));
  if (!wSnap.exists()) throw new Error('Pedido de levantamento não encontrado no Cloud Firestore.');
  const existing = normalizeFirestoreDoc<WithdrawalRequest>(wSnap.id, wSnap.data());
  if (existing.status !== 'pendente') return existing;

  const nowIso = new Date().toISOString();
  const cleanReason = (reason || '').trim() || 'Dados bancários inválidos ou pedido recusado.';

  if (status === 'processado') {
    const walletSnap = await getDoc(doc(firestore, 'wallets', existing.userId)).catch(() => null);
    const baseWallet: Wallet =
      walletSnap && walletSnap.exists()
        ? { ...zeroWallet(existing.userId), ...(walletSnap.data() as Wallet), userId: existing.userId }
        : getWallet(existing.userId);
    if (baseWallet.availableBalance < Number(existing.amount)) {
      throw new Error('Saldo disponível do cliente insuficiente para processar este levantamento.');
    }
    const updatedWallet: Wallet = {
      ...baseWallet,
      availableBalance: Math.max(0, (Number(baseWallet.availableBalance) || 0) - Number(existing.amount)),
      totalWithdrawn: (Number(baseWallet.totalWithdrawn) || 0) + Number(existing.amount),
      updatedAt: nowIso
    };
    memoryWallets[existing.userId] = updatedWallet;
    await persistDocToFirestoreStrict('wallets', existing.userId, updatedWallet, true);
  }

  const updated: WithdrawalRequest = {
    ...existing,
    status,
    rejectionReason: status === 'rejeitado' ? cleanReason : ''
  };
  await persistDocToFirestoreStrict('withdrawals', withdrawalId, updated, true);

  const txId = `tx_wth_${existing.id}`;
  await persistDocToFirestoreStrict(
    'transactions',
    txId,
    {
      id: txId,
      userId: existing.userId,
      userName: existing.userName,
      type: 'levantamento',
      amount: -Number(existing.amount),
      status: status === 'processado' ? 'confirmada' : 'recusada',
      reference: `SAQ-${existing.id.slice(-6).toUpperCase()}`,
      rejectionReason: status === 'rejeitado' ? cleanReason : undefined,
      description:
        status === 'processado'
          ? `Levantamento Pago para ${existing.bankName}`
          : `Levantamento Recusado — Motivo: ${cleanReason}`,
      createdAt: existing.createdAt
    },
    true
  ).catch(() => {});

  const idx = memoryWithdrawals.findIndex(w => w.id === withdrawalId);
  if (idx !== -1) memoryWithdrawals[idx] = updated;

  createNotification(
    existing.userId,
    status === 'processado' ? 'Levantamento Processado & Pago! 💸' : 'Levantamento Recusado ❌',
    status === 'processado'
      ? `A transferência de ${formatMoney(existing.amount)} para o teu IBAN (${existing.bankName}) foi confirmada!`
      : `O teu pedido de levantamento de ${formatMoney(existing.amount)} foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'carteira'
  );
  dispatchDbChange();
  return updated;
}

// ==========================================
// USER PRODUCTS & RESALE MARKETPLACE P2P
// ==========================================
export function getUserProducts(userId: string): UserProduct[] {
  return memoryUserProducts.filter(p => p.currentOwnerId === userId);
}

export function getAllResaleListings(): ResaleListing[] {
  return [...memoryResaleListings];
}

export function getResaleListings(): ResaleListing[] {
  return memoryResaleListings.filter(l => l.status === 'ativo');
}

export function createResaleListing(
  userProductId: string,
  sellerId: string,
  listingPrice: number,
  customDescription: string,
  minAcceptablePrice = 0,
  allowNegotiation = true
): ResaleListing {
  const numericListingPrice = Number(listingPrice);
  if (!Number.isFinite(numericListingPrice) || numericListingPrice <= 0) {
    throw new Error('Insere um preço de revenda superior a 0 Kz.');
  }
  const upIdx = memoryUserProducts.findIndex(up => up.id === userProductId && up.currentOwnerId === sellerId);
  if (upIdx === -1) throw new Error('Produto não encontrado no teu inventário.');
  const userProd = memoryUserProducts[upIdx];
  if (userProd.status !== 'disponivel') {
    throw new Error('Este artigo já se encontra anunciado ou vendido.');
  }

  const seller = memoryUsers.find(u => u.id === sellerId) || (currentUserRecord?.id === sellerId ? currentUserRecord : null);
  const nowIso = new Date().toISOString();
  const listingId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const listing: ResaleListing = {
    id: listingId,
    userProductId,
    sellerId,
    sellerName: seller?.name || 'Revendedor BABA',
    productName: userProd.productName,
    category: userProd.category,
    imageUrl: userProd.productImage,
    originalPrice: userProd.purchasePrice ?? userProd.originalPrice,
    listingPrice: numericListingPrice,
    customDescription: String(customDescription || '').trim() || `Artigo verificado BABA SHOPPING disponível para revenda.`,
    status: 'ativo',
    allowNegotiation,
    minAcceptablePrice: Number(minAcceptablePrice) > 0 ? Number(minAcceptablePrice) : numericListingPrice,
    resaleCycle: (userProd.resaleCycle || 0) + 1,
    colors: userProd.colors,
    selectedColor: userProd.selectedColor,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  memoryUserProducts[upIdx] = { ...userProd, status: 'anunciado' };
  resalePublicMap.set(listing.id, listing);
  resaleOwnedMap.set(listing.id, listing);
  rebuildResaleListingsFromMaps();

  dispatchDbChange();
  writeDocToCloudFirestore('user_products', userProd.id, memoryUserProducts[upIdx], true).catch(() => {});
  writeDocToCloudFirestore('resale_listings', listing.id, listing, false).catch(() => {});
  return listing;
}

export function approveResaleListing(listingId: string): ResaleListing {
  assertAdminCaller();
  const idx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (idx === -1) throw new Error('Anúncio não encontrado.');
  const updated: ResaleListing = {
    ...memoryResaleListings[idx],
    status: 'ativo',
    rejectionReason: '',
    updatedAt: new Date().toISOString()
  };
  resalePublicMap.set(updated.id, updated);
  resaleOwnedMap.set(updated.id, updated);
  rebuildResaleListingsFromMaps();
  dispatchDbChange();
  writeDocToCloudFirestore('resale_listings', listingId, updated, true).catch(() => {});
  return updated;
}

export async function approveResaleListingAsync(listingId: string): Promise<ResaleListing> {
  assertAdminCaller();
  const snap = await getDoc(doc(firestore, 'resale_listings', listingId));
  if (!snap.exists()) throw new Error('Anúncio não encontrado no Cloud Firestore.');
  const existing = normalizeFirestoreDoc<ResaleListing>(snap.id, snap.data());
  const updated: ResaleListing = {
    ...existing,
    status: 'ativo',
    rejectionReason: '',
    updatedAt: new Date().toISOString()
  };
  await persistDocToFirestoreStrict('resale_listings', listingId, updated, true);
  resalePublicMap.set(updated.id, updated);
  resaleOwnedMap.set(updated.id, updated);
  rebuildResaleListingsFromMaps();
  dispatchDbChange();
  return updated;
}

export function rejectResaleListing(listingId: string, reason: string): ResaleListing {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Anúncio não aprovado pela moderação.';
  const idx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (idx === -1) throw new Error('Anúncio não encontrado.');
  const existing = memoryResaleListings[idx];
  const updated: ResaleListing = {
    ...existing,
    status: 'rejeitado',
    rejectionReason: cleanReason,
    updatedAt: new Date().toISOString()
  };
  resalePublicMap.delete(updated.id);
  resaleOwnedMap.set(updated.id, updated);
  rebuildResaleListingsFromMaps();

  const upIdx = memoryUserProducts.findIndex(up => up.id === existing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx] = { ...memoryUserProducts[upIdx], status: 'disponivel' };
    writeDocToCloudFirestore('user_products', memoryUserProducts[upIdx].id, memoryUserProducts[upIdx], true).catch(() => {});
  }

  createNotification(
    existing.sellerId,
    'Anúncio Não Aprovado ❌',
    `O teu anúncio "${existing.productName}" foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'produto'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('resale_listings', listingId, updated, true).catch(() => {});
  return updated;
}

export async function rejectResaleListingAsync(listingId: string, reason: string): Promise<ResaleListing> {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Anúncio não aprovado pela moderação.';
  const snap = await getDoc(doc(firestore, 'resale_listings', listingId));
  if (!snap.exists()) throw new Error('Anúncio não encontrado no Cloud Firestore.');
  const existing = normalizeFirestoreDoc<ResaleListing>(snap.id, snap.data());
  const updated: ResaleListing = {
    ...existing,
    status: 'rejeitado',
    rejectionReason: cleanReason,
    updatedAt: new Date().toISOString()
  };
  await persistDocToFirestoreStrict('resale_listings', listingId, updated, true);
  await updateDoc(doc(firestore, 'user_products', existing.userProductId), { status: 'disponivel' }).catch(() => {});
  resalePublicMap.delete(updated.id);
  resaleOwnedMap.set(updated.id, updated);
  rebuildResaleListingsFromMaps();

  createNotification(
    existing.sellerId,
    'Anúncio Não Aprovado ❌',
    `O teu anúncio "${existing.productName}" foi recusado. Motivo: ${cleanReason}`,
    'sistema',
    'produto'
  );
  dispatchDbChange();
  return updated;
}

export function cancelResaleListing(listingId: string, sellerId: string): void {
  const listing = memoryResaleListings.find(l => l.id === listingId && l.sellerId === sellerId);
  if (!listing) throw new Error('Anúncio não encontrado ou sem permissão.');

  const updated: ResaleListing = {
    ...listing,
    status: 'pausado',
    updatedAt: new Date().toISOString()
  };
  resalePublicMap.delete(updated.id);
  resaleOwnedMap.set(updated.id, updated);
  rebuildResaleListingsFromMaps();

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx] = { ...memoryUserProducts[upIdx], status: 'disponivel' };
    writeDocToCloudFirestore('user_products', memoryUserProducts[upIdx].id, memoryUserProducts[upIdx], true).catch(() => {});
  }

  dispatchDbChange();
  writeDocToCloudFirestore('resale_listings', listingId, updated, true).catch(() => {});
}

async function creditSellerWalletInFirestore(sellerId: string, amount: number, nowIso: string): Promise<void> {
  try {
    const ref = doc(firestore, 'wallets', sellerId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Wallet;
      const nextAvail = (Number(data.availableBalance) || 0) + amount;
      const nextEarned = (Number(data.totalEarned) || 0) + amount;
      await updateDoc(ref, {
        availableBalance: nextAvail,
        totalEarned: nextEarned,
        updatedAt: nowIso
      });
    } else if (auth.currentUser?.uid === ADMIN_UID) {
      await setDoc(ref, {
        ...zeroWallet(sellerId),
        availableBalance: amount,
        totalEarned: amount,
        updatedAt: nowIso
      });
    }
  } catch (err) {
    console.warn('Credit seller wallet note:', err);
  }
}

function executeConfirmedResaleSettlement(
  listing: ResaleListing,
  buyerId: string,
  paidPrice: number,
  existingOrder?: Order
): Order {
  const nowIso = new Date().toISOString();
  const buyerWallet: Wallet = {
    ...getWallet(buyerId),
    updatedAt: nowIso
  };
  if (buyerWallet.availableBalance < paidPrice) {
    throw new Error(
      `Saldo insuficiente na carteira de ${existingOrder?.buyerName || 'comprador'} (${formatMoney(buyerWallet.availableBalance)}) para concluir a compra de ${formatMoney(paidPrice)}.`
    );
  }

  const buyerUser =
    memoryUsers.find(u => u.id === buyerId) || (currentUserRecord?.id === buyerId ? currentUserRecord : null);
  const sellerUser = memoryUsers.find(u => u.id === listing.sellerId);

  buyerWallet.availableBalance -= paidPrice;
  buyerWallet.totalSpent += paidPrice;
  memoryWallets[buyerId] = buyerWallet;

  const orderId = existingOrder?.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const buyTxId = `tx_ord_${orderId}`;
  const buyTx: Transaction = {
    id: buyTxId,
    userId: buyerId,
    userName: existingOrder?.buyerName || buyerUser?.name || 'Comprador',
    amount: -paidPrice,
    type: 'compra_revenda',
    description: `Compra no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: existingOrder?.createdAt || nowIso
  };
  const existingBuyIdx = memoryTransactions.findIndex(t => t.id === buyTxId);
  if (existingBuyIdx !== -1) memoryTransactions[existingBuyIdx] = buyTx;
  else memoryTransactions = [buyTx, ...memoryTransactions];

  if (memoryWallets[listing.sellerId]) {
    const baseSellerWallet = memoryWallets[listing.sellerId];
    memoryWallets[listing.sellerId] = {
      ...baseSellerWallet,
      availableBalance: (Number(baseSellerWallet.availableBalance) || 0) + paidPrice,
      totalEarned: (Number(baseSellerWallet.totalEarned) || 0) + paidPrice,
      updatedAt: nowIso
    };
  }

  const sellTx: Transaction = {
    id: `tx_${Date.now()}_sell_${Math.random().toString(36).substring(2, 5)}`,
    userId: listing.sellerId,
    userName: sellerUser?.name || listing.sellerName || 'Vendedor',
    amount: paidPrice,
    type: 'venda_recebida',
    description: `Venda Concluída no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: nowIso
  };
  memoryTransactions = [sellTx, ...memoryTransactions];

  const updatedListing: ResaleListing = {
    ...listing,
    status: 'vendido',
    updatedAt: nowIso
  };
  resalePublicMap.delete(updatedListing.id);
  resaleOwnedMap.set(updatedListing.id, updatedListing);
  rebuildResaleListingsFromMaps();

  memoryNegotiations = memoryNegotiations.map(n => {
    if (n.listingId === listing.id) {
      if (n.buyerId === buyerId || n.status === 'aceite') {
        const updatedNeg: Negotiation = {
          ...n,
          status: 'concluida',
          statusMessage: 'Compra concluída automaticamente com sucesso!',
          updatedAt: nowIso
        };
        updateDoc(doc(firestore, 'negotiations', n.id), {
          status: updatedNeg.status,
          statusMessage: updatedNeg.statusMessage,
          updatedAt: nowIso
        }).catch(() => {});
        return updatedNeg;
      } else if (n.status === 'pendente' || n.status === 'contraproposta' || n.status === 'aguardando_adm') {
        const updatedNeg: Negotiation = {
          ...n,
          status: 'cancelada',
          statusMessage: 'Artigo adquirido por outro comprador',
          updatedAt: nowIso
        };
        updateDoc(doc(firestore, 'negotiations', n.id), {
          status: updatedNeg.status,
          statusMessage: updatedNeg.statusMessage,
          updatedAt: nowIso
        }).catch(() => {});
        return updatedNeg;
      }
    }
    return n;
  });

  const oldItemIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (oldItemIdx !== -1) {
    memoryUserProducts[oldItemIdx] = { ...memoryUserProducts[oldItemIdx], status: 'vendido' };
  }
  // Always mark seller's original user_product as vendido in Firestore
  updateDoc(doc(firestore, 'user_products', listing.userProductId), { status: 'vendido' }).catch(() => {});

  const newItem: UserProduct = {
    id: `up_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    originalProductId: listing.userProductId,
    currentOwnerId: buyerId,
    productName: listing.productName,
    category: listing.category,
    originalPrice: listing.originalPrice,
    purchasePrice: paidPrice,
    productImage: listing.imageUrl,
    purchaseDate: nowIso,
    status: 'disponivel',
    type: 'fisico',
    condition: 'novo',
    selectedColor: listing.selectedColor,
    serialNumber: `SN-REV-${Date.now()}`
  };
  memoryUserProducts = [newItem, ...memoryUserProducts];

  const confirmedOrder: Order = existingOrder
    ? {
        ...existingOrder,
        status: 'pagamento_confirmado',
        updatedAt: nowIso
      }
    : {
        id: orderId,
        buyerId,
        buyerName: buyerUser?.name || 'Comprador',
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        items: [
          {
            id: listing.userProductId,
            productId: listing.id,
            name: listing.productName,
            price: paidPrice,
            quantity: 1,
            imageUrl: listing.imageUrl,
            source: 'revenda',
            userProductId: listing.userProductId,
            sellerId: listing.sellerId,
            selectedColor: listing.selectedColor
          }
        ],
        subtotal: paidPrice,
        shippingFee: 0,
        totalAmount: paidPrice,
        deliveryAddress: {
          province: buyerUser?.province || 'Luanda',
          city: buyerUser?.city || 'Luanda',
          street: 'Mercado Interno BABA SHOPPING',
          recipientName: buyerUser?.name || 'Comprador',
          recipientPhone: buyerUser?.phone || ''
        },
        paymentMethod: 'carteira',
        paymentReference: `REV-${listing.id.slice(-6)}`,
        status: 'pagamento_confirmado',
        source: 'revenda',
        createdAt: nowIso,
        updatedAt: nowIso
      };

  ordersBuyerMap.set(confirmedOrder.id, confirmedOrder);
  rebuildOrdersFromMaps();

  createNotification(
    listing.sellerId,
    'Artigo Vendido no Mercado de Revenda! 🎉',
    `O teu produto "${listing.productName}" foi comprado por ${formatMoney(paidPrice)}. O montante foi creditado na tua carteira.`,
    'venda',
    'carteira'
  );

  createNotification(
    buyerId,
    'Compra P2P Concluída & Produto Entregue! 📦',
    `A tua compra de "${listing.productName}" (${formatMoney(paidPrice)}) foi concluída automaticamente e já está em "Meus Produtos".`,
    'compra',
    'produto',
    newItem.id
  );

  dispatchDbChange();

  writeDocToCloudFirestore('wallets', buyerId, buyerWallet, true).catch(() => {});
  creditSellerWalletInFirestore(listing.sellerId, paidPrice, nowIso).catch(() => {});
  updateDoc(doc(firestore, 'resale_listings', updatedListing.id), {
    status: 'vendido',
    updatedAt: nowIso
  }).catch(() => {});
  writeDocToCloudFirestore('user_products', newItem.id, newItem, false).catch(() => {});
  writeDocToCloudFirestore('transactions', buyTx.id, buyTx, true).catch(() => {});
  writeDocToCloudFirestore('transactions', sellTx.id, sellTx, false).catch(() => {});
  writeDocToCloudFirestore('orders', confirmedOrder.id, confirmedOrder, true).catch(() => {});

  return confirmedOrder;
}

export function purchaseResaleListing(
  listingId: string,
  buyerId: string,
  paidPrice: number
): { id: string; pendingApproval?: boolean } {
  const listing = memoryResaleListings.find(l => l.id === listingId);
  if (!listing) throw new Error('Anúncio não encontrado.');
  if (listing.status !== 'ativo') {
    throw new Error('Este anúncio não está disponível para compra no momento.');
  }
  if (listing.sellerId === buyerId) {
    throw new Error('Não podes comprar o teu próprio anúncio.');
  }

  const numericPaidPrice = Number(paidPrice);
  if (!Number.isFinite(numericPaidPrice) || numericPaidPrice <= 0) {
    throw new Error('Preço da compra inválido.');
  }

  const wallet = getWallet(buyerId);
  const spendable = getSpendableBalance(buyerId);
  if (numericPaidPrice > spendable) {
    const reserved = getPendingReservedAmount(buyerId);
    if (reserved > 0 && numericPaidPrice <= wallet.availableBalance) {
      throw new Error(
        `Já tens ${formatMoney(reserved)} em movimentos pendentes de aprovação. O teu saldo livre atual é ${formatMoney(spendable)}.`
      );
    }
    throw new Error('Saldo insuficiente na carteira para concluir esta compra.');
  }

  const confirmed = executeConfirmedResaleSettlement(listing, buyerId, numericPaidPrice);
  return { id: confirmed.id, pendingApproval: false };
}

// ==========================================
// OFFICIAL PRODUCT PURCHASE (INSTANT & AUTOMATIC)
// ==========================================
export function purchaseOfficialProduct(
  userId: string,
  productId: string,
  quantity = 1,
  selectedColor?: string
): { order: { id: string; pendingApproval?: boolean } } {
  const prod = memoryProducts.find(p => p.id === productId);
  if (!prod) throw new Error('Produto não encontrado.');

  const qty = Math.max(1, Number(quantity) || 1);
  if (prod.stock < qty) {
    throw new Error('Stock insuficiente para a quantidade selecionada.');
  }
  const totalPrice = prod.officialPrice * qty;
  const wallet = getWallet(userId);
  const spendable = getSpendableBalance(userId);

  if (totalPrice > spendable) {
    const reserved = getPendingReservedAmount(userId);
    if (reserved > 0 && totalPrice <= wallet.availableBalance) {
      throw new Error(
        `Já tens ${formatMoney(reserved)} em movimentos pendentes de aprovação pelo Administrador. Podes movimentar até ${formatMoney(spendable)}.`
      );
    }
    throw new Error('Saldo insuficiente na tua carteira digital.');
  }

  const user = memoryUsers.find(u => u.id === userId) || (currentUserRecord?.id === userId ? currentUserRecord : null);
  const nowIso = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ref = `BABA-${orderId.slice(-6).toUpperCase()}`;

  const updatedWallet: Wallet = {
    ...wallet,
    availableBalance: Math.max(0, (Number(wallet.availableBalance) || 0) - totalPrice),
    totalSpent: (Number(wallet.totalSpent) || 0) + totalPrice,
    updatedAt: nowIso
  };
  memoryWallets[userId] = updatedWallet;

  const prodIdx = memoryProducts.findIndex(p => p.id === prod.id);
  if (prodIdx !== -1) {
    const nextStock = Math.max(0, (Number(memoryProducts[prodIdx].stock) || 0) - qty);
    const nextStatus = nextStock > 0 ? 'disponivel' : 'esgotado';
    memoryProducts[prodIdx] = { ...memoryProducts[prodIdx], stock: nextStock, status: nextStatus };
    updateDoc(doc(firestore, 'products', prod.id), { stock: nextStock, status: nextStatus }).catch(() => {});
  }

  const resolvedColor = selectedColor || prod.selectedColor;
  for (let i = 0; i < qty; i++) {
    const newItem: UserProduct = {
      id: `up_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      originalProductId: prod.id,
      currentOwnerId: userId,
      productName: prod.name,
      category: prod.category || 'produtos_variados',
      originalPrice: prod.officialPrice,
      purchasePrice: prod.officialPrice,
      productImage: prod.imageUrl,
      purchaseDate: nowIso,
      status: 'disponivel',
      type: prod.type || 'fisico',
      condition: 'novo',
      selectedColor: resolvedColor,
      serialNumber: `SN-OFF-${Date.now()}-${i}`
    };
    memoryUserProducts = [newItem, ...memoryUserProducts];
    writeDocToCloudFirestore('user_products', newItem.id, newItem, false).catch(() => {});
  }

  const confirmedOrder: Order = {
    id: orderId,
    buyerId: userId,
    buyerName: user?.name || 'Cliente',
    items: [
      {
        id: prod.id,
        productId: prod.id,
        name: prod.name,
        price: prod.officialPrice,
        quantity: qty,
        imageUrl: prod.imageUrl,
        source: 'oficial',
        selectedColor: resolvedColor
      }
    ],
    subtotal: totalPrice,
    shippingFee: 0,
    totalAmount: totalPrice,
    deliveryAddress: {
      province: user?.province || 'Luanda',
      city: user?.city || 'Luanda',
      street: 'Mercado Oficial BABA SHOPPING',
      recipientName: user?.name || 'Cliente',
      recipientPhone: user?.phone || ''
    },
    paymentMethod: 'carteira',
    paymentReference: ref,
    status: 'pagamento_confirmado',
    source: 'oficial',
    createdAt: nowIso,
    updatedAt: nowIso
  };
  ordersBuyerMap.set(confirmedOrder.id, confirmedOrder);
  rebuildOrdersFromMaps();

  const confirmedTx: Transaction = {
    id: `tx_ord_${orderId}`,
    userId,
    userName: confirmedOrder.buyerName,
    amount: -totalPrice,
    type: 'compra_oficial',
    description: `Compra Oficial Concluída & Entregue (${qty}x ${prod.name})`,
    status: 'confirmada',
    reference: ref,
    createdAt: nowIso
  };
  memoryTransactions = [confirmedTx, ...memoryTransactions];

  createNotification(
    userId,
    'Compra Concluída & Produto Entregue! 📦',
    `A tua compra de ${qty}x "${prod.name}" (${formatMoney(totalPrice)}) foi confirmada automaticamente e já está em "Meus Produtos" pronta para revenda!`,
    'compra',
    'produto',
    orderId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('wallets', userId, updatedWallet, true).catch(() => {});
  writeDocToCloudFirestore('orders', confirmedOrder.id, confirmedOrder, false).catch(() => {});
  writeDocToCloudFirestore('transactions', confirmedTx.id, confirmedTx, false).catch(() => {});

  return { order: { id: orderId, pendingApproval: false } };
}

export function approveOrder(orderId: string): Order {
  assertAdminCaller();
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado.');
  const existingOrder = memoryOrders[idx];
  if (existingOrder.status !== 'aguardando_aprovacao') return existingOrder;

  if (existingOrder.source === 'revenda') {
    const firstItem = existingOrder.items[0];
    const listing = memoryResaleListings.find(l => l.id === firstItem?.productId);
    if (!listing || listing.status !== 'ativo') {
      throw new Error('Este anúncio já não está ativo no Mercado de Revenda.');
    }
    return executeConfirmedResaleSettlement(listing, existingOrder.buyerId, existingOrder.totalAmount, existingOrder);
  }

  const baseWallet = getWallet(existingOrder.buyerId);
  if (baseWallet.availableBalance < existingOrder.totalAmount) {
    throw new Error(
      `Saldo insuficiente na carteira de ${existingOrder.buyerName} (${formatMoney(baseWallet.availableBalance)}) para debitar ${formatMoney(existingOrder.totalAmount)}.`
    );
  }
  const nowIso = new Date().toISOString();
  const wallet: Wallet = {
    ...baseWallet,
    availableBalance: (Number(baseWallet.availableBalance) || 0) - existingOrder.totalAmount,
    totalSpent: (Number(baseWallet.totalSpent) || 0) + existingOrder.totalAmount,
    updatedAt: nowIso
  };
  memoryWallets[existingOrder.buyerId] = wallet;

  const itemSummary = existingOrder.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const linkedTxId = `tx_ord_${existingOrder.id}`;
  const finalTx: Transaction = {
    id: linkedTxId,
    userId: existingOrder.buyerId,
    userName: existingOrder.buyerName,
    amount: -existingOrder.totalAmount,
    type: 'compra_oficial',
    description: `Compra Oficial Aprovada & Entregue: ${itemSummary}`,
    status: 'confirmada',
    reference: existingOrder.paymentReference,
    createdAt: existingOrder.createdAt || nowIso
  };
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  if (txIdx !== -1) memoryTransactions[txIdx] = finalTx;
  else memoryTransactions = [finalTx, ...memoryTransactions];

  existingOrder.items.forEach(item => {
    const prodMeta = memoryProducts.find(p => p.id === item.productId);
    const qty = Math.max(1, Number(item.quantity) || 1);
    for (let i = 0; i < qty; i++) {
      const newItem: UserProduct = {
        id: `up_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        originalProductId: item.productId,
        currentOwnerId: existingOrder.buyerId,
        productName: item.name,
        category: prodMeta?.category || 'produtos_variados',
        originalPrice: item.price,
        purchasePrice: item.price,
        productImage: item.imageUrl,
        purchaseDate: nowIso,
        status: 'disponivel',
        type: prodMeta?.type || 'fisico',
        condition: 'novo',
        selectedColor: item.selectedColor || prodMeta?.selectedColor,
        serialNumber: `SN-OFF-${Date.now()}-${i}`
      };
      memoryUserProducts = [newItem, ...memoryUserProducts];
      writeDocToCloudFirestore('user_products', newItem.id, newItem, false).catch(() => {});
    }
  });

  const order: Order = { ...existingOrder, status: 'pagamento_confirmado', updatedAt: nowIso };
  ordersBuyerMap.set(order.id, order);
  rebuildOrdersFromMaps();

  createNotification(
    order.buyerId,
    'Compra Oficial Aprovada & Produto Entregue! 📦',
    `A tua compra de ${itemSummary} (${formatMoney(order.totalAmount)}) foi aprovada. O produto já está em "Meus Produtos"!`,
    'compra',
    'produto',
    order.id
  );

  dispatchDbChange();
  writeDocToCloudFirestore('orders', order.id, order, true).catch(() => {});
  writeDocToCloudFirestore('wallets', order.buyerId, wallet, true).catch(() => {});
  writeDocToCloudFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});
  return order;
}

export async function approveOrderAsync(orderId: string): Promise<Order> {
  assertAdminCaller();
  const snap = await getDoc(doc(firestore, 'orders', orderId));
  if (!snap.exists()) throw new Error('Pedido de compra não encontrado no Cloud Firestore.');
  const order = normalizeFirestoreDoc<Order>(snap.id, snap.data());
  ordersBuyerMap.set(order.id, order);
  rebuildOrdersFromMaps();
  return approveOrder(orderId);
}

export function rejectOrder(orderId: string, reason: string): Order {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Pedido de compra recusado.';
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado.');
  const existing = memoryOrders[idx];
  if (existing.status !== 'aguardando_aprovacao') return existing;

  const nowIso = new Date().toISOString();
  const order: Order = { ...existing, status: 'cancelado', rejectionReason: cleanReason, updatedAt: nowIso };
  ordersBuyerMap.set(order.id, order);
  rebuildOrdersFromMaps();

  const linkedTxId = `tx_ord_${order.id}`;
  const itemSummary = order.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const rejectedTx: Transaction = {
    id: linkedTxId,
    userId: order.buyerId,
    userName: order.buyerName,
    amount: -order.totalAmount,
    type: order.source === 'revenda' ? 'compra_revenda' : 'compra_oficial',
    description: `${order.source === 'revenda' ? 'Compra Revenda' : 'Compra Oficial'} Recusada (${itemSummary}) — Motivo: ${cleanReason}`,
    status: 'recusada',
    reference: order.paymentReference,
    rejectionReason: cleanReason,
    createdAt: order.createdAt || nowIso
  };
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  if (txIdx !== -1) memoryTransactions[txIdx] = rejectedTx;
  else memoryTransactions = [rejectedTx, ...memoryTransactions];

  createNotification(
    order.buyerId,
    'Pedido de Compra Recusado ❌',
    `A tua compra de ${itemSummary} (${formatMoney(order.totalAmount)}) foi recusada. Motivo: ${cleanReason}.`,
    'sistema',
    'carteira'
  );
  dispatchDbChange();
  writeDocToCloudFirestore('orders', order.id, order, true).catch(() => {});
  writeDocToCloudFirestore('transactions', rejectedTx.id, rejectedTx, true).catch(() => {});
  return order;
}

export async function rejectOrderAsync(orderId: string, reason: string): Promise<Order> {
  assertAdminCaller();
  const snap = await getDoc(doc(firestore, 'orders', orderId));
  if (!snap.exists()) throw new Error('Pedido de compra não encontrado no Cloud Firestore.');
  const order = normalizeFirestoreDoc<Order>(snap.id, snap.data());
  ordersBuyerMap.set(order.id, order);
  rebuildOrdersFromMaps();
  return rejectOrder(orderId, reason);
}

// ==========================================
// NEGOTIATIONS (PROPOSTAS P2P)
// ==========================================
export function getNegotiations(userId: string): Negotiation[] {
  const user = memoryUsers.find(u => u.id === userId) || currentUserRecord;
  if (userId === ADMIN_UID || user?.role === 'admin') {
    return [...memoryNegotiations];
  }
  return memoryNegotiations.filter(n => n.buyerId === userId || n.sellerId === userId);
}

export function createNegotiation(
  listingId: string,
  buyerId: string,
  proposedPrice: number,
  initialMessage?: string,
  customBuyerName?: string
): Negotiation {
  const listing = memoryResaleListings.find(l => l.id === listingId);
  if (!listing) throw new Error('Anúncio não encontrado.');
  if (listing.status !== 'ativo') throw new Error('Este anúncio já não está disponível para negociação.');
  if (listing.sellerId === buyerId) throw new Error('Não podes negociar o teu próprio anúncio.');

  const numericPrice = Number(proposedPrice);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new Error('Insere um valor de proposta válido superior a 0 Kz.');
  }

  const buyer = memoryUsers.find(u => u.id === buyerId) || (currentUserRecord?.id === buyerId ? currentUserRecord : null);
  const buyerName = customBuyerName || buyer?.name || 'Comprador';
  const nowIso = new Date().toISOString();
  const negId = `neg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const firstMsgText =
    String(initialMessage || '').trim() ||
    `Proposta de compra por ${formatMoney(numericPrice)} (preço listado: ${formatMoney(listing.listingPrice)}).`;

  const negotiation: Negotiation = {
    id: negId,
    listingId: listing.id,
    userProductId: listing.userProductId,
    productName: listing.productName,
    productImage: listing.imageUrl,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    buyerId,
    buyerName,
    listedPrice: listing.listingPrice,
    currentProposedPrice: numericPrice,
    lastOfferBy: 'buyer',
    status: 'pendente',
    statusMessage: `Proposta de ${formatMoney(numericPrice)} enviada para o vendedor.`,
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [
      {
        id: `nmsg_${Date.now()}`,
        negotiationId: negId,
        senderId: buyerId,
        senderName: buyerName,
        text: firstMsgText,
        timestamp: nowIso
      }
    ]
  };

  negBuyerMap.set(negId, negotiation);
  rebuildNegotiationsFromMaps();

  createNotification(
    listing.sellerId,
    'Nova Proposta de Preço! 💬',
    `${buyerName} propôs ${formatMoney(numericPrice)} pelo teu produto "${listing.productName}".`,
    'negociacao',
    'negociacao',
    negId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negId, negotiation, false).catch(() => {});
  return negotiation;
}

export function approveNegotiationProposal(negotiationId: string): Negotiation {
  assertAdminCaller();
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada.');
  const existing = memoryNegotiations[idx];
  const updated: Negotiation = {
    ...existing,
    status: existing.lastOfferBy === 'seller' ? 'contraproposta' : 'pendente',
    statusMessage: 'Proposta validada pelo Administrador. Podes continuar a negociação.',
    updatedAt: new Date().toISOString()
  };
  negBuyerMap.set(updated.id, updated);
  rebuildNegotiationsFromMaps();
  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negotiationId, updated, true).catch(() => {});
  return updated;
}

export async function approveNegotiationProposalAsync(negotiationId: string): Promise<Negotiation> {
  assertAdminCaller();
  const snap = await getDoc(doc(firestore, 'negotiations', negotiationId));
  if (!snap.exists()) throw new Error('Negociação não encontrada no Cloud Firestore.');
  const n = normalizeFirestoreDoc<Negotiation>(snap.id, snap.data());
  negBuyerMap.set(n.id, n);
  rebuildNegotiationsFromMaps();
  return approveNegotiationProposal(negotiationId);
}

export function rejectNegotiationProposal(negotiationId: string, reason: string): Negotiation {
  assertAdminCaller();
  const cleanReason = (reason || '').trim() || 'Proposta recusada pelo Administrador.';
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada.');
  const existing = memoryNegotiations[idx];
  const updated: Negotiation = {
    ...existing,
    status: 'recusada',
    adminRejectionReason: cleanReason,
    statusMessage: `Recusada pelo Administrador: ${cleanReason}`,
    updatedAt: new Date().toISOString()
  };
  negBuyerMap.set(updated.id, updated);
  rebuildNegotiationsFromMaps();
  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negotiationId, updated, true).catch(() => {});
  return updated;
}

export async function rejectNegotiationProposalAsync(negotiationId: string, reason: string): Promise<Negotiation> {
  assertAdminCaller();
  const snap = await getDoc(doc(firestore, 'negotiations', negotiationId));
  if (!snap.exists()) throw new Error('Negociação não encontrada no Cloud Firestore.');
  const n = normalizeFirestoreDoc<Negotiation>(snap.id, snap.data());
  negBuyerMap.set(n.id, n);
  rebuildNegotiationsFromMaps();
  return rejectNegotiationProposal(negotiationId, reason);
}

export function respondSellerNegotiation(
  negotiationId: string,
  action: 'aceitar' | 'contraproposta' | 'recusar',
  counterPrice?: number,
  message?: string
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada.');
  const existing = memoryNegotiations[idx];
  const nowIso = new Date().toISOString();

  let nextStatus: Negotiation['status'] = existing.status;
  let nextPrice = existing.currentProposedPrice;
  let statusMsg = existing.statusMessage;
  let msgText = String(message || '').trim();

  if (action === 'aceitar') {
    nextStatus = 'aceite';
    statusMsg = `Proposta de ${formatMoney(existing.currentProposedPrice)} aceite! O comprador pode concluir a compra.`;
    if (!msgText) msgText = `Aceito a tua proposta de ${formatMoney(existing.currentProposedPrice)}.`;
  } else if (action === 'contraproposta') {
    const numCounter = Number(counterPrice);
    if (!Number.isFinite(numCounter) || numCounter <= 0) {
      throw new Error('Insere um valor válido para a contraproposta.');
    }
    nextStatus = 'contraproposta';
    nextPrice = numCounter;
    statusMsg = `Vendedor enviou contraproposta de ${formatMoney(numCounter)}.`;
    if (!msgText) msgText = `Proponho um novo valor de ${formatMoney(numCounter)}.`;
  } else {
    nextStatus = 'recusada';
    statusMsg = 'Proposta recusada pelo vendedor.';
    if (!msgText) msgText = 'Infelizmente não posso aceitar esta proposta.';
  }

  const newMsg = {
    id: `nmsg_${Date.now()}`,
    negotiationId,
    senderId: existing.sellerId,
    senderName: existing.sellerName,
    text: msgText,
    timestamp: nowIso
  };

  const updated: Negotiation = {
    ...existing,
    currentProposedPrice: nextPrice,
    lastOfferBy: 'seller',
    status: nextStatus,
    statusMessage: statusMsg,
    updatedAt: nowIso,
    messages: [...(existing.messages || []), newMsg]
  };
  negBuyerMap.set(updated.id, updated);
  rebuildNegotiationsFromMaps();

  createNotification(
    existing.buyerId,
    action === 'aceitar'
      ? 'Proposta Aceite pelo Vendedor! 🎉'
      : action === 'contraproposta'
      ? 'Nova Contraproposta Recebida 💬'
      : 'Proposta Recusada',
    statusMsg,
    'negociacao',
    'negociacao',
    negotiationId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negotiationId, updated, true).catch(() => {});
  return updated;
}

export function respondBuyerNegotiation(
  negotiationId: string,
  action: 'aceitar' | 'contraproposta' | 'recusar',
  counterPrice?: number,
  message?: string
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada.');
  const existing = memoryNegotiations[idx];
  const nowIso = new Date().toISOString();

  let nextStatus: Negotiation['status'] = existing.status;
  let nextPrice = existing.currentProposedPrice;
  let statusMsg = existing.statusMessage;
  let msgText = String(message || '').trim();

  if (action === 'aceitar') {
    nextStatus = 'aceite';
    statusMsg = `Acordo fechado em ${formatMoney(existing.currentProposedPrice)}!`;
    if (!msgText) msgText = `Aceito o valor de ${formatMoney(existing.currentProposedPrice)}.`;
  } else if (action === 'contraproposta') {
    const numCounter = Number(counterPrice);
    if (!Number.isFinite(numCounter) || numCounter <= 0) {
      throw new Error('Insere um valor válido para a contraproposta.');
    }
    nextStatus = 'pendente';
    nextPrice = numCounter;
    statusMsg = `Comprador propôs ${formatMoney(numCounter)}.`;
    if (!msgText) msgText = `Nova proposta: ${formatMoney(numCounter)}.`;
  } else {
    nextStatus = 'cancelada';
    statusMsg = 'Negociação cancelada pelo comprador.';
    if (!msgText) msgText = 'Decidi cancelar esta negociação.';
  }

  const newMsg = {
    id: `nmsg_${Date.now()}`,
    negotiationId,
    senderId: existing.buyerId,
    senderName: existing.buyerName,
    text: msgText,
    timestamp: nowIso
  };

  const updated: Negotiation = {
    ...existing,
    currentProposedPrice: nextPrice,
    lastOfferBy: 'buyer',
    status: nextStatus,
    statusMessage: statusMsg,
    updatedAt: nowIso,
    messages: [...(existing.messages || []), newMsg]
  };
  negBuyerMap.set(updated.id, updated);
  rebuildNegotiationsFromMaps();

  createNotification(
    existing.sellerId,
    'Atualização na Negociação 💬',
    statusMsg,
    'negociacao',
    'negociacao',
    negotiationId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negotiationId, updated, true).catch(() => {});
  return updated;
}

export function sendNegotiationMessage(
  negotiationId: string,
  senderId: string,
  senderName: string,
  text: string,
  newPrice?: number
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada.');
  const existing = memoryNegotiations[idx];
  const nowIso = new Date().toISOString();

  const newMsg = {
    id: `nmsg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    negotiationId,
    senderId,
    senderName,
    text: String(text || '').trim(),
    timestamp: nowIso
  };

  const nextPrice =
    newPrice !== undefined && Number.isFinite(Number(newPrice)) && Number(newPrice) > 0
      ? Number(newPrice)
      : existing.currentProposedPrice;

  const updated: Negotiation = {
    ...existing,
    currentProposedPrice: nextPrice,
    lastOfferBy: senderId === existing.sellerId ? 'seller' : 'buyer',
    updatedAt: nowIso,
    messages: [...(existing.messages || []), newMsg]
  };
  negBuyerMap.set(updated.id, updated);
  rebuildNegotiationsFromMaps();

  const recipientId = senderId === existing.sellerId ? existing.buyerId : existing.sellerId;
  createNotification(
    recipientId,
    `Mensagem na Negociação — ${existing.productName}`,
    `${senderName}: ${newMsg.text.slice(0, 80)}`,
    'negociacao',
    'negociacao',
    negotiationId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('negotiations', negotiationId, updated, true).catch(() => {});
  return updated;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export function getNotifications(userId: string): Notification[] {
  return memoryNotifications.filter(n => n.recipientId === userId);
}

export function createNotification(
  recipientId: string,
  title: string,
  message: string,
  type: 'venda' | 'compra' | 'negociacao' | 'sistema',
  linkType?: 'produto' | 'negociacao' | 'carteira' | 'admin' | 'assistente',
  linkId?: string
): Notification {
  const newNotif: Notification = stripUndefined({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientId,
    title,
    message,
    type,
    read: false,
    linkType,
    linkId,
    createdAt: new Date().toISOString()
  });

  if (
    recipientId === auth.currentUser?.uid ||
    auth.currentUser?.uid === ADMIN_UID ||
    isAdminUserRecord(currentUserRecord)
  ) {
    memoryNotifications = [newNotif, ...memoryNotifications];
    dispatchDbChange();
  }
  writeDocToCloudFirestore('notifications', newNotif.id, newNotif, false).catch(() => {});
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const idx = memoryNotifications.findIndex(n => n.id === id);
  if (idx !== -1 && !memoryNotifications[idx].read) {
    memoryNotifications[idx] = { ...memoryNotifications[idx], read: true };
    dispatchDbChange();
  }
  updateDoc(doc(firestore, 'notifications', id), { read: true }).catch(() => {});
}

export function markAllNotificationsAsRead(userId: string): void {
  const unread = memoryNotifications.filter(n => n.recipientId === userId && !n.read);
  if (unread.length === 0) return;
  memoryNotifications = memoryNotifications.map(n =>
    n.recipientId === userId ? { ...n, read: true } : n
  );
  dispatchDbChange();
  unread.forEach(n => {
    updateDoc(doc(firestore, 'notifications', n.id), { read: true }).catch(() => {});
  });
}

// ==========================================
// ORDERS & FORMATTING
// ==========================================
export function formatKz(amount: number): string {
  return formatCurrencyAmount(amount);
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aguardando_aprovacao: 'Aguardando Aprovação do Adm',
    aguardando_pagamento: 'Aguardando Pagamento',
    pagamento_confirmado: 'Compra Concluída & Entregue',
    em_preparacao: 'Em Preparação',
    enviado: 'Enviado',
    em_entrega: 'Em Entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado / Recusado'
  };
  return labels[status] || status;
}

export function getOrders(userId?: string): Order[] {
  if (!userId || userId === ADMIN_UID || isAdminUserRecord(currentUserRecord)) {
    return [...memoryOrders];
  }
  return memoryOrders.filter(o => o.buyerId === userId || o.sellerId === userId);
}

export function updateOrderStatus(orderId: string, status: OrderStatus): any {
  assertAdminCaller();
  const nowIso = new Date().toISOString();
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  const updated: Order =
    idx !== -1
      ? { ...memoryOrders[idx], status, updatedAt: nowIso }
      : ({ id: orderId, status, updatedAt: nowIso } as Order);

  if (idx !== -1) {
    ordersBuyerMap.set(updated.id, updated);
    rebuildOrdersFromMaps();
  }
  dispatchDbChange();
  updateDoc(doc(firestore, 'orders', orderId), { status, updatedAt: nowIso }).catch(() => {});
  return updated;
}

// ==========================================
// ASSISTENTE JENIFFER & ADMIN SUPPORT CHAT
// ==========================================
export function getAllAssistantConversations(): AssistantConversation[] {
  return [...memoryAssistantConversations];
}

export function getAssistantConversations(userId?: string): AssistantConversation[] {
  if (!userId) return [...memoryAssistantConversations];
  return memoryAssistantConversations.filter(c => c.userId === userId);
}

export function createAssistantConversation(
  user: User,
  title = 'Novo Atendimento'
): AssistantConversation {
  const nowIso = new Date().toISOString();
  const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const welcomeMsg: AssistantMessage = {
    id: `jmsg_welcome_${Date.now()}`,
    conversationId: convId,
    sender: 'jeniffer',
    senderName: 'Assistente Jeniffer',
    text: `Olá, ${user.name}! Sou a **Assistente Jeniffer**, gerente virtual da BABA SHOPPING. Estou disponível 24/24h para responder às tuas dúvidas, consultar o teu saldo, depósitos, saques, compras e estado do teu BI em tempo real. Como posso ajudar hoje?`,
    timestamp: nowIso
  };
  const conv: AssistantConversation = {
    id: convId,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone || '',
    userProvince: user.province || '',
    title,
    status: 'ativo',
    messages: [welcomeMsg],
    lastMessagePreview: welcomeMsg.text.slice(0, 90),
    unreadByAdmin: false,
    unreadByUser: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  memoryAssistantConversations = [conv, ...memoryAssistantConversations];
  dispatchDbChange();
  writeDocToCloudFirestore('assistant_conversations', convId, conv, false).catch(() => {});
  return conv;
}

export async function sendJenifferChatMessage(
  conversationId: string,
  userId: string,
  message: string
): Promise<{
  ok: boolean;
  conversation?: AssistantConversation;
  reply?: AssistantMessage;
  error?: string;
}> {
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    return {
      ok: false,
      error: 'Sessão Firebase expirada ou ausente. Inicia sessão novamente para falar com a Assistente Jeniffer.'
    };
  }

  // Ensure the conversation document exists in Cloud Firestore before invoking the server endpoint
  const localConv = memoryAssistantConversations.find(c => c.id === conversationId);
  if (localConv) {
    await writeDocToCloudFirestore('assistant_conversations', conversationId, localConv, true).catch(() => {});
  }

  const res = await fetch('/api/assistant/jeniffer/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    cache: 'no-store',
    body: JSON.stringify({ conversationId, userId, message })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.error || 'Não foi possível comunicar com a Assistente Jeniffer.'
    };
  }

  if (data.conversation) {
    const idx = memoryAssistantConversations.findIndex(c => c.id === data.conversation.id);
    if (idx !== -1) memoryAssistantConversations[idx] = data.conversation;
    else memoryAssistantConversations = [data.conversation, ...memoryAssistantConversations];
    dispatchDbChange();
  }

  return {
    ok: true,
    conversation: data.conversation,
    reply: data.replyMessage
  };
}

export async function escalateAssistantConversation(
  conversationId: string,
  userId: string,
  reason: string
): Promise<{ ok: boolean; conversation?: AssistantConversation; error?: string }> {
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    return { ok: false, error: 'Sessão Firebase expirada. Inicia sessão novamente.' };
  }

  const localConv = memoryAssistantConversations.find(c => c.id === conversationId);
  if (localConv) {
    await writeDocToCloudFirestore('assistant_conversations', conversationId, localConv, true).catch(() => {});
  }

  const res = await fetch('/api/assistant/jeniffer/escalate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    cache: 'no-store',
    body: JSON.stringify({ conversationId, userId, reason })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.error || 'Não foi possível encaminhar o atendimento ao Administrador.'
    };
  }

  if (data.conversation) {
    const idx = memoryAssistantConversations.findIndex(c => c.id === data.conversation.id);
    if (idx !== -1) memoryAssistantConversations[idx] = data.conversation;
    else memoryAssistantConversations = [data.conversation, ...memoryAssistantConversations];
    dispatchDbChange();
  }

  return { ok: true, conversation: data.conversation };
}

export function adminReplyAssistantConversation(
  conversationId: string,
  adminUser: User,
  text: string,
  nextStatus?: AssistantConversation['status']
): AssistantConversation {
  assertAdminCaller();
  const idx = memoryAssistantConversations.findIndex(c => c && c.id === conversationId);
  if (idx === -1) throw new Error('Conversa de atendimento não encontrada.');
  const existing = memoryAssistantConversations[idx];
  const cleanText = String(text || '').trim();
  if (!cleanText) throw new Error('Escreve uma mensagem para enviar ao cliente.');

  const nowIso = new Date().toISOString();
  const adminMsg: AssistantMessage = {
    id: `jmsg_adm_${Date.now()}`,
    conversationId,
    sender: 'admin',
    senderName: adminUser.name || 'Administrador BABA',
    text: cleanText,
    timestamp: nowIso
  };

  const updated: AssistantConversation = {
    ...existing,
    status: nextStatus || existing.status,
    messages: [...(existing.messages || []), adminMsg],
    lastMessagePreview: cleanText.slice(0, 90),
    unreadByAdmin: false,
    unreadByUser: true,
    updatedAt: nowIso
  };
  memoryAssistantConversations[idx] = updated;

  createNotification(
    existing.userId,
    'Resposta do Administrador no Suporte 💬',
    `O Administrador respondeu ao teu atendimento: "${cleanText.slice(0, 90)}"`,
    'sistema',
    'assistente',
    conversationId
  );

  dispatchDbChange();
  writeDocToCloudFirestore('assistant_conversations', conversationId, updated, true).catch(() => {});
  return updated;
}

export function adminUpdateAssistantStatus(
  conversationId: string,
  status: AssistantConversation['status']
): AssistantConversation {
  assertAdminCaller();
  const idx = memoryAssistantConversations.findIndex(c => c && c.id === conversationId);
  if (idx === -1) throw new Error('Conversa não encontrada.');
  const nowIso = new Date().toISOString();
  const updated: AssistantConversation = {
    ...memoryAssistantConversations[idx],
    status,
    unreadByAdmin: false,
    updatedAt: nowIso
  };
  memoryAssistantConversations[idx] = updated;
  dispatchDbChange();
  updateDoc(doc(firestore, 'assistant_conversations', conversationId), {
    status,
    unreadByAdmin: false,
    updatedAt: nowIso
  }).catch(() => {});
  return updated;
}

export function markAssistantConversationRead(
  conversationId: string,
  viewer: 'user' | 'admin'
): void {
  const idx = memoryAssistantConversations.findIndex(c => c && c.id === conversationId);
  if (idx === -1) return;
  const existing = memoryAssistantConversations[idx];
  const needsUpdate = viewer === 'admin' ? existing.unreadByAdmin : existing.unreadByUser;
  if (!needsUpdate) return;
  const updated: AssistantConversation = {
    ...existing,
    unreadByAdmin: viewer === 'admin' ? false : existing.unreadByAdmin,
    unreadByUser: viewer === 'user' ? false : existing.unreadByUser
  };
  memoryAssistantConversations[idx] = updated;
  dispatchDbChange();
  updateDoc(
    doc(firestore, 'assistant_conversations', conversationId),
    viewer === 'admin' ? { unreadByAdmin: false } : { unreadByUser: false }
  ).catch(() => {});
}

export {
  CURRENCIES,
  getActiveCurrency,
  setActiveCurrency,
  convertFromKz,
  formatCurrencyAmount,
  CURRENCY_CHANGE_EVENT,
  type CurrencyCode
};
