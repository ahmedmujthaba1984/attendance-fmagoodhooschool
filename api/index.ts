process.env.VERCEL = '1';
import app from '../server/app';

export default function handler(req: any, res: any) {
  try {
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
