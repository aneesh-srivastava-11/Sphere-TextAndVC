import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const topicId = id;
        const searchParams = req.nextUrl.searchParams;
        const limit = Number(searchParams.get("limit") || 50);

        // 1. Fetch blocks involving this user
        const blocksRef = dbAdmin.collection("blocks");
        const [blocks1, blocks2] = await Promise.all([
            blocksRef.where("blockerId", "==", account.id).get(),
            blocksRef.where("blockedId", "==", account.id).get(),
        ]);

        const blockedUserIds = new Set<string>();
        blocks1.docs.forEach((doc) => blockedUserIds.add(doc.data().blockedId));
        blocks2.docs.forEach((doc) => blockedUserIds.add(doc.data().blockerId));

        // 2. Fetch messages ordered by creation
        const messagesRef = dbAdmin.collection("messages");
        const snapshot = await messagesRef
            .where("topicId", "==", topicId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        let messages = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        messages.reverse();

        messages = messages.map(msg => {
            if (blockedUserIds.has(msg.authorId)) {
                return { ...msg, content: null, isGhostBlocked: true, authorId: "blocked_user" };
            }
            return msg;
        });

        return NextResponse.json(messages);
    } catch {
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const topicId = id;
        const { content } = await req.json();

        if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

        const newMessage = {
            topicId,
            authorId: account.id,
            content,
            isPinned: false,
            deletedAt: null,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await dbAdmin.collection("messages").add(newMessage);
        return NextResponse.json({ id: docRef.id, ...newMessage }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
