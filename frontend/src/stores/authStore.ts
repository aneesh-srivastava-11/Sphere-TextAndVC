'use client';

import { create } from 'zustand';
import { Account } from '@/types';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Session } from '@supabase/supabase-js';

interface AuthState {
    user: Account | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;

    initialize: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<Account>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const user = await api.syncUser();
                connectSocket(session.access_token);
                set({ user, session, loading: false, initialized: true });
            } else {
                set({ loading: false, initialized: true });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    const user = await api.syncUser();
                    connectSocket(session.access_token);
                    set({ user, session });
                } else if (event === 'SIGNED_OUT') {
                    disconnectSocket();
                    set({ user: null, session: null });
                }
            });
        } catch (err) {
            console.error('Auth init error:', err);
            set({ loading: false, initialized: true });
        }
    },

    signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    },

    signInWithEmail: async (email: string) => {
        await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
    },

    signOut: async () => {
        disconnectSocket();
        await supabase.auth.signOut();
        set({ user: null, session: null });
    },

    updateProfile: async (data) => {
        const updated = await api.updateProfile(data);
        set({ user: { ...get().user!, ...updated } });
    },
}));
