'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { signInWithEmail, loading, user } = useAuthStore();
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
