import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  processJenifferChat,
  escalateToAdminManual
} from './server/jeniffer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

function extractBearerToken(req: Request): string {
  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Assistente Jeniffer AI endpoint (authenticated via Firebase ID token + Firestore REST)
  app.post('/api/assistant/jeniffer/chat', async (req: Request, res: Response) => {
    const idToken = extractBearerToken(req);
    if (!idToken) {
      res.status(401).json({
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Sessão Firebase expirada ou ausente. Inicia sessão novamente para falar com a Assistente Jeniffer.'
      });
      return;
    }

    const { conversationId, userId, message } = req.body || {};
    if (
      typeof conversationId !== 'string' ||
      !conversationId.trim() ||
      typeof userId !== 'string' ||
      !userId.trim() ||
      typeof message !== 'string'
    ) {
      res.status(400).json({ ok: false, error: 'Pedido inválido para o atendimento da Assistente Jeniffer.' });
      return;
    }

    const result = await processJenifferChat({
      conversationId: conversationId.trim(),
      userId: userId.trim(),
      message,
      idToken
    });

    if (!result.ok) {
      res.status(result.statusCode || 500).json(result);
      return;
    }
    res.json(result);
  });

  // Direct manual escalation to Admin Panel
  app.post('/api/assistant/jeniffer/escalate', async (req: Request, res: Response) => {
    const idToken = extractBearerToken(req);
    if (!idToken) {
      res.status(401).json({
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Sessão Firebase expirada ou ausente. Inicia sessão novamente.'
      });
      return;
    }

    const { conversationId, userId, reason } = req.body || {};
    if (
      typeof conversationId !== 'string' ||
      !conversationId.trim() ||
      typeof userId !== 'string' ||
      !userId.trim()
    ) {
      res.status(400).json({ ok: false, error: 'Dados inválidos para encaminhar ao Administrador.' });
      return;
    }

    const result = await escalateToAdminManual({
      conversationId: conversationId.trim(),
      userId: userId.trim(),
      reason: typeof reason === 'string' ? reason : '',
      idToken
    });

    if (!result.ok) {
      res.status(result.statusCode || 500).json(result);
      return;
    }
    res.json(result);
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
