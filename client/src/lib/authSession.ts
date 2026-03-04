<<<<<<< HEAD
import { NextRequest } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebaseAdmin";

export type AuthenticatedAccount = {
    id: string;
    firebaseUid: string;
    email: string | null;
    displayName: string | null;
};

export async function getAuthenticatedAccount(req: NextRequest): Promise<AuthenticatedAccount | null> {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
=======
import { NextRequest, NextResponse } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebaseAdmin";

export async function getAuthenticatedAccount(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);

        const accountsRef = dbAdmin.collection("accounts");
<<<<<<< HEAD
        const accountSnapshot = await accountsRef
            .where("firebaseUid", "==", decodedToken.uid)
            .limit(1)
            .get();

        if (accountSnapshot.empty) return null;

        const doc = accountSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AuthenticatedAccount;
    } catch {
=======
        const accountSnapshot = await accountsRef.where("firebaseUid", "==", decodedToken.uid).limit(1).get();

        if (accountSnapshot.empty) {
            return null;
        }

        const doc = accountSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as { id: string, firebaseUid: string, email: string | null, displayName: string | null };
    } catch (error) {
        console.error("Auth Token Verification Error:", error);
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
        return null;
    }
}
