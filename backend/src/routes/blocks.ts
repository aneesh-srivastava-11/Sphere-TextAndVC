import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";
import * as admin from "firebase-admin";

const router = express.Router();

router.use(verifyToken);

// GET /api/blocks - List all accounts blocked by current user
router.get("/", async (req, res) => {
    try {
        const accountId = req.account?.id;
        const blocksRef = db.collection("blocks");
        const snapshot = await blocksRef.where("blockerId", "==", accountId).get();

        const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blocks" });
    }
});

// POST /api/blocks - Block an account
router.post("/", async (req, res) => {
    try {
        const { blockedId } = req.body;
        const blockerId = req.account?.id;

        if (!blockedId) return res.status(400).json({ error: "blockedId is required" });
        if (blockerId === blockedId) return res.status(400).json({ error: "Cannot block yourself" });

        // Check if already blocked
        const blocksRef = db.collection("blocks");
        const snapshot = await blocksRef
            .where("blockerId", "==", blockerId)
            .where("blockedId", "==", blockedId)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return res.status(400).json({ error: "User is already blocked" });
        }

        const newBlock = {
            blockerId,
            blockedId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await blocksRef.add(newBlock);
        res.status(201).json({ id: docRef.id, ...newBlock });
    } catch (error) {
        res.status(500).json({ error: "Failed to block user" });
    }
});

// DELETE /api/blocks/:id - Unblock by block document ID
router.delete("/:id", async (req, res) => {
    try {
        const blockRef = db.collection("blocks").doc(req.params.id);
        const doc = await blockRef.get();

        if (!doc.exists) return res.status(404).json({ error: "Block not found" });
        if (doc.data()?.blockerId !== req.account?.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await blockRef.delete();
        res.json({ message: "Unblocked successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to unblock user" });
    }
});

export default router;
