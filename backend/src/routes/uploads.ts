import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import { db } from "../lib/firebase";
import multer from "multer";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const router = express.Router();
router.use(verifyToken);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Map files to disk 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split(".").pop() || "";
        cb(null, `${uuidv4()}.${extension}`)
    }
})

const upload = multer({
    storage: storage,
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

        // The file is already saved to disk by multer at this point.
        // req.file.filename contains the generated UUID name.

        // Using the host/port the server is running on (fallback to localhost:4000)
        const hostUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const publicUrl = `${hostUrl}/uploads/${file.filename}`;

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
