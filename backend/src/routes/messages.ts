import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";
import * as admin from "firebase-admin";

const router = express.Router();

router.use(verifyToken);

// GET /api/messages?topicId=xyz - List messages with ghost block filtering
router.get("/", async (req, res) => {
    try {
        const { topicId, limit = 50 } = req.query;
        const accountId = req.account?.id;

        if (!topicId) return res.status(400).json({ error: "topicId is required" });

        // 1. Fetch blocks involving this user
        const blocksRef = db.collection("blocks");
        const [blocks1, blocks2] = await Promise.all([
            blocksRef.where("blockerId", "==", accountId).get(),
            blocksRef.where("blockedId", "==", accountId).get(),
        ]);

        const blockedUserIds = new Set<string>();
        blocks1.docs.forEach((doc) => blockedUserIds.add(doc.data().blockedId));
        blocks2.docs.forEach((doc) => blockedUserIds.add(doc.data().blockerId));

        // 2. Fetch messages ordered by creation
        const messagesRef = db.collection("messages");
        const snapshot = await messagesRef
            .where("topicId", "==", topicId)
            .orderBy("createdAt", "desc")
            .limit(Number(limit))
            .get();

        let messages = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        // 3. Reverse to chronological
        messages.reverse();

        // 4. Ghost block mapping: hide contents
        messages = messages.map(msg => {
            if (blockedUserIds.has(msg.authorId)) {
                return {
                    ...msg,
                    content: null,
                    isGhostBlocked: true,
                    authorId: "blocked_user"
                };
            }
            return msg;
        });

        res.json(messages);
    } catch (error) {
        console.error("Messages fetch error:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// POST /api/messages - Create a message
router.post("/", async (req, res) => {
    try {
        const { topicId, content } = req.body;
        const accountId = req.account?.id;

        if (!topicId || !content) return res.status(400).json({ error: "topicId and content are required" });

        const newMessage = {
            topicId,
            authorId: accountId,
            content,
            isPinned: false,
            deletedAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("messages").add(newMessage);
        res.status(201).json({ id: docRef.id, ...newMessage });
    } catch (error) {
        res.status(500).json({ error: "Failed to create message" });
    }
});

// DELETE /api/messages/:id (Soft delete)
router.delete("/:id", async (req, res) => {
    try {
        const msgRef = db.collection("messages").doc(req.params.id);
        const msg = await msgRef.get();

        if (!msg.exists) return res.status(404).json({ error: "Not found" });
        if (msg.data()?.authorId !== req.account?.id) {
            // Ideally moderators can delete anyone's messages; simplified here
            return res.status(403).json({ error: "Forbidden" });
        }

        await msgRef.update({
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            content: "[Message Deleted]"
        });

        res.json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete message" });
    }
});

// POST /api/messages/:id/pin (Toggle pin)
router.post("/:id/pin", async (req, res) => {
    try {
        const msgRef = db.collection("messages").doc(req.params.id);
        const msg = await msgRef.get();
        if (!msg.exists) return res.status(404).json({ error: "Not found" });

        const isCurrentlyPinned = msg.data()?.isPinned || false;
        await msgRef.update({ isPinned: !isCurrentlyPinned });

        res.json({ isPinned: !isCurrentlyPinned });
    } catch (error) {
        res.status(500).json({ error: "Failed to pin message" });
    }
});

export default router;
