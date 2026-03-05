'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useCallStore } from '@/stores/callStore';
import { api } from '@/lib/api';
import { Account, Message } from '@/types';
import {
    Users, Pin, Paperclip, Phone, Shield, UserMinus, Ban,
    VolumeX, AlertTriangle, PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function RightPanel() {
    const { user } = useAuthStore();
    const { activeConversation } = useConversationStore();
    const { activeCall, isInCall } = useCallStore();

    const [activeTab, setActiveTab] = useState<'members' | 'pinned' | 'files'>('members');
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');

    const participants = activeConversation?.participants || [];
    const userRole = participants.find((p: Account) => p.id === user?.id)?.role;
    const isModerator = userRole === 'owner' || userRole === 'moderator';

    useEffect(() => {
        if (activeTab === 'pinned' && activeConversation?.id) {
            api.getPinnedMessages(activeConversation.id)
                .then(data => setPinnedMessages(data || []))
                .catch(() => setPinnedMessages([]));
        }
    }, [activeTab, activeConversation?.id]);

    const handleReport = async () => {
        if (!reportMessageId || !reportReason) return;
        try {
            await api.reportMessage(reportMessageId, reportReason);
            setShowReportModal(false);
            setReportReason('');
            setReportMessageId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMute = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.muteUser(activeConversation.id, userId, 60);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBan = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.banUser(activeConversation.id, userId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.removeUser(activeConversation.id, userId);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <aside className="w-80 bg-transparent border-l border-white/10 flex flex-col h-full shadow-lg z-10 glass-card">
            {/* Header */}
            <div className="p-5 border-b border-white/10 glass-card">
                <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Details</h3>

                {/* Call status */}
                {isInCall && activeCall && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-white/[0.05] border border-white/20 shadow-inner">
                        <div className="bg-white text-black p-1.5 rounded-full">
                            <PhoneCall size={14} className="animate-pulse" />
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase text-white">Call Active</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5">
                    {[
                        { key: 'members', icon: Users, count: participants.length },
                        { key: 'pinned', icon: Pin },
                        { key: 'files', icon: Paperclip }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex flex-1 items-center justify-center py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-500 hover:text-white hover:bg-white/[0.05]'}`}
                        >
                            <tab.icon size={14} className={tab.count ? 'mr-1.5' : ''} />
                            {tab.count !== undefined && tab.count}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
                {activeTab === 'members' && (
                    <div className="space-y-1">
                        {participants.map((member: Account) => (
                            <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all group">
                                <Avatar className="h-8 w-8 border border-white/10 bg-black">
                                    <AvatarImage src={member.avatar_url || ''} />
                                    <AvatarFallback className="text-white text-xs font-semibold">
                                        {member.display_name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold text-white truncate leading-none mb-1">{member.display_name}</span>
                                        {member.id === user?.id && <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">You</span>}
                                    </div>
                                    <span className={`text-[9px] uppercase tracking-widest font-bold ${member.role === 'owner' ? 'text-white' : member.role === 'moderator' ? 'text-neutral-300' : 'text-neutral-500'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>

                                {/* Mod actions */}
                                {isModerator && member.id !== user?.id && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-white/10 text-neutral-400">
                                                <Shield size={14} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0a] border border-white/10 glass-card text-white">
                                            <DropdownMenuLabel className="text-[10px] tracking-widest font-bold text-neutral-500 uppercase">Moderation</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem onClick={() => handleMute(member.id)} className="text-neutral-300 focus:bg-white/10 focus:text-white cursor-pointer">
                                                <VolumeX size={14} className="mr-2" /> Mute (1h)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-neutral-300 focus:bg-white/10 focus:text-white cursor-pointer">
                                                <UserMinus size={14} className="mr-2" /> Remove
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem onClick={() => handleBan(member.id)} className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer">
                                                <Ban size={14} className="mr-2" /> Ban User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pinned' && (
                    <div className="space-y-3">
                        {pinnedMessages.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Pin size={18} className="text-neutral-500" />
                                </div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">No pinned messages</p>
                            </div>
                        ) : (
                            pinnedMessages.map(pin => (
                                <div key={pin.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-white/20" />
                                    <div className="flex justify-between items-start mb-2 pl-1">
                                        <span className="text-xs font-semibold text-white">{pin.message?.author?.display_name}</span>
                                        <Pin size={12} className="text-neutral-400" />
                                    </div>
                                    <p className="text-[13px] text-neutral-400 pl-1 leading-relaxed">
                                        {pin.message?.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <Paperclip size={18} className="text-neutral-500" />
                        </div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">No shared files</p>
                    </div>
                )}
            </ScrollArea>
        </aside>
    );
}
