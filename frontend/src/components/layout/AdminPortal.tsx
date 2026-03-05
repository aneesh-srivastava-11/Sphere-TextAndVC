'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Globe, UserPlus, Trash2, Plus } from 'lucide-react';

interface AdminPortalProps {
    onClose: () => void;
}

const S = {
    glass: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as React.CSSProperties,
    border: { border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    input: {
        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none',
        transition: 'all 0.3s', fontFamily: 'inherit', boxSizing: 'border-box',
    } as React.CSSProperties,
    btn: {
        background: 'rgba(255,255,255,0.05)', color: '#fff',
        fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 8
    } as React.CSSProperties,
};

export default function AdminPortal({ onClose }: AdminPortalProps) {
    const [domains, setDomains] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [newOverride, setNewOverride] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [d, o] = await Promise.all([
                api.getAdminDomains(),
                api.getAdminOverrides()
            ]);
            setDomains(d);
            setOverrides(o);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async () => {
        if (!newDomain) return;
        try {
            await api.addAdminDomain(newDomain);
            setNewDomain('');
            fetchData();
        } catch (err) { alert('Failed to add domain'); }
    };

    const handleDeleteDomain = async (domain: string) => {
        try {
            await api.deleteAdminDomain(domain);
            fetchData();
        } catch (err) { alert('Failed to delete domain'); }
    };

    const handleAddOverride = async () => {
        if (!newOverride) return;
        try {
            await api.addAdminOverride(newOverride);
            setNewOverride('');
            fetchData();
        } catch (err) { alert('Failed to add override'); }
    };

    const handleDeleteOverride = async (email: string) => {
        try {
            await api.deleteAdminOverride(email);
            fetchData();
        } catch (err) { alert('Failed to delete override'); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <div style={{ width: '100%', maxWidth: 640, ...S.glass, ...S.border, borderRadius: 24, padding: 32, color: '#fff', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Management</h2>
                        <p style={{ fontSize: 14, color: '#737373', marginTop: 4 }}>Control domain restrictions and manual overrides.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 8 }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    {/* Allowed Domains */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={16} /> ALLOWED DOMAINS
                        </h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                style={S.input}
                                placeholder="e.g. google.com"
                                value={newDomain}
                                onChange={e => setNewDomain(e.target.value)}
                            />
                            <button onClick={handleAddDomain} style={{ ...S.btn, background: '#fff', color: '#000' }}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', maxHeight: 300, overflowY: 'auto' }}>
                            {domains.map(d => (
                                <div key={d.domain} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{d.domain}</span>
                                    <button onClick={() => handleDeleteDomain(d.domain)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {domains.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#404040', fontSize: 12 }}>No restricted domains</div>}
                        </div>
                    </div>

                    {/* Email Overrides */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <UserPlus size={16} /> USER OVERRIDES
                        </h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                style={S.input}
                                placeholder="e.g. user@gmail.com"
                                value={newOverride}
                                onChange={e => setNewOverride(e.target.value)}
                            />
                            <button onClick={handleAddOverride} style={{ ...S.btn, background: '#fff', color: '#000' }}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', maxHeight: 300, overflowY: 'auto' }}>
                            {overrides.map(o => (
                                <div key={o.email} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{o.email}</span>
                                    <button onClick={() => handleDeleteOverride(o.email)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {overrides.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#404040', fontSize: 12 }}>No email overrides</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
