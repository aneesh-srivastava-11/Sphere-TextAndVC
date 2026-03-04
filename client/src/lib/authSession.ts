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

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);

        const accountsRef = dbAdmin.collection("accounts");
        const accountSnapshot = await accountsRef
            .where("firebaseUid", "==", decodedToken.uid)
            .limit(1)
            .get();

        if (accountSnapshot.empty) return null;

        const doc = accountSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AuthenticatedAccount;
    } catch {
        return null;
    }
}
