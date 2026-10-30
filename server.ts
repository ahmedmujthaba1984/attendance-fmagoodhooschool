process.on('uncaughtException', (err) => {
  console.error('[Server Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Process] Unhandled Rejection:', reason);
});

import app, { startServer } from './server/app';

startServer().catch((err) => {
  console.error('[Server Process] Failed to start server:', err);
});

export default app;
export { app };

