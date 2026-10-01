import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';

const router = Router();

const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  platform: z.enum(['web-laptop', 'mobile-pwa', 'flutter-mobile', 'desktop-client', 'tablet'])
});

router.post('/register', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const parseResult = RegisterDeviceSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
    return;
  }

  const { deviceId, deviceName, platform } = parseResult.data;
  const device = AuthService.registerDevice(req.user!.id, deviceId, deviceName, platform);
  res.json({ device });
});

router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const devices = AuthService.getDevicesForUser(req.user!.id);
  res.json({ devices });
});

export default router;
