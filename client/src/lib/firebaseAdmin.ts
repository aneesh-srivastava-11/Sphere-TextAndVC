import * as admin from "firebase-admin";

function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        throw new Error(
            "Missing Firebase Admin environment variables. " +
            "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment."
        );
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    return admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        storageBucket: storageBucket,
    });
}

export const dbAdmin = {
    collection: (name: string) => admin.firestore(getAdminApp()).collection(name),
};

export const authAdmin = {
    verifyIdToken: (token: string) => admin.auth(getAdminApp()).verifyIdToken(token),
};

export const storageAdmin = {
    bucket: () => admin.storage(getAdminApp()).bucket(),
};
