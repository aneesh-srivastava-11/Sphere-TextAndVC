'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { signInWithPassword, signUpWithEmail, user, initialize } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isSignIn, setIsSignIn] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    // Initialize auth store (sets up listeners) and redirect if already logged in
    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (user) router.push('/');
    }, [user, router]);

    const handleAction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            toast.error('Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            if (isSignIn) {
                await signInWithPassword(email, password);
                toast.success('Signed in successfully');
                // signInWithPassword now sets user directly, useEffect will redirect
                // But also push explicitly as a backup
                router.push('/');
            } else {
                await signUpWithEmail(email, password);
                toast.success('Account created! Please check your email to verify.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                background: 'radial-gradient(circle at top center, #171717 0%, #000000 100%)',
                height: '100vh',
                maxHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Gray mesh overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage:
                        'radial-gradient(at 0% 0%, rgba(255,255,255,0.03) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(255,255,255,0.02) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(255,255,255,0.01) 0, transparent 50%)',
                    pointerEvents: 'none',
                }}
            />

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '24px 24px' }}>
                {/* Logo & Title */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            background: 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.739-8z" />
                        </svg>
                    </div>
                    <h1
                        style={{
                            fontSize: '1.75rem',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: 8,
                            letterSpacing: '-0.025em',
                        }}
                    >
                        Sphere
                    </h1>
                    <p
                        style={{
                            color: '#737373',
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: '0.05em',
                        }}
                    >
                        ENTER THE ECOSYSTEM
                    </p>
                </div>

                {/* Glass Card */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '2rem',
                        padding: 8,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    }}
                >
                    <div style={{ padding: '20px 24px' }}>
                        {/* Tabs */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                marginBottom: 20,
                            }}
                        >
                            <button
                                onClick={() => setIsSignIn(true)}
                                type="button"
                                style={{
                                    fontSize: 14,
                                    fontWeight: isSignIn ? 600 : 500,
                                    color: isSignIn ? '#fff' : '#737373',
                                    borderBottom: isSignIn ? '2px solid #fff' : '2px solid transparent',
                                    paddingBottom: 16,
                                    marginBottom: -1,
                                    transition: 'all 0.2s',
                                    background: 'none',
                                    border: 'none',
                                    borderBottomStyle: 'solid',
                                    borderBottomWidth: 2,
                                    borderBottomColor: isSignIn ? '#fff' : 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setIsSignIn(false)}
                                type="button"
                                style={{
                                    fontSize: 14,
                                    fontWeight: !isSignIn ? 600 : 500,
                                    color: !isSignIn ? '#fff' : '#737373',
                                    paddingBottom: 16,
                                    marginBottom: -1,
                                    transition: 'all 0.2s',
                                    background: 'none',
                                    border: 'none',
                                    borderBottomStyle: 'solid',
                                    borderBottomWidth: 2,
                                    borderBottomColor: !isSignIn ? '#fff' : 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => { if (isSignIn) e.currentTarget.style.color = '#d4d4d4'; }}
                                onMouseLeave={(e) => { if (isSignIn) e.currentTarget.style.color = '#737373'; }}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Email */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label
                                    htmlFor="email"
                                    style={{
                                        fontSize: 10,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2em',
                                        fontWeight: 700,
                                        color: '#737373',
                                        paddingLeft: 4,
                                    }}
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@sphere.tech"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                        borderRadius: '0.75rem',
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: 14,
                                        outline: 'none',
                                        transition: 'all 0.3s',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.03), inset 0 0 10px rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    }}
                                />
                            </div>

                            {/* Password */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4, paddingRight: 4 }}>
                                    <label
                                        htmlFor="password"
                                        style={{
                                            fontSize: 10,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            fontWeight: 700,
                                            color: '#737373',
                                        }}
                                    >
                                        Password
                                    </label>
                                    {isSignIn && (
                                        <a
                                            href="#"
                                            style={{
                                                fontSize: 10,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontWeight: 700,
                                                color: '#525252',
                                                textDecoration: 'none',
                                                transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#525252'; }}
                                        >
                                            Recovery
                                        </a>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.10)',
                                            borderRadius: '0.75rem',
                                            padding: '12px 16px',
                                            paddingRight: '48px',
                                            color: '#fff',
                                            fontSize: 14,
                                            outline: 'none',
                                            transition: 'all 0.3s',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.03), inset 0 0 10px rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: 16,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#525252',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#525252'; }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {showPassword ? (
                                                <>
                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                    <line x1="2" x2="22" y1="2" y2="22" />
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)',
                                    color: '#000',
                                    fontWeight: 700,
                                    padding: '12px 16px',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.5 : 1,
                                    transition: 'all 0.3s',
                                    marginTop: 8,
                                    fontSize: 14,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {loading && <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />}
                                {loading ? 'Processing...' : (isSignIn ? 'Continue' : 'Register')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer text */}
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <p
                        style={{
                            fontSize: 11,
                            color: '#525252',
                            lineHeight: 1.6,
                            maxWidth: 300,
                            margin: '0 auto',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Authorized access only. View our{' '}
                        <a href="#" style={{ color: '#a3a3a3', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3'; }}
                        >
                            Terms
                        </a>{' '}
                        and{' '}
                        <a href="#" style={{ color: '#a3a3a3', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3'; }}
                        >
                            Security
                        </a>{' '}
                        policies.
                    </p>
                </div>
            </div>

            {/* Bottom right: System version */}
            <div
                className="hidden sm:flex"
                style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <div style={{ height: 1, width: 48, background: 'rgba(255,255,255,0.1)' }} />
                <span
                    style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#404040',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                    }}
                >
                    System v2.04
                </span>
            </div>

            {/* Bottom left: Core Online */}
            <div
                className="hidden sm:block"
                style={{ position: 'fixed', bottom: 32, left: 32 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Core Online
                    </span>
                </div>
            </div>
        </div>
    );
}
