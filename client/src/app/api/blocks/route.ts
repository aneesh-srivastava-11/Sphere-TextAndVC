import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const blocksRef = dbAdmin.collection("blocks");
        const snapshot = await blocksRef.where("blockerId", "==", account.id).get();
        const blocked = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(blocked);
    } catch {
        return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { blockedId } = await req.json();
        if (!blockedId) return NextResponse.json({ error: "blockedId is required" }, { status: 400 });

        if (blockedId === account.id) {
            return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
        }

        const blocksRef = dbAdmin.collection("blocks");
        const existing = await blocksRef
            .where("blockerId", "==", account.id)
            .where("blockedId", "==", blockedId)
            .limit(1)
            .get();

        if (!existing.empty) {
            return NextResponse.json({ message: "User already blocked" });
        }

        const newBlock = {
            blockerId: account.id,
            blockedId,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await blocksRef.add(newBlock);
        return NextResponse.json({ id: docRef.id, ...newBlock }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { blockedId } = await req.json();
        if (!blockedId) return NextResponse.json({ error: "blockedId is required" }, { status: 400 });

        const blocksRef = dbAdmin.collection("blocks");
        const snapshot = await blocksRef
            .where("blockerId", "==", account.id)
            .where("blockedId", "==", blockedId)
            .get();

        const batch = dbAdmin.collection("_").firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({ message: "User unblocked" });
    } catch {
        return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
    }
}
