import { Server, Socket } from 'socket.io';
import { BlockService } from '../services/blockService';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

export function setupPresenceHandlers(io: Server, socket: Socket, userId: string) {
    // Mark user as online
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId });

    // Typing indicators
    socket.on('typing_start', async (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
            userId,
            conversationId: data.conversationId,
        });
    });

    socket.on('typing_stop', async (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
            userId,
            conversationId: data.conversationId,
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                onlineUsers.delete(userId);
                socket.broadcast.emit('user_offline', { userId });
            }
        }
    });
}

export function getOnlineUsers(): string[] {
    return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId) && (onlineUsers.get(userId)?.size || 0) > 0;
}
