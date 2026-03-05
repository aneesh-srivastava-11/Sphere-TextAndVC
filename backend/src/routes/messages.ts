// @ts-nocheck
import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { MessageService } from '../services/messageService';
import { ConversationService } from '../services/conversationService';
import { ModerationService } from '../services/moderationService';

const router = Router();

// Get messages for a conversation
router.get('/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const isParticipant = await ConversationService.isParticipant(req.params.conversationId, req.user!.id);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        const { before, limit } = req.query;
        const { data, error } = await MessageService.getMessages(
            req.params.conversationId,
            req.user!.id,
            limit ? parseInt(limit as string) : 50,
            before as string | undefined
        );

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message
router.post('/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const isParticipant = await ConversationService.isParticipant(req.params.conversationId, req.user!.id);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        // Check if user is muted
        const isMuted = await ModerationService.isUserMuted(req.params.conversationId, req.user!.id);
        if (isMuted) return res.status(403).json({ error: 'You are muted in this conversation' });

        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const { data, error } = await MessageService.sendMessage(req.params.conversationId, req.user!.id, content);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Edit a message
router.patch('/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const { data, error } = await MessageService.editMessage(req.params.messageId, req.user!.id, content);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to edit message' });
    }
});

// Delete a message
router.delete('/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { error } = await MessageService.deleteMessage(req.params.messageId, req.user!.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Toggle reaction
router.post('/:messageId/reactions', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { emoji } = req.body;
        if (!emoji) return res.status(400).json({ error: 'Emoji required' });

        const result = await MessageService.toggleReaction(req.params.messageId, req.user!.id, emoji);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle reaction' });
    }
});

// Pin a message
router.post('/:conversationId/pin/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const role = await ConversationService.getUserRole(req.params.conversationId, req.user!.id);
        if (!role || role === 'member') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { error } = await MessageService.pinMessage(req.params.conversationId, req.params.messageId, req.user!.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to pin message' });
    }
});

// Unpin a message
router.delete('/:conversationId/pin/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const role = await ConversationService.getUserRole(req.params.conversationId, req.user!.id);
        if (!role || role === 'member') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { error } = await MessageService.unpinMessage(req.params.conversationId, req.params.messageId);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unpin message' });
    }
});

// Get pinned messages
router.get('/:conversationId/pinned', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await MessageService.getPinnedMessages(req.params.conversationId);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pinned messages' });
    }
});

// Get thread replies
router.get('/threads/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await MessageService.getThreadReplies(req.params.messageId);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
});

// Add thread reply
router.post('/threads/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const { data, error } = await MessageService.addThreadReply(req.params.messageId, req.user!.id, content);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Clear conversation locally
router.post('/:conversationId/clear', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const isParticipant = await ConversationService.isParticipant(req.params.conversationId, req.user!.id);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        const { error } = await MessageService.clearConversation(req.params.conversationId, req.user!.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear conversation' });
    }
});

export default router;
