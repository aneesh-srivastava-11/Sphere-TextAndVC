import * as admin from "firebase-admin";

<<<<<<< HEAD
let app: admin.app.App;

function getAdminApp() {
    if (!app) {
        if (admin.apps.length > 0) {
            app = admin.apps[0]!;
        } else {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
            app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                }),
            });
        }
    }
    return app;
}

export function getDbAdmin() {
    return admin.firestore(getAdminApp());
}

export function getAuthAdmin() {
    return admin.auth(getAdminApp());
}

// Lazy exports for convenience
export const dbAdmin = {
    collection: (name: string) => getDbAdmin().collection(name),
};

export const authAdmin = {
    verifyIdToken: (token: string) => getAuthAdmin().verifyIdToken(token),
};
=======
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
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
