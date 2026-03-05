'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { Conversation, Account } from '@/types';
import { api } from '@/lib/api';
import {
    MessageSquare, Hash, Users, Plus, Search, LogOut, Settings, Globe, ChevronDown,
} from 'lucide-react';

export default function Sidebar() {
    const { user, signOut } = useAuthStore();
    const {
        conversations, spaces, activeConversation, activeSpace,
        setActiveConversation, setSidebarTab, sidebarTab,
        fetchConversations, loadSpace, setActiveSpace,
    } = useConversationStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState<'dm' | 'group' | 'space'>('dm');
    const [searchResults, setSearchResults] = useState<Account[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Account[]>([]);
    const [groupTitle, setGroupTitle] = useState('');
    const [spaceName, setSpaceName] = useState('');
    const [spaceDesc, setSpaceDesc] = useState('');

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (conv.title?.toLowerCase().includes(q)) return true;
        return conv.participants?.some(p => p.display_name.toLowerCase().includes(q));
    });

    const handleSearchUsers = async (q: string) => {
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
            setShowCreateModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupTitle || selectedUsers.length === 0) return;
        try {
            const conv = await api.createGroup(groupTitle, selectedUsers.map(u => u.id));
            await fetchConversations();
            setActiveConversation(conv);
            setShowCreateModal(false);
            setGroupTitle('');
            setSelectedUsers([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSpace = async () => {
        if (!spaceName) return;
        try {
            await api.createSpace(spaceName, spaceDesc);
            const { fetchSpaces } = useConversationStore.getState();
            await fetchSpaces();
            setShowCreateModal(false);
            setSpaceName('');
            setSpaceDesc('');
        } catch (err) {
            console.error(err);
        }
    };

    const getConversationName = (conv: Conversation) => {
        if (conv.title) return conv.title;
        if (conv.type === 'direct') {
            const other = conv.participants?.find((p: Account) => p.id !== user?.id);
            return other?.display_name || 'Direct Message';
        }
        return 'Untitled';
    };

    const getConversationIcon = (type: string) => {
        switch (type) {
            case 'direct': return <MessageSquare size={16} />;
            case 'group': return <Users size={16} />;
            case 'topic': return <Hash size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    return (
        <>
            <aside
                className="glass-panel-strong flex flex-col h-full animate-slide-left"
                style={{ width: '320px', minWidth: '320px', borderRight: '1px solid var(--border-color)' }}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Globe size={16} color="white" />
                        </div>
                        <span className="font-bold text-lg">Sphere</span>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-icon btn-ghost" title="New conversation">
                        <Plus size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        className={`btn btn-ghost flex-1 text-sm ${sidebarTab === 'conversations' ? 'font-semibold' : ''}`}
                        style={sidebarTab === 'conversations' ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' } : {}}
                        onClick={() => setSidebarTab('conversations')}
                    >
                        <MessageSquare size={16} /> Chats
                    </button>
                    <button
                        className={`btn btn-ghost flex-1 text-sm ${sidebarTab === 'spaces' ? 'font-semibold' : ''}`}
                        style={sidebarTab === 'spaces' ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' } : {}}
                        onClick={() => setSidebarTab('spaces')}
                    >
                        <Globe size={16} /> Spaces
                    </button>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {sidebarTab === 'conversations' ? (
                        filteredConversations.length === 0 ? (
                            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No conversations yet</p>
                                <p className="text-xs mt-1">Start a new conversation</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-150 text-left"
                                    style={{
                                        background: activeConversation?.id === conv.id ? 'var(--bg-elevated)' : 'transparent',
                                        borderLeft: activeConversation?.id === conv.id ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}
                                >
                                    <div className="avatar avatar-sm" style={conv.type === 'group' ? { background: 'linear-gradient(135deg, #059669, #10b981)' } : conv.type === 'topic' ? { background: 'linear-gradient(135deg, #d97706, #f59e0b)' } : {}}>
                                        {conv.avatar_url ? <img src={conv.avatar_url} alt="" /> : getConversationName(conv).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="opacity-60">{getConversationIcon(conv.type)}</span>
                                            <span className="font-medium text-sm truncate">{getConversationName(conv)}</span>
                                        </div>
                                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            {conv.participants?.length || 0} members
                                        </p>
                                    </div>
                                </button>
                            ))
                        )
                    ) : (
                        /* Spaces tab */
                        spaces.length === 0 ? (
                            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                <Globe size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No spaces yet</p>
                            </div>
                        ) : (
                            spaces.map(space => (
                                <button
                                    key={space.id}
                                    onClick={async () => {
                                        setActiveSpace(space);
                                        await loadSpace(space.id);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-150 text-left"
                                    style={{
                                        background: activeSpace?.id === space.id ? 'var(--bg-elevated)' : 'transparent',
                                        borderLeft: activeSpace?.id === space.id ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}
                                >
                                    <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
                                        {space.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium text-sm truncate block">{space.name}</span>
                                        {space.description && (
                                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{space.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )
                    )}
                </div>

                {/* User footer */}
                <div className="p-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="avatar avatar-sm relative">
                        {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : user?.display_name?.charAt(0).toUpperCase()}
                        <div className="online-dot" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.display_name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                    <button onClick={signOut} className="btn btn-icon btn-ghost" title="Sign out">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">New Conversation</h2>

                        {/* Type tabs */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { key: 'dm' as const, label: 'Direct Message', icon: MessageSquare },
                                { key: 'group' as const, label: 'Group', icon: Users },
                                { key: 'space' as const, label: 'Space', icon: Globe },
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    className={`btn btn-ghost flex-1 text-xs`}
                                    style={createType === key ? { background: 'var(--bg-elevated)', color: 'var(--accent)' } : {}}
                                    onClick={() => setCreateType(key)}
                                >
                                    <Icon size={14} /> {label}
                                </button>
                            ))}
                        </div>

                        {createType === 'dm' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="input mb-3"
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                />
                                <div className="max-h-60 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleCreateDM(u)}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                                        >
                                            <div className="avatar avatar-sm">{u.display_name.charAt(0).toUpperCase()}</div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium">{u.display_name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {createType === 'group' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Group name"
                                    value={groupTitle}
                                    onChange={(e) => setGroupTitle(e.target.value)}
                                    className="input mb-3"
                                />
                                <input
                                    type="text"
                                    placeholder="Search users to add..."
                                    className="input mb-3"
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                />
                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {selectedUsers.map(u => (
                                            <span key={u.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                                {u.display_name}
                                                <button onClick={() => setSelectedUsers(prev => prev.filter(p => p.id !== u.id))} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="max-h-40 overflow-y-auto mb-3">
                                    {searchResults.filter(u => !selectedUsers.find(s => s.id === u.id)).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => setSelectedUsers(prev => [...prev, u])}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                                        >
                                            <div className="avatar avatar-sm">{u.display_name.charAt(0).toUpperCase()}</div>
                                            <span className="text-sm">{u.display_name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleCreateGroup} className="btn btn-primary w-full"
                                    disabled={!groupTitle || selectedUsers.length === 0}>
                                    Create Group
                                </button>
                            </div>
                        )}

                        {createType === 'space' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Space name"
                                    value={spaceName}
                                    onChange={(e) => setSpaceName(e.target.value)}
                                    className="input mb-3"
                                />
                                <textarea
                                    placeholder="Description (optional)"
                                    value={spaceDesc}
                                    onChange={(e) => setSpaceDesc(e.target.value)}
                                    className="input mb-3"
                                    rows={3}
                                    style={{ resize: 'none' }}
                                />
                                <button onClick={handleCreateSpace} className="btn btn-primary w-full" disabled={!spaceName}>
                                    Create Space
                                </button>
                            </div>
                        )}

                        <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost w-full mt-3 text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
