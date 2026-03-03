import { Server, Socket } from "socket.io";
import { db } from "../lib/firebase";

export const registerRealtimeHandlers = (io: Server, socket: Socket) => {
    const accountId = socket.data.accountId;

    // 1. Join/Leave topic rooms for live messages
    socket.on("topic:join", (topicId: string) => {
        socket.join(`topic:${topicId}`);
        // Broadcast presence update if needed
    });

    socket.on("topic:leave", (topicId: string) => {
        socket.leave(`topic:${topicId}`);
    });

    // 2. Typing indicators
    socket.on("typing:start", (data: { topicId: string; displayName: string }) => {
        socket.to(`topic:${data.topicId}`).emit("typing:started", {
            accountId,
            displayName: data.displayName,
            topicId: data.topicId,
        });
    });

    socket.on("typing:stop", (topicId: string) => {
        socket.to(`topic:${topicId}`).emit("typing:stopped", {
            accountId,
            topicId,
        });
    });

    // 3. Live Message Broadcast 
    // Expects the client to emit this after receiving a 201 from the POST /api/messages route
    socket.on("message:new", async (data: { topicId: string, message: any }) => {
        // In a fully secure architecture, you'd fetch the message from DB here to guarantee
        // it was created, then fetch blocked users before emitting. 
        // Here we'll do a simple server-side block check before broadcasting.

        const blocksRef = db.collection("blocks");
        const [blocks1, blocks2] = await Promise.all([
            blocksRef.where("blockerId", "==", accountId).get(),
            blocksRef.where("blockedId", "==", accountId).get(),
        ]);

        const blockedUserIds = new Set<string>();
        blocks1.docs.forEach((doc) => blockedUserIds.add(doc.data().blockedId));
        blocks2.docs.forEach((doc) => blockedUserIds.add(doc.data().blockerId));

        // Emit selectively to sockets in the topic room
        // For simplicity of MVP, we broadcast to the room. Sockets receiving it will 
        // need to filter client-side or we must emit to individual sockets.
        // Better server-side broadcast:
        const room = io.sockets.adapter.rooms.get(`topic:${data.topicId}`);
        if (room) {
            for (const socketId of room) {
                const clientSocket = io.sockets.sockets.get(socketId);
                if (clientSocket) {
                    const clientAccountId = clientSocket.data.accountId;

                    // Ghost Block logic: if the sender blocked the receiver OR receiver blocked sender,
                    // hide the content.
                    if (blockedUserIds.has(clientAccountId)) {
                        clientSocket.emit("message:received", {
                            ...data.message,
                            content: null,
                            isGhostBlocked: true,
                            authorId: "blocked_user"
                        });
                    } else {
                        clientSocket.emit("message:received", data.message);
                    }
                }
            }
        }
    });

    socket.on("message:deleted", (data: { topicId: string, messageId: string }) => {
        io.to(`topic:${data.topicId}`).emit("message:deleted", data.messageId);
    });
};
