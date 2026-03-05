// @ts-nocheck
import { Router } from 'express';

import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ConversationService } from '../services/conversationService';

const router = Router();

// Get all conversations for current user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await ConversationService.getUserConversations(req.user!.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get single conversation
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const isParticipant = await ConversationService.isParticipant(req.params.id, req.user!.id);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        const { data, error } = await ConversationService.getConversation(req.params.id, req.user!.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Create or find DM
router.post('/dm', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const { data, error, created } = await ConversationService.findOrCreateDM(req.user!.id, userId);
        if (error) return res.status(500).json({ error: error.message });
        res.status(created ? 201 : 200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create DM' });
    }
});

// Create group conversation
router.post('/group', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { title, memberIds } = req.body;
        if (!title || !memberIds?.length) {
            return res.status(400).json({ error: 'title and memberIds required' });
        }

        const { data, error } = await ConversationService.createGroup(req.user!.id, title, memberIds);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Create topic conversation (in a space)
router.post('/topic', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { spaceId, title } = req.body;
        if (!spaceId || !title) {
            return res.status(400).json({ error: 'spaceId and title required' });
        }

        const { data, error } = await ConversationService.createTopic(req.user!.id, spaceId, title);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create topic' });
    }
});

// Update conversation (title, avatar)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const role = await ConversationService.getUserRole(req.params.id, req.user!.id);
        if (!role || role === 'member') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { title, avatar_url } = req.body;
        const { data, error } = await ConversationService.updateConversation(req.params.id, { title, avatar_url });
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update conversation' });
    }
});

// Add participant
router.post('/:id/participants', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const role = await ConversationService.getUserRole(req.params.id, req.user!.id);
        if (!role || role === 'member') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { userId, participantRole } = req.body;
        const { error } = await ConversationService.addParticipant(req.params.id, userId, participantRole || 'member');
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add participant' });
    }
});

// Remove participant
router.delete('/:id/participants/:userId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const role = await ConversationService.getUserRole(req.params.id, req.user!.id);
        const isSelf = req.params.userId === req.user!.id;

        if (!isSelf && (!role || role === 'member')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { error } = await ConversationService.removeParticipant(req.params.id, req.params.userId);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove participant' });
    }
});

// Accept DM request
router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const isParticipant = await ConversationService.isParticipant(req.params.id, req.user!.id);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        const { error } = await ConversationService.acceptConversation(req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to accept DM request' });
    }
});

export default router;
