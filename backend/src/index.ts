import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import spaceRoutes from "./routes/spaces";
import topicRoutes from "./routes/topics";
import messageRoutes from "./routes/messages";
import blockRoutes from "./routes/blocks";
import uploadRoutes from "./routes/uploads";
import { socketAuthMiddleware } from "./realtime/authMiddleware";
import { registerRealtimeHandlers } from "./realtime/handlers";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Next.js frontend
const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static uploaded files locally
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// Initialize Socket.io
export const io = new Server(server, {
    cors: corsOptions,
});

// Basic Health Check
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Sphere Backend is running." });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/uploads", uploadRoutes);

// Realtime connection handler
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (Account: ${socket.data.accountId})`);

    registerRealtimeHandlers(io, socket);

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Sphere Backend listening on port ${PORT}`);
});
