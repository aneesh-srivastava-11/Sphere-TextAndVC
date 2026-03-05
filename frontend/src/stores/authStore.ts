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
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<Account>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        // Prevent double initialization
        if (get().initialized) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                try {
                    const user = await api.syncUser();
                    connectSocket(session.access_token);
                    set({ user, session, loading: false, initialized: true });
                } catch {
                    // Backend might be down but session is valid
                    set({ loading: false, initialized: true });
                }
            } else {
                set({ loading: false, initialized: true });
            }

            // Listen for auth changes (sign in/out from other tabs, etc.)
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    try {
                        const user = await api.syncUser();
                        connectSocket(session.access_token);
                        set({ user, session });
                    } catch {
                        // If sync fails, still set session so redirect works
                        set({ session });
                    }
                } else if (event === 'SIGNED_OUT') {
                    disconnectSocket();
                    set({ user: null, session: null });
                }
            });
        } catch {
            set({ loading: false, initialized: true });
        }
    },

    signUpWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    },

    signInWithPassword: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Directly sync user and set state — don't rely on onAuthStateChange
        if (data.session) {
            try {
                const user = await api.syncUser();
                connectSocket(data.session.access_token);
                set({ user, session: data.session, loading: false, initialized: true });
            } catch {
                // Even if sync fails, set the session so the page can redirect
                set({ session: data.session, loading: false, initialized: true });
            }
        }
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
