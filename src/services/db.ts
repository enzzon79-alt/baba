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
  Notification,
  AssistantConversation,
  AssistantMessage
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
  auth,
  firestore,
  OperationType,
  handleFirestoreError,
  formatFirestoreErrorForUser,
  testFirestoreConnection,
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Unsubscribe
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
  ORDERS: 'baba_orders_v9',
  ASSISTANT_CONVERSATIONS: 'baba_assistant_conversations_v1'
};

export const DB_STATE_EVENT = 'baba_db_state_changed';

export function dispatchDbChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_STATE_EVENT));
  }
}

function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Safari private mode / restricted iframe storage safe
  }
}

function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Safari private mode / restricted iframe storage safe
  }
}

// In-memory state for 0ms instantaneous React UI updates & Safari storage-restricted fallback
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
let memoryAssistantConversations: AssistantConversation[] = [];
let memoryCurrentUserId: string | null = safeStorageGet(DB_KEYS.CURRENT_USER_ID);
let memoryCurrentUserObj: User | null = (() => {
  try {
    const raw = safeStorageGet('baba_current_user_obj');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
})();
let memoryOnboardingCompleted: boolean = safeStorageGet('baba_onboarding_completed') === 'true';

export function isOnboardingCompleted(): boolean {
  if (memoryOnboardingCompleted) return true;
  if (safeStorageGet('baba_onboarding_completed') === 'true') {
    memoryOnboardingCompleted = true;
    return true;
  }
  return false;
}

export function markOnboardingCompleted(completed: boolean): void {
  memoryOnboardingCompleted = completed;
  if (completed) {
    safeStorageSet('baba_onboarding_completed', 'true');
  } else {
    safeStorageRemove('baba_onboarding_completed');
  }
}

let isInitialized = false;
const serverSyncedCols = new Set<string>();
const pendingWrites = new Map<string, Set<string>>();

interface SyncOutboxItem {
  collection: string;
  id: string;
  data: Record<string, any>;
  merge: boolean;
  queuedAt: number;
}

const SYNC_OUTBOX_KEY = 'baba_sync_outbox_v1';
const syncOutbox = new Map<string, SyncOutboxItem>();

function outboxKey(colName: string, docId: string): string {
  return `${colName}:${docId}`;
}

const firestoreSyncedCols = new Set<string>();
const firestoreDocIds = new Map<string, Set<string>>();

export function toIsoTimestamp(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? '' : val.toISOString();
  }
  if (typeof val === 'object') {
    if (typeof (val as any).toDate === 'function') {
      try {
        return (val as any).toDate().toISOString();
      } catch {
        return '';
      }
    }
    if (typeof (val as any).seconds === 'number') {
      const ms = (val as any).seconds * 1000 + Math.floor(Number((val as any).nanoseconds || 0) / 1e6);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? '' : d.toISOString();
    }
  }
  return String(val);
}

export const ADMIN_UID = 'ABcb3DyaZGMapMxuQ0KqYQdPnqT2';

const LEGACY_REMOVED_ADMIN_IDS = new Set([
  'kt5dFLArJzV7hCNMQ3ZvgqFokM62',
  'usr_admin'
]);

function isLegacyRemovedAdmin(u?: { id?: string; email?: string } | null): boolean {
  if (!u) return false;
  const id = String(u.id || '').trim();
  const email = String(u.email || '').trim().toLowerCase();
  return (
    LEGACY_REMOVED_ADMIN_IDS.has(id) ||
    email === 'admin@baba.ao' ||
    email === 'admin@babashopping.ao'
  );
}

export function isAdminUserRecord(u?: Partial<User> | null): boolean {
  if (!u || isLegacyRemovedAdmin(u)) return false;
  return u.role === 'admin' || u.id === ADMIN_UID;
}

function normalizeDepositStatus(raw: any): DepositRequest['status'] {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'aprovado' || s === 'approved' || s === 'confirmada' || s === 'confirmado') return 'aprovado';
  if (s === 'rejeitado' || s === 'recusado' || s === 'recusada' || s === 'rejected') return 'rejeitado';
  return 'pendente';
}

function normalizeWithdrawalStatus(raw: any): WithdrawalRequest['status'] {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'processado' || s === 'aprovado' || s === 'approved' || s === 'confirmado' || s === 'confirmada' || s === 'completed') {
    return 'processado';
  }
  if (s === 'rejeitado' || s === 'recusado' || s === 'recusada' || s === 'rejected') {
    return 'rejeitado';
  }
  return 'pendente';
}

function normalizeAccountStatus(raw: any, isMasterOrAdmin = false): User['accountStatus'] {
  if (isMasterOrAdmin) return 'ativo';
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'ativo' || s === 'active' || s === 'aprovado' || s === 'approved') return 'ativo';
  if (s === 'rejeitado' || s === 'rejected' || s === 'recusado') return 'rejeitado';
  if (s === 'suspenso' || s === 'suspended') return 'suspenso';
  return 'em_processamento';
}

function normalizeDepositFromDoc(docId: string, raw: any): DepositRequest {
  const id = String(raw?.id || docId);
  const createdAt = toIsoTimestamp(raw?.createdAt) || toIsoTimestamp(raw?.updatedAt) || new Date(0).toISOString();
  return {
    id,
    userId: String(raw?.userId || ''),
    userName: String(raw?.userName || 'Cliente'),
    amount: Number(raw?.amount) || 0,
    paymentMethod: String(raw?.paymentMethod || raw?.method || 'multicaixa_express'),
    reference: String(raw?.reference || id),
    receiptProof: raw?.receiptProof || undefined,
    status: normalizeDepositStatus(raw?.status),
    ...(raw?.rejectionReason ? { rejectionReason: String(raw.rejectionReason) } : {}),
    createdAt
  };
}

function normalizeWithdrawalFromDoc(docId: string, raw: any): WithdrawalRequest {
  const id = String(raw?.id || docId);
  const createdAt = toIsoTimestamp(raw?.createdAt) || toIsoTimestamp(raw?.updatedAt) || new Date(0).toISOString();
  return {
    id,
    userId: String(raw?.userId || ''),
    userName: String(raw?.userName || 'Cliente'),
    amount: Number(raw?.amount) || 0,
    bankName: String(raw?.bankName || 'Banco em Angola'),
    iban: String(raw?.iban || ''),
    accountHolder: String(raw?.accountHolder || raw?.userName || 'Cliente'),
    status: normalizeWithdrawalStatus(raw?.status),
    ...(raw?.rejectionReason ? { rejectionReason: String(raw.rejectionReason) } : {}),
    createdAt
  };
}

function normalizeUserFromDoc(docId: string, raw: any, localMatch?: User): User {
  const id = String(raw?.id || docId);
  const isMaster = id === ADMIN_UID;
  const role: User['role'] = isMaster || raw?.role === 'admin' ? 'admin' : 'client';
  const createdAt = toIsoTimestamp(raw?.createdAt) || localMatch?.createdAt || new Date().toISOString();
  const verifiedAt = toIsoTimestamp(raw?.verifiedAt) || localMatch?.verifiedAt;
  return {
    ...(localMatch || {}),
    ...raw,
    id,
    name: String(raw?.name || localMatch?.name || (isMaster ? 'Administrador BABA' : 'Utilizador BABA')),
    email: String(raw?.email || localMatch?.email || ''),
    phone: String(raw?.phone || localMatch?.phone || ''),
    province: String(raw?.province || localMatch?.province || 'Luanda'),
    city: String(raw?.city || localMatch?.city || 'Luanda'),
    role,
    idNumber: String(raw?.idNumber || localMatch?.idNumber || ''),
    birthDate: String(raw?.birthDate || localMatch?.birthDate || ''),
    accountStatus: normalizeAccountStatus(raw?.accountStatus ?? localMatch?.accountStatus, isMaster || role === 'admin'),
    ...(localMatch?.password && !raw?.password ? { password: localMatch.password } : {}),
    idCardFront: raw?.idCardFront || localMatch?.idCardFront || '',
    idCardBack: raw?.idCardBack || localMatch?.idCardBack || '',
    ...(verifiedAt ? { verifiedAt } : {}),
    createdAt
  };
}

function normalizeGenericDates<T extends Record<string, any>>(docId: string, raw: any): T {
  const out: Record<string, any> = { ...raw, id: String(raw?.id || docId) };
  if (raw?.createdAt !== undefined) out.createdAt = toIsoTimestamp(raw.createdAt);
  if (raw?.updatedAt !== undefined) out.updatedAt = toIsoTimestamp(raw.updatedAt);
  if (raw?.purchaseDate !== undefined) out.purchaseDate = toIsoTimestamp(raw.purchaseDate);
  if (raw?.verifiedAt !== undefined) out.verifiedAt = toIsoTimestamp(raw.verifiedAt);
  return out as T;
}

function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanForFirestore(item));
  if (typeof (obj as any).toDate === 'function') {
    try {
      return (obj as any).toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  const res: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      res[k] = v && typeof v === 'object' && !(v instanceof Date) ? cleanForFirestore(v) : v;
    }
  }
  return res;
}

function stripHeavyMediaForStorage(val: any): any {
  if (typeof val === 'string') {
    if (val.startsWith('data:') && val.length > 16384) {
      return '';
    }
    return val;
  }
  if (!val || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(item => stripHeavyMediaForStorage(item));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = stripHeavyMediaForStorage(v);
  }
  return out;
}

// Hydrate queued unsynced writes synchronously at module load
(() => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SYNC_OUTBOX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]: [string, any]) => {
          if (v && typeof v === 'object' && v.collection && v.id && v.data) {
            syncOutbox.set(k, v as SyncOutboxItem);
            if (!pendingWrites.has(v.collection)) pendingWrites.set(v.collection, new Set());
            pendingWrites.get(v.collection)!.add(v.id);
          }
        });
      }
    }
  } catch {
    // storage safe
  }
})();

function persistOutboxToStorage(): void {
  if (typeof window === 'undefined') return;
  const obj: Record<string, SyncOutboxItem> = {};
  syncOutbox.forEach((v, k) => {
    obj[k] = v;
  });
  if (Object.keys(obj).length === 0) {
    safeStorageRemove(SYNC_OUTBOX_KEY);
    return;
  }
  try {
    localStorage.setItem(SYNC_OUTBOX_KEY, JSON.stringify(obj));
  } catch {
    try {
      localStorage.setItem(SYNC_OUTBOX_KEY, JSON.stringify(stripHeavyMediaForStorage(obj)));
    } catch {
      // Safari private mode / restricted iframe storage safe
    }
  }
}

function markPendingWrite(colName: string, docId: string): void {
  if (!pendingWrites.has(colName)) pendingWrites.set(colName, new Set());
  pendingWrites.get(colName)!.add(docId);
}

function clearPendingWrite(colName: string, docId: string): void {
  if (syncOutbox.has(outboxKey(colName, docId))) return;
  pendingWrites.get(colName)?.delete(docId);
}

function isPendingWrite(colName: string, docId: string): boolean {
  return Boolean(pendingWrites.get(colName)?.has(docId) || syncOutbox.has(outboxKey(colName, docId)));
}

async function pushDocToServer(
  colName: string,
  docId: string,
  payload: Record<string, any>,
  merge = true
): Promise<void> {
  if (typeof window === 'undefined') return;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 12000) : null;
  try {
    const res = await fetch('/api/sync/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller?.signal,
      body: JSON.stringify({ collection: colName, id: docId, data: payload, merge })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP_${res.status}: ${errText || res.statusText}`);
    }
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function pushBatchToServer(items: SyncOutboxItem[]): Promise<void> {
  if (typeof window === 'undefined' || items.length === 0) return;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 15000) : null;
  try {
    const res = await fetch('/api/sync/batch-upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller?.signal,
      body: JSON.stringify({
        items: items.map(it => ({
          collection: it.collection,
          id: it.id,
          data: it.data,
          merge: it.merge
        }))
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP_${res.status}: ${errText || res.statusText}`);
    }
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stripPayloadMediaFallback(item: SyncOutboxItem): Record<string, any> | null {
  if (item.collection === 'users' && (item.data.idCardFront || item.data.idCardBack)) {
    return {
      ...item.data,
      idCardFront: '',
      idCardBack: ''
    };
  }
  if (item.collection === 'deposits' && item.data.receiptProof) {
    return {
      ...item.data,
      receiptProof: ''
    };
  }
  return null;
}

let outboxFlushInFlight: Promise<void> | null = null;
let outboxCoalesceTimer: ReturnType<typeof setTimeout> | null = null;
let outboxCoalesceWaiters: Array<() => void> = [];
let outboxRetryTimer: ReturnType<typeof setTimeout> | null = null;
let outboxRetryDelayMs = 1500;

function scheduleOutboxRetry(): void {
  if (typeof window === 'undefined' || syncOutbox.size === 0 || outboxRetryTimer) return;
  const delay = outboxRetryDelayMs;
  outboxRetryDelayMs = Math.min(10000, Math.round(outboxRetryDelayMs * 1.8));
  outboxRetryTimer = setTimeout(() => {
    outboxRetryTimer = null;
    void flushSyncOutbox();
  }, delay);
}

export async function flushSyncOutbox(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (outboxFlushInFlight) return outboxFlushInFlight;

  outboxFlushInFlight = (async () => {
    try {
      let rounds = 0;
      while (syncOutbox.size > 0 && rounds < 5) {
        rounds += 1;
        const snapshot = Array.from(syncOutbox.entries());

        // Split into batches keeping JSON under ~2.5MB
        const batches: Array<Array<[string, SyncOutboxItem]>> = [];
        let currentBatch: Array<[string, SyncOutboxItem]> = [];
        let currentBytes = 0;

        for (const entry of snapshot) {
          const approxSize = JSON.stringify(entry[1].data).length;
          if (currentBatch.length >= 15 || (currentBatch.length > 0 && currentBytes + approxSize > 2_500_000)) {
            batches.push(currentBatch);
            currentBatch = [];
            currentBytes = 0;
          }
          currentBatch.push(entry);
          currentBytes += approxSize;
        }
        if (currentBatch.length > 0) batches.push(currentBatch);

        let hadTransientFailure = false;

        for (const batch of batches) {
          const itemsOnly = batch.map(([, v]) => v);
          try {
            await pushBatchToServer(itemsOnly);
            batch.forEach(([k, item]) => {
              const current = syncOutbox.get(k);
              if (current && current.queuedAt === item.queuedAt) {
                syncOutbox.delete(k);
                setTimeout(() => clearPendingWrite(item.collection, item.id), 450);
              }
            });
            outboxRetryDelayMs = 1500;
          } catch {
            // Fall back to sending items individually so one oversized or failing doc never blocks others
            for (const [k, item] of batch) {
              try {
                await pushDocToServer(item.collection, item.id, item.data, item.merge);
                const current = syncOutbox.get(k);
                if (current && current.queuedAt === item.queuedAt) {
                  syncOutbox.delete(k);
                  setTimeout(() => clearPendingWrite(item.collection, item.id), 450);
                }
                outboxRetryDelayMs = 1500;
              } catch (err: any) {
                const msg = String(err?.message || '');
                const isSizeErr =
                  msg.includes('HTTP_413') ||
                  msg.toLowerCase().includes('too large') ||
                  msg.toLowerCase().includes('entity');
                if (isSizeErr) {
                  const lightweight = stripPayloadMediaFallback(item);
                  if (lightweight) {
                    try {
                      await pushDocToServer(item.collection, item.id, lightweight, item.merge);
                      const current = syncOutbox.get(k);
                      if (current && current.queuedAt === item.queuedAt) {
                        syncOutbox.delete(k);
                        setTimeout(() => clearPendingWrite(item.collection, item.id), 450);
                      }
                      continue;
                    } catch {
                      hadTransientFailure = true;
                    }
                  }
                } else if (msg.includes('HTTP_400')) {
                  // Drop permanently invalid payload so it does not stall future sync
                  syncOutbox.delete(k);
                  clearPendingWrite(item.collection, item.id);
                } else {
                  hadTransientFailure = true;
                }
              }
            }
          }
        }

        persistOutboxToStorage();
        if (hadTransientFailure) {
          scheduleOutboxRetry();
          break;
        }
      }
    } finally {
      outboxFlushInFlight = null;
    }
  })();

  return outboxFlushInFlight;
}

function scheduleOutboxFlush(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise<void>(resolve => {
    outboxCoalesceWaiters.push(resolve);
    if (outboxCoalesceTimer) return;
    outboxCoalesceTimer = setTimeout(() => {
      outboxCoalesceTimer = null;
      const waiters = outboxCoalesceWaiters;
      outboxCoalesceWaiters = [];
      flushSyncOutbox()
        .catch(() => undefined)
        .finally(() => {
          waiters.forEach(w => w());
        });
    }, 12);
  });
}

function deleteDocOnServer(colName: string, docId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const serverPromise = fetch('/api/sync/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ collection: colName, id: docId })
  })
    .then(() => undefined)
    .catch(() => undefined);

  const cloudPromise = deleteDoc(doc(firestore, colName, docId)).catch(() => undefined);
  return Promise.all([serverPromise, cloudPromise]).then(() => undefined);
}

function sanitizePayloadForCloudFirestore(colName: string, payload: Record<string, any>): Record<string, any> {
  const cleaned = cleanForFirestore(payload);
  if (colName === 'users' && cleaned && typeof cleaned === 'object' && 'password' in cleaned) {
    const { password: _pw, ...safeUser } = cleaned;
    return safeUser;
  }
  return cleaned;
}

export async function writeDocToCloudFirestore(
  colName: string,
  docId: string,
  data: Record<string, any>,
  merge = true,
  strictThrow = false
): Promise<void> {
  if (typeof window === 'undefined' || !colName || !docId) return;
  const cloudPayload = sanitizePayloadForCloudFirestore(colName, data);
  const path = `${colName}/${docId}`;
  try {
    await setDoc(doc(firestore, colName, docId), cloudPayload, { merge });
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    const code = String(err?.code || '').toLowerCase();
    if (code === 'resource-exhausted' || msg.includes('exceeds the maximum') || msg.includes('too large') || msg.includes('bytes')) {
      const stripped = stripPayloadMediaFallback({
        collection: colName,
        id: docId,
        data: cloudPayload,
        merge,
        queuedAt: Date.now()
      });
      if (stripped) {
        try {
          await setDoc(doc(firestore, colName, docId), stripped, { merge });
          return;
        } catch (retryErr) {
          handleFirestoreError(retryErr, merge ? OperationType.UPDATE : OperationType.CREATE, path, strictThrow);
          return;
        }
      }
    }
    handleFirestoreError(err, merge ? OperationType.UPDATE : OperationType.CREATE, path, strictThrow);
  }
}

export async function persistDocToFirestoreStrict(
  colName: string,
  docId: string,
  data: Record<string, any>,
  merge = true
): Promise<void> {
  const payload = cleanForFirestore(data);
  const key = outboxKey(colName, docId);
  markPendingWrite(colName, docId);
  syncOutbox.set(key, {
    collection: colName,
    id: docId,
    data: payload,
    merge,
    queuedAt: Date.now()
  });
  persistOutboxToStorage();
  void scheduleOutboxFlush();

  const knownInCloud = Boolean(firestoreDocIds.get(colName)?.has(docId));
  const mustEnforceCloud = Boolean(auth.currentUser) || knownInCloud;
  try {
    await writeDocToCloudFirestore(colName, docId, data, merge, mustEnforceCloud);
  } finally {
    setTimeout(() => clearPendingWrite(colName, docId), 450);
  }
}

function writeDocToFirestore(
  colName: string,
  docId: string,
  data: Record<string, any>,
  merge = true
): Promise<void> {
  const payload = cleanForFirestore(data);
  const key = outboxKey(colName, docId);
  markPendingWrite(colName, docId);
  syncOutbox.set(key, {
    collection: colName,
    id: docId,
    data: payload,
    merge,
    queuedAt: Date.now()
  });
  persistOutboxToStorage();
  const outboxPromise = scheduleOutboxFlush();
  const cloudPromise = writeDocToCloudFirestore(colName, docId, data, merge, false).catch(() => undefined);
  return Promise.all([outboxPromise, cloudPromise]).then(() => undefined);
}

function backupToStorage<T>(key: string, val: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // iOS Safari 2.5MB-5MB quota fallback: preserve records without heavy inline base64 images
      try {
        localStorage.setItem(key, JSON.stringify(stripHeavyMediaForStorage(val)));
      } catch {
        // Safari private mode / restricted iframe storage safe
      }
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
    if (currentId && currentId !== ADMIN_UID) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
      localStorage.removeItem('baba_current_user_obj');
    }
    localStorage.setItem(LOCAL_RESET_KEY, ADMIN_ONLY_RESET_VERSION);
  } catch {
    // storage safe
  }
}

applyLocalAdminOnlyResetOnce();

function evictLegacyAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    const currentId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
    const rawUserObj = localStorage.getItem('baba_current_user_obj');
    let parsedObj: any = null;
    try {
      parsedObj = rawUserObj ? JSON.parse(rawUserObj) : null;
    } catch {}
    if (
      (currentId && LEGACY_REMOVED_ADMIN_IDS.has(currentId)) ||
      (parsedObj && isLegacyRemovedAdmin(parsedObj))
    ) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER_ID);
      localStorage.removeItem('baba_current_user_obj');
    }
  } catch {
    // storage safe
  }
}

evictLegacyAdminSession();

// Initial hydration from backup storage for 0ms initial render
memoryProducts = loadFromStorage(DB_KEYS.PRODUCTS, INITIAL_PRODUCTS);
memoryDeletedUserIds = loadFromStorage(DB_KEYS.DELETED_USERS, []);
memoryUsers = loadFromStorage(DB_KEYS.USERS, INITIAL_USERS).filter(
  (u: User) => u && !isLegacyRemovedAdmin(u) && !memoryDeletedUserIds.includes(u.id)
);
memoryWallets = loadFromStorage(DB_KEYS.WALLETS, INITIAL_WALLETS);
LEGACY_REMOVED_ADMIN_IDS.forEach(oldId => {
  if (memoryWallets[oldId]) delete memoryWallets[oldId];
});
memoryTransactions = loadFromStorage(DB_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
memoryUserProducts = loadFromStorage(DB_KEYS.USER_PRODUCTS, []);
memoryResaleListings = loadFromStorage(DB_KEYS.RESALE_LISTINGS, INITIAL_RESALE_LISTINGS);
memoryNegotiations = loadFromStorage(DB_KEYS.NEGOTIATIONS, INITIAL_NEGOTIATIONS);
memoryNotifications = loadFromStorage(DB_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
memoryDeposits = loadFromStorage(DB_KEYS.DEPOSITS, INITIAL_DEPOSITS);
memoryWithdrawals = loadFromStorage(DB_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
memoryOrders = loadFromStorage(DB_KEYS.ORDERS, []);
memoryAssistantConversations = loadFromStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, []);

function mergeListById<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  snapDocs: Array<{ id: string; data: () => any }>,
  localItems: T[],
  colName: string,
  sortDesc = true,
  fromServer = false
): T[] {
  if (fromServer) {
    serverSyncedCols.add(colName);
  }
  const hasServerTruth = serverSyncedCols.has(colName);
  const map = new Map<string, T>();

  snapDocs.forEach(d => {
    const raw = d.data() as T;
    if (raw) {
      const id = d.id || raw.id;
      if (id) map.set(id, { ...raw, id });
    }
  });

  localItems.forEach(item => {
    if (!item || !item.id) return;
    if (isPendingWrite(colName, item.id)) {
      // Keep local in-flight version until Firestore confirms our write
      map.set(item.id, item);
    } else if (!map.has(item.id) && !hasServerTruth) {
      // Before first server sync, preserve local items without blindly resurrecting server-deleted docs
      map.set(item.id, item);
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

let serverSyncInFlight: Promise<boolean> | null = null;
let lastSyncedRevision = 0;

function applyServerDocUpdate(colName: string, id: string, docData: any): void {
  if (!docData || !id) return;
  if (isPendingWrite(colName, id)) return;

  if (colName === 'deleted_users') {
    if (id !== ADMIN_UID && !memoryDeletedUserIds.includes(id)) {
      memoryDeletedUserIds = [...memoryDeletedUserIds, id];
      backupToStorage(DB_KEYS.DELETED_USERS, memoryDeletedUserIds);
      memoryUsers = memoryUsers.filter(u => u && u.id !== id);
      backupToStorage(DB_KEYS.USERS, memoryUsers);
      dispatchDbChange();
    }
    return;
  }

  if (colName === 'users') {
    if (isLegacyRemovedAdmin({ id, email: docData?.email })) return;
    const isMaster = id === ADMIN_UID;
    if (!isMaster && memoryDeletedUserIds.includes(id)) return;
    const localMatch = memoryUsers.find(u => u && u.id === id);
    const nextUser: User = {
      ...docData,
      id,
      role: isMaster || docData.role === 'admin' ? 'admin' : 'client',
      accountStatus: isMaster || docData.role === 'admin' ? 'ativo' : (docData.accountStatus || localMatch?.accountStatus || 'em_processamento'),
      phone: docData.phone || localMatch?.phone || '',
      password: docData.password || localMatch?.password,
      idCardFront: docData.idCardFront || localMatch?.idCardFront || '',
      idCardBack: docData.idCardBack || localMatch?.idCardBack || ''
    };
    const idx = memoryUsers.findIndex(u => u && u.id === id);
    if (idx !== -1) {
      memoryUsers = memoryUsers.map((u, i) => (i === idx ? nextUser : u));
    } else {
      memoryUsers = [nextUser, ...memoryUsers];
    }
    backupToStorage(DB_KEYS.USERS, memoryUsers);
    dispatchDbChange();
    return;
  }

  if (colName === 'wallets') {
    memoryWallets = {
      ...memoryWallets,
      [id]: { ...docData, userId: id }
    };
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    dispatchDbChange();
    return;
  }

  const upsertArray = <T extends { id: string; createdAt?: string; updatedAt?: string }>(
    arr: T[],
    sortDesc = true
  ): T[] => {
    const next = [{ ...docData, id } as T, ...arr.filter(x => x && x.id !== id)];
    if (sortDesc) {
      next.sort((a, b) => {
        const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return tb - ta;
      });
    }
    return next;
  };

  if (colName === 'deposits') {
    memoryDeposits = upsertArray(memoryDeposits);
    backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
  } else if (colName === 'withdrawals') {
    memoryWithdrawals = upsertArray(memoryWithdrawals);
    backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
  } else if (colName === 'resale_listings') {
    memoryResaleListings = upsertArray(memoryResaleListings);
    backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  } else if (colName === 'user_products') {
    memoryUserProducts = upsertArray(memoryUserProducts, false);
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
  } else if (colName === 'negotiations') {
    memoryNegotiations = upsertArray(memoryNegotiations);
    backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
  } else if (colName === 'notifications') {
    memoryNotifications = upsertArray(memoryNotifications);
    backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
  } else if (colName === 'transactions') {
    memoryTransactions = upsertArray(memoryTransactions);
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
  } else if (colName === 'orders') {
    memoryOrders = upsertArray(memoryOrders);
    backupToStorage(DB_KEYS.ORDERS, memoryOrders);
  } else if (colName === 'products') {
    memoryProducts = upsertArray(memoryProducts, false);
    backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
  } else if (colName === 'assistant_conversations') {
    memoryAssistantConversations = upsertArray(memoryAssistantConversations);
    backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  }
  dispatchDbChange();
}

function applyServerDocDelete(colName: string, id: string): void {
  if (!id || isPendingWrite(colName, id)) return;
  if (colName === 'users') {
    memoryUsers = memoryUsers.filter(u => u && u.id !== id);
    backupToStorage(DB_KEYS.USERS, memoryUsers);
  } else if (colName === 'wallets') {
    if (memoryWallets[id]) {
      const next = { ...memoryWallets };
      delete next[id];
      memoryWallets = next;
      backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    }
  } else if (colName === 'resale_listings') {
    memoryResaleListings = memoryResaleListings.filter(l => l && l.id !== id);
    backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  } else if (colName === 'user_products') {
    memoryUserProducts = memoryUserProducts.filter(up => up && up.id !== id);
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
  } else if (colName === 'assistant_conversations') {
    memoryAssistantConversations = memoryAssistantConversations.filter(c => c && c.id !== id);
    backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  }
  dispatchDbChange();
}

async function syncFromSharedServer(forceFull = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (serverSyncInFlight && !forceFull) return serverSyncInFlight;
  if (serverSyncInFlight && forceFull) {
    await serverSyncInFlight.catch(() => false);
  }

  serverSyncInFlight = (async () => {
    try {
      // Flush any pending local mutations FIRST so server snapshot includes them
      if (syncOutbox.size > 0) {
        await flushSyncOutbox().catch(() => undefined);
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;
      const useSinceRevision =
        !forceFull &&
        lastSyncedRevision > 0 &&
        serverSyncedCols.size > 0 &&
        syncOutbox.size === 0;
      const sinceParam = useSinceRevision ? `&sinceRevision=${lastSyncedRevision}` : '';
      const res = await fetch(`/api/sync/state?t=${Date.now()}${sinceParam}`, {
        cache: 'no-store',
        signal: controller?.signal
      });
      if (timer) clearTimeout(timer);
      if (!res.ok) return false;
      const json = await res.json();
      if (json?.unchanged === true && serverSyncedCols.size > 0 && !forceFull) {
        return true;
      }
      const cols = json?.collections;
      if (!cols || typeof cols !== 'object') return false;

      const toSnapDocs = (mapObj: Record<string, any> | undefined) =>
        Object.entries(mapObj || {}).map(([id, val]) => ({
          id,
          data: () => val
        }));

      // 1. Apply deleted_users first & purge any deleted users/outbox references locally
      const deletedDocs = toSnapDocs(cols.deleted_users);
      if (deletedDocs.length > 0) {
        const deletedSet = new Set<string>(memoryDeletedUserIds);
        deletedDocs.forEach(d => {
          const uid = d.id || (d.data() as any)?.id;
          if (uid && uid !== ADMIN_UID) {
            deletedSet.add(uid);
          }
        });
        memoryDeletedUserIds = Array.from(deletedSet);
        backupToStorage(DB_KEYS.DELETED_USERS, memoryDeletedUserIds);
      }

      if (memoryDeletedUserIds.length > 0) {
        const deletedLookup = new Set(memoryDeletedUserIds);
        memoryUsers = memoryUsers.filter(u => u && !deletedLookup.has(u.id));
        memoryUserProducts = memoryUserProducts.filter(up => up && !deletedLookup.has(up.currentOwnerId));
        memoryResaleListings = memoryResaleListings.filter(l => l && !deletedLookup.has(l.sellerId));
        memoryDeletedUserIds.forEach(uid => {
          syncOutbox.delete(outboxKey('users', uid));
          syncOutbox.delete(outboxKey('wallets', uid));
        });
        persistOutboxToStorage();
      }

      // 2. Bidirectional local-to-server reconciliation:
      // Upload any non-deleted local records missing on the server (so offline/mobile writes never vanish!)
      const seedCols: Record<string, Record<string, any>> = {
        users: {},
        wallets: {},
        deposits: {},
        withdrawals: {},
        resale_listings: {},
        user_products: {},
        negotiations: {},
        notifications: {},
        transactions: {},
        orders: {}
      };
      let missingCount = 0;

      const serverUsersMap = cols.users || {};
      if (Object.keys(serverUsersMap).length === 0) {
        INITIAL_USERS.forEach(u => {
          seedCols.users[u.id] = cleanForFirestore(u);
          missingCount += 1;
        });
        Object.entries(INITIAL_WALLETS).forEach(([uid, w]) => {
          if (!cols.wallets?.[uid]) {
            seedCols.wallets[uid] = cleanForFirestore(w);
            missingCount += 1;
          }
        });
      }

      memoryUsers.forEach(u => {
        if (u && u.id && !memoryDeletedUserIds.includes(u.id) && !serverUsersMap[u.id] && !seedCols.users[u.id]) {
          seedCols.users[u.id] = cleanForFirestore(u);
          missingCount += 1;
        }
      });
      Object.entries(memoryWallets).forEach(([uid, w]) => {
        if (uid && w && !memoryDeletedUserIds.includes(uid) && !cols.wallets?.[uid] && !seedCols.wallets[uid]) {
          seedCols.wallets[uid] = cleanForFirestore(w);
          missingCount += 1;
        }
      });
      memoryDeposits.forEach(x => {
        if (x?.id && !cols.deposits?.[x.id]) {
          seedCols.deposits[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryWithdrawals.forEach(x => {
        if (x?.id && !cols.withdrawals?.[x.id]) {
          seedCols.withdrawals[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryTransactions.forEach(x => {
        if (x?.id && !cols.transactions?.[x.id]) {
          seedCols.transactions[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryOrders.forEach(x => {
        if (x?.id && !cols.orders?.[x.id]) {
          seedCols.orders[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryNegotiations.forEach(x => {
        if (x?.id && !cols.negotiations?.[x.id]) {
          seedCols.negotiations[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryNotifications.forEach(x => {
        if (x?.id && !cols.notifications?.[x.id]) {
          seedCols.notifications[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryUserProducts.forEach(x => {
        if (x?.id && !memoryDeletedUserIds.includes(x.currentOwnerId) && !cols.user_products?.[x.id]) {
          seedCols.user_products[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });
      memoryResaleListings.forEach(x => {
        if (x?.id && !memoryDeletedUserIds.includes(x.sellerId) && !cols.resale_listings?.[x.id]) {
          seedCols.resale_listings[x.id] = cleanForFirestore(x);
          missingCount += 1;
        }
      });

      if (missingCount > 0) {
        let seedRes = await fetch('/api/sync/seed-missing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ collections: seedCols })
        }).catch(() => null);

        if (seedRes && seedRes.status === 413) {
          seedRes = await fetch('/api/sync/seed-missing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({ collections: stripHeavyMediaForStorage(seedCols) })
          }).catch(() => null);
        }

        if (seedRes && seedRes.ok) {
          const reRes = await fetch(`/api/sync/state?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
          if (reRes && reRes.ok) {
            const reJson = await reRes.json();
            if (reJson?.collections) {
              Object.assign(cols, reJson.collections);
            }
          }
        }
      }

      // 3. Apply users from server truth
      const userDocs = toSnapDocs(cols.users);
      if (userDocs.length > 0) {
        serverSyncedCols.add('users');
        const localById = new Map(memoryUsers.map(mu => [mu.id, mu]));
        const mergedUsers: User[] = [];
        const seenIds = new Set<string>();
        userDocs.forEach(d => {
          const u = d.data() as User;
          if (!u) return;
          const uid = d.id || u.id;
          if (isLegacyRemovedAdmin({ id: uid, email: u.email })) return;
          const isMaster = uid === ADMIN_UID;
          if (!isMaster && memoryDeletedUserIds.includes(uid)) return;
          const localMatch = localById.get(uid);
          seenIds.add(uid);
          if (isPendingWrite('users', uid) && localMatch) {
            mergedUsers.push(localMatch);
            return;
          }
          mergedUsers.push({
            ...u,
            id: uid,
            role: isMaster || u.role === 'admin' ? 'admin' : 'client',
            accountStatus: isMaster || u.role === 'admin' ? 'ativo' : (u.accountStatus || localMatch?.accountStatus || 'em_processamento'),
            phone: u.phone || localMatch?.phone || '',
            password: u.password || localMatch?.password,
            idCardFront: u.idCardFront || localMatch?.idCardFront || '',
            idCardBack: u.idCardBack || localMatch?.idCardBack || ''
          });
        });
        memoryUsers.forEach(lu => {
          if (lu?.id && !isLegacyRemovedAdmin(lu) && !seenIds.has(lu.id) && isPendingWrite('users', lu.id) && !memoryDeletedUserIds.includes(lu.id)) {
            mergedUsers.unshift(lu);
          }
        });
        memoryUsers = mergedUsers;
        backupToStorage(DB_KEYS.USERS, memoryUsers);
      }

      // 4. Apply wallets from server truth
      const walletDocs = toSnapDocs(cols.wallets);
      if (walletDocs.length > 0) {
        serverSyncedCols.add('wallets');
        const nextWallets: Record<string, Wallet> = {};
        walletDocs.forEach(d => {
          const w = d.data() as Wallet;
          if (!w) return;
          const uid = d.id || w.userId;
          if (LEGACY_REMOVED_ADMIN_IDS.has(uid)) return;
          if (uid !== ADMIN_UID && memoryDeletedUserIds.includes(uid)) return;
          if (isPendingWrite('wallets', uid) && memoryWallets[uid]) {
            nextWallets[uid] = memoryWallets[uid];
          } else {
            nextWallets[uid] = { ...w, userId: uid };
          }
        });
        Object.entries(memoryWallets).forEach(([uid, lw]) => {
          if (isPendingWrite('wallets', uid) && lw) {
            nextWallets[uid] = lw;
          }
        });
        memoryWallets = nextWallets;
        backupToStorage(DB_KEYS.WALLETS, memoryWallets);
      }

      // 5. Apply all transactional collections
      memoryDeposits = mergeListById<DepositRequest>(toSnapDocs(cols.deposits), memoryDeposits, 'deposits', true, true);
      backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);

      memoryWithdrawals = mergeListById<WithdrawalRequest>(toSnapDocs(cols.withdrawals), memoryWithdrawals, 'withdrawals', true, true);
      backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);

      memoryResaleListings = mergeListById<ResaleListing>(toSnapDocs(cols.resale_listings), memoryResaleListings, 'resale_listings', true, true);
      backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);

      memoryNegotiations = mergeListById<Negotiation>(toSnapDocs(cols.negotiations), memoryNegotiations, 'negotiations', true, true);
      backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

      memoryTransactions = mergeListById<Transaction>(toSnapDocs(cols.transactions), memoryTransactions, 'transactions', true, true);
      backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

      memoryOrders = mergeListById<Order>(toSnapDocs(cols.orders), memoryOrders, 'orders', true, true);
      backupToStorage(DB_KEYS.ORDERS, memoryOrders);

      memoryUserProducts = mergeListById<UserProduct>(toSnapDocs(cols.user_products), memoryUserProducts, 'user_products', false, true);
      backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

      memoryNotifications = mergeListById<Notification>(toSnapDocs(cols.notifications), memoryNotifications, 'notifications', true, true);
      backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);

      memoryAssistantConversations = mergeListById<AssistantConversation>(
        toSnapDocs(cols.assistant_conversations),
        memoryAssistantConversations,
        'assistant_conversations',
        true,
        true
      );
      backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);

      const prodDocs = toSnapDocs(cols.products);
      if (prodDocs.length > 0) {
        const prodsMap = new Map<string, Product>();
        INITIAL_PRODUCTS.forEach(p => prodsMap.set(p.id, p));
        prodDocs.forEach(d => {
          const p = d.data() as Product;
          if (p && p.id) {
            prodsMap.set(p.id, { ...(prodsMap.get(p.id) || p), ...p });
          }
        });
        memoryProducts = Array.from(prodsMap.values());
        backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
      }

      if (Number(json?.revision) > 0) {
        lastSyncedRevision = Number(json.revision);
      }
      dispatchDbChange();
      return true;
    } catch {
      return false;
    } finally {
      serverSyncInFlight = null;
    }
  })();

  return serverSyncInFlight;
}

export async function forceSyncFromSharedServer(): Promise<boolean> {
  return syncFromSharedServer(true);
}

/**
 * Initialize real-time Shared Server (SSE) + Cloud Firestore listeners on all collections
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
      } else if (ev.key === DB_KEYS.DELETED_USERS) {
        memoryDeletedUserIds = loadFromStorage(DB_KEYS.DELETED_USERS, []);
        changed = true;
      } else if (ev.key === DB_KEYS.ASSISTANT_CONVERSATIONS) {
        memoryAssistantConversations = loadFromStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, []);
        changed = true;
      }
      if (changed) dispatchDbChange();
    });

    // Real-time Server-Sent Events stream across Chrome, Safari, desktop & mobile
    let es: EventSource | null = null;
    const connectSse = () => {
      if (typeof EventSource === 'undefined') return;
      try {
        if (es) es.close();
        es = new EventSource('/api/sync/stream');
        es.addEventListener('upsert', (ev: any) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload?.collection && payload?.id && payload?.doc) {
              applyServerDocUpdate(payload.collection, payload.id, payload.doc);
            }
          } catch {}
        });
        es.addEventListener('delete', (ev: any) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload?.collection && payload?.id) {
              applyServerDocDelete(payload.collection, payload.id);
            }
          } catch {}
        });
        es.addEventListener('resync', () => {
          void syncFromSharedServer();
        });
        es.addEventListener('connected', () => {
          void syncFromSharedServer();
        });
      } catch {}
    };
    connectSse();
    void flushSyncOutbox().then(() => syncFromSharedServer(true));

    // Fallback poll when SSE is throttled or disconnected or outbox still has unsent items
    setInterval(() => {
      if (syncOutbox.size > 0) {
        void flushSyncOutbox();
      }
      if (!es || es.readyState !== 1) {
        if (es && es.readyState === 2) connectSse();
        void syncFromSharedServer();
      }
    }, 6000);

    // Re-sync immediately when browser tab regains visibility or network reconnects (essential for Safari background throttling)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!es || es.readyState === 2) connectSse();
        void flushSyncOutbox().then(() => syncFromSharedServer(true));
      }
    });
    window.addEventListener('online', () => {
      if (!es || es.readyState === 2) connectSse();
      void flushSyncOutbox().then(() => syncFromSharedServer(true));
    });
  }
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
      const numOfficial = Number(merged.officialPrice);
      const safePrice = Number.isFinite(numOfficial) && numOfficial > 0 ? numOfficial : (existing.officialPrice || 5000);
      const numResale = Number(merged.suggestedResalePrice);
      const safeResale = Number.isFinite(numResale) && numResale > 0 ? numResale : Math.round(safePrice * 1.35);
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
  assertAdminCaller();
  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Produto não encontrado');
  const updated = { ...memoryProducts[idx], ...updates };
  memoryProducts[idx] = updated;
  backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
  dispatchDbChange();

  writeDocToFirestore('products', id, updated, true).catch(() => {});

  return updated;
}

export function createProduct(productData: Omit<Product, 'id'>): Product {
  assertAdminCaller();
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}`
  };
  memoryProducts = [newProduct, ...memoryProducts];
  backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
  dispatchDbChange();

  writeDocToFirestore('products', newProduct.id, newProduct, false).catch(() => {});

  return newProduct;
}

// ==========================================
// USERS & AUTH
// ==========================================
export function getUsers(): User[] {
  const map = new Map<string, User>();
  const isDeleted = (id: string) =>
    id !== ADMIN_UID &&
    memoryDeletedUserIds.includes(id);

  INITIAL_USERS.forEach(u => {
    if (u && u.id && !isLegacyRemovedAdmin(u) && !isDeleted(u.id)) {
      map.set(u.id, { ...u });
    }
  });
  memoryUsers.forEach(u => {
    if (u && u.id && !isLegacyRemovedAdmin(u) && !isDeleted(u.id)) {
      const isMaster = u.id === ADMIN_UID;
      const initial = map.get(u.id);
      map.set(u.id, {
        ...(initial || {}),
        ...u,
        role: isMaster || u.role === 'admin' ? 'admin' : 'client',
        accountStatus: isMaster || u.role === 'admin' ? 'ativo' : (u.accountStatus || initial?.accountStatus || 'em_processamento'),
        phone: u.phone || initial?.phone || '',
        password: u.password || initial?.password
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

function applyCloudSnapshotDocs(
  colName: string,
  docs: Array<{ id: string; data: any }>
): void {
  firestoreSyncedCols.add(colName);
  const prevCloudIds = firestoreDocIds.get(colName) || new Set<string>();
  const nextCloudIds = new Set<string>();
  docs.forEach(d => {
    if (d.id) nextCloudIds.add(d.id);
  });
  firestoreDocIds.set(colName, nextCloudIds);

  const removedFromCloud = new Set<string>();
  prevCloudIds.forEach(oldId => {
    if (!nextCloudIds.has(oldId) && !isPendingWrite(colName, oldId)) {
      removedFromCloud.add(oldId);
    }
  });

  if (colName === 'users') {
    const map = new Map<string, User>();
    memoryUsers.forEach(u => {
      if (u?.id && !isLegacyRemovedAdmin(u) && !removedFromCloud.has(u.id) && !memoryDeletedUserIds.includes(u.id)) {
        map.set(u.id, u);
      }
    });
    docs.forEach(({ id, data }) => {
      const uid = String(data?.id || id);
      if (!uid) return;
      if (isLegacyRemovedAdmin({ id: uid, email: data?.email })) return;
      if (uid !== ADMIN_UID && memoryDeletedUserIds.includes(uid)) return;
      if (isPendingWrite('users', uid) && map.has(uid)) return;
      map.set(uid, normalizeUserFromDoc(uid, data, map.get(uid)));
    });
    memoryUsers = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    backupToStorage(DB_KEYS.USERS, memoryUsers);
    dispatchDbChange();
    return;
  }

  if (colName === 'deposits') {
    const map = new Map<string, DepositRequest>();
    memoryDeposits.forEach(d => {
      if (d?.id && !removedFromCloud.has(d.id)) map.set(d.id, d);
    });
    docs.forEach(({ id, data }) => {
      const depId = String(data?.id || id);
      if (!depId) return;
      if (isPendingWrite('deposits', depId) && map.has(depId)) return;
      map.set(depId, normalizeDepositFromDoc(depId, data));
    });
    memoryDeposits = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
    dispatchDbChange();
    return;
  }

  if (colName === 'withdrawals') {
    const map = new Map<string, WithdrawalRequest>();
    memoryWithdrawals.forEach(w => {
      if (w?.id && !removedFromCloud.has(w.id)) map.set(w.id, w);
    });
    docs.forEach(({ id, data }) => {
      const wthId = String(data?.id || id);
      if (!wthId) return;
      if (isPendingWrite('withdrawals', wthId) && map.has(wthId)) return;
      map.set(wthId, normalizeWithdrawalFromDoc(wthId, data));
    });
    memoryWithdrawals = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
    dispatchDbChange();
    return;
  }

  if (colName === 'wallets') {
    const nextWallets: Record<string, Wallet> = { ...memoryWallets };
    removedFromCloud.forEach(id => {
      delete nextWallets[id];
    });
    docs.forEach(({ id, data }) => {
      const uid = String(data?.userId || id);
      if (!uid || memoryDeletedUserIds.includes(uid)) return;
      if (isPendingWrite('wallets', uid) && nextWallets[uid]) return;
      nextWallets[uid] = normalizeGenericDates<Wallet>(uid, { ...data, userId: uid });
    });
    memoryWallets = nextWallets;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    dispatchDbChange();
    return;
  }

  const mergeCollectionArray = <T extends { id: string; createdAt?: string; updatedAt?: string }>(
    current: T[],
    sortDesc = true
  ): T[] => {
    const map = new Map<string, T>();
    current.forEach(item => {
      if (item?.id && !removedFromCloud.has(item.id)) map.set(item.id, item);
    });
    docs.forEach(({ id, data }) => {
      const docId = String(data?.id || id);
      if (!docId) return;
      if (isPendingWrite(colName, docId) && map.has(docId)) return;
      map.set(docId, normalizeGenericDates<T>(docId, data));
    });
    const list = Array.from(map.values());
    if (sortDesc) {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime()
      );
    }
    return list;
  };

  if (colName === 'orders') {
    memoryOrders = mergeCollectionArray<Order>(memoryOrders);
    backupToStorage(DB_KEYS.ORDERS, memoryOrders);
  } else if (colName === 'resale_listings') {
    memoryResaleListings = mergeCollectionArray<ResaleListing>(memoryResaleListings);
    backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  } else if (colName === 'negotiations') {
    memoryNegotiations = mergeCollectionArray<Negotiation>(memoryNegotiations);
    backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
  } else if (colName === 'transactions') {
    memoryTransactions = mergeCollectionArray<Transaction>(memoryTransactions);
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
  } else if (colName === 'notifications') {
    memoryNotifications = mergeCollectionArray<Notification>(memoryNotifications);
    backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
  } else if (colName === 'user_products') {
    memoryUserProducts = mergeCollectionArray<UserProduct>(memoryUserProducts, false);
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
  } else if (colName === 'assistant_conversations') {
    memoryAssistantConversations = mergeCollectionArray<AssistantConversation>(memoryAssistantConversations);
    backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  }
  dispatchDbChange();
}

export async function fetchCloudFirestoreCollection(
  colName: string,
  strictThrow = false
): Promise<number> {
  try {
    const snap = await getDocs(collection(firestore, colName));
    const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
    applyCloudSnapshotDocs(colName, docs);
    return docs.length;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colName, strictThrow);
    return 0;
  }
}

export interface AdminRealtimeOptions {
  onCollectionSync?: (colName: string, count: number) => void;
  onError?: (colName: string, message: string, code?: string) => void;
}

export function subscribeAdminFirestoreRealtime(
  options: AdminRealtimeOptions = {}
): () => void {
  const caller = getCurrentUser();
  if (!isAdminUserRecord(caller)) {
    return () => {};
  }

  const targetCollections = [
    'users',
    'deposits',
    'withdrawals',
    'orders',
    'resale_listings',
    'negotiations',
    'wallets',
    'transactions',
    'notifications',
    'assistant_conversations'
  ];

  void testFirestoreConnection();

  const unsubscribers: Unsubscribe[] = [];
  targetCollections.forEach(colName => {
    try {
      const q = query(collection(firestore, colName));
      const unsub = onSnapshot(
        q,
        snapshot => {
          const docs = snapshot.docs.map(d => ({ id: d.id, data: d.data() }));
          applyCloudSnapshotDocs(colName, docs);
          options.onCollectionSync?.(colName, docs.length);
        },
        err => {
          const info = handleFirestoreError(err, OperationType.LIST, colName, false);
          options.onError?.(colName, formatFirestoreErrorForUser(err), info.code);
        }
      );
      unsubscribers.push(unsub);
    } catch (err: any) {
      const info = handleFirestoreError(err, OperationType.LIST, colName, false);
      options.onError?.(colName, formatFirestoreErrorForUser(err), info.code);
    }
  });

  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
  };
}

export async function signInAdminFirebaseAuth(email: string, password: string): Promise<void> {
  const cleanEmail = (email || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanEmail || !cleanPass) {
    throw new Error('Insere o email e a palavra-passe do Administrador no Firebase.');
  }
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
  const uid = cred.user.uid;
  if (LEGACY_REMOVED_ADMIN_IDS.has(uid)) {
    try {
      await signOut(auth);
    } catch {}
    throw new Error('A conta do Administrador antigo foi removida.');
  }
  let isAuthorizedAdmin = uid === ADMIN_UID;
  if (!isAuthorizedAdmin) {
    try {
      const userSnap = await getDoc(doc(firestore, 'users', uid));
      if (userSnap.exists() && userSnap.data()?.role === 'admin') {
        isAuthorizedAdmin = true;
      }
    } catch {}
  }
  if (!isAuthorizedAdmin) {
    try {
      await signOut(auth);
    } catch {}
    throw new Error('Esta conta Firebase não possui permissão de Administrador (role: "admin").');
  }
}

export async function syncUsersFromFirestore(): Promise<User[]> {
  await Promise.allSettled([
    syncFromSharedServer(true),
    fetchCloudFirestoreCollection('users', false)
  ]);
  return getUsers();
}

export async function syncAdminCollectionsFromFirestore(): Promise<{
  firestoreErrors: Array<{ collection: string; message: string; code?: string }>;
}> {
  const firestoreErrors: Array<{ collection: string; message: string; code?: string }> = [];
  const adminCols = ['users', 'deposits', 'withdrawals', 'orders', 'resale_listings', 'negotiations', 'wallets', 'transactions'];

  await Promise.allSettled([
    syncFromSharedServer(true),
    ...adminCols.map(async col => {
      try {
        await fetchCloudFirestoreCollection(col, true);
      } catch (err: any) {
        firestoreErrors.push({
          collection: col,
          message: err?.message || formatFirestoreErrorForUser(err),
          code: err?.code
        });
      }
    })
  ]);

  return { firestoreErrors };
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const currentId = memoryCurrentUserId || safeStorageGet(DB_KEYS.CURRENT_USER_ID);
  if (!currentId) return null;
  if (
    LEGACY_REMOVED_ADMIN_IDS.has(currentId) ||
    (currentId !== ADMIN_UID && memoryDeletedUserIds.includes(currentId))
  ) {
    memoryCurrentUserId = null;
    memoryCurrentUserObj = null;
    safeStorageRemove(DB_KEYS.CURRENT_USER_ID);
    safeStorageRemove('baba_current_user_obj');
    return null;
  }
  const users = getUsers();
  let user = users.find(u => u && (u.id === currentId || u.id?.toLowerCase() === currentId.toLowerCase()));
  if (!user && memoryCurrentUserObj && memoryCurrentUserObj.id === currentId && !isLegacyRemovedAdmin(memoryCurrentUserObj) && !memoryDeletedUserIds.includes(currentId)) {
    user = memoryCurrentUserObj;
  }
  if (!user) {
    try {
      const rawCached = safeStorageGet('baba_current_user_obj');
      if (rawCached) {
        const parsed = JSON.parse(rawCached);
        if (parsed && (parsed.id === currentId || !currentId) && !isLegacyRemovedAdmin(parsed) && !memoryDeletedUserIds.includes(parsed.id)) {
          user = parsed;
        }
      }
    } catch {}
  }
  if (user && isLegacyRemovedAdmin(user)) {
    memoryCurrentUserId = null;
    memoryCurrentUserObj = null;
    safeStorageRemove(DB_KEYS.CURRENT_USER_ID);
    safeStorageRemove('baba_current_user_obj');
    return null;
  }
  if (user && isAdminUserRecord(user)) {
    user = { ...user, role: 'admin', accountStatus: 'ativo' };
  }
  return user || null;
}

export async function logoutUser(): Promise<void> {
  memoryCurrentUserId = null;
  memoryCurrentUserObj = null;
  memoryOnboardingCompleted = false;
  safeStorageRemove(DB_KEYS.CURRENT_USER_ID);
  safeStorageRemove('baba_current_user_obj');
  safeStorageRemove('baba_onboarding_completed');
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

  if (!user || isLegacyRemovedAdmin(user)) {
    throw new Error('Utilizador não encontrado.');
  }

  const isAdmin = isAdminUserRecord(user);
  if (isAdmin) {
    user.role = 'admin';
    user.accountStatus = 'ativo';
  } else {
    user.accountStatus = user.accountStatus || 'em_processamento';
  }

  memoryCurrentUserId = user.id;
  memoryCurrentUserObj = { ...user };
  memoryOnboardingCompleted = true;

  memoryUsers = [user, ...memoryUsers.filter(u => u && u.id !== user!.id)];
  backupToStorage(DB_KEYS.USERS, memoryUsers);
  safeStorageSet(DB_KEYS.CURRENT_USER_ID, user.id);
  safeStorageSet('baba_current_user_obj', JSON.stringify(user));
  safeStorageSet('baba_onboarding_completed', 'true');
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

  // Ensure latest server user directory before duplicate check
  await Promise.race([syncUsersFromFirestore(), new Promise<void>(res => setTimeout(res, 2000))]);

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
      // Conta não existe na base de dados da plataforma (verificado acima): cria registo na plataforma
      console.warn('Firebase Auth email-already-in-use orphan fallback:', email);
      authUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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
    totalWithdrawn: 0,
    updatedAt: new Date().toISOString()
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

  const activeId = memoryCurrentUserId || safeStorageGet(DB_KEYS.CURRENT_USER_ID);
  if (activeId === userId) {
    memoryCurrentUserId = null;
    memoryCurrentUserObj = null;
    safeStorageRemove(DB_KEYS.CURRENT_USER_ID);
    safeStorageRemove('baba_current_user_obj');
  }

  // Create pending review notification for the new user
  const userPendingNotif = createNotification(
    userId,
    'Conta em Revisão pelo Administrador 📋',
    'A tua conta foi criada e encontra-se em revisão. Assim que o Administrador validar os teus dados e o Bilhete de Identidade, poderás iniciar sessão e usar os 500,00 Kz de bónus.',
    'sistema',
    'carteira'
  );

  // Notificar imediatamente o Administrador sobre novo documento BI para validar
  const adminBiNotif = createNotification(
    ADMIN_UID,
    'Novo Documento BI para Validar 📋',
    `${newUser.name} (${newUser.phone}) submeteu o BI ${newUser.idNumber} (${newUser.province}) e aguarda validação no Painel Adm.`,
    'sistema',
    'admin'
  );

  // 2. Enviar para Cloud Firestore e servidor partilhado ANTES de terminar sessão Firebase Auth (para request.auth.uid == userId)
  try {
    await Promise.race([
      Promise.all([
        writeDocToFirestore('users', userId, newUser, true),
        writeDocToFirestore('wallets', userId, newWallet, true),
        writeDocToFirestore('transactions', welcomeTx.id, welcomeTx, true),
        writeDocToFirestore('notifications', userPendingNotif.id, userPendingNotif, false),
        writeDocToFirestore('notifications', adminBiNotif.id, adminBiNotif, false)
      ]).then(() => flushSyncOutbox()),
      new Promise<void>(res => setTimeout(res, 6500))
    ]);
  } catch (fsErr) {
    console.warn('Server/Firestore sync note:', fsErr);
  } finally {
    // Não autenticar automaticamente — a conta fica em revisão até o Administrador validar o BI e aceitar
    try {
      await signOut(auth);
    } catch {
      // safe ignore
    }
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

  initDatabase();

  // 1. Rejeitar explicitamente o Administrador antigo removido
  const isLegacyAdminAttempt =
    searchPhoneNorm === '932200719' ||
    strippedTerm === 'kt5dflarjzv7hcnmq3zvgqfokm62' ||
    strippedTerm === 'usr_admin' ||
    term === 'admin@baba.ao' ||
    term === 'admin@babashopping.ao';

  if (isLegacyAdminAttempt) {
    throw new Error('A conta do Administrador antigo foi removida.');
  }

  // 2. Sincronizar utilizadores do servidor primeiro quando possível para garantir dados e estado atualizados
  await Promise.race([syncUsersFromFirestore(), new Promise<void>(res => setTimeout(res, 2500))]);

  // Procurar conta existente (correspondência exata de email, telefone, BI ou ID)
  const users = getUsers();
  const safeStr = (v: any) => (v !== null && v !== undefined ? String(v).trim() : '');

  let matched: User | undefined = users.find(u => {
    if (!u || isLegacyRemovedAdmin(u)) return false;
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

  const assertAccountApproved = async (u: User) => {
    if (isLegacyRemovedAdmin(u)) {
      try {
        await signOut(auth);
      } catch {}
      throw new Error('A conta do Administrador antigo foi removida.');
    }
    if (isAdminUserRecord(u)) return;

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

  // 4. Se nenhuma conta local corresponder e for um email, tentar autenticar diretamente via Firebase Auth + Cloud Firestore
  let authenticatedViaFirebase = false;
  if (!matched && rawId.includes('@')) {
    try {
      const cred = await signInWithEmailAndPassword(auth, rawId, passTerm);
      authenticatedViaFirebase = true;
      const uid = cred.user.uid;

      if (LEGACY_REMOVED_ADMIN_IDS.has(uid)) {
        try {
          await signOut(auth);
        } catch {}
        throw new Error('A conta do Administrador antigo foi removida.');
      }

      let fsDocData: any = null;
      let fsDocId = uid;
      try {
        const directSnap = await getDoc(doc(firestore, 'users', uid));
        if (directSnap.exists()) {
          fsDocData = directSnap.data();
          fsDocId = directSnap.id;
        } else {
          const emailSnap = await getDocs(query(collection(firestore, 'users'), where('email', '==', rawId)));
          if (!emailSnap.empty) {
            fsDocData = emailSnap.docs[0].data();
            fsDocId = emailSnap.docs[0].id;
          }
        }
      } catch {}

      if (fsDocData) {
        matched = normalizeUserFromDoc(fsDocId, fsDocData);
      } else if (uid === ADMIN_UID) {
        matched = {
          ...INITIAL_USERS[0],
          id: uid,
          name: cred.user.displayName || 'Administrador BABA',
          email: cred.user.email || rawId,
          role: 'admin',
          accountStatus: 'ativo'
        };
      }
    } catch (authErr: any) {
      if (authErr?.message && authErr.message.includes('Administrador antigo foi removida')) {
        throw authErr;
      }
      if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
        throw new Error('Palavra-passe incorreta! Verifica a tua senha e tenta novamente.');
      }
    }
  }

  // Se nenhuma conta existente corresponder aos dados -> RECUSAR ENTRADA
  if (!matched) {
    throw new Error('Conta não encontrada! Verifica o teu telefone/email ou cria uma nova conta primeiro.');
  }

  // Se alguém entrou apenas com o UID do Administrador antes do primeiro login com email no dispositivo
  if (matched.id === ADMIN_UID && !matched.password && !matched.email && !authenticatedViaFirebase) {
    throw new Error('Para iniciar sessão com esta conta de Administrador, entra com o email e a palavra-passe da conta ABcb3DyaZGMapMxuQ0KqYQdPnqT2.');
  }

  // 5. Validar estritamente a palavra-passe da conta encontrada (ou confirmar Firebase Auth)
  if (!authenticatedViaFirebase) {
    if (matched.password) {
      if (passTerm !== matched.password) {
        throw new Error('Palavra-passe incorreta! Verifica a tua senha e tenta novamente.');
      }
    } else {
      let firebaseValid = false;
      if (matched.email) {
        try {
          await signInWithEmailAndPassword(auth, matched.email, passTerm);
          firebaseValid = true;
          authenticatedViaFirebase = true;
        } catch {
          firebaseValid = false;
        }
      }
      if (!firebaseValid) {
        throw new Error('Palavra-passe incorreta! Verifica a tua senha e tenta novamente.');
      }
      matched.password = passTerm;
    }
  }

  // Refrescar dados/role a partir do documento Cloud Firestore do utilizador se autenticado
  if (matched.email && !authenticatedViaFirebase) {
    try {
      await signInWithEmailAndPassword(auth, matched.email, passTerm);
      authenticatedViaFirebase = true;
    } catch {
      // safe fallback
    }
  }
  if (authenticatedViaFirebase && auth.currentUser) {
    try {
      const freshSnap = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
      if (freshSnap.exists()) {
        matched = normalizeUserFromDoc(freshSnap.id, freshSnap.data(), matched);
      }
    } catch {}
  }

  if (matched.id === ADMIN_UID) {
    const needsAdminSync = matched.role !== 'admin' || matched.accountStatus !== 'ativo';
    matched = {
      ...matched,
      role: 'admin',
      accountStatus: 'ativo'
    };
    if (needsAdminSync || authenticatedViaFirebase) {
      writeDocToFirestore('users', matched.id, matched, true).catch(() => {});
    }
    if (!memoryWallets[matched.id]) {
      const starterAdminWallet: Wallet = {
        ...(INITIAL_WALLETS[ADMIN_UID] || {
          userId: matched.id,
          availableBalance: 50000000,
          pendingBalance: 0,
          reservedBalance: 0,
          totalDeposited: 50000000,
          totalSpent: 0,
          totalEarned: 0,
          totalWithdrawn: 0
        }),
        updatedAt: new Date().toISOString()
      };
      memoryWallets[matched.id] = starterAdminWallet;
      backupToStorage(DB_KEYS.WALLETS, memoryWallets);
      writeDocToFirestore('wallets', matched.id, starterAdminWallet, true).catch(() => {});
    }
  }

  // 6. Bloquear entrada se a conta ainda estiver em revisão ou tiver sido rejeitada pelo Administrador
  await assertAccountApproved(matched);

  const activeMatched: User = { ...matched };
  memoryUsers = [activeMatched, ...memoryUsers.filter(u => u && u.id !== activeMatched.id)];
  backupToStorage(DB_KEYS.USERS, memoryUsers);

  return setCurrentUser(activeMatched);
}

export function approveKYC(userId: string): User {
  assertAdminCaller();
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
      const baseInviterWallet = getWallet(inviter.id);
      const inviterWallet: Wallet = {
        ...baseInviterWallet,
        availableBalance: (Number(baseInviterWallet.availableBalance) || 0) + 1000,
        totalDeposited: (Number(baseInviterWallet.totalDeposited) || 0) + 1000,
        updatedAt: new Date().toISOString()
      };
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

      writeDocToFirestore('wallets', inviter.id, inviterWallet, true).catch(() => {});
      writeDocToFirestore('transactions', bonusTx.id, bonusTx, true).catch(() => {});
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
  writeDocToFirestore('users', userId, updated, true).catch(() => {});

  return updated;
}

export function rejectKYC(userId: string, reason: string): User {
  assertAdminCaller();
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
  writeDocToFirestore('users', userId, updated, true).catch(() => {});

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

  if (safeStorageGet(DB_KEYS.CURRENT_USER_ID) === userId) {
    safeStorageSet('baba_current_user_obj', JSON.stringify(updated));
  }

  createNotification(
    ADMIN_UID,
    'Documento BI Reenviado para Validação 📋',
    `${updated.name} reenviou as fotografias do BI ${updated.idNumber} para nova análise no Painel Adm.`,
    'sistema',
    'admin'
  );

  dispatchDbChange();
  writeDocToFirestore('users', userId, updated, true).catch(() => {});

  return updated;
}

export function getPendingKYCUsers(): User[] {
  return getUsers().filter(u => u.accountStatus === 'em_processamento');
}

function assertAdminCaller(): void {
  const caller = getCurrentUser();
  const isAdmin = isAdminUserRecord(caller);
  if (!isAdmin) {
    throw new Error('Acesso negado: apenas administradores autorizados podem executar esta operação.');
  }
}

export function suspendUser(userId: string, reason?: string): User {
  assertAdminCaller();
  if (userId === ADMIN_UID) {
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

  if (safeStorageGet(DB_KEYS.CURRENT_USER_ID) === userId) {
    safeStorageSet('baba_current_user_obj', JSON.stringify(updated));
  }

  dispatchDbChange();
  writeDocToFirestore('users', userId, updated, true).catch(() => {});

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
  writeDocToFirestore('users', userId, updated, true).catch(() => {});

  return updated;
}

export function deleteUserAccount(userId: string): void {
  assertAdminCaller();
  if (userId === ADMIN_UID) {
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

  if (memoryCurrentUserId === userId || safeStorageGet(DB_KEYS.CURRENT_USER_ID) === userId) {
    memoryCurrentUserId = null;
    memoryCurrentUserObj = null;
    safeStorageRemove(DB_KEYS.CURRENT_USER_ID);
    safeStorageRemove('baba_current_user_obj');
    signOut(auth).catch(() => {});
  }

  dispatchDbChange();

  const delMarker = {
    id: userId,
    deletedAt: new Date().toISOString()
  };
  void writeDocToFirestore('deleted_users', userId, delMarker, true).catch(() => {});
  void deleteDocOnServer('users', userId);
  void deleteDocOnServer('wallets', userId);
  removedListingIds.forEach(listingId => {
    void deleteDocOnServer('resale_listings', listingId);
  });
}

// ==========================================
// WALLET & TRANSACTIONS
// ==========================================
export function getWallets(): Record<string, Wallet> {
  return memoryWallets;
}

export function getWallet(userId: string): Wallet {
  const existing = memoryWallets[userId];
  if (existing) {
    return existing;
  }
  const initialAdmin = INITIAL_WALLETS[userId];
  if (initialAdmin) {
    return { ...initialAdmin };
  }
  // NUNCA escrever 500 Kz para o Firestore ao ler antes da sincronização terminar!
  return {
    userId,
    availableBalance: 500,
    pendingBalance: 0,
    reservedBalance: 0,
    totalDeposited: 500,
    totalSpent: 0,
    totalEarned: 0,
    totalWithdrawn: 0
  };
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
  adminId: string = ADMIN_UID
): { wallet: Wallet; transaction: Transaction } {
  assertAdminCaller();
  const users = getUsers();
  const user = users.find(u => u && u.id === userId);
  if (!user) throw new Error('Utilizador não encontrado');

  const baseWallet = getWallet(userId);
  const numericAmount = Math.abs(Number(amount));
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor insere um montante válido superior a 0 Kz.');
  }

  if (type === 'remove' && baseWallet.availableBalance < numericAmount) {
    throw new Error(`Saldo insuficiente para debitar. O utilizador dispõe de ${formatKz(baseWallet.availableBalance)}.`);
  }

  const wallet: Wallet = {
    ...baseWallet,
    availableBalance:
      type === 'add'
        ? (Number(baseWallet.availableBalance) || 0) + numericAmount
        : (Number(baseWallet.availableBalance) || 0) - numericAmount,
    totalDeposited:
      type === 'add'
        ? (Number(baseWallet.totalDeposited) || 0) + numericAmount
        : Number(baseWallet.totalDeposited) || 0,
    totalSpent:
      type === 'remove'
        ? (Number(baseWallet.totalSpent) || 0) + numericAmount
        : Number(baseWallet.totalSpent) || 0,
    updatedAt: new Date().toISOString()
  };

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

  writeDocToFirestore('wallets', userId, wallet, true).catch(() => {});
  writeDocToFirestore('transactions', tx.id, tx, false).catch(() => {});

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
    ADMIN_UID,
    'Novo Depósito Pendente de Aprovação 💰',
    `${newDeposit.userName} solicitou um depósito de ${formatMoney(numericAmount)} (Ref: ${reference}). Aprova no Painel do Adm para creditar na carteira.`,
    'sistema',
    'admin',
    newDeposit.id
  );

  dispatchDbChange();
  writeDocToFirestore('deposits', newDeposit.id, newDeposit, false).catch(() => {});
  writeDocToFirestore('transactions', pendingTx.id, pendingTx, false).catch(() => {});

  return newDeposit;
}

export function approveDeposit(depositId: string): DepositRequest {
  assertAdminCaller();
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de carregamento não encontrado');
  const existingDeposit = memoryDeposits[idx];
  if (existingDeposit.status === 'aprovado') return existingDeposit;

  const deposit: DepositRequest = {
    ...existingDeposit,
    status: 'aprovado'
  };
  memoryDeposits[idx] = deposit;
  backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);

  const baseWallet = getWallet(deposit.userId);
  const wallet: Wallet = {
    ...baseWallet,
    availableBalance: (Number(baseWallet.availableBalance) || 0) + (Number(deposit.amount) || 0),
    totalDeposited: (Number(baseWallet.totalDeposited) || 0) + (Number(deposit.amount) || 0),
    updatedAt: new Date().toISOString()
  };
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
  writeDocToFirestore('deposits', depositId, deposit, true).catch(() => {});
  writeDocToFirestore('wallets', deposit.userId, wallet, true).catch(() => {});
  writeDocToFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});

  return deposit;
}

export function rejectDeposit(depositId: string, reason?: string): DepositRequest {
  assertAdminCaller();
  const idx = memoryDeposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new Error('Pedido de carregamento não encontrado');
  const existingDeposit = memoryDeposits[idx];
  if (existingDeposit.status !== 'pendente') return existingDeposit;

  const cleanReason = (reason || '').trim();
  const deposit: DepositRequest = {
    ...existingDeposit,
    status: 'rejeitado',
    ...(cleanReason ? { rejectionReason: cleanReason } : {})
  };
  memoryDeposits[idx] = deposit;
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
  writeDocToFirestore('deposits', depositId, deposit, true).catch(() => {});
  writeDocToFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});

  return deposit;
}

export const MIN_WITHDRAWAL_AMOUNT = 0;

export function requestWithdrawal(
  userId: string,
  amount: number,
  iban: string,
  bankName: string,
  accountHolder?: string
): WithdrawalRequest {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Por favor, introduz um montante maior que zero para sacar.');
  }

  const wallet = getWallet(userId);
  const reservedSum = getPendingReservedAmount(userId);
  const withdrawableBalance = Math.max(0, wallet.availableBalance - reservedSum);

  if (Math.round(numericAmount * 100) > Math.round(withdrawableBalance * 100)) {
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
    ADMIN_UID,
    'Novo Saque Pendente de Aprovação 🏦',
    `${newWithdrawal.userName} solicitou um levantamento de ${formatMoney(numericAmount)} para ${newWithdrawal.bankName} (${newWithdrawal.iban}).`,
    'sistema',
    'admin',
    newWithdrawal.id
  );

  dispatchDbChange();
  writeDocToFirestore('withdrawals', newWithdrawal.id, newWithdrawal, false).catch(() => {});
  writeDocToFirestore('transactions', pendingTx.id, pendingTx, false).catch(() => {});

  return newWithdrawal;
}

export function processWithdrawal(
  withdrawalId: string,
  status: 'processado' | 'rejeitado',
  reason?: string
): WithdrawalRequest {
  assertAdminCaller();
  const idx = memoryWithdrawals.findIndex(w => w.id === withdrawalId);
  if (idx === -1) throw new Error('Pedido de levantamento não encontrado');
  const existingWth = memoryWithdrawals[idx];
  if (existingWth.status !== 'pendente') return existingWth;

  const cleanReason = (reason || '').trim();
  const baseWallet = getWallet(existingWth.userId);
  const wallet: Wallet = {
    ...baseWallet,
    updatedAt: new Date().toISOString()
  };
  const linkedTxId = `tx_wth_${withdrawalId}`;
  const txIdx = memoryTransactions.findIndex(t => t.id === linkedTxId);
  const isNewNonDebitedFlow = txIdx !== -1 || wallet.pendingBalance < existingWth.amount;

  if (status === 'processado') {
    if (isNewNonDebitedFlow) {
      if (wallet.availableBalance < existingWth.amount) {
        throw new Error(
          `Saldo insuficiente na conta do utilizador (${formatMoney(wallet.availableBalance)}) para aprovar e debitar ${formatMoney(existingWth.amount)}.`
        );
      }
      wallet.availableBalance -= existingWth.amount;
    } else {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - existingWth.amount);
    }
    wallet.totalWithdrawn += existingWth.amount;
  } else {
    // Rejeitado: se era pedido antigo com pendingBalance congelado, devolve; se novo fluxo, nada foi debitado
    if (!isNewNonDebitedFlow && wallet.pendingBalance >= existingWth.amount) {
      wallet.pendingBalance -= existingWth.amount;
      wallet.availableBalance += existingWth.amount;
    }
  }

  const wth: WithdrawalRequest = {
    ...existingWth,
    status,
    ...(status === 'rejeitado' && cleanReason ? { rejectionReason: cleanReason } : {})
  };
  memoryWithdrawals[idx] = wth;
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
  writeDocToFirestore('withdrawals', withdrawalId, wth, true).catch(() => {});
  writeDocToFirestore('wallets', wth.userId, wallet, true).catch(() => {});
  writeDocToFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});

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
    listingPrice: Number(l.listingPrice) > 0 ? Number(l.listingPrice) : 5000,
    originalPrice: Number(l.originalPrice) > 0 ? Number(l.originalPrice) : 5000
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
  const numericListingPrice = Number(listingPrice);
  if (!Number.isFinite(numericListingPrice) || numericListingPrice <= 0) {
    throw new Error('O preço de revenda deve ser maior que zero.');
  }
  const upIdx = memoryUserProducts.findIndex(
    up => up.id === userProductId && up.currentOwnerId === sellerId
  );
  if (upIdx === -1) throw new Error('Produto não encontrado no teu inventário');

  const userProd = memoryUserProducts[upIdx];
  if (userProd.status === 'vendido') {
    throw new Error('Este artigo já foi vendido.');
  }
  const user = getUsers().find(u => u.id === sellerId);
  const isAdmin = sellerId === ADMIN_UID || user?.role === 'admin';
  const nowIso = new Date().toISOString();

  const newListing: ResaleListing = {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    userProductId,
    sellerId,
    sellerName: user ? user.name : 'Vendedor BABA',
    productName: userProd.productName,
    category: userProd.category,
    originalPrice: userProd.originalPrice,
    listingPrice: numericListingPrice,
    minAcceptablePrice: minAcceptablePrice > 0 ? minAcceptablePrice : Math.round(numericListingPrice * 0.8),
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
      ADMIN_UID,
      'Novo Anúncio de Revenda Pendente 📦',
      `${newListing.sellerName} submeteu "${newListing.productName}" por ${formatMoney(listingPrice)} para aprovação no Mercado de Revenda.`,
      'sistema',
      'admin',
      newListing.id
    );
  }

  dispatchDbChange();
  writeDocToFirestore('resale_listings', newListing.id, newListing, false).catch(() => {});
  writeDocToFirestore('user_products', userProd.id, userProd, true).catch(() => {});

  return newListing;
}

export function approveResaleListing(listingId: string): ResaleListing {
  assertAdminCaller();
  const listIdx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (listIdx === -1) throw new Error('Anúncio não encontrado');
  const existing = memoryResaleListings[listIdx];
  if (existing.status === 'ativo') return existing;

  const listing: ResaleListing = {
    ...existing,
    status: 'ativo',
    rejectionReason: '',
    updatedAt: new Date().toISOString()
  };
  memoryResaleListings[listIdx] = listing;

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx] = { ...memoryUserProducts[upIdx], status: 'anunciado' };
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
    writeDocToFirestore('user_products', memoryUserProducts[upIdx].id, memoryUserProducts[upIdx], true).catch(() => {});
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
  writeDocToFirestore('resale_listings', listingId, listing, true).catch(() => {});
  return listing;
}

export function rejectResaleListing(listingId: string, reason: string): ResaleListing {
  assertAdminCaller();
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição do anúncio.');
  }
  const listIdx = memoryResaleListings.findIndex(l => l.id === listingId);
  if (listIdx === -1) throw new Error('Anúncio não encontrado');
  const listing: ResaleListing = {
    ...memoryResaleListings[listIdx],
    status: 'rejeitado',
    rejectionReason: cleanReason,
    updatedAt: new Date().toISOString()
  };
  memoryResaleListings[listIdx] = listing;

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx] = { ...memoryUserProducts[upIdx], status: 'disponivel' };
    backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);
    writeDocToFirestore('user_products', memoryUserProducts[upIdx].id, memoryUserProducts[upIdx], true).catch(() => {});
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
  writeDocToFirestore('resale_listings', listingId, listing, true).catch(() => {});
  return listing;
}

export function cancelResaleListing(listingId: string, sellerId: string): void {
  const listIdx = memoryResaleListings.findIndex(
    l => l.id === listingId && l.sellerId === sellerId
  );
  if (listIdx === -1) throw new Error('Anúncio não encontrado ou sem permissão');

  const listing: ResaleListing = {
    ...memoryResaleListings[listIdx],
    status: 'pausado',
    updatedAt: new Date().toISOString()
  };
  memoryResaleListings[listIdx] = listing;

  const upIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (upIdx !== -1) {
    memoryUserProducts[upIdx] = { ...memoryUserProducts[upIdx], status: 'disponivel' };
    writeDocToFirestore('user_products', memoryUserProducts[upIdx].id, memoryUserProducts[upIdx], true).catch(() => {});
  }

  backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  dispatchDbChange();
  writeDocToFirestore('resale_listings', listingId, listing, true).catch(() => {});
}

function executeConfirmedResaleSettlement(
  listing: ResaleListing,
  buyerId: string,
  paidPrice: number,
  existingOrder?: Order
): Order {
  const nowIso = new Date().toISOString();
  const baseBuyerWallet = getWallet(buyerId);
  const buyerWallet: Wallet = {
    ...baseBuyerWallet,
    updatedAt: nowIso
  };
  const isAdminOrPersona =
    buyerId.startsWith('persona_') ||
    buyerId === ADMIN_UID;

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

  buyerWallet.availableBalance -= paidPrice;
  buyerWallet.totalSpent += paidPrice;
  memoryWallets[buyerId] = buyerWallet;

  const orderId = existingOrder?.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const buyTxId = `tx_ord_${orderId}`;
  const existingBuyIdx = memoryTransactions.findIndex(t => t.id === buyTxId);
  const buyTx: Transaction = {
    id: buyTxId,
    userId: buyerId,
    userName: existingOrder?.buyerName || (buyerUser ? buyerUser.name : 'Comprador'),
    amount: -paidPrice,
    type: 'compra_revenda',
    description: `Compra no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: existingOrder?.createdAt || nowIso
  };
  if (existingBuyIdx !== -1) {
    memoryTransactions[existingBuyIdx] = buyTx;
  } else {
    memoryTransactions = [buyTx, ...memoryTransactions];
  }

  const baseSellerWallet = getWallet(listing.sellerId);
  const sellerWallet: Wallet = {
    ...baseSellerWallet,
    availableBalance: (Number(baseSellerWallet.availableBalance) || 0) + paidPrice,
    totalEarned: (Number(baseSellerWallet.totalEarned) || 0) + paidPrice,
    updatedAt: nowIso
  };
  memoryWallets[listing.sellerId] = sellerWallet;

  const sellTx: Transaction = {
    id: `tx_${Date.now()}_sell_${Math.random().toString(36).substring(2, 5)}`,
    userId: listing.sellerId,
    userName: sellerUser ? sellerUser.name : listing.sellerName || 'Vendedor',
    amount: paidPrice,
    type: 'venda_recebida',
    description: `Venda Concluída no Mercado de Revenda: ${listing.productName}`,
    status: 'confirmada',
    reference: existingOrder?.paymentReference || `REV-${listing.id.slice(-6)}`,
    createdAt: nowIso
  };

  memoryTransactions = [sellTx, ...memoryTransactions];
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  const updatedListing: ResaleListing = {
    ...listing,
    status: 'vendido',
    updatedAt: nowIso
  };
  const lIdx = memoryResaleListings.findIndex(l => l.id === listing.id);
  if (lIdx !== -1) {
    memoryResaleListings[lIdx] = updatedListing;
  }

  memoryNegotiations = memoryNegotiations.map(n => {
    if (n.listingId === listing.id) {
      if (n.buyerId === buyerId || n.status === 'aceite') {
        const updatedNeg: Negotiation = {
          ...n,
          status: 'concluida',
          statusMessage: 'Compra concluída automaticamente com sucesso!',
          updatedAt: nowIso
        };
        writeDocToFirestore('negotiations', n.id, updatedNeg, true).catch(() => {});
        return updatedNeg;
      } else if (n.status === 'pendente' || n.status === 'contraproposta' || n.status === 'aguardando_adm') {
        const updatedNeg: Negotiation = {
          ...n,
          status: 'cancelada',
          statusMessage: 'Artigo adquirido por outro comprador',
          updatedAt: nowIso
        };
        writeDocToFirestore('negotiations', n.id, updatedNeg, true).catch(() => {});
        return updatedNeg;
      }
    }
    return n;
  });
  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  const oldItemIdx = memoryUserProducts.findIndex(up => up.id === listing.userProductId);
  if (oldItemIdx !== -1) {
    memoryUserProducts[oldItemIdx] = { ...memoryUserProducts[oldItemIdx], status: 'vendido' };
    writeDocToFirestore('user_products', memoryUserProducts[oldItemIdx].id, memoryUserProducts[oldItemIdx], true).catch(() => {});
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
      'Compra P2P Concluída & Produto Entregue! 📦',
      `A tua compra de "${listing.productName}" (${formatMoney(paidPrice)}) foi concluída automaticamente e já está em "Meus Produtos".`,
      'compra',
      'produto',
      newItem.id
    );
  }

  dispatchDbChange();

  writeDocToFirestore('wallets', buyerId, buyerWallet, true).catch(() => {});
  writeDocToFirestore('wallets', listing.sellerId, sellerWallet, true).catch(() => {});
  writeDocToFirestore('resale_listings', updatedListing.id, updatedListing, true).catch(() => {});
  writeDocToFirestore('user_products', newItem.id, newItem, false).catch(() => {});
  writeDocToFirestore('transactions', buyTx.id, buyTx, true).catch(() => {});
  writeDocToFirestore('transactions', sellTx.id, sellTx, false).catch(() => {});
  writeDocToFirestore('orders', confirmedOrder.id, confirmedOrder, true).catch(() => {});

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

  const numericPaidPrice = Number(paidPrice);
  if (!Number.isFinite(numericPaidPrice) || numericPaidPrice <= 0) {
    throw new Error('Preço da compra inválido.');
  }

  const buyerUser = getUsers().find(u => u.id === buyerId);
  const isAdminOrPersona =
    buyerId.startsWith('persona_') ||
    buyerId === ADMIN_UID ||
    buyerUser?.role === 'admin';

  if (!isAdminOrPersona) {
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
  }

  // Compra automática e imediata: liquida na hora e entrega diretamente em "Meus Produtos"
  const confirmed = executeConfirmedResaleSettlement(listing, buyerId, numericPaidPrice);
  return { id: confirmed.id, pendingApproval: false };
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

  const qty = Math.max(1, Number(quantity) || 1);
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

  const user = getUsers().find(u => u.id === userId);
  const nowIso = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ref = `BABA-${orderId.slice(-6).toUpperCase()}`;

  // Compra automática: debita saldo imediatamente e entrega o(s) artigo(s) diretamente em "Meus Produtos"
  const updatedWallet: Wallet = {
    ...wallet,
    availableBalance: Math.max(0, (Number(wallet.availableBalance) || 0) - totalPrice),
    totalSpent: (Number(wallet.totalSpent) || 0) + totalPrice,
    updatedAt: nowIso
  };
  memoryWallets[userId] = updatedWallet;
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const memProdIdx = memoryProducts.findIndex(p => p.id === prod.id);
  if (memProdIdx !== -1) {
    const nextStock = Math.max(0, (Number(memoryProducts[memProdIdx].stock) || 0) - qty);
    const updatedProd: Product = {
      ...memoryProducts[memProdIdx],
      stock: nextStock,
      status: nextStock > 0 ? 'disponivel' : 'esgotado'
    };
    memoryProducts[memProdIdx] = updatedProd;
    backupToStorage(DB_KEYS.PRODUCTS, memoryProducts);
    writeDocToFirestore('products', updatedProd.id, updatedProd, true).catch(() => {});
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
    writeDocToFirestore('user_products', newItem.id, newItem, false).catch(() => {});
  }
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  const confirmedOrder: Order = {
    id: orderId,
    buyerId: userId,
    buyerName: user ? user.name : 'Cliente',
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

  memoryOrders = [confirmedOrder, ...memoryOrders];
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);

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
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  createNotification(
    userId,
    'Compra Concluída & Produto Entregue! 📦',
    `A tua compra de ${qty}x "${prod.name}" (${formatMoney(totalPrice)}) foi confirmada automaticamente e já está em "Meus Produtos" pronta para revenda!`,
    'compra',
    'produto',
    orderId
  );

  dispatchDbChange();

  writeDocToFirestore('wallets', userId, updatedWallet, true).catch(() => {});
  writeDocToFirestore('orders', confirmedOrder.id, confirmedOrder, false).catch(() => {});
  writeDocToFirestore('transactions', confirmedTx.id, confirmedTx, false).catch(() => {});

  return { order: { id: orderId, pendingApproval: false } };
}

export function approveOrder(orderId: string): Order {
  assertAdminCaller();
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado');
  const existingOrder = memoryOrders[idx];
  if (existingOrder.status !== 'aguardando_aprovacao') return existingOrder;

  if (existingOrder.source === 'revenda') {
    const firstItem = existingOrder.items[0];
    const listingId = firstItem?.productId;
    const listing = memoryResaleListings.find(l => l.id === listingId);
    if (!listing || listing.status !== 'ativo') {
      throw new Error('Este anúncio já não está ativo no Mercado de Revenda (pode já ter sido vendido ou retirado).');
    }
    return executeConfirmedResaleSettlement(listing, existingOrder.buyerId, existingOrder.totalAmount, existingOrder);
  }

  // Compra Oficial
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
  backupToStorage(DB_KEYS.WALLETS, memoryWallets);

  const itemSummary = existingOrder.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const linkedTxId = `tx_ord_${existingOrder.id}`;
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
      userId: existingOrder.buyerId,
      userName: existingOrder.buyerName,
      amount: -existingOrder.totalAmount,
      type: 'compra_oficial',
      description: `Compra Oficial Aprovada & Entregue: ${itemSummary}`,
      status: 'confirmada',
      reference: existingOrder.paymentReference,
      createdAt: existingOrder.createdAt || nowIso
    };
    memoryTransactions = [finalTx, ...memoryTransactions];
  }
  backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);

  // Entregar itens em "Meus Produtos"
  existingOrder.items.forEach(item => {
    const prodMeta = getProducts().find(p => p.id === item.productId);
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
      writeDocToFirestore('user_products', newItem.id, newItem, false).catch(() => {});
    }
  });
  backupToStorage(DB_KEYS.USER_PRODUCTS, memoryUserProducts);

  const order: Order = {
    ...existingOrder,
    status: 'pagamento_confirmado',
    updatedAt: nowIso
  };
  memoryOrders[idx] = order;
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
  writeDocToFirestore('orders', order.id, order, true).catch(() => {});
  writeDocToFirestore('wallets', order.buyerId, wallet, true).catch(() => {});
  writeDocToFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});

  return order;
}

export function rejectOrder(orderId: string, reason: string): Order {
  assertAdminCaller();
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição do pedido.');
  }
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new Error('Pedido de compra não encontrado');
  const existingOrder = memoryOrders[idx];
  if (existingOrder.status !== 'aguardando_aprovacao') return existingOrder;

  const nowIso = new Date().toISOString();
  const order: Order = {
    ...existingOrder,
    status: 'cancelado',
    rejectionReason: cleanReason,
    updatedAt: nowIso
  };
  memoryOrders[idx] = order;
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
  writeDocToFirestore('orders', order.id, order, true).catch(() => {});
  writeDocToFirestore('transactions', finalTx.id, finalTx, true).catch(() => {});

  return order;
}

// ==========================================
// NEGOTIATIONS (Propostas P2P)
// ==========================================
export function getNegotiations(userId: string): Negotiation[] {
  const user = getUsers().find(u => u.id === userId);
  if (userId === ADMIN_UID || user?.role === 'admin') {
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
    buyerId === ADMIN_UID ||
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
      ADMIN_UID,
      'Nova Proposta P2P Pendente de Aprovação 🤝',
      `${resolvedBuyerName} enviou proposta de ${formatMoney(proposedPrice)} para "${listing.productName}" (Vendedor: ${listing.sellerName}). Aprova ou recusa no Painel do Adm.`,
      'negociacao',
      'admin',
      newNeg.id
    );
  }

  dispatchDbChange();
  writeDocToFirestore('negotiations', newNeg.id, newNeg, false).catch(() => {});

  return newNeg;
}

export function approveNegotiationProposal(negotiationId: string): Negotiation {
  assertAdminCaller();
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Proposta de negociação não encontrada');
  const existing = memoryNegotiations[idx];
  if (existing.status !== 'aguardando_adm') return existing;

  const neg: Negotiation = {
    ...existing,
    status: 'pendente',
    adminRejectionReason: '',
    statusMessage: 'Aprovada pelo Adm — Aguardando resposta do vendedor',
    updatedAt: new Date().toISOString()
  };
  memoryNegotiations[idx] = neg;

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
  writeDocToFirestore('negotiations', negotiationId, neg, true).catch(() => {});
  return neg;
}

export function rejectNegotiationProposal(negotiationId: string, reason: string): Negotiation {
  assertAdminCaller();
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('Por favor, escreve o motivo da rejeição da proposta.');
  }
  const idx = memoryNegotiations.findIndex(n => n.id === negotiationId);
  if (idx === -1) throw new Error('Proposta de negociação não encontrada');
  const existing = memoryNegotiations[idx];
  if (existing.status !== 'aguardando_adm') return existing;

  const neg: Negotiation = {
    ...existing,
    status: 'recusada',
    adminRejectionReason: cleanReason,
    statusMessage: `Proposta recusada pelo Administrador: ${cleanReason}`,
    updatedAt: new Date().toISOString()
  };
  memoryNegotiations[idx] = neg;

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
  writeDocToFirestore('negotiations', negotiationId, neg, true).catch(() => {});
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
  const existing = memoryNegotiations[idx];
  const neg: Negotiation = {
    ...existing,
    messages: [...(existing.messages || [])]
  };

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
  memoryNegotiations[idx] = neg;

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
      ADMIN_UID,
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
  writeDocToFirestore('negotiations', negotiationId, neg, true).catch(() => {});

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
  const existing = memoryNegotiations[idx];
  const neg: Negotiation = {
    ...existing,
    messages: [...(existing.messages || [])]
  };

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
  memoryNegotiations[idx] = neg;

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
  writeDocToFirestore('negotiations', negotiationId, neg, true).catch(() => {});

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
  const existing = memoryNegotiations[idx];

  if (existing.adminRejectionReason) {
    throw new Error('Esta proposta foi recusada pelo Administrador e não pode ser reaberta.');
  }

  const neg: Negotiation = {
    ...existing,
    messages: [...(existing.messages || [])]
  };

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
  memoryNegotiations[idx] = neg;

  backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);

  const recipientId = isWaitingAdmin
    ? ADMIN_UID
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
      ADMIN_UID,
      `Nova mensagem de ${senderName} para ${neg.buyerName}`,
      `"${text}"`,
      'negociacao',
      'admin',
      neg.id
    );
  }

  dispatchDbChange();
  writeDocToFirestore('negotiations', negotiationId, neg, true).catch(() => {});

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
  linkType?: 'produto' | 'negociacao' | 'carteira' | 'admin' | 'assistente',
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
  writeDocToFirestore('notifications', newNotif.id, newNotif, false).catch(() => {});

  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const idx = memoryNotifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    const updated = { ...memoryNotifications[idx], read: true };
    memoryNotifications[idx] = updated;
    backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
    dispatchDbChange();
    writeDocToFirestore('notifications', id, updated, true).catch(() => {});
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const toPersist: Notification[] = [];
  memoryNotifications = memoryNotifications.map(n => {
    if (n.recipientId === userId && !n.read) {
      const updated = { ...n, read: true };
      toPersist.push(updated);
      return updated;
    }
    return n;
  });
  backupToStorage(DB_KEYS.NOTIFICATIONS, memoryNotifications);
  dispatchDbChange();
  toPersist.forEach(n => {
    writeDocToFirestore('notifications', n.id, n, true).catch(() => {});
  });
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
  assertAdminCaller();
  const idx = memoryOrders.findIndex(o => o.id === orderId);
  if (idx === -1) return { id: orderId, status };
  const updated: Order = {
    ...memoryOrders[idx],
    status,
    updatedAt: new Date().toISOString()
  };
  memoryOrders[idx] = updated;
  backupToStorage(DB_KEYS.ORDERS, memoryOrders);
  dispatchDbChange();
  writeDocToFirestore('orders', orderId, updated, true).catch(() => {});
  return updated;
}

// ==========================================
// ASSISTENTE JENIFFER (ATENDIMENTO INTELIGENTE)
// ==========================================
export function getAllAssistantConversations(): AssistantConversation[] {
  return [...memoryAssistantConversations].sort((a, b) => {
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return tb - ta;
  });
}

export function getAssistantConversations(userId?: string): AssistantConversation[] {
  const all = getAllAssistantConversations();
  if (!userId) return all;
  return all.filter(c => c && c.userId === userId);
}

export function createAssistantConversation(user: User, title = 'Novo Atendimento'): AssistantConversation {
  const nowIso = new Date().toISOString();
  const welcomeMsg: AssistantMessage = {
    id: `jmsg_welcome_${Date.now()}`,
    conversationId: '',
    sender: 'jeniffer',
    senderName: 'Assistente Jeniffer',
    text: `Olá ${user.name?.split(' ')[0] || 'Cliente'}! Sou a Assistente Jeniffer, a tua gerente virtual na BABA SHOPPING. Posso explicar como funciona a compra e revenda, consultar o teu saldo ou estado de depósitos/saques/BI, ou encaminhar qualquer questão para o Administrador. Em que posso ajudar hoje?`,
    timestamp: nowIso
  };
  const convId = `chat_jen_${user.id.slice(-6)}_${Date.now()}`;
  welcomeMsg.conversationId = convId;

  const conv: AssistantConversation = {
    id: convId,
    userId: user.id,
    userName: user.name || 'Cliente BABA',
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
  backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  dispatchDbChange();
  writeDocToFirestore('assistant_conversations', convId, conv, false).catch(() => {});
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
  code?: string;
}> {
  const res = await fetch('/api/assistant/jeniffer/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ conversationId, userId, message })
  });
  const json = await res.json().catch(() => ({
    ok: false,
    error: 'Falha ao comunicar com o servidor da Assistente Jeniffer.'
  }));

  if (json?.conversation) {
    const conv = json.conversation as AssistantConversation;
    memoryAssistantConversations = [
      conv,
      ...memoryAssistantConversations.filter(c => c && c.id !== conv.id)
    ];
    backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
    dispatchDbChange();
  }

  if (!res.ok || !json?.ok) {
    return {
      ok: false,
      conversation: json?.conversation,
      error: json?.error || 'Não foi possível obter resposta da Assistente Jeniffer.',
      code: json?.code
    };
  }

  return {
    ok: true,
    conversation: json.conversation,
    reply: json.replyMessage
  };
}

export async function escalateAssistantConversation(
  conversationId: string,
  userId: string,
  reason: string
): Promise<{ ok: boolean; conversation?: AssistantConversation; error?: string }> {
  const res = await fetch('/api/assistant/jeniffer/escalate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ conversationId, userId, reason })
  });
  const json = await res.json().catch(() => ({
    ok: false,
    error: 'Erro ao encaminhar atendimento para o Administrador.'
  }));

  if (json?.conversation) {
    const conv = json.conversation as AssistantConversation;
    memoryAssistantConversations = [
      conv,
      ...memoryAssistantConversations.filter(c => c && c.id !== conv.id)
    ];
    backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
    dispatchDbChange();
  }

  if (!res.ok || !json?.ok) {
    return { ok: false, error: json?.error || 'Erro ao encaminhar para o Administrador.' };
  }
  return { ok: true, conversation: json.conversation };
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
  const cleanText = text.trim();
  if (!cleanText) throw new Error('Escreve uma resposta antes de enviar.');

  const existing = memoryAssistantConversations[idx];
  const nowIso = new Date().toISOString();
  const msg: AssistantMessage = {
    id: `jmsg_adm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    sender: 'admin',
    senderName: adminUser?.name || 'Administrador BABA',
    text: cleanText,
    timestamp: nowIso
  };

  const updated: AssistantConversation = {
    ...existing,
    status: nextStatus || (existing.status === 'aguardando_adm' ? 'ativo' : existing.status),
    messages: [...(Array.isArray(existing.messages) ? existing.messages : []), msg],
    lastMessagePreview: `Adm: ${cleanText.slice(0, 85)}`,
    unreadByAdmin: false,
    unreadByUser: true,
    updatedAt: nowIso
  };

  memoryAssistantConversations = [
    updated,
    ...memoryAssistantConversations.filter(c => c && c.id !== conversationId)
  ];
  backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  dispatchDbChange();
  writeDocToFirestore('assistant_conversations', conversationId, updated, false).catch(() => {});

  createNotification(
    existing.userId,
    'Resposta do Administrador no Atendimento Jeniffer',
    cleanText.slice(0, 140),
    'sistema',
    'assistente',
    conversationId
  );

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
  memoryAssistantConversations = [
    updated,
    ...memoryAssistantConversations.filter(c => c && c.id !== conversationId)
  ];
  backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  dispatchDbChange();
  writeDocToFirestore('assistant_conversations', conversationId, updated, false).catch(() => {});
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
    ...(viewer === 'admin' ? { unreadByAdmin: false } : { unreadByUser: false })
  };
  memoryAssistantConversations[idx] = updated;
  backupToStorage(DB_KEYS.ASSISTANT_CONVERSATIONS, memoryAssistantConversations);
  dispatchDbChange();
  writeDocToFirestore('assistant_conversations', conversationId, updated, true).catch(() => {});
}

// ==========================================
// FUNÇÕES ASSÍNCRONAS ADM COM PERSISTÊNCIA RIGOROSA NO CLOUD FIRESTORE
// ==========================================
export async function approveKYCAsync(userId: string): Promise<User> {
  assertAdminCaller();
  const prevUser = memoryUsers.find(u => u && u.id === userId);
  const prevWallets = { ...memoryWallets };
  const prevTxs = [...memoryTransactions];

  const updated = approveKYC(userId);
  try {
    await persistDocToFirestoreStrict(
      'users',
      userId,
      {
        accountStatus: 'ativo',
        rejectionReason: '',
        referralRewardPaid: Boolean(updated.referralRewardPaid),
        verifiedAt: updated.verifiedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      true
    );
    if (updated.referredBy && updated.referralRewardPaid && !prevUser?.referralRewardPaid) {
      const refNorm = updated.referredBy.trim().toUpperCase();
      const inviter = getUsers().find(
        u => u && u.id !== userId && (getUserInviteCode(u).toUpperCase() === refNorm || u.id.toUpperCase() === refNorm)
      );
      if (inviter && memoryWallets[inviter.id]) {
        await persistDocToFirestoreStrict('wallets', inviter.id, memoryWallets[inviter.id], true);
      }
    }
    return updated;
  } catch (err) {
    if (prevUser) {
      memoryUsers = memoryUsers.map(u => (u && u.id === userId ? prevUser : u));
      backupToStorage(DB_KEYS.USERS, memoryUsers);
    }
    memoryWallets = prevWallets;
    memoryTransactions = prevTxs;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
    dispatchDbChange();
    throw err;
  }
}

export async function rejectKYCAsync(userId: string, reason: string): Promise<User> {
  assertAdminCaller();
  const prevUser = memoryUsers.find(u => u && u.id === userId);
  const updated = rejectKYC(userId, reason);
  try {
    await persistDocToFirestoreStrict(
      'users',
      userId,
      {
        accountStatus: 'rejeitado',
        rejectionReason: updated.rejectionReason || reason,
        updatedAt: new Date().toISOString()
      },
      true
    );
    return updated;
  } catch (err) {
    if (prevUser) {
      memoryUsers = memoryUsers.map(u => (u && u.id === userId ? prevUser : u));
      backupToStorage(DB_KEYS.USERS, memoryUsers);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function approveDepositAsync(depositId: string): Promise<DepositRequest> {
  assertAdminCaller();
  const prevDep = memoryDeposits.find(d => d && d.id === depositId);
  const prevWallets = { ...memoryWallets };
  const prevTxs = [...memoryTransactions];

  const deposit = approveDeposit(depositId);
  const wallet = memoryWallets[deposit.userId];
  const tx = memoryTransactions.find(t => t.id === `tx_dep_${depositId}`);
  try {
    await persistDocToFirestoreStrict(
      'deposits',
      depositId,
      {
        status: 'aprovado',
        rejectionReason: '',
        updatedAt: new Date().toISOString()
      },
      true
    );
    if (wallet) {
      await persistDocToFirestoreStrict('wallets', deposit.userId, wallet, true);
    }
    if (tx) {
      await persistDocToFirestoreStrict('transactions', tx.id, tx, true);
    }
    return deposit;
  } catch (err) {
    if (prevDep) {
      memoryDeposits = memoryDeposits.map(d => (d && d.id === depositId ? prevDep : d));
      backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
    }
    memoryWallets = prevWallets;
    memoryTransactions = prevTxs;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
    dispatchDbChange();
    throw err;
  }
}

export async function rejectDepositAsync(depositId: string, reason?: string): Promise<DepositRequest> {
  assertAdminCaller();
  const prevDep = memoryDeposits.find(d => d && d.id === depositId);
  const prevTxs = [...memoryTransactions];

  const deposit = rejectDeposit(depositId, reason);
  const tx = memoryTransactions.find(t => t.id === `tx_dep_${depositId}`);
  try {
    await persistDocToFirestoreStrict(
      'deposits',
      depositId,
      {
        status: 'rejeitado',
        ...(deposit.rejectionReason ? { rejectionReason: deposit.rejectionReason } : {}),
        updatedAt: new Date().toISOString()
      },
      true
    );
    if (tx) {
      await persistDocToFirestoreStrict('transactions', tx.id, tx, true);
    }
    return deposit;
  } catch (err) {
    if (prevDep) {
      memoryDeposits = memoryDeposits.map(d => (d && d.id === depositId ? prevDep : d));
      backupToStorage(DB_KEYS.DEPOSITS, memoryDeposits);
    }
    memoryTransactions = prevTxs;
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
    dispatchDbChange();
    throw err;
  }
}

export async function processWithdrawalAsync(
  withdrawalId: string,
  status: 'processado' | 'rejeitado',
  reason?: string
): Promise<WithdrawalRequest> {
  assertAdminCaller();
  const prevWth = memoryWithdrawals.find(w => w && w.id === withdrawalId);
  const prevWallets = { ...memoryWallets };
  const prevTxs = [...memoryTransactions];

  const wth = processWithdrawal(withdrawalId, status, reason);
  const wallet = memoryWallets[wth.userId];
  const tx = memoryTransactions.find(t => t.id === `tx_wth_${withdrawalId}`);
  try {
    await persistDocToFirestoreStrict(
      'withdrawals',
      withdrawalId,
      {
        status,
        ...(status === 'rejeitado' && wth.rejectionReason ? { rejectionReason: wth.rejectionReason } : { rejectionReason: '' }),
        updatedAt: new Date().toISOString()
      },
      true
    );
    if (wallet) {
      await persistDocToFirestoreStrict('wallets', wth.userId, wallet, true);
    }
    if (tx) {
      await persistDocToFirestoreStrict('transactions', tx.id, tx, true);
    }
    return wth;
  } catch (err) {
    if (prevWth) {
      memoryWithdrawals = memoryWithdrawals.map(w => (w && w.id === withdrawalId ? prevWth : w));
      backupToStorage(DB_KEYS.WITHDRAWALS, memoryWithdrawals);
    }
    memoryWallets = prevWallets;
    memoryTransactions = prevTxs;
    backupToStorage(DB_KEYS.WALLETS, memoryWallets);
    backupToStorage(DB_KEYS.TRANSACTIONS, memoryTransactions);
    dispatchDbChange();
    throw err;
  }
}

export async function approveOrderAsync(orderId: string): Promise<Order> {
  assertAdminCaller();
  const prevOrd = memoryOrders.find(o => o && o.id === orderId);
  const order = approveOrder(orderId);
  try {
    await persistDocToFirestoreStrict('orders', orderId, order, true);
    if (memoryWallets[order.buyerId]) {
      await persistDocToFirestoreStrict('wallets', order.buyerId, memoryWallets[order.buyerId], true);
    }
    return order;
  } catch (err) {
    if (prevOrd) {
      memoryOrders = memoryOrders.map(o => (o && o.id === orderId ? prevOrd : o));
      backupToStorage(DB_KEYS.ORDERS, memoryOrders);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function rejectOrderAsync(orderId: string, reason: string): Promise<Order> {
  assertAdminCaller();
  const prevOrd = memoryOrders.find(o => o && o.id === orderId);
  const order = rejectOrder(orderId, reason);
  try {
    await persistDocToFirestoreStrict('orders', orderId, order, true);
    return order;
  } catch (err) {
    if (prevOrd) {
      memoryOrders = memoryOrders.map(o => (o && o.id === orderId ? prevOrd : o));
      backupToStorage(DB_KEYS.ORDERS, memoryOrders);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function approveResaleListingAsync(listingId: string): Promise<ResaleListing> {
  assertAdminCaller();
  const prevLst = memoryResaleListings.find(l => l && l.id === listingId);
  const listing = approveResaleListing(listingId);
  try {
    await persistDocToFirestoreStrict('resale_listings', listingId, listing, true);
    return listing;
  } catch (err) {
    if (prevLst) {
      memoryResaleListings = memoryResaleListings.map(l => (l && l.id === listingId ? prevLst : l));
      backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function rejectResaleListingAsync(listingId: string, reason: string): Promise<ResaleListing> {
  assertAdminCaller();
  const prevLst = memoryResaleListings.find(l => l && l.id === listingId);
  const listing = rejectResaleListing(listingId, reason);
  try {
    await persistDocToFirestoreStrict('resale_listings', listingId, listing, true);
    return listing;
  } catch (err) {
    if (prevLst) {
      memoryResaleListings = memoryResaleListings.map(l => (l && l.id === listingId ? prevLst : l));
      backupToStorage(DB_KEYS.RESALE_LISTINGS, memoryResaleListings);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function approveNegotiationProposalAsync(negotiationId: string): Promise<Negotiation> {
  assertAdminCaller();
  const prevNeg = memoryNegotiations.find(n => n && n.id === negotiationId);
  const neg = approveNegotiationProposal(negotiationId);
  try {
    await persistDocToFirestoreStrict('negotiations', negotiationId, neg, true);
    return neg;
  } catch (err) {
    if (prevNeg) {
      memoryNegotiations = memoryNegotiations.map(n => (n && n.id === negotiationId ? prevNeg : n));
      backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
      dispatchDbChange();
    }
    throw err;
  }
}

export async function rejectNegotiationProposalAsync(negotiationId: string, reason: string): Promise<Negotiation> {
  assertAdminCaller();
  const prevNeg = memoryNegotiations.find(n => n && n.id === negotiationId);
  const neg = rejectNegotiationProposal(negotiationId, reason);
  try {
    await persistDocToFirestoreStrict('negotiations', negotiationId, neg, true);
    return neg;
  } catch (err) {
    if (prevNeg) {
      memoryNegotiations = memoryNegotiations.map(n => (n && n.id === negotiationId ? prevNeg : n));
      backupToStorage(DB_KEYS.NEGOTIATIONS, memoryNegotiations);
      dispatchDbChange();
    }
    throw err;
  }
}

export {
  formatMoney,
  getActiveCurrency,
  setActiveCurrency,
  CURRENCIES,
  type CurrencyCode
};
