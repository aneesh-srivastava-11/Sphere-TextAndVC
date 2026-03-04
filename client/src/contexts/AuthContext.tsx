"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { apiFetch } from "../lib/api";

export interface Account {
    id: string;
    firebaseUid: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
}

interface AuthContextType {
    user: User | null;
    account: Account | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    account: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    refreshAccount: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAccount = async (firebaseUser: User) => {
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/auth/session`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const accData = await res.json();
                setAccount(accData);
            }
        } catch { /* Silent */ }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await refreshAccount(firebaseUser);
            } else {
                setAccount(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            // If popup is blocked by COOP/browsers, redirect is the only choice left
            // but for now we try to keep it simple with popup.
            throw e;
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setAccount(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            account,
            loading,
            signInWithGoogle,
            signOut,
            refreshAccount: async () => {
                if (user) await refreshAccount(user);
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
