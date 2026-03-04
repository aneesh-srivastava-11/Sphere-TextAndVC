import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const spaceId = params.id;
        const topicsRef = dbAdmin.collection("topics");
        const snapshot = await topicsRef.where("spaceId", "==", spaceId).get();
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(topics);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const spaceId = params.id;
        const { name, description } = await req.json();
        if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

        const newTopic = {
            spaceId,
            name,
            description: description || "",
            isArchived: false,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await dbAdmin.collection("topics").add(newTopic);
        return NextResponse.json({ id: docRef.id, ...newTopic }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
    }
}
