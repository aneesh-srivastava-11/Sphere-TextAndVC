import { Request, Response, NextFunction } from "express";
import { auth, db } from "../lib/firebase";

// Extend Express Request to include account info
declare global {
    namespace Express {
        interface Request {
            user?: import("firebase-admin").auth.DecodedIdToken;
            account?: { id: string;[key: string]: any };
        }
    }
}

export const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return;
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;

        // Fetch account from Firestore to get internal fields
        const accountsRef = db.collection("accounts");
        const snapshot = await accountsRef
            .where("firebaseUid", "==", decodedToken.uid)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            req.account = { id: doc.id, ...doc.data() };
        }

        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};
