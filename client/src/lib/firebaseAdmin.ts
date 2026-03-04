import * as admin from "firebase-admin";

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined;

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
