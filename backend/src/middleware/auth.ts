import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        supabase_uid: string;
        email: string;
        display_name: string;
    };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT with Supabase
        const supabaseAuth = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
        );

        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get or create account in our database
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('*')
            .eq('supabase_uid', user.id)
            .single();

        if (accountError && accountError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!account) {
            // Auto-create account on first login
            const { data: newAccount, error: createError } = await supabase
                .from('accounts')
                .insert({
                    supabase_uid: user.id,
                    email: user.email!,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    avatar_url: user.user_metadata?.avatar_url || null,
                })
                .select()
                .single();

            if (createError) {
                return res.status(500).json({ error: 'Failed to create account' });
            }

            req.user = {
                id: newAccount.id,
                supabase_uid: newAccount.supabase_uid,
                email: newAccount.email,
                display_name: newAccount.display_name,
            };
        } else {
            req.user = {
                id: account.id,
                supabase_uid: account.supabase_uid,
                email: account.email,
                display_name: account.display_name,
            };
        }

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}
