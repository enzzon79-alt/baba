import {
  formatMoney,
  getActiveCurrency,
  setActiveCurrency,
  CURRENCIES,
  type CurrencyCode
} from './currency';
import {
  User,
  Product,
  UserProduct,
  ResaleListing,
  Negotiation,
  NegotiationMessage,
  Wallet,
  Transaction,
  Order,
  OrderStatus,
  DepositRequest,
  WithdrawalRequest,
  Notification
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_RESALE_LISTINGS,
  INITIAL_WALLETS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DEPOSITS,
  INITIAL_WITHDRAWALS,
  INITIAL_NEGOTIATIONS
} from '../data/mockData';
import {
  firestore,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from './firebase';

export const DB_KEYS = {
  USERS: 'baba_users_v9',
  DELETED_USERS: 'baba_deleted_users_v9',
  CURRENT_USER_ID: 'baba_current_user_id_v9',
  PRODUCTS: 'baba_products_v9',
  USER_PRODUCTS: 'baba_user_products_v9',
  RESALE_LISTINGS: 'baba_resale_listings_v9',
  NEGOTIATIONS: 'baba_negotiations_v9',
  WALLETS: 'baba_wallets_v10',
  TRANSACTIONS: 'baba_transactions_v10',
  DEPOSITS: 'baba_deposits_v9',
  WITHDRAWALS: 'baba_withdrawals_v9',
  NOTIFICATIONS: 'baba_notifications_v9',
  ORDERS: 'baba_orders_v9'
};

export const DB_STATE_EVENT = 'baba_db_state_changed';

export function dispatchDbChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_STATE_EVENT));
  }
}

// In-memory state for 0ms instantaneous React UI updates
let memoryProducts: Product[] = [];
let memoryUsers: User[] = [];
let memoryDeletedUserIds: string[] = [];
let memoryWallets: Record<string, Wallet> = {};
let memoryTransactions: Transaction[] = [];
let memoryUserProducts: UserProduct[] = [];
let memoryResaleListings: ResaleListing[] = [];
let memoryNegotiations: Negotiation[] = [];
let memoryNotifications: Notification[] = [];
let memoryDeposits: DepositRequest[] = [];
let memoryWithdrawals: WithdrawalRequest[] = [];
let memoryOrders: Order[] = [];

let isInitialized = false;


function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanForFirestore(item));
  const res: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      res[k] = (v && typeof v === 'object' && !(v instanceof Date)) ? cleanForFirestore(v) : v;
    }
  }
  return res;
}

function backupToStorage<T>(key: string, val: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // quota safe
    }
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const ADMIN_ONLY_RESET_VERSION = 'admin_only_20261114_v1';
const LOCAL_RESET_KEY = 'baba_local_reset_v';

function applyLocalAdminOnlyResetOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(LOCAL_RESET_KEY) === ADMIN_ONLY_RESET_VERSION) return;
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(DB_KEYS.DELETED_USERS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.WALLETS, JSON.stringify(INITIAL_WALLETS));
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.USER_PRODUCTS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.RESALE_LISTINGS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.NEGOTIATIONS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.DEPOSITS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));

    const currentId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    if (currentId && currentId !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62') {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
      localStorage.removeItem('baba_current_user_obj');
    }
    localStorage.setItem(LOCAL_RESET_KEY, ADMIN_ONLY_RESET_VERSION);
  } catch {
    // storage safe
  }
}

applyLocalAdminOnlyResetOnce();

// Initial hydration from backup storage for 0ms initial render
memoryProducts = loadFromStorage(DB_KEYS.PRODUCTS, INITIAL_PRODUCTS);
memoryDeletedUserIds = loadFromStorage(DB_KEYS.DELETED_USERS, []);
memoryUsers = loadFromStorage(DB_KEYS.USERS, INITIAL_USERS).filter(
  (u: User) => u && !memoryDeletedUserIds.includes(u.id)
);
memoryWallets = loadFromStorage(DB_KEYS.WALLETS, INITIAL_WALLETS);
memoryTransactions = loadFromStorage(DB_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
memoryUserProducts = loadFromStorage(DB_KEYS.USER_PRODUCTS, []);
memoryResaleListings = loadFromStorage(DB_KEYS.RESALE_LISTINGS, INITIAL_RESALE_LISTINGS);
memoryNegotiations = loadFromStorage(DB_KEYS.NEGOTIATIONS, INITIAL_NEGOTIATIONS);
memoryNotifications = loadFromStorage(DB_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
memoryDeposits = loadFromStorage(DB_KEYS.DEPOSITS, INITIAL_DEPOSITS);
memoryWithdrawals = loadFromStorage(DB_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
memoryOrders = loadFromStorage(DB_KEYS.ORDERS, []);

async function performOneTimeFirestoreAdminOnlyPurge(): Promise<void> {
  const adminId = 'kt5dFLArJzV7hCNMQ3ZvgqFokM62';
  try {
    const adminRef = doc(firestore, 'users', adminId);
    const adminSnap = await Promise.race([
      getDoc(adminRef).catch(() => null),
      new Promise<null>(res => setTimeout(() => res(null), 2500))
    ]);

    if (!adminSnap) {
      return;
    }

    if (adminSnap.exists() && adminSnap.data()?.globalCleanResetVersion === ADMIN_ONLY_RESET_VERSION) {
      return;
    }

    const purgeCollection = async (colName: string, keepDocId?: string) => {
      try {
        const snap = await Promise.race([
          getDocs(collection(firestore, colName)),
          new Promise<null>(res => setTimeout(() => res(null), 2500))
        ]);
        if (!snap) return;
        const deletions: Promise<void>[] = [];
        snap.forEach(d => {
          if (!keepDocId || d.id !== keepDocId) {
            deletions.push(deleteDoc(doc(firestore, colName, d.id)).catch(() => {}));
          }
        });
        if (deletions.length > 0) {
          await Promise.all(deletions);
        }
      } catch (err) {
        console.warn(`Firestore purge notice (${colName}):`, err);
      }
    };

    await Promise.all([
      purgeCollection('users', adminId),
      purgeCollection('wallets', adminId),
      purgeCollection('resale_listings'),
      purgeCollection('user_products'),
      purgeCollection('negotiations'),
      purgeCollection('notifications'),
      purgeCollection('deposits'),
      purgeCollection('withdrawals'),
      purgeCollection('orders')
    ]);

    const adminUserData = {
      ...cleanForFirestore(INITIAL_USERS[0]),
      globalCleanResetVersion: ADMIN_ONLY_RESET_VERSION
    };
    await setDoc(adminRef, adminUserData, { merge: true }).catch(() => {});
    await setDoc(doc(firestore, 'wallets', adminId), INITIAL_WALLETS[adminId], { merge: true }).catch(() => {});

    memoryUsers = [...INITIAL_USERS];
    memoryWallets = { ...INITIAL_WALLETS };
    memoryResaleListings = [];
    memoryUserProducts = [];
    memoryNegotiations = [];
    memoryNotifications = [];
    memoryDeposits = [];
    memoryWithdrawals = [];
    memoryTransactions = [];
    memoryOrders = [];
    backupToStorage(DB_KEYS.USERS, memoryUsers);
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    backupToStorage(DB_KEYS.RESALE_LISTINGS, []);
    backupToStorage(DB_KEYS.USER_PRODUCTS, []);
    backupToStorage(DB_KEYS.NEGOTIATIONS, []);
    backupToStorage(DB_KEYS.NOTIFICATIONS, []);
    backupToStorage(DB_KEYS.DEPOSITS, []);
    backupToStorage(DB_KEYS.WITHDRAWALS, []);
    backupToStorage(DB_KEYS.TRANSACTIONS, []);
    backupToStorage(DB_KEYS.ORDERS, []);
    dispatchDbChange();
  } catch (err) {
    console.warn('Admin-only purge note:', err);
  }
}

function mergeListById<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  snapDocs: Array<{ id: string; data: () => any }>,
  localItems: T[],
  colName: string,
  sortDesc = true
): T[] {
  const map = new Map<string, T>();
  snapDocs.forEach(d => {
    const raw = d.data() as T;
    if (raw) {
      const id = d.id || raw.id;
      if (id) map.set(id, { ...raw, id });
    }
  });
  localItems.forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
      setDoc(doc(firestore, colName, item.id), cleanForFirestore(item), { merge: true }).catch(() => {});
    }
  });
  const list = Array.from(map.values());
  if (sortDesc) {
    list.sort((a, b) => {
      const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return tb - ta;
    });
  }
  return list;
}

/**
 * Initialize real-time Cloud Firestore listeners on all collections
 */
export function initDatabase(): void {
  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', ev => {
      if (!ev.key) return;
      let changed = false;
      if (ev.key === DB_KEYS.USERS) {
        memoryUsers = loadFromStorage(DB_KEYS.USERS, INITIAL_USERS);
        changed = true;
      } else if (ev.key === DB_KEYS.WALLETS) {
        memoryWallets = loadFromStorage(DB_KEYS.WALLETS, INITIAL_WALLETS);
        changed = true;
      } else if (ev.key === DB_KEYS.TRANSACTIONS) {
        memoryTransactions = loadFromStorage(DB_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
        changed = true;
      } else if (ev.key === DB_KEYS.DEPOSITS) {
        memoryDeposits = loadFromStorage(DB_KEYS.DEPOSITS, INITIAL_DEPOSITS);
        changed = true;
      } else if (ev.key === DB_KEYS.WITHDRAWALS) {
        memoryWithdrawals = loadFromStorage(DB_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
        changed = true;
      } else if (ev.key === DB_KEYS.RESALE_LISTINGS) {
        memoryResaleListings = loadFromStorage(DB_KEYS.RESALE_LISTINGS, INITIAL_RESALE_LISTINGS);
        changed = true;
      } else if (ev.key === DB_KEYS.USER_PRODUCTS) {
        memoryUserProducts = loadFromStorage(DB_KEYS.USER_PRODUCTS, []);
        changed = true;
      } else if (ev.key === DB_KEYS.NEGOTIATIONS) {
        memoryNegotiations = loadFromStorage(DB_KEYS.NEGOTIATIONS, INITIAL_NEGOTIATIONS);
        changed = true;
      } else if (ev.key === DB_KEYS.NOTIFICATIONS) {
        memoryNotifications = loadFromStorage(DB_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
        changed = true;
      } else if (ev.key === DB_KEYS.ORDERS) {
        memoryOrders = loadFromStorage(DB_KEYS.ORDERS, []);
        changed = true;
      }
      if (changed) dispatchDbChange();
    });
  }

  // 1. Subscribe to Firestore Products
  onSnapshot(
    collection(firestore, 'products'),
    async snap => {
      const prodsMap = new Map<string, Product>();
      INITIAL_PRODUCTS.forEach(p => prodsMap.set(p.id, p));
      snap.forEach(d => {
        const p = d.data() as Product;
        if (p && p.id) {
          prodsMap.set(p.id, { ...(prodsMap.get(p.id) || p), ...p });
        }
      });
      memoryProducts = Array.from(prodsMap.values());
      backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
      dispatchDbChange();
    },
    err => console.warn('Products live listener notice:', err.message)
  );

  const mergeFirestoreUsersSnapshot = (snapDocs: Array<{ id: string; data: () => any }>) => {
    const users: User[] = [];
    const seenIds = new Set<string>();
    const localById = new Map(memoryUsers.map(mu => [mu.id, mu]));

    snapDocs.forEach(d => {
      const u = d.data() as User;
      if (u) {
        const uid = d.id || u.id;
        const isMaster = uid === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62';
        if (!isMaster && memoryDeletedUserIds.includes(uid)) return;
        const localMatch = localById.get(uid);
        seenIds.add(uid);
        users.push({
          ...u,
          id: uid,
          accountStatus: isMaster ? 'ativo' : (u.accountStatus || localMatch?.accountStatus || 'em_processamento'),
          phone: isMaster ? '+244 932 200 719' : (u.phone || localMatch?.phone || '+244 923 000 001'),
          password: isMaster ? 'Adelina25' : (u.password || localMatch?.password),
          idCardFront: u.idCardFront || localMatch?.idCardFront || '',
          idCardBack: u.idCardBack || localMatch?.idCardBack || ''
        });
      }
    });

    // Preservar utilizadores recém-criados localmente que ainda estejam a sincronizar para o Firestore
    memoryUsers.forEach(lu => {
      if (
        lu &&
        lu.id &&
        !seenIds.has(lu.id) &&
        lu.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' &&
        !memoryDeletedUserIds.includes(lu.id)
      ) {
        users.unshift(lu);
        setDoc(doc(firestore, 'users', lu.id), cleanForFirestore(lu), { merge: true }).catch(() => {});
      }
    });

    memoryUsers = users;
    backupToStorage(DB_KEYS.USERS, memoryUsers);
    dispatchDbChange();
  };

  void (async () => {
    // 2. Subscribe to Firestore Users
    onSnapshot(
      collection(firestore, 'users'),
      async snap => {
        if (snap.empty) {
          try {
            const batch = writeBatch(firestore);
            INITIAL_USERS.forEach(u => {
              const ref = doc(firestore, 'users', u.id);
              batch.set(ref, u);
            });
            await batch.commit();
          } catch (err: any) {
            console.warn('Seeding users note:', err?.message);
          }
        } else {
          mergeFirestoreUsersSnapshot(snap.docs);
        }
      },
      err => console.warn('Users live listener notice:', err.message)
    );

    // 3. Subscribe to Firestore Wallets
    onSnapshot(
      collection(firestore, 'wallets'),
      async snap => {
        if (snap.empty) {
          try {
            const batch = writeBatch(firestore);
            Object.values(INITIAL_WALLETS).forEach(w => {
              const ref = doc(firestore, 'wallets', w.userId);
              batch.set(ref, w);
            });
            await batch.commit();
          } catch (err: any) {
            console.warn('Seeding wallets note:', err?.message);
          }
        } else {
          const walletsMap: Record<string, Wallet> = { ...memoryWallets };
          snap.forEach(d => {
            const w = d.data() as Wallet;
            if (!w) return;
            const uid = d.id || w.userId;
            if (
              (w.availableBalance === 500000 || w.availableBalance === 950000 || w.availableBalance === 5000000) &&
              (w.totalSpent === 0 || !w.totalSpent)
            ) {
              w.availableBalance = 500;
              w.totalDeposited = 500;
              setDoc(doc(firestore, 'wallets', uid), w, { merge: true }).catch(() => {});
            }
            walletsMap[uid] = { ...w, userId: uid };
          });
          memoryWallets = walletsMap;
          backupToStorage(DB_KEYS.WALLETS, memoryWallets);
          dispatchDbChange();
        }
      },
      err => console.warn('Wallets live listener notice:', err.message)
    );

    // 4. Subscribe to Firestore Resale Listings
    onSnapshot(
      collection(firestore, 'resale_listings'),
      snap => {
        memoryResaleListings = mergeListById<ResaleListing>(snap.docs, memoryResaleListings, 'resale_listings', true);
        backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
        dispatchDbChange();
      },
      err => console.warn('Listings live listener notice:', err.message)
    );

    // 5. Subscribe to Firestore User Products (Meus Produtos)
    onSnapshot(
      collection(firestore, 'user_products'),
      snap => {
        memoryUserProducts = mergeListById<UserProduct>(snap.docs, memoryUserProducts, 'user_products', false);
        backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
        dispatchDbChange();
      },
      err => console.warn('User products live listener notice:', err.message)
    );

    // 6. Subscribe to Firestore Negotiations
    onSnapshot(
      collection(firestore, 'negotiations'),
      snap => {
        memoryNegotiations = mergeListById<Negotiation>(snap.docs, memoryNegotiations, 'negotiations', true);
        backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
        dispatchDbChange();
      },
      err => console.warn('Negotiations live listener notice:', err.message)
    );

    // 7. Subscribe to Firestore Notifications
    onSnapshot(
      collection(firestore, 'notifications'),
      snap => {
        memoryNotifications = mergeListById<Notification>(snap.docs, memoryNotifications, 'notifications', true);
        backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
        dispatchDbChange();
      },
      err => console.warn('Notifications live listener notice:', err.message)
    );

    // 8. Subscribe to Firestore Deposits
    onSnapshot(
      collection(firestore, 'deposits'),
      snap => {
        memoryDeposits = mergeListById<DepositRequest>(snap.docs, memoryDeposits, 'deposits', true);
        backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
        dispatchDbChange();
      },
      err => console.warn('Deposits live listener notice:', err.message)
    );

    // 9. Subscribe to Firestore Withdrawals
    onSnapshot(
      collection(firestore, 'withdrawals'),
      snap => {
        memoryWithdrawals = mergeListById<WithdrawalRequest>(snap.docs, memoryWithdrawals, 'withdrawals', true);
        backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
        dispatchDbChange();
      },
      err => console.warn('Withdrawals live listener notice:', err.message)
    );

    // 10. Subscribe to Firestore Transactions
    onSnapshot(
      collection(firestore, 'transactions'),
      snap => {
        memoryTransactions = mergeListById<Transaction>(snap.docs, memoryTransactions, 'transactions', true);
        backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
        dispatchDbChange();
      },
      err => console.warn('Transactions live listener notice:', err.message)
    );

    // 11. Subscribe to Firestore Orders
    onSnapshot(
      collection(firestore, 'orders'),
      snap => {
        memoryOrders = mergeListById<Order>(snap.docs, memoryOrders, 'orders', true);
        backupToStorage(DB_KEYS.ORDERS, memoryOrders);
        dispatchDbChange();
      },
      err => console.warn('Orders live listener notice:', err.message)
    );
  })();
}

// ==========================================
// PRODUCTS
// ==========================================
export function getProducts(): Product[] {
  const map = new Map<string, Product>();
  INITIAL_PRODUCTS.forEach(p => {
    const safePrice = Math.max(5000, Math.min(450000, Number(p.officialPrice) || 5000));
    const safeResale = Math.max(safePrice, Math.min(450000, Number(p.suggestedResalePrice) || Math.round(safePrice * 1.35)));
    map.set(p.id, {
      ...p,
      officialPrice: safePrice,
      suggestedResalePrice: safeResale
    });
  });
  memoryProducts.forEach(p => {
    if (p && p.id) {
      const existing = map.get(p.id) || p;
      const merged = { ...existing, ...p };
      const safePrice = Math.max(5000, Math.min(450000, Number(merged.officialPrice) || 5000));
      const safeResale = Math.max(safePrice, Math.min(450000, Number(merged.suggestedResalePrice) || Math.round(safePrice * 1.35)));
      map.set(p.id, {
        ...merged,
        officialPrice: safePrice,
        suggestedResalePrice: safeResale
      });
    }
  });
  return Array.from(map.values());
}

export function updateProduct(id: string, updates: Partial<Product>): Product {
  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Produto não encontrado');
  const updated = { ...memoryProducts[idx], ...updates };
  memoryProducts[idx] = updated;
  backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
  dispatchDbChange();

  setDoc(doc(firestore, 'products', id), updated, { merge: true }).catch(err =>
    console.warn('Firestore product update note:', err)
  );

  return updated;
}

export function createProduct(productData: Omit<Product, 'id'>): Product {
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}`
  };
  memoryProducts = [newProduct, ...memoryProducts];
  backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
  dispatchDbChange();

  setDoc(doc(firestore, 'products', newProduct.id), newProduct).catch(err =>
    console.warn('Firestore product create note:', err)
  );

  return newProduct;
}

// ==========================================
// USERS & AUTH
// ==========================================
export function getUsers(): User[] {
  const map = new Map<string, User>();
  const isDeleted = (id: string) =>
    id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' &&
    memoryDeletedUserIds.includes(id);

  INITIAL_USERS.forEach(u => {
    if (u && u.id && !isDeleted(u.id)) {
      map.set(u.id, { ...u, phone: u.phone || '+244 923 000 001' });
    }
  });
  memoryUsers.forEach(u => {
    if (u && u.id && !isDeleted(u.id)) {
      const isMaster = u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62';
      const initial = map.get(u.id);
      map.set(u.id, {
        ...(initial || {}),
        ...u,
        phone: isMaster ? '+244 932 200 719' : (u.phone || initial?.phone || '+244 923 000 001'),
        password: isMaster ? 'Adelina25' : (u.password || initial?.password)
      });
    }
  });
  return Array.from(map.values());
}

export function getUserInviteCode(user?: Pick<User, 'id' | 'name'> | null): string {
  if (!user) return 'BABA-AMIGO94';
  const firstName = (user.name || 'AMIGO').trim().split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'AMIGO';
  const suffix = (user.id || '94').replace(/[^A-Za-z0-9]/g, '').slice(-3).toUpperCase() || '94';
  return `BABA-${firstName}${suffix}`;
}

export async function syncUsersFromFirestore(): Promise<User[]> {
  try {
    const snap = await Promise.race([
      getDocs(collection(firestore, 'users')),
      new Promise<null>(res => setTimeout(() => res(null), 3000))
    ]);
    if (snap && !snap.empty) {
      const localById = new Map(memoryUsers.map(mu => [mu.id, mu]));
      const merged: User[] = [];
      const seenIds = new Set<string>();

      snap.forEach(d => {
        const u = d.data() as User;
        if (!u) return;
        const uid = d.id || u.id;
        const isMaster = uid === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62';
        if (!isMaster && memoryDeletedUserIds.includes(uid)) return;
        const localMatch = localById.get(uid);
        seenIds.add(uid);
        merged.push({
          ...u,
          id: uid,
          accountStatus: isMaster ? 'ativo' : (u.accountStatus || localMatch?.accountStatus || 'em_processamento'),
          phone: isMaster ? '+244 932 200 719' : (u.phone || localMatch?.phone || '+244 923 000 001'),
          password: isMaster ? 'Adelina25' : (u.password || localMatch?.password),
          idCardFront: u.idCardFront || localMatch?.idCardFront || '',
          idCardBack: u.idCardBack || localMatch?.idCardBack || ''
        });
      });

      memoryUsers.forEach(lu => {
        if (
          lu &&
          lu.id &&
          !seenIds.has(lu.id) &&
          lu.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' &&
          !memoryDeletedUserIds.includes(lu.id)
        ) {
          merged.unshift(lu);
          setDoc(doc(firestore, 'users', lu.id), cleanForFirestore(lu), { merge: true }).catch(() => {});
        }
      });

      memoryUsers = merged;
      backupToStorage(DB_KEYS.USERS, memoryUsers);
      dispatchDbChange();
    }
  } catch (err) {
    console.warn('syncUsersFromFirestore notice:', err);
  }
  return getUsers();
}

export async function syncAdminCollectionsFromFirestore(): Promise<void> {
  try {
    const withTimeout = <T,>(p: Promise<T>) =>
      Promise.race([p, new Promise<null>(res => setTimeout(() => res(null), 3000))]);

    const [depSnap, wthSnap, listSnap, negSnap, walSnap, txSnap, ordSnap, upSnap] = await Promise.all([
      withTimeout(getDocs(collection(firestore, 'deposits'))),
      withTimeout(getDocs(collection(firestore, 'withdrawals'))),
      withTimeout(getDocs(collection(firestore, 'resale_listings'))),
      withTimeout(getDocs(collection(firestore, 'negotiations'))),
      withTimeout(getDocs(collection(firestore, 'wallets'))),
      withTimeout(getDocs(collection(firestore, 'transactions'))),
      withTimeout(getDocs(collection(firestore, 'orders'))),
      withTimeout(getDocs(collection(firestore, 'user_products')))
    ]);

    if (depSnap) {
      memoryDeposits = mergeListById<DepositRequest>(depSnap.docs, memoryDeposits, 'deposits', true);
      backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
    }

    if (wthSnap) {
      memoryWithdrawals = mergeListById<WithdrawalRequest>(wthSnap.docs, memoryWithdrawals, 'withdrawals', true);
      backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
    }

    if (listSnap) {
      memoryResaleListings = mergeListById<ResaleListing>(listSnap.docs, memoryResaleListings, 'resale_listings', true);
      backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
    }

    if (negSnap) {
      memoryNegotiations = mergeListById<Negotiation>(negSnap.docs, memoryNegotiations, 'negotiations', true);
      backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
    }

    if (walSnap && !walSnap.empty) {
      const nextWallets: Record<string, Wallet> = { ...memoryWallets };
      walSnap.forEach(d => {
        const w = d.data() as Wallet;
        if (w) nextWallets[d.id || w.userId] = { ...w, userId: d.id || w.userId };
      });
      memoryWallets = nextWallets;
      backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    }

    if (txSnap) {
      memoryTransactions = mergeListById<Transaction>(txSnap.docs, memoryTransactions, 'transactions', true);
      backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
    }

    if (ordSnap) {
      memoryOrders = mergeListById<Order>(ordSnap.docs, memoryOrders, 'orders', true);
      backupToStorage(DB_KEYS.ORDERS, memoryOrders);
    }

    if (upSnap) {
      memoryUserProducts = mergeListById<UserProduct>(upSnap.docs, memoryUserProducts, 'user_products', false);
      backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
    }

    dispatchDbChange();
  } catch (err) {
    console.warn('syncAdminCollectionsFromFirestore notice:', err);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const currentId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
  if (!currentId) return null;
  if (
    currentId !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' &&
    currentId !== 'usr_admin' &&
    memoryDeletedUserIds.includes(currentId)
  ) {
    localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
    localStorage.removeItem('baba_current_user_obj');
    return null;
  }
  const users = getUsers();
  let user = users.find(u => u && (u.id === currentId || u.id?.toLowerCase() === currentId.toLowerCase()));
  if (!user) {
    try {
      const rawCached = localStorage.getItem('baba_current_user_obj');
      if (rawCached) {
        const parsed = JSON.parse(rawCached);
        if (parsed && (parsed.id === currentId || !currentId) && !memoryDeletedUserIds.includes(parsed.id)) {
          user = parsed;
        }
      }
    } catch {}
  }
  if (user && (user.role === 'admin' || user.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || user.id === 'usr_admin')) {
    user.accountStatus = 'ativo';
  }
  return user || null;
}

export async function logoutUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
    localStorage.removeItem('baba_current_user_obj');
  }
  try {
    await signOut(auth);
  } catch {
    // safe ignore
  }
  dispatchDbChange();
}

export function setCurrentUser(userIdOrUser: string | User): User {
  let user: User | undefined;
  if (typeof userIdOrUser === 'object' && userIdOrUser !== null) {
    user = { ...userIdOrUser };
  } else {
    const users = getUsers();
    user = users.find(u => u && (u.id === userIdOrUser || u.id?.toLowerCase() === String(userIdOrUser).toLowerCase()));
    if (!user) {
      user = INITIAL_USERS.find(u => u && (u.id === userIdOrUser || u.id?.toLowerCase() === String(userIdOrUser).toLowerCase()));
    }
  }

  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  const isAdmin = user.role === 'admin' || user.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || user.id === 'usr_admin';
  if (isAdmin) {
    user.accountStatus = 'ativo';
  } else {
    user.accountStatus = user.accountStatus || 'em_processamento';
  }

  memoryUsers = [user, ...memoryUsers.filter(u => u && u.id !== user!.id)];
  backupToStorage(DB_KEYS.USERS, memoryUsers);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DB_KEYS.CURRENT_USER_ID, user.id);
      localStorage.setItem('baba_current_user_obj', JSON.stringify(user));
    } catch {}
  }
  dispatchDbChange();
  return user;
}

export async function registerUser(
  name: string,
  email: string,
  phone: string,
  passwordOrProvince: string,
  provinceOrCity?: string,
  cityOrIdNumber?: string,
  idNumberOrBirthDate?: string,
  birthDateOrIdCardFront?: string,
  idCardFrontOrBack?: string,
  idCardBack?: string,
  referredByCode?: string
): Promise<User> {
  let password = 'BABA2026!';
  let province = 'Luanda';
  let city = 'Luanda (Talatona)';
  let idNumber = '009847123LA042';
  let birthDate = '1998-05-15';
  let docFront = '';
  let docBack = '';
  const cleanReferredBy = (referredByCode || '').trim().toUpperCase();

  if (idCardBack !== undefined) {
    // 10+ arguments passed: name, email, phone, password, province, city, idNumber, birthDate, front, back, referredBy
    password = passwordOrProvince || 'BABA2026!';
    province = provinceOrCity || 'Luanda';
    city = cityOrIdNumber || 'Luanda';
    idNumber = idNumberOrBirthDate || '009847123LA042';
    birthDate = birthDateOrIdCardFront || '1998-05-15';
    docFront = idCardFrontOrBack || '';
    docBack = idCardBack || '';
  } else {
    // 9 arguments passed (legacy): name, email, phone, province, city, idNumber, birthDate, front, back
    province = passwordOrProvince || 'Luanda';
    city = provinceOrCity || 'Luanda';
    idNumber = cityOrIdNumber || '009847123LA042';
    birthDate = idNumberOrBirthDate || '1998-05-15';
    docFront = birthDateOrIdCardFront || '';
    docBack = idCardFrontOrBack || '';
  }

  // Prevent duplicate registration with existing email or phone
  const cleanDigits = (s: any) => (s ? String(s).replace(/\D+/g, '') : '');
  const normPhone = (d: string) => (d.startsWith('244') && d.length > 9 ? d.slice(3) : d);
  const newEmailLower = email.trim().toLowerCase();
  const newPhoneNorm = normPhone(cleanDigits(phone));

  const existingDuplicate = getUsers().find(u => {
    if (!u) return false;
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhoneNorm = normPhone(cleanDigits(u.phone));
    if (uEmail && uEmail === newEmailLower) return true;
    if (newPhoneNorm.length >= 9 && uPhoneNorm === newPhoneNorm) return true;
    return false;
  });

  if (existingDuplicate) {
    throw new Error('Já existe uma conta registada com este email ou número de telefone. Por favor, inicia sessão.');
  }

  // 1. Create User in Firebase Authentication
  let authUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    authUid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {
      // safe
    }
    console.log('Firebase Auth user created with real name & UID:', name, authUid);
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está registado na plataforma. Por favor, faz login.');
    } else if (authErr.code === 'auth/weak-password') {
      throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
    } else if (authErr.code === 'auth/invalid-email') {
      throw new Error('O formato do email inserido é inválido.');
    } else {
      console.warn('Firebase Auth note:', authErr.message);
      authUid = `usr_${Date.now()}`;
    }
  }

  const userId = authUid || `usr_${Date.now()}`;
  if (memoryDeletedUserIds.includes(userId)) {
    memoryDeletedUserIds = memoryDeletedUserIds.filter(id => id !== userId);
    backupToStorage(DB_KEYS.DELETED_USERS, memoryDeletedUserIds);
  }

  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    password: password,
    role: 'client',
    accountStatus: 'em_processamento',
    province,
    city,
    idNumber,
    birthDate,
    idCardFront: docFront,
    idCardBack: docBack,
    ...(cleanReferredBy ? { referredBy: cleanReferredBy, referralRewardPaid: false } : {}),
    createdAt: new Date().toISOString()
  };

  memoryUsers = [newUser, ...memoryUsers.filter(u => u.id !== userId && u.email !== email)];
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  // Initialize wallet with 500.00 Kz bonus
  const newWallet: Wallet = {
    userId: userId,
    availableBalance: 500,
    pendingBalance: 0,
    reservedBalance: 0,
    totalDeposited: 500,
    totalSpent: 0,
    totalEarned: 0,
    totalWithdrawn: 0
  };

  memoryWallets[userId] = newWallet;
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const welcomeTx: Transaction = {
    id: `tx_welcome_${Date.now()}`,
    userId: userId,
    userName: name.trim(),
    amount: 500,
    type: 'carregamento',
    description: 'Bónus de Boas-Vindas BABA SHOPPING (Saldo Inicial)',
    status: 'confirmada',
    reference: 'BONUS-500',
    createdAt: new Date().toISOString()
  };
  memoryTransactions = [welcomeTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  // Não autenticar automaticamente — a conta fica em revisão até o Administrador validar o BI e aceitar
  try {
    await signOut(auth);
  } catch {
    // safe ignore
  }
  if (typeof window !== 'undefined') {
    const activeId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    if (activeId === userId) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
      localStorage.removeItem('baba_current_user_obj');
    }
  }

  // Create pending review notification for the new user
  createNotification(
    userId,
    'Conta em Revisão pelo Administrador 📋',
    'A tua conta foi criada e encontra-se em revisão. Assim que o Administrador validar os teus dados e o Bilhete de Identidade, poderás iniciar sessão e usar os 500,00 Kz de bónus.',
    'sistema',
    'carteira'
  );

  // Notificar imediatamente o Administrador sobre novo documento BI para validar
  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Novo Documento BI para Validar 📋',
    `${newUser.name} (${newUser.phone}) submeteu o BI ${newUser.idNumber} (${newUser.province}) e aguarda validação no Painel Adm.`,
    'sistema',
    'admin'
  );

  // 2. Direct AWAIT write to Cloud Firestore (com timeout de segurança)
  try {
    await Promise.race([
      Promise.all([
        setDoc(doc(firestore, 'users', userId), cleanForFirestore(newUser), { merge: true }),
        setDoc(doc(firestore, 'wallets', userId), cleanForFirestore(newWallet), { merge: true }),
        setDoc(doc(firestore, 'transactions', welcomeTx.id), cleanForFirestore(welcomeTx), { merge: true })
      ]),
      new Promise<void>(res => setTimeout(res, 4000))
    ]);
    console.log('User and wallet saved to Firestore successfully for UID:', userId);
  } catch (fsErr) {
    console.warn('Firestore write note:', fsErr);
  }

  dispatchDbChange();
  return newUser;
}

export async function loginUser(identifier: string, password?: string): Promise<User> {
  const rawId = (identifier || '').trim();
  const strippedId = rawId.replace(/[\s\r\n\t'"`]/g, '');
  const term = rawId.toLowerCase();
  const strippedTerm = strippedId.toLowerCase();
  const passTerm = (password || '').trim();

  if (!rawId) {
    throw new Error('Por favor insere o teu número de telefone, email ou Nº do BI.');
  }
  if (!passTerm) {
    throw new Error('Por favor insere a tua palavra-passe.');
  }

  const cleanDigits = (s: any) => (s ? String(s).replace(/\D+/g, '') : '');
  const normPhone = (d: string) => (d.startsWith('244') && d.length > 9 ? d.slice(3) : d);
  const searchDigits = cleanDigits(rawId);
  const searchPhoneNorm = normPhone(searchDigits);

  // 1. Verificar Credenciais Oficiais do Administrador (932200719 / Adelina25 ou ID Master)
  const isMasterAdminIdentifier =
    searchPhoneNorm === '932200719' ||
    strippedTerm === 'kt5dflarjzv7hcnmq3zvgqfokm62' ||
    term === 'admin@baba.ao' ||
    term === 'admin@babashopping.ao';

  if (isMasterAdminIdentifier) {
    if (passTerm !== 'Adelina25') {
      throw new Error('Palavra-passe incorreta! Verifica os teus dados e tenta novamente.');
    }
    const users = getUsers();
    const admin =
      users.find(u => u && (u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || u.role === 'admin')) ||
      INITIAL_USERS[0];
    const adminUser: User = {
      ...admin,
      id: 'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
      name: 'Administrador Master BABA',
      email: 'admin@baba.ao',
      phone: '+244 932 200 719',
      password: 'Adelina25',
      role: 'admin',
      accountStatus: 'ativo',
      province: 'Luanda',
      city: 'Luanda (Sede Central)',
      idNumber: '000000000LA001'
    };
    memoryUsers = [adminUser, ...memoryUsers.filter(u => u && u.id !== adminUser.id && u.id !== 'dR71uBkwU4Z8k52HyDL9TdeXdeR2')];
    backupToStorage(DB_KEYS.USERS, memoryUsers);
    const adminWallet = getWallet(adminUser.id);
    if (adminWallet.availableBalance < 5000000) {
      adminWallet.availableBalance = 50000000;
      adminWallet.totalDeposited = 50000000;
      backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    }
    return setCurrentUser(adminUser);
  }

  // 2. Procurar conta existente na base de dados local (correspondência exata de email, telefone, BI ou ID)
  const users = getUsers();
  const safeStr = (v: any) => (v !== null && v !== undefined ? String(v).trim() : '');

  let matched: User | undefined = users.find(u => {
    if (!u) return false;
    const uEmail = safeStr(u.email).toLowerCase();
    const uId = safeStr(u.id);
    const uIdNum = safeStr(u.idNumber).toLowerCase();
    const uPhoneNorm = normPhone(cleanDigits(u.phone));

    if (uEmail && uEmail === term) return true;
    if (uId && (uId === rawId || uId.toLowerCase() === strippedTerm)) return true;
    if (uIdNum && uIdNum === term) return true;
    if (searchPhoneNorm.length >= 9 && uPhoneNorm && uPhoneNorm === searchPhoneNorm) return true;
    return false;
  });

  // 3. Se não encontrado localmente, sincronizar Firestore e procurar por telefone, email, BI ou ID
  if (!matched && !memoryDeletedUserIds.includes(rawId)) {
    try {
      const syncedUsers = await syncUsersFromFirestore();
      matched = syncedUsers.find(u => {
        if (!u) return false;
        const uEmail = safeStr(u.email).toLowerCase();
        const uId = safeStr(u.id);
        const uIdNum = safeStr(u.idNumber).toLowerCase();
        const uPhoneNorm = normPhone(cleanDigits(u.phone));
        if (uEmail && uEmail === term) return true;
        if (uId && (uId === rawId || uId.toLowerCase() === strippedTerm)) return true;
        if (uIdNum && uIdNum === term) return true;
        if (searchPhoneNorm.length >= 9 && uPhoneNorm && uPhoneNorm === searchPhoneNorm) return true;
        return false;
      });
    } catch {}
  }

  const assertAccountApproved = async (u: User) => {
    const isAdmin =
      u.role === 'admin' ||
      u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
      u.id === 'usr_admin';
    if (isAdmin) return;

    if (memoryDeletedUserIds.includes(u.id)) {
      try {
        await signOut(auth);
      } catch {}
      throw new Error('Esta conta foi eliminada e já não existe na plataforma.');
    }

    if (u.accountStatus === 'em_processamento') {
      try {
        await signOut(auth);
      } catch {}
      throw new Error(
        'A sua conta encontra-se em revisão. Aguarda a validação do Bilhete de Identidade e aceitação pelo Administrador.'
      );
    }

    if (u.accountStatus === 'rejeitado') {
      try {
        await signOut(auth);
      } catch {}
      const motivo =
        (u.rejectionReason || '').trim() ||
        'Documentação ou dados do Bilhete de Identidade não conformes.';
      throw new Error(`A sua conta foi rejeitada por motivo: ${motivo}`);
    }

    if (u.accountStatus === 'suspenso') {
      try {
        await signOut(auth);
      } catch {}
      const motivo =
        (u.suspensionReason || u.rejectionReason || '').trim() ||
        'Suspensão administrativa temporária por motivos de segurança.';
      throw new Error(`A sua conta encontra-se suspensa pelo Administrador. Motivo: ${motivo}`);
    }
  };

  if (!matched && rawId.includes('@')) {
    try {
      const cred = await signInWithEmailAndPassword(auth, rawId, passTerm);
      if (cred?.user) {
        let fsUser: User | null = null;
        try {
          const d = await getDoc(doc(firestore, 'users', cred.user.uid));
          if (d.exists()) {
            fsUser = { id: d.id, ...(d.data() as any) } as User;
          }
        } catch {}

        if (fsUser && !memoryDeletedUserIds.includes(fsUser.id)) {
          fsUser.password = fsUser.password || passTerm;
          await assertAccountApproved(fsUser);
          memoryUsers = [fsUser, ...memoryUsers.filter(u => u && u.id !== fsUser!.id)];
          backupToStorage(DB_KEYS.USERS, memoryUsers);
          getWallet(fsUser.id);
          return setCurrentUser(fsUser);
        }
      }
    } catch (authOrStatusErr: any) {
      if (
        authOrStatusErr?.message &&
        (authOrStatusErr.message.includes('encontra-se em revisão') ||
          authOrStatusErr.message.includes('foi rejeitada por motivo') ||
          authOrStatusErr.message.includes('encontra-se suspensa') ||
          authOrStatusErr.message.includes('foi eliminada'))
      ) {
        throw authOrStatusErr;
      }
      // Fall through to strict error below
    }
  }

  // 4. Se nenhuma conta existente corresponder aos dados -> RECUSAR ENTRADA
  if (!matched) {
    throw new Error('Conta não encontrada! Verifica o teu telefone/email ou cria uma nova conta primeiro.');
  }

  // 5. Validar estritamente a palavra-passe da conta encontrada
  if (matched.password) {
    if (passTerm !== matched.password) {
      throw new Error('Palavra-passe incorreta! Verifica a tua senha e tenta novamente.');
    }
  } else {
    // Caso seja uma conta antiga do Firestore sem campo password local, validar via Firebase Auth
    let firebaseValid = false;
    if (matched.email) {
      try {
        await signInWithEmailAndPassword(auth, matched.email, passTerm);
        firebaseValid = true;
      } catch {
        firebaseValid = false;
      }
    }
    if (!firebaseValid) {
      throw new Error('Palavra-passe incorreta! Verifica a tua senha e tenta novamente.');
    }
    matched.password = passTerm;
  }

  // 6. Bloquear entrada se a conta ainda estiver em revisão ou tiver sido rejeitada pelo Administrador
  await assertAccountApproved(matched);

  const activeMatched: User = { ...matched };
  memoryUsers = [activeMatched, ...memoryUsers.filter(u => u && u.id !== activeMatched.id)];
  backupToStorage(DB_KEYS.USERS, memoryUsers);
  getWallet(activeMatched.id);
  if (activeMatched.email) {
    signInWithEmailAndPassword(auth, activeMatched.email, passTerm).catch(() => {});
  }
  return setCurrentUser(activeMatched);
}

export function approveKYC(userId: string): User {
  const idx = memoryUsers.findIndex(u => u && u.id === userId);
  const baseUser = idx !== -1 ? memoryUsers[idx] : getUsers().find(u => u && u.id === userId);
  if (!baseUser) throw new Error('Utilizador não encontrado');

  let referralRewardPaid = !!baseUser.referralRewardPaid;
  if (baseUser.referredBy && !referralRewardPaid) {
    const refNorm = baseUser.referredBy.trim().toUpperCase();
    const inviter = getUsers().find(
      u =>
        u &&
        u.id !== userId &&
        (getUserInviteCode(u).toUpperCase() === refNorm || u.id.toUpperCase() === refNorm)
    );
    if (inviter) {
      const inviterWallet = getWallet(inviter.id);
      inviterWallet.availableBalance += 1000;
      inviterWallet.totalDeposited += 1000;
      memoryWallets[inviter.id] = inviterWallet;
      backupToStorage(DB_KEYS.WALLETS, memoryWallets);

      const bonusTx: Transaction = {
        id: `tx_ref_${Date.now()}_${userId.slice(-4)}`,
        userId: inviter.id,
        userName: inviter.name,
        amount: 1000,
        type: 'carregamento',
        description: `Bónus de Convite Validado: ${baseUser.name}`,
        status: 'confirmada',
        reference: `REF-${userId.slice(-5).toUpperCase()}`,
        createdAt: new Date().toISOString()
      };
      memoryTransactions = [bonusTx, ...memoryTransactions];
      backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

      createNotification(
        inviter.id,
        'Ganhaste +1.000 Kz de Bónus de Convite! 🎉',
        `O teu amigo ${baseUser.name} teve o BI validado pelo Administrador. 1.000,00 Kz foram creditados na tua carteira.`,
        'sistema',
        'carteira'
      );

      setDoc(doc(firestore, 'wallets', inviter.id), cleanForFirestore(inviterWallet), { merge: true }).catch(() => {});
      setDoc(doc(firestore, 'transactions', bonusTx.id), cleanForFirestore(bonusTx), { merge: true }).catch(() => {});
      referralRewardPaid = true;
    }
  }

  const updated: User = {
    ...baseUser,
    accountStatus: 'ativo',
    rejectionReason: '',
    referralRewardPaid,
    verifiedAt: new Date().toISOString()
  };
  if (idx !== -1) {
    memoryUsers[idx] = updated;
  } else {
    memoryUsers = [updated, ...memoryUsers];
  }
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  createNotification(
    userId,
    'Identidade Verificada com Sucesso! 🇦🇴',
    'O teu documento foi aprovado pelo Administrador. A tua conta está 100% ativa para compras e vendas.',
    'sistema'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'users', userId), cleanForFirestore(updated), { merge: true }).catch(err =>
    console.warn('Firestore KYC approve note:', err)
  );

  return updated;
}

export function rejectKYC(userId: string, reason: string): User {
  const idx = memoryUsers.findIndex(u => u && u.id === userId);
  const baseUser = idx !== -1 ? memoryUsers[idx] : getUsers().find(u => u && u.id === userId);
  if (!baseUser) throw new Error('Utilizador não encontrado');

  const cleanReason = (reason || '').trim() || 'Documentação ou dados do Bilhete de Identidade não conformes.';
  const updated: User = {
    ...baseUser,
    accountStatus: 'rejeitado',
    rejectionReason: cleanReason
  };
  if (idx !== -1) {
    memoryUsers[idx] = updated;
  } else {
    memoryUsers = [updated, ...memoryUsers];
  }
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  createNotification(
    userId,
    'Documento Rejeitado pelo Administrador',
    `Motivo da recusa: ${cleanReason}. Por favor anexa uma fotografia legível do documento.`,
    'sistema'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'users', userId), cleanForFirestore(updated), { merge: true }).catch(err =>
    console.warn('Firestore KYC reject note:', err)
  );

  return updated;
}

export function resubmitKYCDocuments(
  userId: string,
  idCardFront: string,
  idCardBack: string,
  idNumber?: string
): User {
  const idx = memoryUsers.findIndex(u => u && u.id === userId);
  const baseUser = idx !== -1 ? memoryUsers[idx] : getUsers().find(u => u && u.id === userId);
  if (!baseUser) throw new Error('Utilizador não encontrado');

  const updated: User = {
    ...baseUser,
    ...(idNumber && idNumber.trim() ? { idNumber: idNumber.trim().toUpperCase() } : {}),
    idCardFront,
    idCardBack,
    rejectionReason: '',
    accountStatus: 'em_processamento'
  };
  if (idx !== -1) {
    memoryUsers[idx] = updated;
  } else {
    memoryUsers = [updated, ...memoryUsers];
  }
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  if (typeof window !== 'undefined' && localStorage.getItem(DB_KEYS.CURRENT_USER_ID) === userId) {
    try {
      localStorage.setItem('baba_current_user_obj', JSON.stringify(updated));
    } catch {}
  }

  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Documento BI Reenviado para Validação 📋',
    `${updated.name} reenviou as fotografias do BI ${updated.idNumber} para nova análise no Painel Adm.`,
    'sistema',
    'admin'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'users', userId), cleanForFirestore(updated), { merge: true }).catch(err =>
    console.warn('Firestore resubmit note:', err)
  );

  return updated;
}

export function getPendingKYCUsers(): User[] {
  return getUsers().filter(u => u.accountStatus === 'em_processamento');
}

function assertAdminCaller(): void {
  const caller = getCurrentUser();
  const isAdmin =
    !!caller &&
    (caller.role === 'admin' ||
      caller.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
      caller.id === 'usr_admin');
  if (!isAdmin) {
    throw new Error('Apenas o Administrador tem permissão para suspender, reativar ou eliminar contas de utilizadores.');
  }
}

export function suspendUser(userId: string, reason?: string): User {
  assertAdminCaller();
  if (userId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || userId === 'usr_admin') {
    throw new Error('Não é possível suspender a conta do Administrador Master.');
  }
  const idx = memoryUsers.findIndex(u => u && u.id === userId);
  const baseUser = idx !== -1 ? memoryUsers[idx] : getUsers().find(u => u && u.id === userId);
  if (!baseUser) throw new Error('Utilizador não encontrado');
  if (baseUser.role === 'admin') {
    throw new Error('Não é possível suspender uma conta de Administrador.');
  }

  const cleanReason =
    (reason || '').trim() ||
    'Conta suspensa temporariamente pelo Administrador para verificação de segurança.';
  const updated: User = {
    ...baseUser,
    accountStatus: 'suspenso',
    suspensionReason: cleanReason
  };
  if (idx !== -1) {
    memoryUsers[idx] = updated;
  } else {
    memoryUsers = [updated, ...memoryUsers];
  }
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  createNotification(
    userId,
    'Conta Suspensa pelo Administrador',
    `A tua conta foi suspensa. Motivo: ${cleanReason}`,
    'sistema'
  );

  if (typeof window !== 'undefined' && localStorage.getItem(DB_KEYS.CURRENT_USER_ID) === userId) {
    localStorage.setItem('baba_current_user_obj', JSON.stringify(updated));
  }

  dispatchDbChange();
  setDoc(doc(firestore, 'users', userId), cleanForFirestore(updated), { merge: true }).catch(err =>
    console.warn('Firestore suspend note:', err)
  );

  return updated;
}

export function reactivateUser(userId: string): User {
  assertAdminCaller();
  const idx = memoryUsers.findIndex(u => u && u.id === userId);
  const baseUser = idx !== -1 ? memoryUsers[idx] : getUsers().find(u => u && u.id === userId);
  if (!baseUser) throw new Error('Utilizador não encontrado');

  const updated: User = {
    ...baseUser,
    accountStatus: 'ativo',
    suspensionReason: '',
    rejectionReason: '',
    verifiedAt: baseUser.verifiedAt || new Date().toISOString()
  };
  if (idx !== -1) {
    memoryUsers[idx] = updated;
  } else {
    memoryUsers = [updated, ...memoryUsers];
  }
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  createNotification(
    userId,
    'Conta Reativada pelo Administrador! 🇦🇴',
    'A suspensão da tua conta foi levantada. Já podes iniciar sessão e operar normalmente na plataforma.',
    'sistema'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'users', userId), cleanForFirestore(updated), { merge: true }).catch(err =>
    console.warn('Firestore reactivate note:', err)
  );

  return updated;
}

export function deleteUserAccount(userId: string): void {
  assertAdminCaller();
  if (userId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || userId === 'usr_admin') {
    throw new Error('Não é possível eliminar a conta do Administrador Master.');
  }
  const target = getUsers().find(u => u && u.id === userId);
  if (target?.role === 'admin') {
    throw new Error('Não é possível eliminar uma conta de Administrador.');
  }

  if (!memoryDeletedUserIds.includes(userId)) {
    memoryDeletedUserIds = [...memoryDeletedUserIds, userId];
    backupToStorage(DB_KEYS.DELETED_USERS, memoryDeletedUserIds);
  }

  memoryUsers = memoryUsers.filter(u => u && u.id !== userId);
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  if (memoryWallets[userId]) {
    delete memoryWallets[userId];
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
  }

  // Cancelar/remover anúncios ativos de revenda pertencentes ao utilizador eliminado
  const removedListingIds = memoryResaleListings
    .filter(l => l && l.sellerId === userId)
    .map(l => l.id);
  memoryResaleListings = memoryResaleListings.filter(l => l && l.sellerId !== userId);
  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);

  memoryUserProducts = memoryUserProducts.filter(up => up && up.currentOwnerId !== userId);
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  if (typeof window !== 'undefined' && localStorage.getItem(DB_KEYS.CURRENT_USER_ID) === userId) {
    localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
    localStorage.removeItem('baba_current_user_obj');
    signOut(auth).catch(() => {});
  }

  dispatchDbChange();

  deleteDoc(doc(firestore, 'users', userId)).catch(err =>
    console.warn('Firestore delete user note:', err)
  );
  deleteDoc(doc(firestore, 'wallets', userId)).catch(() => {});
  removedListingIds.forEach(listingId => {
    deleteDoc(doc(firestore, 'resale_listings', listingId)).catch(() => {});
  });
}

// ==========================================
// WALLET & TRANSACTIONS
// ==========================================
export function getWallets(): Record<string, Wallet> {
  return memoryWallets;
}

export function getWallet(userId: string): Wallet {
  let wallet = memoryWallets[userId];
  if (!wallet) {
    wallet = {
      userId,
      availableBalance: 500,
      pendingBalance: 0,
      reservedBalance: 0,
      totalDeposited: 500,
      totalSpent: 0,
      totalEarned: 0,
      totalWithdrawn: 0
    };
    memoryWallets[userId] = wallet;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    setDoc(doc(firestore, 'wallets', userId), wallet).catch(err =>
      console.warn('Firestore wallet create note:', err)
    );
  } else if (
    (wallet.availableBalance === 500000 || wallet.availableBalance === 950000 || wallet.availableBalance === 5000000) &&
    (wallet.totalSpent === 0 || !wallet.totalSpent)
  ) {
    // Reconcile initial starter balance strictly to 500 Kz
    wallet.availableBalance = 500;
    wallet.totalDeposited = 500;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    setDoc(doc(firestore, 'wallets', userId), wallet, { merge: true }).catch(err =>
      console.warn('Firestore wallet reset note:', err)
    );
  }
  return wallet;
}

export function getPendingReservedAmount(userId: string): number {
  const pendingWithdrawals = memoryWithdrawals
    .filter(w => w && w.userId === userId && w.status === 'pendente')
    .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);
  const pendingOrders = memoryOrders
    .filter(o => o && o.buyerId === userId && o.status === 'aguardando_aprovacao')
    .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  return pendingWithdrawals + pendingOrders;
}

export function getSpendableBalance(userId: string): number {
  const wallet = getWallet(userId);
  return Math.max(0, (Number(wallet.availableBalance) || 0) - getPendingReservedAmount(userId));
}

export function getAllTransactions(): Transaction[] {
  const byId = new Map<string, Transaction>();
  memoryTransactions.forEach(tx => {
    if (tx && tx.id) byId.set(tx.id, tx);
  });

  // Garantir que todo depósito aparece sempre no extrato/movimentos mesmo em sincronização parcial
  memoryDeposits.forEach(d => {
    if (!d || !d.id) return;
    const txId = `tx_dep_${d.id}`;
    if (!byId.has(txId)) {
      const mappedStatus: Transaction['status'] =
        d.status === 'aprovado' ? 'confirmada' : d.status === 'rejeitado' ? 'recusada' : 'pendente';
      byId.set(txId, {
        id: txId,
        userId: d.userId,
        userName: d.userName,
        type: 'carregamento',
        amount: Number(d.amount) || 0,
        status: mappedStatus,
        reference: d.reference || d.id,
        description:
          mappedStatus === 'confirmada'
            ? `Carregamento Aprovado pelo Administrador (${d.reference})`
            : mappedStatus === 'recusada'
            ? `Depósito Recusado pelo Administrador (${d.reference})${d.rejectionReason ? ` — Motivo: ${d.rejectionReason}` : ''}`
            : `Depósito via ${d.paymentMethod === 'paypay' ? 'PayPay' : 'Multicaixa Express'} — Aguardando aprovação do Adm`,
        paymentMethod: d.paymentMethod,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt
      });
    }
  });

  // Garantir que todo saque aparece sempre no extrato/movimentos
  memoryWithdrawals.forEach(w => {
    if (!w || !w.id) return;
    const txId = `tx_wth_${w.id}`;
    if (!byId.has(txId)) {
      const mappedStatus: Transaction['status'] =
        w.status === 'processado' ? 'confirmada' : w.status === 'rejeitado' ? 'recusada' : 'pendente';
      byId.set(txId, {
        id: txId,
        userId: w.userId,
        userName: w.userName,
        type: 'levantamento',
        amount: -(Number(w.amount) || 0),
        status: mappedStatus,
        reference: `WTH-${w.id.slice(-6)}`,
        description:
          mappedStatus === 'confirmada'
            ? `Saque Aprovado & Debitado — ${w.bankName} (${w.iban})`
            : mappedStatus === 'recusada'
            ? `Saque Recusado pelo Administrador (${w.bankName})${w.rejectionReason ? ` — Motivo: ${w.rejectionReason}` : ''}`
            : `Saque para ${w.bankName} (${w.iban}) — Aguardando aprovação do Adm`,
        rejectionReason: w.rejectionReason,
        createdAt: w.createdAt
      });
    }
  });

  // Garantir que todo pedido de compra (oficial ou revenda) aparece sempre no extrato/movimentos
  memoryOrders.forEach(o => {
    if (!o || !o.id) return;
    const txId = `tx_ord_${o.id}`;
    if (!byId.has(txId)) {
      const mappedStatus: Transaction['status'] =
        o.status === 'aguardando_aprovacao' || o.status === 'aguardando_pagamento'
          ? 'pendente'
          : o.status === 'cancelado'
          ? 'recusada'
          : 'confirmada';
      const itemLabel = o.items.map(it => `${it.quantity}x ${it.name}`).join(', ') || 'Artigo BABA';
      byId.set(txId, {
        id: txId,
        userId: o.buyerId,
        userName: o.buyerName,
        type: o.source === 'revenda' ? 'compra_revenda' : 'compra_oficial',
        amount: -(Number(o.totalAmount) || 0),
        status: mappedStatus,
        reference: o.paymentReference || o.id,
        description:
          mappedStatus === 'confirmada'
            ? `${o.source === 'revenda' ? 'Compra Revenda' : 'Compra Oficial'} Aprovada: ${itemLabel}`
            : mappedStatus === 'recusada'
            ? `${o.source === 'revenda' ? 'Compra Revenda' : 'Compra Oficial'} Recusada: ${itemLabel}${o.rejectionReason ? ` — Motivo: ${o.rejectionReason}` : ''}`
            : `${o.source === 'revenda' ? 'Compra Revenda P2P' : 'Compra Oficial'}: ${itemLabel} — Aguardando aprovação do Adm`,
        rejectionReason: o.rejectionReason,
        createdAt: o.createdAt
      });
    }
  });

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTransactions(userId: string): Transaction[] {
  return getAllTransactions().filter(t => t.userId === userId);
}

export function adjustUserBalance(
  userId: string,
  amount: number,
  type: 'add' | 'remove',
  reason: string,
  adminId: string = 'kt5dFLArJzV7hCNMQ3ZvgqFokM62'
): { wallet: Wallet; transaction: Transaction } {
  const users = getUsers();
  const user = users.find(u => u && u.id === userId);
  if (!user) throw new Error('Utilizador não encontrado');

  const wallet = getWallet(userId);
  const numericAmount = Math.abs(Number(amount));
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor insere um montante válido superior a 0 Kz.');
  }

  if (type === 'remove' && wallet.availableBalance < numericAmount) {
    throw new Error(`Saldo insuficiente para debitar. O utilizador dispõe de ${formatKz(wallet.availableBalance)}.`);
  }

  if (type === 'add') {
    wallet.availableBalance += numericAmount;
    wallet.totalDeposited += numericAmount;
  } else {
    wallet.availableBalance -= numericAmount;
    wallet.totalSpent += numericAmount;
  }

  memoryWallets[userId] = wallet;
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const tx: Transaction = {
    id: `tx_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName: user.name,
    amount: type === 'add' ? numericAmount : -numericAmount,
    type: 'carregamento',
    description: reason.trim() || (type === 'add' ? 'Crédito manual pelo Administrador' : 'Débito manual pelo Administrador'),
    status: 'confirmada',
    reference: `ADM-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString()
  };

  memoryTransactions = [tx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    userId,
    type === 'add' ? 'Saldo Creditado pelo Administrador 💰' : 'Ajuste de Saldo na Carteira',
    type === 'add'
      ? `Foram creditados ${formatKz(numericAmount)} na tua carteira digital BABA. Motivo: ${reason.trim() || 'Ajuste administrativo'}.`
      : `Foi debitado o valor de ${formatKz(numericAmount)} da tua carteira digital BABA. Motivo: ${reason.trim() || 'Ajuste administrativo'}.`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();

  setDoc(doc(firestore, 'wallets', userId), cleanForFirestore(wallet), { merge: true }).catch(() => {});
  setDoc(doc(firestore, 'transactions', tx.id), cleanForFirestore(tx)).catch(() => {});

  return { wallet, transaction: tx };
}

export function getDeposits(): DepositRequest[] {
  return memoryDeposits;
}

export function getWithdrawals(): WithdrawalRequest[] {
  return memoryWithdrawals;
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
  if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor, seleciona um montante válido para depósito.');
  }

  const user = getUsers().find(u => u.id === userId);
  const nowIso = new Date().toISOString();
  const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newDeposit: DepositRequest = {
    id: depositId,
    userId,
    userName: user ? user.name : 'Cliente',
    amount: numericAmount,
    paymentMethod,
    reference,
    receiptProof,
    status: 'pendente',
    createdAt: nowIso
  };

  memoryDeposits = [newDeposit, ...memoryDeposits];
  backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);

  // Registar imediatamente no extrato do utilizador como PENDENTE (não credita saldo até Adm aprovar)
  const pendingTx: Transaction = {
    id: `tx_dep_${depositId}`,
    userId,
    userName: newDeposit.userName,
    type: 'carregamento',
    amount: numericAmount,
    status: 'pendente',
    reference,
    description: `Depósito via ${paymentMethod === 'paypay' ? 'PayPay' : 'Multicaixa Express'} — Aguardando aprovação do Adm`,
    paymentMethod,
    createdAt: nowIso
  };
  memoryTransactions = [pendingTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Novo Depósito Pendente de Aprovação 💰',
    `${newDeposit.userName} solicitou um depósito de ${formatMoney(numericAmount)} (Ref: ${reference}). Aprova no Painel do Adm para creditar na carteira.`,
    'sistema',
    'admin',
    newDeposit.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'deposits', newDeposit.id), cleanForFirestore(newDeposit)).catch(err => {
    console.warn('Firestore deposit request note (retrying lightweight copy):', err);
    const { receiptProof: _bigProof, ...lightweight } = newDeposit;
    setDoc(
      doc(firestore, 'deposits', newDeposit.id),
      cleanForFirestore({ ...lightweight, receiptProof: receiptProof ? '' : undefined })
    ).catch(() => {});
  });
  setDoc(doc(firestore, 'transactions', pendingTx.id), cleanForFirestore(pendingTx)).catch(err =>
    console.warn('Firestore pending deposit tx note:', err)
  );

  return newDeposit;
}

export function approveDeposit(depositId: string): DepositRequest {
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de carregamento não encontrado');
  const deposit = memoryDeposits[idx];
  if (deposit.status === 'aprovado') return deposit;

  deposit.status = 'aprovado';
  backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);

  const wallet = getWallet(deposit.userId);
  wallet.availableBalance += Number(deposit.amount) || 0;
  wallet.totalDeposited += Number(deposit.amount) || 0;
  memoryWallets[deposit.userId] = wallet;
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const linkedTxId = `tx_dep_${depositId}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  let finalTx: Transaction;
  if (txIdx !== -1) {
    finalTx = {
      ...memoryTransactions[txIdx],
      status: 'confirmada',
      description: `Carregamento Aprovado pelo Administrador (${deposit.reference})`
    };
    memoryTransactions[txIdx] = finalTx;
  } else {
    finalTx = {
      id: linkedTxId,
      userId: deposit.userId,
      userName: deposit.userName,
      amount: deposit.amount,
      type: 'carregamento',
      description: `Carregamento Aprovado pelo Administrador (${deposit.reference})`,
      status: 'confirmada',
      reference: deposit.reference,
      paymentMethod: deposit.paymentMethod,
      createdAt: deposit.createdAt || new Date().toISOString()
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    deposit.userId,
    'Depósito Aprovado & Creditado! 💰',
    `O teu depósito de ${formatMoney(deposit.amount)} foi aprovado pelo Administrador e creditado na tua carteira.`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'deposits', depositId), cleanForFirestore(deposit), { merge: true }).catch(err =>
    console.warn('Firestore approve deposit note:', err)
  );
  setDoc(doc(firestore, 'wallets', deposit.userId), cleanForFirestore(wallet), { merge: true }).catch(err =>
    console.warn('Firestore wallet credit note:', err)
  );
  setDoc(doc(firestore, 'transactions', finalTx.id), cleanForFirestore(finalTx), { merge: true }).catch(err =>
    console.warn('Firestore tx save note:', err)
  );

  return deposit;
}

export function rejectDeposit(depositId: string, reason?: string): DepositRequest {
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de carregamento não encontrado');
  const deposit = memoryDeposits[idx];
  if (deposit.status !== 'pendente') return deposit;

  const cleanReason = (reason || '').trim();
  deposit.status = 'rejeitado';
  if (cleanReason) {
    deposit.rejectionReason = cleanReason;
  }
  backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);

  const linkedTxId = `tx_dep_${depositId}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  const rejectedDesc = cleanReason
    ? `Depósito Recusado (${deposit.reference}) — Motivo: ${cleanReason}`
    : `Depósito Recusado pelo Administrador (${deposit.reference})`;
  let finalTx: Transaction;
  if (txIdx !== -1) {
    finalTx = {
      ...memoryTransactions[txIdx],
      status: 'recusada',
      description: rejectedDesc,
      ...(cleanReason ? { rejectionReason: cleanReason } : {})
    };
    memoryTransactions[txIdx] = finalTx;
  } else {
    finalTx = {
      id: linkedTxId,
      userId: deposit.userId,
      userName: deposit.userName,
      amount: deposit.amount,
      type: 'carregamento',
      description: rejectedDesc,
      status: 'recusada',
      reference: deposit.reference,
      paymentMethod: deposit.paymentMethod,
      ...(cleanReason ? { rejectionReason: cleanReason } : {}),
      createdAt: deposit.createdAt || new Date().toISOString()
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    deposit.userId,
    'Depósito Recusado pelo Administrador ❌',
    `O teu pedido de depósito de ${formatMoney(deposit.amount)} (Ref: ${deposit.reference}) foi recusado.${cleanReason ? ` Motivo: ${cleanReason}` : ''}`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'deposits', depositId), cleanForFirestore(deposit), { merge: true }).catch(err =>
    console.warn('Firestore reject deposit note:', err)
  );
  setDoc(doc(firestore, 'transactions', finalTx.id), cleanForFirestore(finalTx), { merge: true }).catch(err =>
    console.warn('Firestore reject deposit tx note:', err)
  );

  return deposit;
}

export const MIN_WITHDRAWAL_AMOUNT = 2000;

export function requestWithdrawal(
  userId: string,
  amount: number,
  iban: string,
  bankName: string,
  accountHolder?: string
): WithdrawalRequest {
  const numericAmount = Number(amount);
  if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor, introduz o montante que desejas sacar.');
  }
  if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`O valor mínimo para saque é de ${formatMoney(MIN_WITHDRAWAL_AMOUNT)}.`);
  }

  const wallet = getWallet(userId);
  const reservedSum = getPendingReservedAmount(userId);
  const withdrawableBalance = Math.max(0, wallet.availableBalance - reservedSum);

  if (numericAmount > withdrawableBalance) {
    if (reservedSum > 0 && numericAmount <= wallet.availableBalance) {
      throw new Error(
        `Já tens ${formatMoney(reservedSum)} em movimentos pendentes de aprovação pelo Administrador. Podes movimentar até ${formatMoney(withdrawableBalance)}.`
      );
    }
    throw new Error(`Saldo insuficiente. O teu saldo disponível para levantamento é de ${formatMoney(wallet.availableBalance)}.`);
  }

  // NÃO debita wallet.availableBalance agora — só será debitado quando o Administrador aprovar!
  const user = getUsers().find(u => u.id === userId);
  const nowIso = new Date().toISOString();
  const withdrawalId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newWithdrawal: WithdrawalRequest = {
    id: withdrawalId,
    userId,
    userName: user ? user.name : 'Cliente',
    amount: numericAmount,
    bankName: bankName?.trim() || 'Banco em Angola',
    iban: iban.trim(),
    accountHolder: accountHolder?.trim() || (user ? user.name : 'Cliente'),
    status: 'pendente',
    createdAt: nowIso
  };

  memoryWithdrawals = [newWithdrawal, ...memoryWithdrawals];
  backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);

  // Registar imediatamente no extrato do utilizador como PENDENTE (sem debitar ainda)
  const pendingTx: Transaction = {
    id: `tx_wth_${withdrawalId}`,
    userId,
    userName: newWithdrawal.userName,
    type: 'levantamento',
    amount: -numericAmount,
    status: 'pendente',
    reference: `WTH-${withdrawalId.slice(-6)}`,
    description: `Saque para ${newWithdrawal.bankName} (${newWithdrawal.iban}) — Aguardando aprovação do Adm`,
    createdAt: nowIso
  };
  memoryTransactions = [pendingTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Novo Saque Pendente de Aprovação 🏦',
    `${newWithdrawal.userName} solicitou um levantamento de ${formatMoney(numericAmount)} para ${newWithdrawal.bankName} (${newWithdrawal.iban}).`,
    'sistema',
    'admin',
    newWithdrawal.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'withdrawals', newWithdrawal.id), cleanForFirestore(newWithdrawal)).catch(err =>
    console.warn('Firestore withdrawal request note:', err)
  );
  setDoc(doc(firestore, 'transactions', pendingTx.id), cleanForFirestore(pendingTx)).catch(err =>
    console.warn('Firestore pending withdrawal tx note:', err)
  );

  return newWithdrawal;
}

export function processWithdrawal(
  withdrawalId: string,
  status: 'processado' | 'rejeitado',
  reason?: string
): WithdrawalRequest {
  const idx = memoryWithdrawals.findIndex(w => w.id === withdrawalId);
  if (idx === -1) throw new Error('Pedido de levantamento não encontrado');
  const wth = memoryWithdrawals[idx];
  if (wth.status !== 'pendente') return wth;

  const cleanReason = (reason || '').trim();
  const wallet = getWallet(wth.userId);
  const linkedTxId = `tx_wth_${withdrawalId}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  const isNewNonDebitedFlow = txIdx !== -1 || wallet.pendingBalance < wth.amount;

  if (status === 'processado') {
    if (isNewNonDebitedFlow) {
      if (wallet.availableBalance < wth.amount) {
        throw new Error(
          `Saldo insuficiente na conta do utilizador (${formatMoney(wallet.availableBalance)}) para aprovar e debitar ${formatMoney(wth.amount)}.`
        );
      }
      wallet.availableBalance -= wth.amount;
    } else {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - wth.amount);
    }
    wallet.totalWithdrawn += wth.amount;
  } else {
    // Rejeitado: se era pedido antigo com pendingBalance congelado, devolve; se novo fluxo, nada foi debitado
    if (!isNewNonDebitedFlow && wallet.pendingBalance >= wth.amount) {
      wallet.pendingBalance -= wth.amount;
      wallet.availableBalance += wth.amount;
    }
    if (cleanReason) {
      wth.rejectionReason = cleanReason;
    }
  }

  wth.status = status;
  memoryWallets[wth.userId] = wallet;
  backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const rejectedDesc = cleanReason
    ? `Saque Recusado (${wth.bankName}) — Motivo: ${cleanReason}`
    : `Saque Recusado pelo Administrador (${wth.bankName})`;

  let finalTx: Transaction;
  if (txIdx !== -1) {
    finalTx = {
      ...memoryTransactions[txIdx],
      status: status === 'processado' ? 'confirmada' : 'recusada',
      description:
        status === 'processado'
          ? `Saque Aprovado & Debitado — ${wth.bankName} (${wth.iban})`
          : rejectedDesc,
      ...(status === 'rejeitado' && cleanReason ? { rejectionReason: cleanReason } : {})
    };
    memoryTransactions[txIdx] = finalTx;
  } else {
    finalTx = {
      id: linkedTxId,
      userId: wth.userId,
      userName: wth.userName,
      amount: -wth.amount,
      type: 'levantamento',
      description:
        status === 'processado'
          ? `Saque Aprovado & Debitado — ${wth.bankName} (${wth.iban})`
          : rejectedDesc,
      status: status === 'processado' ? 'confirmada' : 'recusada',
      reference: `WTH-${withdrawalId.slice(-6)}`,
      ...(status === 'rejeitado' && cleanReason ? { rejectionReason: cleanReason } : {}),
      createdAt: wth.createdAt || new Date().toISOString()
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    wth.userId,
    status === 'processado' ? 'Levantamento Aprovado & Debitado ✅' : 'Levantamento Recusado ❌',
    status === 'processado'
      ? `O teu saque de ${formatMoney(wth.amount)} foi aprovado pelo Administrador, debitado da tua conta e marcado como Sucesso no extrato.`
      : `O teu pedido de saque de ${formatMoney(wth.amount)} foi recusado pelo Administrador.${cleanReason ? ` Motivo: ${cleanReason}` : ''} O teu saldo disponível não foi alterado.`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'withdrawals', withdrawalId), cleanForFirestore(wth), { merge: true }).catch(err =>
    console.warn('Firestore process withdrawal note:', err)
  );
  setDoc(doc(firestore, 'wallets', wth.userId), cleanForFirestore(wallet), { merge: true }).catch(err =>
    console.warn('Firestore wallet update note:', err)
  );
  setDoc(doc(firestore, 'transactions', finalTx.id), cleanForFirestore(finalTx), { merge: true }).catch(err =>
    console.warn('Firestore tx update note:', err)
  );

  return wth;
}

// ==========================================
// USER PRODUCTS (Meus Produtos)
// ==========================================
export function getUserProducts(userId: string): UserProduct[] {
  return memoryUserProducts.filter(up => up.currentOwnerId === userId);
}

// ==========================================
// RESALE LISTINGS (Mercado de Revenda)
// ==========================================
export function getAllResaleListings(): ResaleListing[] {
  const base = memoryResaleListings.length > 0 ? memoryResaleListings : INITIAL_RESALE_LISTINGS;
  return base.map(l => ({
    ...l,
    listingPrice: Math.max(5000, Math.min(450000, Number(l.listingPrice) || 5000)),
    originalPrice: Math.max(5000, Math.min(450000, Number(l.originalPrice) || 5000))
  }));
}

export function getResaleListings(): ResaleListing[] {
  return getAllResaleListings().filter(l => l.status === 'ativo');
}

export function createResaleListing(
  userProductId: string,
  sellerId: string,
  listingPrice: number,
  customDescription: string,
  minAcceptablePrice = 0,
  allowNegotiation = true
): ResaleListing {
  const upIdx = memoryUserProducts.findIndex(
    up => up.id === userProductId && up.currentOwnerId === sellerId
  );
  if (upIdx === -1) throw new Error('Produto não encontrado no teu inventário');

  const userProd = memoryUserProducts[upIdx];
  if (userProd.status === 'vendido') {
    throw new Error('Este artigo já foi vendido.');
  }
  const user = getUsers().find(u => u.id === sellerId);
  const isAdmin =
    sellerId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
    sellerId === 'usr_admin' ||
    user?.role === 'admin';
  const nowIso = new Date().toISOString();

  const newListing: ResaleListing = {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    userProductId,
    sellerId,
    sellerName: user ? user.name : 'Vendedor BABA',
    productName: userProd.productName,
    category: userProd.category,
    originalPrice: userProd.originalPrice,
    listingPrice,
    minAcceptablePrice: minAcceptablePrice || Math.round(listingPrice * 0.8),
    customDescription: customDescription || userProd.productName,
    allowNegotiation,
    status: isAdmin ? 'ativo' : 'pendente',
    selectedColor: userProd.selectedColor,
    createdAt: nowIso,
    updatedAt: nowIso,
    imageUrl: userProd.productImage
  };

  userProd.status = 'anunciado';

  memoryResaleListings = [newListing, ...memoryResaleListings];
  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  if (!isAdmin) {
    createNotification(
      'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
      'Novo Anúncio de Revenda Pendente 📦',
      `${newListing.sellerName} submeteu "${newListing.productName}" por ${formatMoney(listingPrice)} para aprovação no Mercado de Revenda.`,
      'sistema',
      'admin',
      newListing.id
    );
  }

  dispatchDbChange();
  setDoc(doc(firestore, 'resale_listings', newListing.id), cleanForFirestore(newListing)).catch(err =>
    console.warn('Firestore listing note:', err)
  );
  setDoc(doc(firestore, 'user_products', userProd.id), cleanForFirestore(userProd), { merge: true }).catch(err =>
    console.warn('Firestore user product note:', err)
  );

  return newListing;
}

export function approveResaleListing(listingId: string): ResaleListing {
  const listIdx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (listIdx === -1) throw new Error('Anúncio não encontrado');
  const listing = memoryResaleListings[listIdx];
  if (listing.status === 'ativo') return listing;

  listing.status = 'ativo';
  listing.rejectionReason = '';
  listing.updatedAt = new Date().toISOString();

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx].status = 'anunciado';
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
    setDoc(doc(firestore, 'user_products', memoryUserProducts[upIdx].id), cleanForFirestore(memoryUserProducts[upIdx]), { merge: true }).catch(() => {});
  }

  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);

  createNotification(
    listing.sellerId,
    'Anúncio de Revenda Aprovado! ✅',
    `O teu anúncio "${listing.productName}" (${formatMoney(listing.listingPrice)}) foi aprovado pelo Administrador e já está visível no Mercado de Revenda.`,
    'venda',
    'produto',
    listing.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'resale_listings', listingId), cleanForFirestore(listing), { merge: true }).catch(err =>
    console.warn('Firestore listing approve note:', err)
  );
  return listing;
}

export function rejectResaleListing(listingId: string, reason: string): ResaleListing {
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição do anúncio.');
  }
  const listIdx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (listIdx === -1) throw new Error('Anúncio não encontrado');
  const listing = memoryResaleListings[listIdx];

  listing.status = 'rejeitado';
  listing.rejectionReason = cleanReason;
  listing.updatedAt = new Date().toISOString();

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx].status = 'disponivel';
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
    setDoc(doc(firestore, 'user_products', memoryUserProducts[upIdx].id), cleanForFirestore(memoryUserProducts[upIdx]), { merge: true }).catch(() => {});
  }

  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);

  createNotification(
    listing.sellerId,
    'Anúncio de Revenda Recusado ❌',
    `O teu anúncio "${listing.productName}" foi recusado pelo Administrador. Motivo: ${cleanReason}`,
    'sistema',
    'produto',
    listing.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'resale_listings', listingId), cleanForFirestore(listing), { merge: true }).catch(err =>
    console.warn('Firestore listing reject note:', err)
  );
  return listing;
}

export function cancelResaleListing(listingId: string, sellerId: string): void {
  const listIdx = memoryResaleListings.findIndex(
    l => l.id === listingId && l.sellerId === sellerId
  );
  if (listIdx === -1) throw new Error('Anúncio não encontrado ou sem permissão');

  const listing = memoryResaleListings[listIdx];
  listing.status = 'pausado';
  listing.updatedAt = new Date().toISOString();

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx].status = 'disponivel';
    setDoc(doc(firestore, 'user_products', memoryUserProducts[upIdx].id), cleanForFirestore(memoryUserProducts[upIdx]), { merge: true }).catch(err =>
      console.warn('Firestore user product cancel note:', err)
    );
  }

  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  dispatchDbChange();
  setDoc(doc(firestore, 'resale_listings', listingId), cleanForFirestore(listing), { merge: true }).catch(err =>
    console.warn('Firestore listing cancel note:', err)
  );
}

function executeConfirmedResaleSettlement(
  listing: ResaleListing,
  buyerId: string,
  paidPrice: number,
  existingOrder?: Order
): Order {
  const buyerWallet = getWallet(buyerId);
  const isAdminOrPersona =
    buyerId.startsWith('persona_') ||
    buyerId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
    buyerId === 'usr_admin';

  if (buyerWallet.availableBalance < paidPrice) {
    if (isAdminOrPersona) {
      buyerWallet.availableBalance += paidPrice + 10000000;
      buyerWallet.totalDeposited += paidPrice + 10000000;
    } else {
      throw new Error(
        `Saldo insuficiente na carteira de ${existingOrder?.buyerName || 'comprador'} (${formatMoney(buyerWallet.availableBalance)}) para concluir a compra de ${formatMoney(paidPrice)}.`
      );
    }
  }

  const buyerUser = getUsers().find(u => u.id === buyerId);
  const sellerUser = getUsers().find(u => u.id === listing.sellerId);
  const nowIso = new Date().toISOString();

  buyerWallet.availableBalance -= paidPrice;
  buyerWallet.totalSpent += paidPrice;

  const orderId = existingOrder?.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const buyTxId = `tx_ord_${orderId}`;
  const existingBuyIdx = memoryTransactions.findIndex(t => t.id === buyTxId);
  const buyTx: Transaction = {
    id: buyTxId,
    userId: buyerId,
    userName: existingOrder?.buyerName || (buyerUser ? buyerUser.name : 'Comprador'),
    amount: -paidPrice,
    type: 'compra_revenda',
    description: `Compra Aprovada no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: existingOrder?.createdAt || nowIso
  };
  if (existingBuyIdx !== -1) {
    memoryTransactions[existingBuyIdx] = buyTx;
  } else {
    memoryTransactions = [buyTx, ...memoryTransactions];
  }

  const sellerWallet = getWallet(listing.sellerId);
  sellerWallet.availableBalance += paidPrice;
  sellerWallet.totalEarned += paidPrice;

  const sellTx: Transaction = {
    id: `tx_${Date.now()}_sell_${Math.random().toString(36).substring(2, 5)}`,
    userId: listing.sellerId,
    userName: sellerUser ? sellerUser.name : listing.sellerName || 'Vendedor',
    amount: paidPrice,
    type: 'venda_recebida',
    description: `Venda Aprovada no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: nowIso
  };

  memoryTransactions = [sellTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  listing.status = 'vendido';
  listing.updatedAt = nowIso;

  memoryNegotiations.forEach(n => {
    if (n.listingId === listing.id) {
      if (n.buyerId === buyerId || n.status === 'aceite') {
        n.status = 'concluida';
        n.statusMessage = 'Compra aprovada e concluída com sucesso!';
        setDoc(doc(firestore, 'negotiations', n.id), cleanForFirestore(n), { merge: true }).catch(() => {});
      } else if (n.status === 'pendente' || n.status === 'contraproposta' || n.status === 'aguardando_adm') {
        n.status = 'cancelada';
        n.statusMessage = 'Artigo adquirido por outro comprador';
        setDoc(doc(firestore, 'negotiations', n.id), cleanForFirestore(n), { merge: true }).catch(() => {});
      }
    }
  });
  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  const oldItemIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (oldItemIdx !== -1) {
    memoryUserProducts[oldItemIdx].status = 'vendido';
    setDoc(doc(firestore, 'user_products', memoryUserProducts[oldItemIdx].id), cleanForFirestore(memoryUserProducts[oldItemIdx]), { merge: true }).catch(() => {});
  }

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
        buyerName: buyerUser ? buyerUser.name : 'Comprador',
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

  const ordIdx = memoryOrders.findIndex(o => o.id === confirmedOrder.id);
  if (ordIdx !== -1) {
    memoryOrders[ordIdx] = confirmedOrder;
  } else {
    memoryOrders = [confirmedOrder, ...memoryOrders];
  }

  backupToStorage(DB_KEYS.ORDERS, memoryOrders);
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);
  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  createNotification(
    listing.sellerId,
    'Artigo Vendido no Mercado de Revenda! 🎉',
    `O teu produto "${listing.productName}" foi comprado por ${formatMoney(paidPrice)}. O montante foi creditado na tua carteira.`,
    'venda',
    'carteira'
  );

  if (!isAdminOrPersona) {
    createNotification(
      buyerId,
      'Compra P2P Aprovada & Produto Entregue! 📦',
      `A tua compra de "${listing.productName}" (${formatMoney(paidPrice)}) foi aprovada pelo Administrador e já está em "Meus Produtos".`,
      'compra',
      'produto',
      newItem.id
    );
  }

  dispatchDbChange();

  setDoc(doc(firestore, 'wallets', buyerId), cleanForFirestore(buyerWallet), { merge: true }).catch(err =>
    console.warn('Firestore buyer wallet note:', err)
  );
  setDoc(doc(firestore, 'wallets', listing.sellerId), cleanForFirestore(sellerWallet), { merge: true }).catch(err =>
    console.warn('Firestore seller wallet note:', err)
  );
  setDoc(doc(firestore, 'resale_listings', listing.id), cleanForFirestore(listing), { merge: true }).catch(err =>
    console.warn('Firestore sold listing note:', err)
  );
  setDoc(doc(firestore, 'user_products', newItem.id), cleanForFirestore(newItem)).catch(err =>
    console.warn('Firestore new item note:', err)
  );
  setDoc(doc(firestore, 'transactions', buyTx.id), cleanForFirestore(buyTx), { merge: true }).catch(err =>
    console.warn('Firestore buy tx note:', err)
  );
  setDoc(doc(firestore, 'transactions', sellTx.id), cleanForFirestore(sellTx)).catch(err =>
    console.warn('Firestore sell tx note:', err)
  );
  setDoc(doc(firestore, 'orders', confirmedOrder.id), cleanForFirestore(confirmedOrder), { merge: true }).catch(err =>
    console.warn('Firestore order save note:', err)
  );

  return confirmedOrder;
}

export function purchaseResaleListing(
  listingId: string,
  buyerId: string,
  paidPrice: number
): { id: string; pendingApproval?: boolean } {
  const listIdx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (listIdx === -1) throw new Error('Anúncio não encontrado');

  const listing = memoryResaleListings[listIdx];
  if (listing.status !== 'ativo') {
    throw new Error('Este anúncio não está disponível para compra no momento.');
  }
  if (listing.sellerId === buyerId) {
    throw new Error('Não podes comprar o teu próprio anúncio');
  }

  const buyerUser = getUsers().find(u => u.id === buyerId);
  const isAdminOrPersona =
    buyerId.startsWith('persona_') ||
    buyerId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
    buyerId === 'usr_admin' ||
    buyerUser?.role === 'admin';

  if (isAdminOrPersona) {
    const confirmed = executeConfirmedResaleSettlement(listing, buyerId, paidPrice);
    return { id: confirmed.id, pendingApproval: false };
  }

  const wallet = getWallet(buyerId);
  const spendable = getSpendableBalance(buyerId);
  if (paidPrice > spendable) {
    const reserved = getPendingReservedAmount(buyerId);
    if (reserved > 0 && paidPrice <= wallet.availableBalance) {
      throw new Error(
        `Já tens ${formatMoney(reserved)} em movimentos pendentes de aprovação. O teu saldo livre atual é ${formatMoney(spendable)}.`
      );
    }
    throw new Error('Saldo insuficiente na carteira para solicitar esta compra.');
  }

  const nowIso = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ref = `P2P-${orderId.slice(-6).toUpperCase()}`;

  const pendingOrder: Order = {
    id: orderId,
    buyerId,
    buyerName: buyerUser ? buyerUser.name : 'Cliente',
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
      recipientName: buyerUser?.name || 'Cliente',
      recipientPhone: buyerUser?.phone || ''
    },
    paymentMethod: 'carteira',
    paymentReference: ref,
    status: 'aguardando_aprovacao',
    source: 'revenda',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  memoryOrders = [pendingOrder, ...memoryOrders];
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);

  const pendingTx: Transaction = {
    id: `tx_ord_${orderId}`,
    userId: buyerId,
    userName: pendingOrder.buyerName,
    amount: -paidPrice,
    type: 'compra_revenda',
    description: `Compra Revenda P2P: ${listing.productName} (Vendedor: ${listing.sellerName}) — Aguardando aprovação do Adm`,
    status: 'pendente',
    reference: ref,
    createdAt: nowIso
  };
  memoryTransactions = [pendingTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Nova Compra P2P Pendente de Aprovação 🤝',
    `${pendingOrder.buyerName} solicitou comprar "${listing.productName}" de ${listing.sellerName} por ${formatMoney(paidPrice)}. Aprova ou recusa no Painel do Adm.`,
    'compra',
    'admin',
    orderId
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'orders', pendingOrder.id), cleanForFirestore(pendingOrder)).catch(err =>
    console.warn('Firestore pending p2p order note:', err)
  );
  setDoc(doc(firestore, 'transactions', pendingTx.id), cleanForFirestore(pendingTx)).catch(err =>
    console.warn('Firestore pending p2p tx note:', err)
  );

  return { id: orderId, pendingApproval: true };
}

// ==========================================
// OFFICIAL PRODUCT PURCHASE
// ==========================================
export function purchaseOfficialProduct(
  userId: string,
  productId: string,
  quantity = 1,
  selectedColor?: string
): { order: { id: string; pendingApproval?: boolean } } {
  const prod = getProducts().find(p => p.id === productId);
  if (!prod) throw new Error('Produto não encontrado');

  const totalPrice = prod.officialPrice * quantity;
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

  const user = getUsers().find(u => u.id === userId);
  const nowIso = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ref = `BABA-${orderId.slice(-6).toUpperCase()}`;

  // NÃO debita nem entrega em Meus Produtos antes do Adm aprovar
  const pendingOrder: Order = {
    id: orderId,
    buyerId: userId,
    buyerName: user ? user.name : 'Cliente',
    items: [
      {
        id: prod.id,
        productId: prod.id,
        name: prod.name,
        price: prod.officialPrice,
        quantity,
        imageUrl: prod.imageUrl,
        source: 'oficial',
        selectedColor: selectedColor || prod.selectedColor
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
    status: 'aguardando_aprovacao',
    source: 'oficial',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  memoryOrders = [pendingOrder, ...memoryOrders];
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);

  const pendingTx: Transaction = {
    id: `tx_ord_${orderId}`,
    userId,
    userName: pendingOrder.buyerName,
    amount: -totalPrice,
    type: 'compra_oficial',
    description: `Compra Oficial (${quantity}x ${prod.name}) — Aguardando aprovação do Adm`,
    status: 'pendente',
    reference: ref,
    createdAt: nowIso
  };

  memoryTransactions = [pendingTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
    'Nova Compra Oficial Pendente de Aprovação 🛒',
    `${pendingOrder.buyerName} solicitou a compra de ${quantity}x "${prod.name}" (${formatMoney(totalPrice)}). Aprova ou recusa no Painel do Adm.`,
    'compra',
    'admin',
    orderId
  );

  dispatchDbChange();

  setDoc(doc(firestore, 'orders', pendingOrder.id), cleanForFirestore(pendingOrder)).catch(err =>
    console.warn('Firestore pending order note:', err)
  );
  setDoc(doc(firestore, 'transactions', pendingTx.id), cleanForFirestore(pendingTx)).catch(err =>
    console.warn('Firestore pending tx update note:', err)
  );

  return { order: { id: orderId, pendingApproval: true } };
}

export function approveOrder(orderId: string): Order {
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado');
  const order = memoryOrders[idx];
  if (order.status !== 'aguardando_aprovacao') return order;

  if (order.source === 'revenda') {
    const firstItem = order.items[0];
    const listingId = firstItem?.productId;
    const listing = memoryResaleListings.find(l => l.id === listingId);
    if (!listing || listing.status !== 'ativo') {
      throw new Error('Este anúncio já não está ativo no Mercado de Revenda (pode já ter sido vendido ou retirado).');
    }
    return executeConfirmedResaleSettlement(listing, order.buyerId, order.totalAmount, order);
  }

  // Compra Oficial
  const wallet = getWallet(order.buyerId);
  if (wallet.availableBalance < order.totalAmount) {
    throw new Error(
      `Saldo insuficiente na carteira de ${order.buyerName} (${formatMoney(wallet.availableBalance)}) para debitar ${formatMoney(order.totalAmount)}.`
    );
  }

  const nowIso = new Date().toISOString();
  wallet.availableBalance -= order.totalAmount;
  wallet.totalSpent += order.totalAmount;
  memoryWallets[order.buyerId] = wallet;
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const itemSummary = order.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const linkedTxId = `tx_ord_${order.id}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  let finalTx: Transaction;
  if (txIdx !== -1) {
    finalTx = {
      ...memoryTransactions[txIdx],
      status: 'confirmada',
      description: `Compra Oficial Aprovada & Entregue: ${itemSummary}`
    };
    memoryTransactions[txIdx] = finalTx;
  } else {
    finalTx = {
      id: linkedTxId,
      userId: order.buyerId,
      userName: order.buyerName,
      amount: -order.totalAmount,
      type: 'compra_oficial',
      description: `Compra Oficial Aprovada & Entregue: ${itemSummary}`,
      status: 'confirmada',
      reference: order.paymentReference,
      createdAt: order.createdAt || nowIso
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  // Entregar itens em "Meus Produtos"
  order.items.forEach(item => {
    const prodMeta = getProducts().find(p => p.id === item.productId);
    const qty = Math.max(1, Number(item.quantity) || 1);
    for (let i = 0; i < qty; i++) {
      const newItem: UserProduct = {
        id: `up_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        originalProductId: item.productId,
        currentOwnerId: order.buyerId,
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
      setDoc(doc(firestore, 'user_products', newItem.id), cleanForFirestore(newItem)).catch(err =>
        console.warn('Firestore add user prod note:', err)
      );
    }
  });
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  order.status = 'pagamento_confirmado';
  order.updatedAt = nowIso;
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);

  createNotification(
    order.buyerId,
    'Compra Oficial Aprovada & Produto Entregue! 📦',
    `A tua compra de ${itemSummary} (${formatMoney(order.totalAmount)}) foi aprovada pelo Administrador. O produto já está em "Meus Produtos" pronto para revenda!`,
    'compra',
    'produto',
    order.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'orders', order.id), cleanForFirestore(order), { merge: true }).catch(() => {});
  setDoc(doc(firestore, 'wallets', order.buyerId), cleanForFirestore(wallet), { merge: true }).catch(() => {});
  setDoc(doc(firestore, 'transactions', finalTx.id), cleanForFirestore(finalTx), { merge: true }).catch(() => {});

  return order;
}

export function rejectOrder(orderId: string, reason: string): Order {
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição do pedido.');
  }
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado');
  const order = memoryOrders[idx];
  if (order.status !== 'aguardando_aprovacao') return order;

  const nowIso = new Date().toISOString();
  order.status = 'cancelado';
  order.rejectionReason = cleanReason;
  order.updatedAt = nowIso;
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);

  const itemSummary = order.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const linkedTxId = `tx_ord_${order.id}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  const rejectedDesc = `${order.source === 'revenda' ? 'Compra Revenda' : 'Compra Oficial'} Recusada (${itemSummary}) — Motivo: ${cleanReason}`;

  let finalTx: Transaction;
  if (txIdx !== -1) {
    finalTx = {
      ...memoryTransactions[txIdx],
      status: 'recusada',
      description: rejectedDesc,
      rejectionReason: cleanReason
    };
    memoryTransactions[txIdx] = finalTx;
  } else {
    finalTx = {
      id: linkedTxId,
      userId: order.buyerId,
      userName: order.buyerName,
      amount: -order.totalAmount,
      type: order.source === 'revenda' ? 'compra_revenda' : 'compra_oficial',
      description: rejectedDesc,
      status: 'recusada',
      reference: order.paymentReference,
      rejectionReason: cleanReason,
      createdAt: order.createdAt || nowIso
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    order.buyerId,
    'Pedido de Compra Recusado ❌',
    `A tua compra de ${itemSummary} (${formatMoney(order.totalAmount)}) foi recusada pelo Administrador. Motivo: ${cleanReason}. O teu saldo não foi debitado.`,
    'sistema',
    'carteira'
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'orders', order.id), cleanForFirestore(order), { merge: true }).catch(() => {});
  setDoc(doc(firestore, 'transactions', finalTx.id), cleanForFirestore(finalTx), { merge: true }).catch(() => {});

  return order;
}

// ==========================================
// NEGOTIATIONS (Propostas P2P)
// ==========================================
export function getNegotiations(userId: string): Negotiation[] {
  const user = getUsers().find(u => u.id === userId);
  if (userId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || userId === 'usr_admin' || user?.role === 'admin') {
    return memoryNegotiations;
  }
  return memoryNegotiations.filter(n => {
    // Vendedor não vê propostas antes de serem aprovadas pelo Adm nem propostas rejeitadas pelo Adm
    if (n.sellerId === userId && (n.status === 'aguardando_adm' || Boolean(n.adminRejectionReason))) {
      return false;
    }
    return n.buyerId === userId || n.sellerId === userId || n.buyerId.startsWith(`persona_${userId}`);
  });
}

export function createNegotiation(
  listingId: string,
  buyerId: string,
  proposedPrice: number,
  initialMessage?: string,
  customBuyerName?: string
): Negotiation {
  const listing = memoryResaleListings.find(l => l.id === listingId);
  if (!listing) throw new Error('Anúncio não encontrado');
  if (listing.status !== 'ativo') throw new Error('Este anúncio não está disponível para negociação');
  if (listing.sellerId === buyerId && !customBuyerName) {
    throw new Error('Não podes negociar no teu próprio produto');
  }

  const buyer = getUsers().find(u => u.id === buyerId);
  const isAdminOrPersona =
    Boolean(customBuyerName?.trim()) ||
    buyerId.startsWith('persona_') ||
    buyerId === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
    buyerId === 'usr_admin' ||
    buyer?.role === 'admin';
  const resolvedBuyerName = customBuyerName?.trim() || (buyer ? buyer.name : 'Comprador Interessado');
  const uniqueNegId = `neg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newNeg: Negotiation = {
    id: uniqueNegId,
    listingId,
    userProductId: listing.userProductId,
    productName: listing.productName,
    productImage: listing.imageUrl,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    buyerId,
    buyerName: resolvedBuyerName,
    listedPrice: listing.listingPrice,
    currentProposedPrice: proposedPrice,
    lastOfferBy: 'buyer',
    status: isAdminOrPersona ? 'pendente' : 'aguardando_adm',
    statusMessage: isAdminOrPersona
      ? 'Aguardando resposta do vendedor'
      : 'Proposta enviada — Aguardando aprovação do Administrador',
    messages: initialMessage
      ? [
          {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            negotiationId: uniqueNegId,
            senderId: buyerId,
            senderName: resolvedBuyerName,
            text: initialMessage,
            timestamp: nowIso
          }
        ]
      : [],
    createdAt: nowIso,
    updatedAt: nowIso
  };

  memoryNegotiations = [newNeg, ...memoryNegotiations];
  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  if (isAdminOrPersona) {
    createNotification(
      listing.sellerId,
      'Nova Proposta de Negociação! 🤝',
      `${resolvedBuyerName} enviou uma proposta de ${formatMoney(proposedPrice)} para "${listing.productName}".`,
      'negociacao',
      'negociacao',
      newNeg.id
    );
  } else {
    createNotification(
      'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
      'Nova Proposta P2P Pendente de Aprovação 🤝',
      `${resolvedBuyerName} enviou proposta de ${formatMoney(proposedPrice)} para "${listing.productName}" (Vendedor: ${listing.sellerName}). Aprova ou recusa no Painel do Adm.`,
      'negociacao',
      'admin',
      newNeg.id
    );
  }

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', newNeg.id), cleanForFirestore(newNeg)).catch(err =>
    console.warn('Firestore negotiation save note:', err)
  );

  return newNeg;
}

export function approveNegotiationProposal(negotiationId: string): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Proposta de negociação não encontrada');
  const neg = memoryNegotiations[idx];
  if (neg.status !== 'aguardando_adm') return neg;

  neg.status = 'pendente';
  neg.adminRejectionReason = '';
  neg.statusMessage = 'Aprovada pelo Adm — Aguardando resposta do vendedor';
  neg.updatedAt = new Date().toISOString();

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  createNotification(
    neg.sellerId,
    'Nova Proposta de Negociação! 🤝',
    `${neg.buyerName} enviou uma proposta de ${formatMoney(neg.currentProposedPrice)} para "${neg.productName}".`,
    'negociacao',
    'negociacao',
    neg.id
  );
  createNotification(
    neg.buyerId,
    'Proposta Aprovada & Encaminhada! ✅',
    `A tua proposta de ${formatMoney(neg.currentProposedPrice)} por "${neg.productName}" foi aprovada pelo Administrador e enviada ao vendedor.`,
    'negociacao',
    'negociacao',
    neg.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', negotiationId), cleanForFirestore(neg), { merge: true }).catch(() => {});
  return neg;
}

export function rejectNegotiationProposal(negotiationId: string, reason: string): Negotiation {
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição da proposta.');
  }
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Proposta de negociação não encontrada');
  const neg = memoryNegotiations[idx];
  if (neg.status !== 'aguardando_adm') return neg;

  neg.status = 'recusada';
  neg.adminRejectionReason = cleanReason;
  neg.statusMessage = `Proposta recusada pelo Administrador: ${cleanReason}`;
  neg.updatedAt = new Date().toISOString();

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  createNotification(
    neg.buyerId,
    'Proposta de Negociação Recusada ❌',
    `A tua proposta de ${formatMoney(neg.currentProposedPrice)} por "${neg.productName}" foi recusada pelo Administrador. Motivo: ${cleanReason}`,
    'sistema',
    'negociacao',
    neg.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', negotiationId), cleanForFirestore(neg), { merge: true }).catch(() => {});
  return neg;
}

export function respondSellerNegotiation(
  negotiationId: string,
  action: 'aceitar' | 'contraproposta' | 'recusar',
  counterPrice?: number,
  message?: string
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada');
  const neg = memoryNegotiations[idx];

  let autoText = '';
  if (action === 'aceitar') {
    neg.status = 'aceite';
    neg.lastOfferBy = 'seller';
    neg.statusMessage = 'Proposta aceite pelo vendedor';
    autoText = `✓ Acordo aceite por ${formatMoney(neg.currentProposedPrice)}! Podes concluir o pagamento.`;
  } else if (action === 'recusar') {
    neg.status = 'recusada';
    neg.lastOfferBy = 'seller';
    neg.statusMessage = 'Proposta recusada pelo vendedor (podes enviar nova proposta na conversa)';
    autoText = `Recusei a proposta de ${formatMoney(neg.currentProposedPrice)}. Envia outra proposta na conversa para continuarmos a negociar.`;
  } else if (action === 'contraproposta' && counterPrice) {
    neg.status = 'contraproposta';
    neg.currentProposedPrice = counterPrice;
    neg.lastOfferBy = 'seller';
    neg.statusMessage = 'Contraproposta enviada pelo vendedor';
    autoText = `Envio contraproposta de ${formatMoney(counterPrice)}. Aceitas fechar por este valor?`;
  }

  const finalMsg = message?.trim() || autoText;
  if (finalMsg) {
    neg.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      negotiationId,
      senderId: neg.sellerId,
      senderName: neg.sellerName,
      text: finalMsg,
      timestamp: new Date().toISOString()
    });
  }
  neg.updatedAt = new Date().toISOString();

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  createNotification(
    neg.buyerId,
    action === 'aceitar'
      ? 'Proposta Aceite pelo Vendedor! 🤝'
      : action === 'contraproposta'
      ? 'Contraproposta do Vendedor'
      : 'Proposta Recusada — Continua a Negociar',
    action === 'aceitar'
      ? `O vendedor aceitou a tua proposta de ${formatMoney(neg.currentProposedPrice)} por "${neg.productName}". Podes agora concluir a compra!`
      : action === 'contraproposta'
      ? `O vendedor sugeriu ${formatMoney(counterPrice || 0)} por "${neg.productName}".`
      : `O vendedor recusou ${formatMoney(neg.currentProposedPrice)} por "${neg.productName}". Podes responder na conversa.`,
    'negociacao',
    'negociacao',
    neg.id
  );

  // Notificar também o Adm quando um vendedor responde numa negociação com persona
  if (neg.buyerId.startsWith('persona_')) {
    createNotification(
      'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
      `${neg.sellerName} respondeu a ${neg.buyerName} 💬`,
      action === 'aceitar'
        ? `Acordo aceite em "${neg.productName}" por ${formatMoney(neg.currentProposedPrice)}.`
        : action === 'contraproposta'
        ? `Contraproposta de ${formatMoney(counterPrice || 0)} em "${neg.productName}".`
        : `Recusou ${formatMoney(neg.currentProposedPrice)} em "${neg.productName}".`,
      'negociacao',
      'admin',
      neg.id
    );
  }

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', negotiationId), cleanForFirestore(neg), { merge: true }).catch(err =>
    console.warn('Firestore negotiation update note:', err)
  );

  return neg;
}

export function respondBuyerNegotiation(
  negotiationId: string,
  action: 'aceitar' | 'contraproposta' | 'recusar',
  counterPrice?: number,
  message?: string
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada');
  const neg = memoryNegotiations[idx];

  let autoText = '';
  if (action === 'aceitar') {
    neg.status = 'aceite';
    neg.lastOfferBy = 'buyer';
    neg.statusMessage = 'Acordo aceite pelo comprador';
    autoText = `✓ Aceito a tua proposta de ${formatMoney(neg.currentProposedPrice)}! Vamos fechar negócio.`;
  } else if (action === 'recusar') {
    neg.status = 'recusada';
    neg.lastOfferBy = 'buyer';
    neg.statusMessage = 'Proposta recusada pelo comprador';
    autoText = `Não consigo por ${formatMoney(neg.currentProposedPrice)}. Podemos conversar sobre outro valor.`;
  } else if (action === 'contraproposta' && counterPrice) {
    neg.status = 'contraproposta';
    neg.currentProposedPrice = counterPrice;
    neg.lastOfferBy = 'buyer';
    neg.statusMessage = 'Nova proposta enviada pelo comprador';
    autoText = `Envio nova proposta de ${formatMoney(counterPrice)}. Podemos fechar por este valor?`;
  }

  const finalMsg = message?.trim() || autoText;
  if (finalMsg) {
    neg.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      negotiationId,
      senderId: neg.buyerId,
      senderName: neg.buyerName,
      text: finalMsg,
      timestamp: new Date().toISOString()
    });
  }
  neg.updatedAt = new Date().toISOString();

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  createNotification(
    neg.sellerId,
    action === 'aceitar'
      ? 'Proposta Aceite pelo Comprador! 🤝'
      : action === 'contraproposta'
      ? 'Nova Contraproposta do Comprador'
      : 'Atualização na Negociação',
    `Atualização de ${neg.buyerName} na negociação de "${neg.productName}".`,
    'negociacao',
    'negociacao',
    neg.id
  );

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', negotiationId), cleanForFirestore(neg), { merge: true }).catch(err =>
    console.warn('Firestore buyer negotiation note:', err)
  );

  return neg;
}

export function sendNegotiationMessage(
  negotiationId: string,
  senderId: string,
  senderName: string,
  text: string,
  newPrice?: number
): Negotiation {
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Negociação não encontrada');
  const neg = memoryNegotiations[idx];

  if (neg.adminRejectionReason) {
    throw new Error('Esta proposta foi recusada pelo Administrador e não pode ser reaberta.');
  }

  const isWaitingAdmin = neg.status === 'aguardando_adm';
  if (!isWaitingAdmin && newPrice && newPrice > 0) {
    neg.currentProposedPrice = newPrice;
    neg.lastOfferBy = senderId === neg.buyerId ? 'buyer' : 'seller';
    neg.status = 'contraproposta';
    neg.statusMessage = senderId === neg.buyerId ? 'Nova proposta enviada pelo comprador' : 'Nova contraproposta do vendedor';
  } else if (!isWaitingAdmin && neg.status === 'recusada') {
    neg.status = 'pendente';
    neg.statusMessage = 'Conversa reaberta para negociação';
  }

  neg.messages.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    negotiationId,
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString()
  });
  neg.updatedAt = new Date().toISOString();

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  const recipientId = isWaitingAdmin
    ? 'kt5dFLArJzV7hCNMQ3ZvgqFokM62'
    : senderId === neg.buyerId
    ? neg.sellerId
    : neg.buyerId;
  createNotification(
    recipientId,
    `Nova mensagem na negociação de "${neg.productName}"`,
    `${senderName}: "${text}"`,
    'negociacao',
    isWaitingAdmin ? 'admin' : 'negociacao',
    neg.id
  );

  if (!isWaitingAdmin && senderId === neg.sellerId && neg.buyerId.startsWith('persona_')) {
    createNotification(
      'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
      `Nova mensagem de ${senderName} para ${neg.buyerName}`,
      `"${text}"`,
      'negociacao',
      'admin',
      neg.id
    );
  }

  dispatchDbChange();
  setDoc(doc(firestore, 'negotiations', negotiationId), cleanForFirestore(neg), { merge: true }).catch(err =>
    console.warn('Firestore negotiation message note:', err)
  );

  return neg;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export function getNotifications(userId: string): Notification[] {
  return memoryNotifications
    .filter(n => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createNotification(
  recipientId: string,
  title: string,
  message: string,
  type: 'venda' | 'compra' | 'negociacao' | 'sistema',
  linkType?: 'produto' | 'negociacao' | 'carteira' | 'admin',
  linkId?: string
): Notification {
  const newNotif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientId,
    title,
    message,
    type,
    read: false,
    linkType,
    linkId,
    createdAt: new Date().toISOString()
  };

  memoryNotifications = [newNotif, ...memoryNotifications];
  backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);

  dispatchDbChange();
  setDoc(doc(firestore, 'notifications', newNotif.id), cleanForFirestore(newNotif)).catch(err =>
    console.warn('Firestore notification note:', err)
  );

  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const idx = memoryNotifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    memoryNotifications[idx].read = true;
    backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
    dispatchDbChange();
    updateDoc(doc(firestore, 'notifications', id), { read: true }).catch(err =>
      console.warn('Firestore mark read note:', err)
    );
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  memoryNotifications = memoryNotifications.map(n =>
    n.recipientId === userId ? { ...n, read: true } : n
  );
  backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
  dispatchDbChange();
}

// Backward compatibility helpers
export function formatKz(amount: number): string {
  return formatMoney(amount);
}

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'aguardando_aprovacao':
      return 'Pendente de Aprovação do Adm';
    case 'aguardando_pagamento':
      return 'Aguardando Pagamento';
    case 'pagamento_confirmado':
    case 'pago':
      return 'Aprovado e Liquidado com Sucesso';
    case 'cancelado':
      return 'Recusado / Cancelado';
    default:
      return status;
  }
}

export function getOrders(userId?: string): Order[] {
  const list = [...memoryOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (!userId) return list;
  return list.filter(o => o.buyerId === userId || o.sellerId === userId);
}

export function updateOrderStatus(orderId: string, status: OrderStatus): any {
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) return { id: orderId, status };
  memoryOrders[idx].status = status;
  memoryOrders[idx].updatedAt = new Date().toISOString();
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);
  dispatchDbChange();
  setDoc(doc(firestore, 'orders', orderId), cleanForFirestore(memoryOrders[idx]), { merge: true }).catch(() => {});
  return memoryOrders[idx];
}

export {
  formatMoney,
  getActiveCurrency,
  setActiveCurrency,
  CURRENCIES,
  type CurrencyCode
};
