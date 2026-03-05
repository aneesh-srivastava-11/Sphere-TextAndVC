import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import spaceRoutes from './routes/spaces';
import moderationRoutes from './routes/moderation';
import callRoutes from './routes/calls';
import { setupSocketIO } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/calls', callRoutes);

// Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [frontendUrl, 'http://localhost:3000'],
        credentials: true,
    },
});

setupSocketIO(io);

// Start server
const PORT = parseInt(process.env.PORT || '3001');
httpServer.listen(PORT, () => {
    console.log(`🟢 Sphere backend running on port ${PORT}`);
    console.log(`   Frontend URL: ${frontendUrl}`);
});

export { app, httpServer, io };
