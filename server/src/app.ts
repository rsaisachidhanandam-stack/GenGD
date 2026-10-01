import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import deviceRoutes from './routes/deviceRoutes';
import demoRoutes from './routes/demoRoutes';

export function createApp(): express.Express {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Enforce body payload size limit for SEC04
  app.use(express.json({ limit: '500kb' }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/demo', demoRoutes);

  // Error handling middleware (catches JSON syntax errors or payload errors safely)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Payload too large. Exceeds size limit.' });
      return;
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Malformed JSON payload' });
      return;
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
