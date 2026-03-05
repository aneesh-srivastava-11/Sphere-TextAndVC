import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setupMessagingHandlers } from './messaging';
import { setupPresenceHandlers } from './presence';
import { setupSignalingHandlers } from './signaling';

export function setupSocketIO(io: Server) {
    // Authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const supabaseAuth = createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_ANON_KEY!
            );

            const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

            if (error || !user) {
                return next(new Error('Invalid token'));
            }

            // Get account from database
            const { data: account } = await supabase
                .from('accounts')
                .select('id, supabase_uid, email, display_name')
                .eq('supabase_uid', user.id)
                .single();

            if (!account) {
                return next(new Error('Account not found'));
            }

            (socket as any).userId = account.id;
            (socket as any).user = account;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = (socket as any).userId as string;
        console.log(`User connected: ${userId} (socket: ${socket.id})`);

        // Setup all handlers
        setupMessagingHandlers(io, socket, userId);
        setupPresenceHandlers(io, socket, userId);
        setupSignalingHandlers(io, socket, userId);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId} (socket: ${socket.id})`);
        });
    });
}
