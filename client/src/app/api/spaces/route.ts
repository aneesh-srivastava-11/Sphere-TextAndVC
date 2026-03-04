import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const spacesRef = dbAdmin.collection("spaces");
        const snapshot = await spacesRef.where("isPrivate", "==", false).get();

        const publicSpaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(publicSpaces);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name, slug, description, isPrivate } = await req.json();
        if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });

        const newSpace = {
            name,
            slug,
            description: description || "",
            isPrivate: !!isPrivate,
            ownerId: account.id,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await dbAdmin.collection("spaces").add(newSpace);

        await docRef.collection("members").doc(account.id).set({
            role: "owner",
            joinedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ id: docRef.id, ...newSpace }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
    }
}
