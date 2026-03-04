import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";

<<<<<<< HEAD
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
=======
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
<<<<<<< HEAD
        const { id } = await params;
=======
        const { id } = params;
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
        const doc = await dbAdmin.collection("spaces").doc(id).get();
        if (!doc.exists) return NextResponse.json({ error: "Space not found" }, { status: 404 });

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch space" }, { status: 500 });
    }
}

<<<<<<< HEAD
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
=======
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
<<<<<<< HEAD
        const { id } = await params;
=======
        const { id } = params;
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
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
    } catch (error) {
        return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
    }
}
