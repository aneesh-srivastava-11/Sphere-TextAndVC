import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Start a call
router.post('/start', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId } = req.body;
        if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

        // Check for existing active call
        const { data: existing } = await supabase
            .from('call_sessions')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('status', 'active')
            .single();

        if (existing) {
            return res.json({ id: existing.id, alreadyActive: true });
        }

        const { data, error } = await supabase
            .from('call_sessions')
            .insert({
                conversation_id: conversationId,
                started_by: req.user!.id,
                status: 'active',
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to start call' });
    }
});

// End a call
router.post('/:id/end', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('call_sessions')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to end call' });
    }
});

// Get active call for conversation
router.get('/active/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('call_sessions')
            .select('*')
            .eq('conversation_id', req.params.conversationId)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') {
            return res.status(500).json({ error: error.message });
        }

        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch call' });
    }
});

export default router;
