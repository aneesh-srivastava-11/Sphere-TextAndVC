import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, storageAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const extension = file.name.split(".").pop() || "";
        const filename = `${crypto.randomUUID()}.${extension}`;

        const bucket = storageAdmin.bucket();
        const blob = bucket.file(`uploads/${filename}`);

        await blob.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file publicly accessible (optional, but needed for public URLs)
        // Note: For real-word, use signed URLs or Firebase's own download URL logic
        // For this MVP consolidation, we'll construct a direct URL if public access is enabled on bucket
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/uploads/${filename}`;

        const newAttachment = {
            accountId: account.id,
            filename: file.name,
            storageUrl: publicUrl,
            mimeType: file.type,
            sizeBytes: file.size,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await dbAdmin.collection("fileAttachments").add(newAttachment);

        return NextResponse.json({ id: docRef.id, ...newAttachment }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }
}
