import { Socket } from "socket.io";
import { auth, db } from "../lib/firebase";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decodedToken = await auth.verifyIdToken(token);

        // Attach uid to socket data
        socket.data.uid = decodedToken.uid;

        // Optional: fetch internal account ID to use for ghost block logic
        const snapshot = await db.collection("accounts").where("firebaseUid", "==", decodedToken.uid).limit(1).get();
        if (!snapshot.empty) {
            socket.data.accountId = snapshot.docs[0].id;
        } else {
            return next(new Error("Account not found"));
        }

        next();
    } catch (err) {
        console.error("Socket authentication error:", err);
        next(new Error("Authentication error: Invalid token"));
    }
};
