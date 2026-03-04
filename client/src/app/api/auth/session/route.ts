import { NextRequest, NextResponse } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const { uid, email, picture } = decodedToken;

        const accountsRef = dbAdmin.collection("accounts");
        const snapshot = await accountsRef.where("firebaseUid", "==", uid).limit(1).get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return NextResponse.json({ id: doc.id, ...doc.data() });
        }

        // Create new account
        const newAccount = {
            firebaseUid: uid,
            email: email || null,
            displayName: null,
            avatarUrl: picture || null,
            createdAt: new Date().toISOString(),
        };

        const docRef = await accountsRef.add(newAccount);
        return NextResponse.json({ id: docRef.id, ...newAccount }, { status: 201 });
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json({ error: "Failed to create or verify session" }, { status: 500 });
    }
}
