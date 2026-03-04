"use client";

import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { isSignInWithEmailLink, signInWithEmailLink, sendSignInLinkToEmail, auth } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // Check if coming from email link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                emailForSignIn = window.prompt('Please provide your email for confirmation');
            }

            if (emailForSignIn) {
                setStatus("loading");
                signInWithEmailLink(auth, emailForSignIn, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        // The AuthContext onAuthStateChanged listener will handle routing
                    })
                    .catch(() => {
                        setStatus("error");
                        setErrorMessage("Failed to sign in. The link may have expired.");
                    });
            }
        }
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setStatus("loading");
            await signInWithGoogle();
            // AuthContext routing takes over
        } catch (err: any) {
            setStatus("error");
            setErrorMessage(err.message || "Google sign in failed");
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setStatus("sent");
        } catch (err: any) {
            setStatus("error");
            setErrorMessage(err.message || "Failed to send email link");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="glass-panel w-full max-w-md p-8 rounded-2xl z-10 animate-slide-up">

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-blue-500 rounded-full mx-auto mb-6 shadow-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm border border-white/30"></div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome to Sphere</h1>
                    <p className="text-text-secondary text-sm">Where your team's conversations happen.</p>
                </div>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {errorMessage}
                    </div>
                )}

                {status === "sent" ? (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="w-16 h-16 bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">Check your email</h3>
                        <p className="text-text-secondary text-sm mb-6">
                            We've sent a magic link to <span className="text-white font-medium">{email}</span>. Click it to sign in.
                        </p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors"
                        >
                            Try another email
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in flex flex-col gap-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={status === "loading"}
                            className="glass-button w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-white font-medium disabled:opacity-50"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4 my-2">
                            <div className="flex-1 h-px bg-border"></div>
                            <span className="text-text-tertiary text-xs uppercase font-medium tracking-wider">Or</span>
                            <div className="flex-1 h-px bg-border"></div>
                        </div>

                        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
                            <div>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 text-white placeholder-text-tertiary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="primary-button w-full py-3 px-4 rounded-xl text-center flex justify-center items-center h-[50px]"
                            >
                                {status === "loading" ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Continue with Email"
                                )}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}
