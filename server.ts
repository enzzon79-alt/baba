import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  processJenifferChat,
  escalateToAdminManual,
  type StoreCollections
} from './server/jeniffer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.join(__dirname, '.data');
const STORE_FILE = path.join(DATA_DIR, 'baba-store.json');

const ALLOWED_COLLECTIONS = new Set([
  'products',
  'users',
  'deleted_users',
  'wallets',
  'resale_listings',
  'user_products',
  'negotiations',
  'notifications',
  'deposits',
  'withdrawals',
  'transactions',
  'orders',
  'assistant_conversations'
]);

type StoreData = {
  revision: number;
  updatedAt: string;
  collections: Record<string, Record<string, any>>;
};

function createEmptyStore(): StoreData {
  const collections: Record<string, Record<string, any>> = {};
  ALLOWED_COLLECTIONS.forEach(col => {
    collections[col] = {};
  });
  return {
    revision: 1,
    updatedAt: new Date().toISOString(),
    collections
  };
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.collections) {
        const base = createEmptyStore();
        ALLOWED_COLLECTIONS.forEach(col => {
          if (parsed.collections[col] && typeof parsed.collections[col] === 'object') {
            base.collections[col] = parsed.collections[col];
          }
        });
        base.revision = Number(parsed.revision) || 1;
        base.updatedAt = parsed.updatedAt || new Date().toISOString();
        return base;
      }
    }
  } catch (err) {
    console.warn('Store load note:', err);
  }
  return createEmptyStore();
}

const store: StoreData = loadStore();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(store), 'utf8');
      fs.renameSync(tmp, STORE_FILE);
    } catch (err) {
      console.warn('Store persist error:', err);
    }
  }, 50);
}

const sseClients = new Set<Response>();

function broadcastEvent(eventName: string, payload: Record<string, any>): void {
  const dataStr = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(dataStr);
    } catch {
      sseClients.delete(client);
    }
  });
}

function upsertStoreDoc(
  collection: string,
  id: string,
  data: Record<string, any>,
  merge = true
): any {
  const colMap = store.collections[collection];
  if (!colMap) return null;
  const existing = colMap[id] && typeof colMap[id] === 'object' ? colMap[id] : null;
  const nextDoc = merge && existing ? { ...existing, ...data, id } : { ...data, id };
  colMap[id] = nextDoc;
  store.revision += 1;
  store.updatedAt = new Date().toISOString();
  schedulePersist();
  broadcastEvent('upsert', {
    collection,
    id,
    doc: nextDoc,
    revision: store.revision
  });
  return nextDoc;
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '25mb' }));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Full state snapshot for initial load & Safari visibility re-sync
  app.get('/api/sync/state', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      revision: store.revision,
      updatedAt: store.updatedAt,
      collections: store.collections
    });
  });

  // Real-time Server-Sent Events stream (works identically in Chrome & Safari)
  app.get('/api/sync/stream', (req: Request, res: Response) => {
    req.socket?.setTimeout?.(0);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(
      `event: connected\ndata: ${JSON.stringify({ revision: store.revision, ts: Date.now() })}\n\n`
    );

    const keepAlive = setInterval(() => {
      try {
        res.write(`: ping ${Date.now()}\n\n`);
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Upsert document (single or batch)
  app.post('/api/sync/upsert', (req: Request, res: Response) => {
    const { collection, id, data, merge = true } = req.body || {};
    if (
      typeof collection !== 'string' ||
      !ALLOWED_COLLECTIONS.has(collection) ||
      typeof id !== 'string' ||
      !id.trim() ||
      !data ||
      typeof data !== 'object'
    ) {
      res.status(400).json({ ok: false, error: 'Invalid upsert payload' });
      return;
    }

    const nextDoc = upsertStoreDoc(collection, id, data, merge);
    res.json({ ok: true, revision: store.revision, doc: nextDoc });
  });

  // Assistente Jeniffer: secure server-side Gemini AI chat & authorized data lookup
  app.post('/api/assistant/jeniffer/chat', async (req: Request, res: Response) => {
    const { conversationId, userId, message } = req.body || {};
    if (
      typeof conversationId !== 'string' ||
      !conversationId.trim() ||
      typeof userId !== 'string' ||
      !userId.trim() ||
      typeof message !== 'string'
    ) {
      res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', error: 'Pedido inválido para a Assistente Jeniffer.' });
      return;
    }

    const result = await processJenifferChat(
      {
        collections: store.collections as unknown as StoreCollections,
        upsertDoc: upsertStoreDoc
      },
      {
        conversationId: conversationId.trim(),
        userId: userId.trim(),
        message
      }
    );

    if (!result.ok) {
      res.status(result.statusCode || 500).json(result);
      return;
    }
    res.json(result);
  });

  // Assistente Jeniffer: explicit human admin escalation endpoint
  app.post('/api/assistant/jeniffer/escalate', (req: Request, res: Response) => {
    const { conversationId, userId, reason } = req.body || {};
    if (
      typeof conversationId !== 'string' ||
      !conversationId.trim() ||
      typeof userId !== 'string' ||
      !userId.trim()
    ) {
      res.status(400).json({ ok: false, code: 'INVALID_PAYLOAD', error: 'Dados inválidos para encaminhamento.' });
      return;
    }

    const result = escalateToAdminManual(
      {
        collections: store.collections as unknown as StoreCollections,
        upsertDoc: upsertStoreDoc
      },
      {
        conversationId: conversationId.trim(),
        userId: userId.trim(),
        reason: typeof reason === 'string' ? reason : ''
      }
    );

    if (!result.ok) {
      res.status(result.statusCode || 500).json(result);
      return;
    }
    res.json(result);
  });

  // Delete document
  app.post('/api/sync/delete', (req: Request, res: Response) => {
    const { collection, id } = req.body || {};
    if (
      typeof collection !== 'string' ||
      !ALLOWED_COLLECTIONS.has(collection) ||
      typeof id !== 'string' ||
      !id.trim()
    ) {
      res.status(400).json({ ok: false, error: 'Invalid delete payload' });
      return;
    }

    const colMap = store.collections[collection];
    if (colMap[id]) {
      delete colMap[id];
    }
    store.revision += 1;
    store.updatedAt = new Date().toISOString();
    schedulePersist();

    broadcastEvent('delete', {
      collection,
      id,
      revision: store.revision
    });

    res.json({ ok: true, revision: store.revision });
  });

  // Seed missing records from a client without overwriting existing server truth
  app.post('/api/sync/seed-missing', (req: Request, res: Response) => {
    const { collections } = req.body || {};
    if (!collections || typeof collections !== 'object') {
      res.status(400).json({ ok: false, error: 'Invalid seed payload' });
      return;
    }
    let added = 0;
    for (const [colName, docsMap] of Object.entries(collections)) {
      if (!ALLOWED_COLLECTIONS.has(colName) || !docsMap || typeof docsMap !== 'object') continue;
      const target = store.collections[colName];
      for (const [docId, docVal] of Object.entries(docsMap as Record<string, any>)) {
        if (!docId || !docVal || typeof docVal !== 'object') continue;
        if ((colName === 'users' || colName === 'wallets') && store.collections.deleted_users?.[docId]) {
          continue;
        }
        if (!target[docId]) {
          target[docId] = { ...docVal, id: docVal.id || docId };
          added += 1;
        }
      }
    }
    if (added > 0) {
      store.revision += 1;
      store.updatedAt = new Date().toISOString();
      schedulePersist();
      broadcastEvent('resync', { revision: store.revision });
    }
    res.json({ ok: true, added, revision: store.revision });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BABA SHOPPING server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
