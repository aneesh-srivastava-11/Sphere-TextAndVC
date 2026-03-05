import { Server, Socket } from 'socket.io';

// Track active calls: callId -> Map of participant userId -> info
const activeCalls = new Map<string, Map<string, { socketId: string; userId: string; displayName: string }>>();

export function setupSignalingHandlers(io: Server, socket: Socket, userId: string) {
    // Join a call
    socket.on('call_join', (data: { callId: string; conversationId: string }) => {
        const { callId, conversationId } = data;

        if (!activeCalls.has(callId)) {
            activeCalls.set(callId, new Map());
        }

        const callParticipants = activeCalls.get(callId)!;

        // Notify existing participants about new joiner
        const displayName = (socket as any).user?.display_name || 'User';
        callParticipants.forEach((participant) => {
            io.to(participant.socketId).emit('call_user_joined', {
                userId,
                displayName,
                socketId: socket.id,
                callId,
            });
        });

        // Add new participant
        callParticipants.set(userId, { socketId: socket.id, userId, displayName });

        // Join socket room for this call
        socket.join(`call:${callId}`);

        // Send current participants to the joiner
        const existingParticipants = Array.from(callParticipants.entries())
            .filter(([uid]) => uid !== userId)
            .map(([uid, info]) => ({
                userId: uid,
                socketId: info.socketId,
                displayName: info.displayName
            }));

        socket.emit('call_participants', { callId, participants: existingParticipants });
    });

    // Leave a call
    socket.on('call_leave', (data: { callId: string }) => {
        const { callId } = data;
        const callParticipants = activeCalls.get(callId);

        if (callParticipants) {
            callParticipants.delete(userId);

            if (callParticipants.size === 0) {
                activeCalls.delete(callId);
            }
        }

        socket.leave(`call:${callId}`);
        io.to(`call:${callId}`).emit('call_user_left', { userId, callId });
    });

    // WebRTC signaling: offer
    socket.on('call_offer', (data: { targetSocketId: string; offer: any; callId: string }) => {
        io.to(data.targetSocketId).emit('call_offer', {
            offer: data.offer,
            fromUserId: userId,
            fromSocketId: socket.id,
            callId: data.callId,
        });
    });

    // WebRTC signaling: answer
    socket.on('call_answer', (data: { targetSocketId: string; answer: any; callId: string }) => {
        io.to(data.targetSocketId).emit('call_answer', {
            answer: data.answer,
            fromUserId: userId,
            fromSocketId: socket.id,
            callId: data.callId,
        });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice_candidate', (data: { targetSocketId: string; candidate: any; callId: string }) => {
        io.to(data.targetSocketId).emit('ice_candidate', {
            candidate: data.candidate,
            fromUserId: userId,
            fromSocketId: socket.id,
            callId: data.callId,
        });
    });

    // Call status update (mic/camera toggle)
    socket.on('call_status_update', (data: { callId: string; isMicOn: boolean; isCameraOn: boolean }) => {
        socket.to(`call:${data.callId}`).emit('call_status_update', {
            userId,
            isMicOn: data.isMicOn,
            isCameraOn: data.isCameraOn,
        });
    });

    // Handle disconnect: clean up from all calls
    socket.on('disconnect', () => {
        activeCalls.forEach((participants, callId) => {
            if (participants.has(userId)) {
                participants.delete(userId);
                io.to(`call:${callId}`).emit('call_user_left', { userId, callId });

                if (participants.size === 0) {
                    activeCalls.delete(callId);
                }
            }
        });
    });
}
