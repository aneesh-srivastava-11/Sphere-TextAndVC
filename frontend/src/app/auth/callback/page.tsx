'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                router.push('/login');
            } else {
                router.push('/');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div
            style={{
                background: 'radial-gradient(circle at top center, #171717 0%, #000000 100%)',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                color: '#fff',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#fff' }} />
                <p style={{ color: '#737373', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
                    Authenticating...
                </p>
            </div>
        </div>
    );
}
