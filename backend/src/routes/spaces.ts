import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";
import * as admin from "firebase-admin";

const router = express.Router();

router.use(verifyToken);

// GET /api/spaces - List all spaces (public + my member spaces)
router.get("/", async (req, res) => {
    try {
        const accountId = req.account?.id;
        // For simplicity MVP: fetch all spaces where isPrivate == false
        // or spaces where I am a member. A robust Firestore solution would use two queries and merge them.
        const spacesRef = db.collection("spaces");
        const snapshot = await spacesRef.where("isPrivate", "==", false).get();

        // Convert to array
        const publicSpaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Add additional logic for private member spaces here (omitted for MVP brevity, will implement if required)

        res.json(publicSpaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch spaces" });
    }
});

// POST /api/spaces - Create a space
router.post("/", async (req, res) => {
    try {
        const accountId = req.account?.id;
        const { name, slug, description, isPrivate } = req.body;

        if (!name || !slug) return res.status(400).json({ error: "Name and slug are required" });

        const newSpace = {
            name,
            slug,
            description: description || "",
            isPrivate: !!isPrivate,
            ownerId: accountId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("spaces").add(newSpace);

        // Add creator as owner member
        await docRef.collection("members").doc(accountId!).set({
            role: "owner",
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ id: docRef.id, ...newSpace });
    } catch (error) {
        res.status(500).json({ error: "Failed to create space" });
    }
});

// GET /api/spaces/:id - Get space details
router.get("/:id", async (req, res) => {
    try {
        const doc = await db.collection("spaces").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Space not found" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch space" });
    }
});

// PATCH /api/spaces/:id - Update space
router.patch("/:id", async (req, res) => {
    try {
        const spaceRef = db.collection("spaces").doc(req.params.id);
        const spaceDoc = await spaceRef.get();

        if (!spaceDoc.exists) return res.status(404).json({ error: "Space not found" });
        // Authorization: owner or moderator check
        const memberDoc = await spaceRef.collection("members").doc(req.account!.id).get();
        if (!memberDoc.exists || (memberDoc.data()?.role !== "owner" && memberDoc.data()?.role !== "moderator")) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updates = req.body;
        await spaceRef.update(updates);

        res.json({ id: req.params.id, ...spaceDoc.data(), ...updates });
    } catch (error) {
        res.status(500).json({ error: "Failed to update space" });
    }
});

export default router;
