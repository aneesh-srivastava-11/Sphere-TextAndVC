import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";
import * as admin from "firebase-admin";

const router = express.Router();

router.use(verifyToken);

// GET /api/topics?spaceId=abc - List topics for a space
router.get("/", async (req, res) => {
    try {
        const { spaceId } = req.query;
        if (!spaceId) {
            return res.status(400).json({ error: "spaceId is required" });
        }

        const topicsRef = db.collection("topics");
        const snapshot = await topicsRef.where("spaceId", "==", spaceId).get();
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(topics);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch topics" });
    }
});

// POST /api/topics - Create a topic in a space
router.post("/", async (req, res) => {
    try {
        const { spaceId, name, description } = req.body;
        if (!spaceId || !name) {
            return res.status(400).json({ error: "spaceId and name are required" });
        }

        // Role check conceptually omitted for MVP brevity but should be moderator/owner
        const newTopic = {
            spaceId,
            name,
            description: description || "",
            isArchived: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("topics").add(newTopic);
        res.status(201).json({ id: docRef.id, ...newTopic });
    } catch (error) {
        res.status(500).json({ error: "Failed to create topic" });
    }
});

// GET /api/topics/:id
router.get("/:id", async (req, res) => {
    try {
        const doc = await db.collection("topics").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Topic not found" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch topic" });
    }
});

// PATCH /api/topics/:id
router.patch("/:id", async (req, res) => {
    try {
        const topicRef = db.collection("topics").doc(req.params.id);
        const updates = req.body;
        await topicRef.update(updates);
        res.json({ id: req.params.id, ...updates });
    } catch (error) {
        res.status(500).json({ error: "Failed to update topic" });
    }
});

// DELETE /api/topics/:id
router.delete("/:id", async (req, res) => {
    try {
        await db.collection("topics").doc(req.params.id).delete();
        res.json({ message: "Topic deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete topic" });
    }
});

// GET /api/topics/:id/messages - List messages for a topic
router.get("/:id/messages", async (req, res) => {
    try {
        const topicId = req.params.id;
        const accountId = req.account?.id;

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
            .limit(50)
            .get();

        let messages = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        messages.reverse();

        messages = messages.map(msg => {
            if (blockedUserIds.has(msg.authorId)) {
                return { ...msg, content: null, isGhostBlocked: true, authorId: "blocked_user" };
            }
            return msg;
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// POST /api/topics/:id/messages - Create a message
router.post("/:id/messages", async (req, res) => {
    try {
        const topicId = req.params.id;
        const { content } = req.body;
        const accountId = req.account?.id;

        if (!content) return res.status(400).json({ error: "content is required" });

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

export default router;
