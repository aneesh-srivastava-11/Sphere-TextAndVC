import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { getAuthenticatedAccount } from "@/lib/authSession";
import { FieldValue } from "firebase-admin/firestore";

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
        const topicsRef = dbAdmin.collection("topics");
        const snapshot = await topicsRef.where("spaceId", "==", id).get();
=======
        const spaceId = params.id;
        const topicsRef = dbAdmin.collection("topics");
        const snapshot = await topicsRef.where("spaceId", "==", spaceId).get();
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(topics);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
    }
}

<<<<<<< HEAD
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
=======
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
    const account = await getAuthenticatedAccount(req);
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
<<<<<<< HEAD
        const { id } = await params;
=======
        const spaceId = params.id;
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
        const { name, description } = await req.json();
        if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

        const newTopic = {
<<<<<<< HEAD
            spaceId: id,
=======
            spaceId,
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
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
