// @ts-nocheck
import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ModerationService } from '../services/moderationService';
import { ConversationService } from '../services/conversationService';
import { MessageService } from '../services/messageService';

const router = Router();

// Report a message
router.post('/report', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { messageId, reason } = req.body;
        if (!messageId || !reason) return res.status(400).json({ error: 'messageId and reason required' });

        const { data, error } = await ModerationService.reportMessage(req.user!.id, messageId, reason);
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create report' });
    }
});

// Mute user in conversation
router.post('/mute', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId, userId, durationMinutes } = req.body;

        const role = await ConversationService.getUserRole(conversationId, req.user!.id);
        if (role !== 'owner' && role !== 'moderator') {
            return res.status(403).json({ error: 'Moderator access required' });
        }

        const result = await ModerationService.muteUser(req.user!.id, conversationId, userId, durationMinutes);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to mute user' });
    }
});

// Unmute user
router.post('/unmute', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId, userId } = req.body;

        const role = await ConversationService.getUserRole(conversationId, req.user!.id);
        if (role !== 'owner' && role !== 'moderator') {
            return res.status(403).json({ error: 'Moderator access required' });
        }

        await ModerationService.unmuteUser(conversationId, userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unmute user' });
    }
});

// Ban user from conversation
router.post('/ban', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId, userId } = req.body;

        const role = await ConversationService.getUserRole(conversationId, req.user!.id);
        if (role !== 'owner' && role !== 'moderator') {
            return res.status(403).json({ error: 'Moderator access required' });
        }

        const result = await ModerationService.banUser(req.user!.id, conversationId, userId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

// Delete message (moderator action)
router.delete('/message/:messageId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId } = req.body;

        const role = await ConversationService.getUserRole(conversationId, req.user!.id);
        if (role !== 'owner' && role !== 'moderator') {
            return res.status(403).json({ error: 'Moderator access required' });
        }

        await MessageService.deleteMessage(req.params.messageId, req.user!.id, true);

        await ModerationService.logAction(req.user!.id, 'delete_message', undefined, req.params.messageId, conversationId);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Remove user from conversation
router.post('/remove', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { conversationId, userId } = req.body;

        const role = await ConversationService.getUserRole(conversationId, req.user!.id);
        if (role !== 'owner' && role !== 'moderator') {
            return res.status(403).json({ error: 'Moderator access required' });
        }

        await ConversationService.removeParticipant(conversationId, userId);

        await ModerationService.logAction(req.user!.id, 'remove_user', userId, undefined, conversationId);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove user' });
    }
});

export default router;
