'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { Conversation, Account } from '@/types';
import { api } from '@/lib/api';
import { useNicknameStore } from '@/stores/nicknameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import ProfileModal from './ProfileModal';
import { MessageSquare, Hash, Users, Plus, Search, LogOut, Globe, X, Settings } from 'lucide-react';

// Shared inline style constants
const S = {
    glass: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as React.CSSProperties,
    border: { border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    borderB: { borderBottom: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    borderT: { borderTop: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    borderR: { borderRight: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#737373' } as React.CSSProperties,
    input: {
        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none',
        transition: 'all 0.3s', fontFamily: 'inherit', boxSizing: 'border-box',
    } as React.CSSProperties,
    btn: {
        background: 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)', color: '#000',
        fontWeight: 700, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%',
        fontFamily: 'inherit', transition: 'all 0.3s',
    } as React.CSSProperties,
};

export default function Sidebar() {
    const { user, signOut } = useAuthStore();
    const {
        conversations, spaces, activeConversation, activeSpace,
        setActiveConversation, setSidebarTab, sidebarTab,
        fetchConversations, loadSpace, setActiveSpace,
        sidebarOpen, setSidebarOpen,
    } = useConversationStore();

    const isMobile = useIsMobile();
    const { getDisplayName } = useNicknameStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createType, setCreateType] = useState<'dm' | 'group' | 'space'>('dm');
    const [searchResults, setSearchResults] = useState<Account[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Account[]>([]);
    const [groupTitle, setGroupTitle] = useState('');
    const [spaceName, setSpaceName] = useState('');
    const [spaceDesc, setSpaceDesc] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (conv.title?.toLowerCase().includes(q)) return true;
        return conv.participants?.some(p => p.display_name.toLowerCase().includes(q));
    });

    const handleSearchUsers = async (q: string) => {
        setUserSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const results = await api.searchUsers(q);
            setSearchResults(results);
        } catch { setSearchResults([]); }
    };

    const handleCreateDM = async (targetUser: Account) => {
        try {
            const conv = await api.createDM(targetUser.id);
            await fetchConversations();
            setActiveConversation(conv);
            setCreateModalOpen(false);
        } catch { }
    };

    const handleCreateGroup = async () => {
        if (!groupTitle || selectedUsers.length === 0) return;
        try {
            const conv = await api.createGroup(groupTitle, selectedUsers.map(u => u.id));
            await fetchConversations();
            setActiveConversation(conv);
            setCreateModalOpen(false);
            setGroupTitle('');
            setSelectedUsers([]);
        } catch { }
    };

    const handleCreateSpace = async () => {
        if (!spaceName) return;
        try {
            await api.createSpace(spaceName, spaceDesc);
            const { fetchSpaces } = useConversationStore.getState();
            await fetchSpaces();
            setCreateModalOpen(false);
            setSpaceName('');
            setSpaceDesc('');
        } catch { }
    };

    const getConversationName = (conv: Conversation) => {
        if (conv.title) return conv.title;
        if (conv.type === 'direct') {
            const other = conv.participants?.find((p: Account) => p.id !== user?.id);
            if (other) {
                return getDisplayName(other.id, other.display_name);
            }
            return 'Direct Message';
        }
        return 'Untitled';
    };

    const getConversationIcon = (type: string) => {
        switch (type) {
            case 'direct': return <MessageSquare size={14} />;
            case 'group': return <Users size={14} />;
            case 'topic': return <Hash size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <>
            <aside
                style={{
                    display: isMobile ? (sidebarOpen ? 'flex' : 'none') : 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: isMobile ? '100%' : 320,
                    flexShrink: 0,
                    ...S.glass,
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    position: isMobile ? 'absolute' : 'relative',
                    left: 0, top: 0, bottom: 0,
                    zIndex: 50,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: '#fff',
                    background: isMobile ? 'rgba(10,10,10,0.98)' : undefined,
                }}
            >
                {/* Header */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...S.borderB }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, ...S.glass, ...S.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Globe size={16} />
                        </div>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Sphere</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#737373'; }}
                        >
                            <Plus size={20} />
                        </button>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '10px 12px', gap: 8, ...S.borderB, background: 'rgba(0,0,0,0.2)' }}>
                    {[
                        { key: 'conversations' as const, label: 'CHATS', icon: <MessageSquare size={13} /> },
                        { key: 'spaces' as const, label: 'SPACES', icon: <Globe size={13} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSidebarTab(tab.key)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '8px 0',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: sidebarTab === tab.key ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                                background: sidebarTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: sidebarTab === tab.key ? '#fff' : '#737373',
                                fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ padding: '12px 16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#525252' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ ...S.input, paddingLeft: 36 }}
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                    {sidebarTab === 'conversations' ? (
                        filteredConversations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.5 }}>
                                <MessageSquare size={28} style={{ margin: '0 auto 12px', color: '#404040' }} />
                                <p style={{ ...S.label }}>No conversations</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16 }}>
                                {filteredConversations.map(conv => {
                                    const isActive = activeConversation?.id === conv.id;
                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => { setActiveConversation(conv); if (isMobile) setSidebarOpen(false); }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: 10,
                                                borderRadius: 12,
                                                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s',
                                                fontFamily: 'inherit',
                                                color: '#fff',
                                            }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 600, flexShrink: 0,
                                            }}>
                                                {getConversationName(conv).charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ color: '#525252' }}>{getConversationIcon(conv.type)}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#d4d4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {getConversationName(conv)}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: 10, color: '#525252', marginTop: 4, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                                    {conv.participants?.length || 0} MEMBERS
                                                </p>
                                            </div>
                                            {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.8)', flexShrink: 0 }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        spaces.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.5 }}>
                                <Globe size={28} style={{ margin: '0 auto 12px', color: '#404040' }} />
                                <p style={{ ...S.label }}>No spaces</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16 }}>
                                {spaces.map(space => {
                                    const isActive = activeSpace?.id === space.id;
                                    return (
                                        <button
                                            key={space.id}
                                            onClick={async () => { setActiveSpace(space); await loadSpace(space.id); if (isMobile) setSidebarOpen(false); }}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                                padding: 10, borderRadius: 12,
                                                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                                fontFamily: 'inherit', color: '#fff',
                                            }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 600, flexShrink: 0,
                                            }}>
                                                {space.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#d4d4d4', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {space.name}
                                                </span>
                                                {space.description && (
                                                    <p style={{ fontSize: 10, color: '#525252', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {space.description}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                {/* User footer */}
                <div style={{ padding: '12px 16px', ...S.borderT, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, flexShrink: 0,
                        }}>
                            {user?.display_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1, marginBottom: 4 }}>
                                {user?.display_name}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#525252', letterSpacing: '0.15em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#525252'; }}
                            title="Edit Profile"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={signOut}
                            style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#525252'; }}
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Create modal overlay */}
                {createModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}
                    >
                        <div style={{
                            width: '100%', maxWidth: 420, ...S.glass, ...S.border, borderRadius: 24,
                            padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New Conversation</h2>
                                    <p style={{ fontSize: 12, color: '#525252', marginTop: 4 }}>Create a direct message, group, or space.</p>
                                </div>
                                <button onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', padding: 4 }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Type tabs */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 20, ...S.glass, ...S.border, padding: 4, borderRadius: 14 }}>
                                {[
                                    { key: 'dm' as const, label: 'Direct', icon: <MessageSquare size={13} /> },
                                    { key: 'group' as const, label: 'Group', icon: <Users size={13} /> },
                                    { key: 'space' as const, label: 'Space', icon: <Globe size={13} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setCreateType(tab.key)}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            background: createType === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            color: createType === tab.key ? '#fff' : '#525252',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* DM */}
                            {createType === 'dm' && (
                                <div>
                                    <input type="text" placeholder="Search users..." value={userSearchQuery} onChange={e => handleSearchUsers(e.target.value)} style={S.input} />
                                    <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 12 }}>
                                        {searchResults.map(u => (
                                            <button key={u.id} onClick={() => handleCreateDM(u)}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '10px 8px', borderRadius: 12, border: 'none',
                                                    background: 'transparent', cursor: 'pointer', transition: 'background 0.2s',
                                                    fontFamily: 'inherit', color: '#fff', textAlign: 'left',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0,
                                                }}>
                                                    {u.display_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name}</p>
                                                    <p style={{ fontSize: 10, color: '#525252', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group */}
                            {createType === 'group' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <input type="text" placeholder="Group name" value={groupTitle} onChange={e => setGroupTitle(e.target.value)} style={S.input} />
                                    <input type="text" placeholder="Search users to add..." onChange={e => handleSearchUsers(e.target.value)} style={S.input} />
                                    {selectedUsers.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {selectedUsers.map(u => (
                                                <span key={u.id} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                                                    borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d4',
                                                }}>
                                                    {u.display_name}
                                                    <button onClick={() => setSelectedUsers(p => p.filter(x => x.id !== u.id))}
                                                        style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', marginLeft: 2, fontSize: 14, lineHeight: 1 }}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                                        {searchResults.filter(u => !selectedUsers.find(s => s.id === u.id)).map(u => (
                                            <button key={u.id} onClick={() => setSelectedUsers(p => [...p, u])}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                                    padding: '8px', borderRadius: 10, border: 'none',
                                                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: '#d4d4d4', textAlign: 'left',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0,
                                                }}>
                                                    {u.display_name.charAt(0)}
                                                </div>
                                                <span style={{ fontSize: 13 }}>{u.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={handleCreateGroup} disabled={!groupTitle || selectedUsers.length === 0}
                                        style={{ ...S.btn, opacity: (!groupTitle || selectedUsers.length === 0) ? 0.5 : 1 }}>
                                        Create Group
                                    </button>
                                </div>
                            )}

                            {/* Space */}
                            {createType === 'space' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <input type="text" placeholder="Space name" value={spaceName} onChange={e => setSpaceName(e.target.value)} style={S.input} />
                                    <textarea placeholder="Description (optional)" value={spaceDesc} onChange={e => setSpaceDesc(e.target.value)}
                                        style={{ ...S.input, minHeight: 80, resize: 'none' }} />
                                    <button onClick={handleCreateSpace} disabled={!spaceName}
                                        style={{ ...S.btn, opacity: !spaceName ? 0.5 : 1 }}>
                                        Create Space
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </aside>

            {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
        </>
    );
}
