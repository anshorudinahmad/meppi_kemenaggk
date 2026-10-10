import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Cloud Run health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Path to compiled production static assets
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Serve static assets with cache headers
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Do not cache index.html to ensure users always receive latest app version
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Handle SPA fallback: send index.html for all client-side routes
app.get('*', (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('MONEV Pelayanan Publik is ready.');
  }
});

// Start listening on 0.0.0.0 for Cloud Run container compatibility
const server = app.listen(port, host, () => {
  console.log(`[MONEV Server] Production server running on http://${host}:${port}`);
});

server.on('error', (err) => {
  console.error('[MONEV Server Error]', err);
});

// Handle Cloud Run termination signals gracefully
process.on('SIGTERM', () => {
  console.log('[MONEV Server] Received SIGTERM signal, shutting down gracefully...');
  server.close(() => {
    console.log('[MONEV Server] Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[MONEV Server] Received SIGINT signal, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
