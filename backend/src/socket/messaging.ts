import { Server, Socket } from 'socket.io';
import { MessageService } from '../services/messageService';
import { BlockService } from '../services/blockService';
import { ModerationService } from '../services/moderationService';
import { ConversationService } from '../services/conversationService';

export function setupMessagingHandlers(io: Server, socket: Socket, userId: string) {
    // Join conversation rooms
    socket.on('join_conversation', async (conversationId: string) => {
        const isParticipant = await ConversationService.isParticipant(conversationId, userId);
        if (isParticipant) {
            socket.join(`conversation:${conversationId}`);
            socket.emit('joined_conversation', conversationId);
        }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
        try {
            // Check muted
            const isMuted = await ModerationService.isUserMuted(data.conversationId, userId);
            if (isMuted) {
                socket.emit('error', { message: 'You are muted in this conversation' });
                return;
            }

            const { data: message, error } = await MessageService.sendMessage(
                data.conversationId,
                userId,
                data.content
            );

            if (error) {
                socket.emit('error', { message: 'Failed to send message' });
                return;
            }

            // Broadcast to conversation, filtering blocked users on client-side
            io.to(`conversation:${data.conversationId}`).emit('new_message', message);
        } catch (err) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Edit message
    socket.on('edit_message', async (data: { messageId: string; content: string; conversationId: string }) => {
        try {
            const { data: message, error } = await MessageService.editMessage(
                data.messageId,
                userId,
                data.content
            );

            if (error) {
                socket.emit('error', { message: 'Failed to edit message' });
                return;
            }

            io.to(`conversation:${data.conversationId}`).emit('message_edited', message);
        } catch (err) {
            socket.emit('error', { message: 'Failed to edit message' });
        }
    });

    // Delete message
    socket.on('delete_message', async (data: { messageId: string; conversationId: string }) => {
        try {
            await MessageService.deleteMessage(data.messageId, userId);
            io.to(`conversation:${data.conversationId}`).emit('message_deleted', {
                messageId: data.messageId,
                conversationId: data.conversationId,
            });
        } catch (err) {
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });

    // Toggle reaction
    socket.on('toggle_reaction', async (data: { messageId: string; emoji: string; conversationId: string }) => {
        try {
            const result = await MessageService.toggleReaction(data.messageId, userId, data.emoji);
            io.to(`conversation:${data.conversationId}`).emit('reaction_updated', {
                messageId: data.messageId,
                userId,
                ...result,
            });
        } catch (err) {
            socket.emit('error', { message: 'Failed to toggle reaction' });
        }
    });

    // Thread reply
    socket.on('thread_reply', async (data: { parentMessageId: string; content: string; conversationId: string }) => {
        try {
            const { data: reply, error } = await MessageService.addThreadReply(
                data.parentMessageId,
                userId,
                data.content
            );

            if (error) {
                socket.emit('error', { message: 'Failed to add reply' });
                return;
            }

            io.to(`conversation:${data.conversationId}`).emit('new_thread_reply', {
                parentMessageId: data.parentMessageId,
                reply,
            });
        } catch (err) {
            socket.emit('error', { message: 'Failed to add reply' });
        }
    });
}
