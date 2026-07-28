import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { listRatesViaGrpc } from './bff/grpc-bank';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Разрешённые хосты для SSR (защита от SSRF в Angular 20+). По умолчанию — localhost,
// в проде задаётся через NG_ALLOWED_HOSTS="site.ru,www.site.ru".
const allowedHosts = (process.env['NG_ALLOWED_HOSTS'] ?? 'localhost')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts });

/**
 * BFF-слой: браузер не умеет «сырой» gRPC, поэтому Node проксирует вызов в
 * gRPC-бэкенд (:50051) и отдаёт браузеру JSON. Демонстрирует связку Express + gRPC.
 */
app.get('/bff/grpc/rates', async (_req, res) => {
  try {
    const rates = await listRatesViaGrpc();
    res.json(rates);
  } catch (err) {
    res
      .status(502)
      .json({ error: 'gRPC-бэкенд недоступен', detail: (err as Error).message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
