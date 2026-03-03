import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db, storage } from "../lib/firebase";
import multer from "multer";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
router.use(verifyToken);

// Using multer memory storage since we upload directly to Firebase Storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/uploads - Upload file to Firebase Storage
router.post("/", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const accountId = req.account?.id;
        if (!accountId) return res.status(401).json({ error: "Unauthorized" });

        // Ensure bucket is set
        const bucket = storage.bucket();
        const extension = file.originalname.split(".").pop();
        const filename = `${uuidv4()}.${extension}`;
        const storagePath = `uploads/${accountId}/${filename}`;

        const fileRef = bucket.file(storagePath);

        // Upload the file buffer to Firebase Storage
        await fileRef.save(file.buffer, {
            metadata: { contentType: file.mimetype },
        });

        // Make file publicly readable
        await fileRef.makePublic();

        // Get the public URL. Note: Firebase format for public bucket files
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        // Note: We don't link it to a messageId here. The client receives the URL and 
        // attaches it when creating a message. However, tracking attachments in the DB is good.
        const newAttachment = {
            accountId,
            filename: file.originalname,
            storageUrl: publicUrl,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("fileAttachments").add(newAttachment);

        res.status(201).json({ id: docRef.id, ...newAttachment });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});

export default router;
