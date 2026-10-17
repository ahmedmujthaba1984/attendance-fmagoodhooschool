process.env.VERCEL = '1';

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      const serverModule = await import('../server');
      cachedApp = serverModule.default || serverModule.app;
    }
    const matched =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-vercel-matched-path'] as string) ||
      req.originalUrl;
    if (matched && matched.startsWith('/api') && (req.url === '/api' || req.url === '/api/index' || req.url === '/')) {
      req.url = matched;
    }
    return cachedApp(req, res);
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
