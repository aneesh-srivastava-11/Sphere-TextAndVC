import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        supabase_uid: string;
        email: string;
        display_name: string;
        is_admin: boolean;
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

        // Domain restriction check
        if (!account) {
            const email = user.email || '';
            const domain = email.split('@')[1];

            // 1. Check allowed domains (e.g., muj.manipal.edu)
            const { data: isAllowedDomain } = await supabase
                .from('allowed_domains')
                .select('domain')
                .eq('domain', domain)
                .single();

            // 2. Check if this specific email is overridden/authorized
            const { data: isOverridden } = await supabase
                .from('domain_overrides')
                .select('email')
                .eq('email', email)
                .single();

            if (!isAllowedDomain && !isOverridden) {
                return res.status(403).json({
                    error: 'Unauthorized domain',
                    details: `Registration is restricted to specific domains (e.g., @muj.manipal.edu). Please contact an admin for manual authorization.`
                });
            }

            // Auto-create account on first login since they are now authorized
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
                console.error('Account create error:', JSON.stringify(createError));
                return res.status(500).json({ error: 'Failed to create account', details: createError.message });
            }

            req.user = {
                id: newAccount.id,
                supabase_uid: newAccount.supabase_uid,
                email: newAccount.email,
                display_name: newAccount.display_name,
                is_admin: newAccount.is_admin || false,
            };
        } else {
            req.user = {
                id: account.id,
                supabase_uid: account.supabase_uid,
                email: account.email,
                display_name: account.display_name,
                is_admin: account.is_admin || false,
            };
        }

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}
