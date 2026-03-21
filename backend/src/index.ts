import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/chatRoutes.js';
import { config, validateConfig } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(config.PORT);

  console.log('Starting YAZA DeepVision Server...');
  validateConfig();
  console.log('Gemini API Key status:', config.GEMINI_API_KEY ? 'Configured' : 'Missing');
  console.log('YouTube Cookie status:', config.YOUTUBE_COOKIE ? 'Configured' : 'Missing');
  
  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure all API responses are JSON
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // API routes
  console.log('Registering API routes...');
  app.use('/api', apiRouter);

  // Serve uploads directory statically for frontend analysis
  // In the new structure, uploads is at the root or under backend/
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Catch-all for /api to prevent falling through to Vite
  app.use('/api', (req: express.Request, res: express.Response) => {
    console.log(`404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({
      status: 'error',
      message: `API Route ${req.method} ${req.url} not found`
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    
    // Handle Multer errors explicitly
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 50MB.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: err.message || String(err)
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV === 'development'){
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YAZA DeepVision Server running on http://localhost:${PORT}`);
  });
}

startServer();
