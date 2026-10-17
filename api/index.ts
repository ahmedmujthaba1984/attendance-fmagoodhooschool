process.env.VERCEL = '1';

let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;
  const loaders = [
    () => import('../dist/server.cjs'),
    () => import('../server.js'),
  ];
  let lastError: any = null;
  for (const load of loaders) {
    try {
      const mod = await load();
      const app = mod.default?.default || mod.default || mod.app;
      if (typeof app === 'function') {
        cachedApp = app;
        return cachedApp;
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Could not initialize Express application');
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    const matched =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-vercel-matched-path'] as string) ||
      req.originalUrl;
    if (matched && matched.startsWith('/api') && (req.url === '/api' || req.url === '/api/index' || req.url === '/')) {
      req.url = matched;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('FATAL ERROR in Vercel Serverless Function:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: 'Serverless Handler Initialization Error',
        message: err?.message || String(err),
        stack: err?.stack || null,
      })
    );
  }
}
