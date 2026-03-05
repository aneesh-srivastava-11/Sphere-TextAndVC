import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Create a space
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        const { data: space, error } = await supabase
            .from('spaces')
            .insert({ name, description, created_by: req.user!.id })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        // Add creator as owner
        await supabase.from('space_members').insert({
            space_id: space.id,
            user_id: req.user!.id,
            role: 'owner',
        });

        res.status(201).json(space);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create space' });
    }
});

// Get user's spaces
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('space_members')
            .select(`
        role,
        space:spaces(*)
      `)
            .eq('user_id', req.user!.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data?.map((d: any) => ({ ...d.space, role: d.role })) || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch spaces' });
    }
});

// Get space details with topics
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data: space, error } = await supabase
            .from('spaces')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Space not found' });

        const { data: topics } = await supabase
            .from('conversations')
            .select('id, title, created_at, updated_at')
            .eq('space_id', req.params.id)
            .eq('type', 'topic')
            .order('updated_at', { ascending: false });

        const { data: members } = await supabase
            .from('space_members')
            .select(`
        role,
        user:accounts(id, display_name, avatar_url, email, status)
      `)
            .eq('space_id', req.params.id);

        res.json({
            ...space,
            topics: topics || [],
            members: members?.map((m: any) => ({ ...m.user, role: m.role })) || [],
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch space' });
    }
});

// Join a space
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase.from('space_members').insert({
            space_id: req.params.id,
            user_id: req.user!.id,
            role: 'member',
        });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join space' });
    }
});

// Leave a space
router.delete('/:id/leave', authMiddleware, async (req: AuthRequest, res) => {
    try {
        await supabase
            .from('space_members')
            .delete()
            .eq('space_id', req.params.id)
            .eq('user_id', req.user!.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave space' });
    }
});

export default router;
