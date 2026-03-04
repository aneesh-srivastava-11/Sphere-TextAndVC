import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const doc = await dbAdmin.collection("topics").doc(id).get();
        if (!doc.exists) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch {
        return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const updates = await req.json();
        await dbAdmin.collection("topics").doc(id).update(updates);
        return NextResponse.json({ id, ...updates });
    } catch {
        return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        // Optional: Check if user has permission (owner of space)
        await dbAdmin.collection("topics").doc(id).delete();
        return NextResponse.json({ message: "Topic deleted" });
    } catch {
        return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
    }
}
