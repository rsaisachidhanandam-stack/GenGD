import { Router, Request, Response } from 'express';
import { SyncEngine } from '../services/syncEngine';

const router = Router();

// POST /api/demo/reset - Reset database and seed demo data for Laptop & Phone
router.post('/reset', (req: Request, res: Response) => {
  try {
    const seedData = SyncEngine.resetDemoData();
    res.json({
      message: 'Demo environment successfully reset and seeded',
      seed: seedData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
