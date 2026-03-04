import { NextRequest, NextResponse } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebaseAdmin";

export async function PATCH(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);

        const accountsRef = dbAdmin.collection("accounts");
        const accountSnapshot = await accountsRef.where("firebaseUid", "==", decodedToken.uid).limit(1).get();

        if (accountSnapshot.empty) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const accountDoc = accountSnapshot.docs[0];
        const { displayName } = await req.json();

        if (!displayName || typeof displayName !== "string") {
            return NextResponse.json({ error: "Display name is required" }, { status: 400 });
        }

        const trimmedName = displayName.trim().replace(/<[^>]*>?/gm, '');
        if (trimmedName.length < 3 || trimmedName.length > 30) {
            return NextResponse.json({ error: "Display name must be between 3 and 30 characters" }, { status: 400 });
        }

        await accountDoc.ref.update({ displayName: trimmedName });

        return NextResponse.json({ id: accountDoc.id, displayName: trimmedName, message: "Updated" });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
