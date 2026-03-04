import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const doc = await dbAdmin.collection("spaces").doc(id).get();
        if (!doc.exists) return NextResponse.json({ error: "Space not found" }, { status: 404 });

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch {
        return NextResponse.json({ error: "Failed to fetch space" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const spaceRef = dbAdmin.collection("spaces").doc(id);
        const spaceDoc = await spaceRef.get();

        if (!spaceDoc.exists) return NextResponse.json({ error: "Space not found" }, { status: 404 });

        const memberDoc = await spaceRef.collection("members").doc(account.id).get();
        const role = memberDoc.data()?.role;
        if (!memberDoc.exists || (role !== "owner" && role !== "moderator")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updates = await req.json();
        await spaceRef.update(updates);

        return NextResponse.json({ id, ...spaceDoc.data(), ...updates });
    } catch {
        return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
    }
}
