import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";

const router = express.Router();

// POST /api/auth/session - Verify Firebase Token, create Account if new
router.post("/session", verifyToken, async (req, res) => {
    try {
        const user = req.user!;
        const accountsRef = db.collection("accounts");

        // Check if account already exists
        const snapshot = await accountsRef.where("firebaseUid", "==", user.uid).limit(1).get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            res.json({ id: doc.id, ...doc.data() });
            return;
        }

        // Create new account
        const newAccount = {
            firebaseUid: user.uid,
            email: user.email || null,
            displayName: null, // Forces user to set it
            avatarUrl: user.picture || null,
            createdAt: new Date().toISOString(),
        };

        const docRef = await accountsRef.add(newAccount);
        res.status(201).json({ id: docRef.id, ...newAccount });
    } catch (error) {
        console.error("Session error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

// PATCH /api/auth/display-name - Set Display Name
router.patch("/display-name", verifyToken, async (req, res) => {
    try {
        const account = req.account;
        if (!account) {
            res.status(404).json({ error: "Account not found" });
            return;
        }

        let { displayName } = req.body;

        if (!displayName || typeof displayName !== "string") {
            res.status(400).json({ error: "Display name is required" });
            return;
        }

        // Server-side validation
        displayName = displayName.trim();
        if (displayName.length < 3 || displayName.length > 30) {
            res.status(400).json({ error: "Display name must be between 3 and 30 characters" });
            return;
        }

        // Simple HTML strip
        displayName = displayName.replace(/<[^>]*>?/gm, '');

        await db.collection("accounts").doc(account.id).update({ displayName });
        res.json({ id: account.id, displayName, message: "Display name updated" });

    } catch (error) {
        console.error("Display name update error:", error);
        res.status(500).json({ error: "Failed to update display name" });
    }
});

export default router;
