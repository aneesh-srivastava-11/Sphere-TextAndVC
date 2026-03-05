import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Middleware to check if user is admin
const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Domains
router.get('/domains', async (req, res) => {
    const { data, error } = await supabase.from('allowed_domains').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/domains', async (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const { data, error } = await supabase.from('allowed_domains').insert({ domain }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.delete('/domains/:domain', async (req, res) => {
    const { error } = await supabase.from('allowed_domains').delete().eq('domain', req.params.domain);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// Overrides
router.get('/overrides', async (req, res) => {
    const { data, error } = await supabase.from('domain_overrides').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/overrides', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { data, error } = await supabase.from('domain_overrides').insert({
        email,
        added_by: (req as AuthRequest).user!.id
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.delete('/overrides/:email', async (req, res) => {
    const { error } = await supabase.from('domain_overrides').delete().eq('email', req.params.email);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

export default router;
