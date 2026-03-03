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

export default router;
