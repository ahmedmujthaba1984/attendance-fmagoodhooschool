import app from '../server.ts';

export default function handler(req: any, res: any) {
  const matched =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string) ||
    req.originalUrl;
  if (matched && matched.startsWith('/api') && (req.url === '/api' || req.url === '/api/index' || req.url === '/')) {
    req.url = matched;
  }
  return app(req, res);
}

export { app };
