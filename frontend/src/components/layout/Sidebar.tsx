'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { Conversation, Account } from '@/types';
import { api } from '@/lib/api';
import { MessageSquare, Hash, Users, Plus, Search, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Sidebar() {
    const { user, signOut } = useAuthStore();
    const {
        conversations, spaces, activeConversation, activeSpace,
        setActiveConversation, setSidebarTab, sidebarTab,
        fetchConversations, loadSpace, setActiveSpace,
    } = useConversationStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
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
            setCreateModalOpen(false);
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
            setCreateModalOpen(false);
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
            setCreateModalOpen(false);
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
        <aside className="flex flex-col h-full bg-transparent border-r border-white/10 transition-all duration-300 w-80 relative z-10 glass-card">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/10 shadow-lg">
                        <Globe size={16} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-lg text-white tracking-tight">Sphere</span>
                </div>

                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors">
                            <Plus size={20} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-white/10 text-white glass-card shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-display text-xl tracking-tight">New Conversation</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium tracking-wide">
                                Create a direct message, group chat, or a new space.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2 mb-4 bg-white/[0.02] border border-white/5 p-1 rounded-xl glass-card">
                            {[
                                { key: 'dm' as const, label: 'Direct', icon: MessageSquare },
                                { key: 'group' as const, label: 'Group', icon: Users },
                                { key: 'space' as const, label: 'Space', icon: Globe },
                            ].map(({ key, label, icon: Icon }) => (
                                <Button
                                    key={key}
                                    variant="ghost"
                                    size="sm"
                                    className={`flex-1 rounded-lg transition-all ${createType === key ? 'bg-white/[0.08] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'}`}
                                    onClick={() => setCreateType(key)}
                                >
                                    <Icon size={14} className="mr-2" /> {label}
                                </Button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {createType === 'dm' && (
                                <div>
                                    <Input
                                        type="text"
                                        placeholder="Search users..."
                                        className="bg-white/[0.03] border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300"
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                    />
                                    <ScrollArea className="max-h-60 mt-4 rounded-xl">
                                        {searchResults.map(u => (
                                            <Button
                                                key={u.id}
                                                variant="ghost"
                                                className="w-full justify-start py-6 hover:bg-white/[0.05] rounded-xl transition-colors mb-1"
                                                onClick={() => handleCreateDM(u)}
                                            >
                                                <Avatar className="h-8 w-8 mr-3 border border-white/10 bg-white/[0.02]">
                                                    <AvatarFallback className="text-white text-xs">{u.display_name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{u.display_name}</p>
                                                    <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                                </div>
                                            </Button>
                                        ))}
                                    </ScrollArea>
                                </div>
                            )}

                            {createType === 'group' && (
                                <div className="space-y-3">
                                    <Input
                                        type="text"
                                        placeholder="Group name"
                                        value={groupTitle}
                                        onChange={(e) => setGroupTitle(e.target.value)}
                                        className="bg-white/[0.03] border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Search users to add..."
                                        className="bg-white/[0.03] border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300"
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                    />
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map(u => (
                                                <span key={u.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] border border-white/10 text-neutral-300 backdrop-blur-md">
                                                    {u.display_name}
                                                    <button onClick={() => setSelectedUsers(prev => prev.filter(p => p.id !== u.id))} className="ml-1 text-neutral-500 hover:text-white transition-colors">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <ScrollArea className="max-h-40 rounded-xl">
                                        {searchResults.filter(u => !selectedUsers.find(s => s.id === u.id)).map(u => (
                                            <Button
                                                key={u.id}
                                                variant="ghost"
                                                className="w-full justify-start hover:bg-white/[0.05] rounded-xl mb-1"
                                                onClick={() => setSelectedUsers(prev => [...prev, u])}
                                            >
                                                <Avatar className="h-6 w-6 mr-3 border border-white/10 bg-white/[0.02]">
                                                    <AvatarFallback className="text-[10px] text-white">{u.display_name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-neutral-300 truncate">{u.display_name}</span>
                                            </Button>
                                        ))}
                                    </ScrollArea>
                                    <button onClick={handleCreateGroup} disabled={!groupTitle || selectedUsers.length === 0} className="w-full mono-gradient-btn text-black font-bold py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.99] transition-all duration-300 mt-4 text-xs uppercase tracking-widest disabled:opacity-50">
                                        Create Group
                                    </button>
                                </div>
                            )}

                            {createType === 'space' && (
                                <div className="space-y-3">
                                    <Input
                                        type="text"
                                        placeholder="Space name"
                                        value={spaceName}
                                        onChange={(e) => setSpaceName(e.target.value)}
                                        className="bg-white/[0.03] border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300"
                                    />
                                    <textarea
                                        placeholder="Description (optional)"
                                        value={spaceDesc}
                                        onChange={(e) => setSpaceDesc(e.target.value)}
                                        className="flex min-h-[100px] w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300 resize-none"
                                    />
                                    <button onClick={handleCreateSpace} disabled={!spaceName} className="w-full mono-gradient-btn text-black font-bold py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.99] transition-all duration-300 mt-4 text-xs uppercase tracking-widest disabled:opacity-50">
                                        Create Space
                                    </button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabs */}
            <div className="flex p-3 gap-2 border-b border-white/10 bg-black/20 backdrop-blur-md">
                <button
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${sidebarTab === 'conversations' ? 'bg-white/[0.08] text-white shadow-sm border border-white/5' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'}`}
                    onClick={() => setSidebarTab('conversations')}
                >
                    <MessageSquare size={14} className="mr-2 opacity-70" /> CHATS
                </button>
                <button
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${sidebarTab === 'spaces' ? 'bg-white/[0.08] text-white shadow-sm border border-white/5' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'}`}
                    onClick={() => setSidebarTab('spaces')}
                >
                    <Globe size={14} className="mr-2 opacity-70" /> SPACES
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none input-glow transition-all duration-300"
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 px-3">
                {sidebarTab === 'conversations' ? (
                    filteredConversations.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <MessageSquare size={32} className="mx-auto mb-4 text-neutral-600" />
                            <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">No conversations</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 pb-4">
                            {filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left border ${activeConversation?.id === conv.id ? 'bg-white/[0.08] border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)]' : 'border-transparent hover:bg-white/[0.04]'}`}
                                >
                                    <Avatar className="h-10 w-10 border border-white/10 bg-black">
                                        <AvatarImage src={conv.avatar_url || ''} />
                                        <AvatarFallback className="text-white font-medium text-sm">
                                            {getConversationName(conv).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-500">{getConversationIcon(conv.type)}</span>
                                            <span className={`font-semibold text-sm truncate ${activeConversation?.id === conv.id ? 'text-white' : 'text-neutral-300'}`}>{getConversationName(conv)}</span>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 truncate mt-1 tracking-wide">
                                            {conv.participants?.length || 0} MEMBERS
                                        </p>
                                    </div>
                                    {activeConversation?.id === conv.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )
                ) : (
                    /* Spaces tab */
                    spaces.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <Globe size={32} className="mx-auto mb-4 text-neutral-600" />
                            <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">No spaces</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 pb-4">
                            {spaces.map(space => (
                                <button
                                    key={space.id}
                                    onClick={async () => {
                                        setActiveSpace(space);
                                        await loadSpace(space.id);
                                    }}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left border ${activeSpace?.id === space.id ? 'bg-white/[0.08] border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)]' : 'border-transparent hover:bg-white/[0.04]'}`}
                                >
                                    <Avatar className="h-10 w-10 border border-white/10 bg-white/[0.02]">
                                        <AvatarFallback className="text-white font-medium">
                                            {space.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <span className={`font-semibold text-sm truncate block ${activeSpace?.id === space.id ? 'text-white' : 'text-neutral-300'}`}>{space.name}</span>
                                        {space.description && (
                                            <p className="text-[11px] text-neutral-500 truncate mt-1 tracking-wide">{space.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </ScrollArea>

            {/* User footer */}
            <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-colors">
                    <Avatar className="h-9 w-9 border border-white/10 bg-[#0a0a0a]">
                        <AvatarImage src={user?.avatar_url || ''} />
                        <AvatarFallback className="text-white text-sm font-semibold">{user?.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate leading-none mb-1">{user?.display_name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">{user?.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-colors">
                        <LogOut size={16} />
                    </Button>
                </div>
            </div>
        </aside>
    );
}
