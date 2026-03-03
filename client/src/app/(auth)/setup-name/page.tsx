"use client";

import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function SetupNamePage() {
    const { account, refreshAccount, user } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || displayName.length < 3) {
            setError("Display name must be at least 3 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await apiFetch("/api/auth/display-name", {
                method: "PATCH",
                body: JSON.stringify({ displayName }),
            });

            if (user) {
                await refreshAccount();
            }
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to set display name");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 rounded-2xl z-10 animate-fade-in shadow-2xl shadow-brand-500/10">

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Set Display Name</h2>
                    <p className="text-text-secondary text-sm">How should your team identify you?</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Alex.D"
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 text-white placeholder-text-tertiary focus:outline-none focus:border-brand-500 transition-all font-medium"
                            minLength={3}
                            maxLength={30}
                            required
                        />
                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || displayName.length < 3}
                        className="primary-button w-full py-3 rounded-xl font-medium flex justify-center mt-2 h-[50px] items-center"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Continue"}
                    </button>
                </form>

            </div>
        </div>
    );
}
