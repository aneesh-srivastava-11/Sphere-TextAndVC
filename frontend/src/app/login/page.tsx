'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { signInWithGoogle, signInWithEmail, loading, user } = useAuthStore();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [sending, setSending] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user) router.push('/');
    }, [user, router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSending(true);
        try {
            await signInWithEmail(email);
            setEmailSent(true);
        } catch (err) {
            console.error(err);
        }
        setSending(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Background orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

            <div className="glass-panel rounded-2xl p-8 w-full max-w-md animate-fade-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12a4 4 0 0 1 8 0" />
                            <circle cx="12" cy="12" r="1.5" fill="white" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2"
                        style={{ background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Sphere
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Connect. Collaborate. Communicate.</p>
                </div>

                {emailSent ? (
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                            style={{ background: 'var(--bg-elevated)' }}>
                            <Mail size={24} style={{ color: 'var(--accent)' }} />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            We sent a magic link to <strong>{email}</strong>
                        </p>
                        <button
                            onClick={() => setEmailSent(false)}
                            className="btn btn-ghost text-sm"
                        >
                            Use a different email
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Google login */}
                        <button
                            onClick={signInWithGoogle}
                            className="btn btn-secondary w-full mb-4"
                            style={{ padding: '0.75rem' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>or</span>
                            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                        </div>

                        {/* Email magic link */}
                        <form onSubmit={handleEmailLogin}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input mb-4"
                                required
                            />
                            <button
                                type="submit"
                                disabled={sending || !email}
                                className="btn btn-primary w-full"
                                style={{ padding: '0.75rem' }}
                            >
                                {sending ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Mail size={18} />
                                        Send Magic Link
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
