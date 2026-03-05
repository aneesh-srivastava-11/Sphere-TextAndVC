import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Sync / get current user account (called after Supabase auth)
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ error: 'Sync failed' });
    }
});

export default router;
