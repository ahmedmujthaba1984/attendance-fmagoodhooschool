process.env.VERCEL = '1';

let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;

  const errors: string[] = [];

  // Loader 1: Pre-bundled dist/server.cjs
  try {
    // @ts-ignore
    const cjs = await import('../dist/server.cjs');
    const app = cjs.default?.default || cjs.default || cjs.app;
    if (typeof app === 'function') {
      cachedApp = app;
      return cachedApp;
    }
  } catch (e1: any) {
    errors.push(`dist/server.cjs failed: ${e1?.message || e1}`);
  }

  // Loader 2: Source server/app
  try {
    // @ts-ignore
    const mod: any = await import('../server/app.js');
    const app = mod?.default || mod?.app || mod;
    if (typeof app === 'function') {
      cachedApp = app;
      return cachedApp;
    }
  } catch (e2: any) {
    errors.push(`server/app.js failed: ${e2?.message || e2}`);
  }

  throw new Error(`Failed to initialize Express app:\n${errors.join('\n')}`);
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();

    const matched =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-vercel-matched-path'] as string) ||
      (req.headers['x-now-route-matches'] as string) ||
      req.originalUrl;
    if (matched && matched.startsWith('/api') && (req.url === '/api' || req.url === '/api/index' || !req.url.startsWith('/api'))) {
      req.url = matched;
    }

    return new Promise((resolve) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      try {
        app(req, res, (err: any) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`Express internal error: ${err?.message || err}`);
          }
          resolve(undefined);
        });
      } catch (appErr: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Express invocation crash: ${appErr?.message || appErr}`);
        resolve(undefined);
      }
    });
  } catch (err: any) {
    console.error('FATAL ERROR in Vercel Serverless Function:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    return res.end(`CRASH REASON: ${err?.message || String(err)}\n${err?.stack || ''}`);
  }
}
