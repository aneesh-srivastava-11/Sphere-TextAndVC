import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Get current user's profile
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', req.user!.id)
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update current user's profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { display_name, avatar_url, status } = req.body;
        const updates: any = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;
        if (status !== undefined) updates.status = status;

        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', req.user!.id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Search users
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' });

        const { data, error } = await supabase
            .from('accounts')
            .select('id, display_name, email, avatar_url, status')
            .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
            .neq('id', req.user!.id)
            .limit(20);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('id, display_name, email, avatar_url, status, created_at')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Block a user
router.post('/block/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('blocks')
            .insert({ blocker_id: req.user!.id, blocked_id: req.params.id })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, block: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to block user' });
    }
});

// Unblock a user
router.delete('/block/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        await supabase
            .from('blocks')
            .delete()
            .eq('blocker_id', req.user!.id)
            .eq('blocked_id', req.params.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// Get blocked users list
router.get('/blocks/list', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('blocks')
            .select(`
        id,
        blocked:accounts!blocked_id(id, display_name, avatar_url, email)
      `)
            .eq('blocker_id', req.user!.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blocked users' });
    }
});

export default router;
