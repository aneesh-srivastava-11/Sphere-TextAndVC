'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMessageStore } from '@/stores/messageStore';
import { useCallStore } from '@/stores/callStore';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { Message, Account } from '@/types';
import ThreadPanel from '@/components/message/ThreadPanel';
import {
    Send, Paperclip, Smile, Phone, Hash, Users, MessageSquare,
    Edit3, Trash2, Pin, Reply, X, Loader2, ArrowDown,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '✅', '👏', '🚀', '💡', '⭐', '🤔', '😮', '😢', '😡'];

export default function CenterPanel() {
    const { user } = useAuthStore();
    const { activeConversation } = useConversationStore();
    const { messages, loading, fetchMessages, activeThreadMessageId } = useMessageStore();
    const { startCall } = useCallStore();

    const [input, setInput] = useState('');
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (activeConversation?.id) {
            fetchMessages(activeConversation.id);

            const socket = getSocket();
            if (socket) {
                socket.emit('join_conversation', activeConversation.id);
                return () => {
                    socket.emit('leave_conversation', activeConversation.id);
                };
            }
        }
    }, [activeConversation?.id, fetchMessages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Scroll tracking
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollDown(distFromBottom > 200);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = () => {
        if (!input.trim() || !activeConversation) return;

        const socket = getSocket();
        if (editingMessage) {
            socket?.emit('edit_message', {
                messageId: editingMessage.id,
                content: input,
                conversationId: activeConversation.id,
            });
            setEditingMessage(null);
        } else {
            socket?.emit('send_message', {
                conversationId: activeConversation.id,
                content: input,
            });
        }

        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }

        // Typing indicator
        if (activeConversation) {
            const socket = getSocket();
            socket?.emit('typing_start', { conversationId: activeConversation.id });
        }
    };

    const handleReaction = (messageId: string, emoji: string) => {
        const socket = getSocket();
        socket?.emit('toggle_reaction', {
            messageId,
            emoji,
            conversationId: activeConversation?.id,
        });
        setShowEmojiPicker(null);
    };

    const handleDelete = (messageId: string) => {
        const socket = getSocket();
        socket?.emit('delete_message', {
            messageId,
            conversationId: activeConversation?.id,
        });
    };

    const handlePin = async (messageId: string) => {
        if (!activeConversation) return;
        try {
            await api.pinMessage(activeConversation.id, messageId);
        } catch (err) {
            console.error(err);
        }
    };

    const openThread = (messageId: string) => {
        useMessageStore.getState().openThread(messageId);
    };

    const getConversationTitle = () => {
        if (!activeConversation) return '';
        if (activeConversation.title) return activeConversation.title;
        if (activeConversation.type === 'direct') {
            const other = activeConversation.participants?.find((p: Account) => p.id !== user?.id);
            return other?.display_name || 'Direct Message';
        }
        return 'Conversation';
    };

    const getTypeIcon = () => {
        switch (activeConversation?.type) {
            case 'direct': return <MessageSquare size={16} />;
            case 'group': return <Users size={16} />;
            case 'topic': return <Hash size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    const formatMessageTime = (date: string) => {
        const d = new Date(date);
        return format(d, 'h:mm a');
    };

    const formatDateHeader = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) return 'Today';
        if (isYesterday(d)) return 'Yesterday';
        return format(d, 'MMMM d, yyyy');
    };

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>((groups, msg) => {
        const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.date === date) {
            lastGroup.messages.push(msg);
        } else {
            groups.push({ date, messages: [msg] });
        }
        return groups;
    }, []);

    if (!activeConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-hidden z-10 glass-card">
                <div className="text-center animate-fade-in relative z-10">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-white/[0.03] border border-white/10 shadow-2xl glass-card">
                        <MessageSquare size={32} className="text-white opacity-80" />
                    </div>
                    <h2 className="text-3xl font-display font-bold mb-3 text-white tracking-tight">Select a conversation</h2>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.2em] font-bold max-w-sm mx-auto">
                        Connect with the ecosystem
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-transparent relative z-10 glass-card">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 glass-card border-b border-white/10 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shadow-lg">
                        {getTypeIcon()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-white tracking-wide">{getConversationTitle()}</h2>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                            {activeConversation.participants?.length || 0} members
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => startCall(activeConversation.id)} className="rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white text-neutral-400 glass-card">
                        <Phone size={16} />
                    </Button>
                </div>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4" onScrollCapture={handleScroll}>
                {loading ? (
                    <div className="flex items-center justify-center h-full pt-10">
                        <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {groupedMessages.map(group => (
                            <div key={group.date} className="pb-4">
                                {/* Date separator */}
                                <div className="flex items-center justify-center my-8 sticky top-2 z-10">
                                    <span className="px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-neutral-400 shadow-xl">
                                        {formatDateHeader(group.messages[0].created_at)}
                                    </span>
                                </div>

                                {group.messages.map((msg, i) => {
                                    const isOwn = msg.author_id === user?.id;
                                    const threadCount = msg.threads?.[0]?.count || 0;
                                    const reactionGroups = (msg.reactions || []).reduce<Record<string, { emoji: string; count: number; users: string[] }>>((acc, r) => {
                                        if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
                                        acc[r.emoji].count++;
                                        acc[r.emoji].users.push(r.user_id);
                                        return acc;
                                    }, {});

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`group flex gap-4 py-3 px-4 -mx-4 rounded-2xl transition-all duration-300 ${hoveredMessage === msg.id ? 'bg-white/[0.02] border focus:border-white/10' : 'border border-transparent'}`}
                                            onMouseEnter={() => setHoveredMessage(msg.id)}
                                            onMouseLeave={() => { setHoveredMessage(null); setShowEmojiPicker(null); }}
                                        >
                                            <Avatar className="h-10 w-10 mt-1 flex-shrink-0 border border-white/10 bg-black shadow-lg">
                                                <AvatarImage src={msg.author?.avatar_url || ''} />
                                                <AvatarFallback className="text-white font-semibold text-sm">
                                                    {msg.author?.display_name?.charAt(0).toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <div className="flex items-baseline gap-3 mb-1.5">
                                                    <span className={`font-semibold text-[15px] ${msg._blocked ? 'text-neutral-600' : 'text-white'}`}>
                                                        {msg.author?.display_name || 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                                                        {formatMessageTime(msg.created_at)}
                                                        {msg.edited_at && <span className="ml-2 font-medium">(edited)</span>}
                                                    </span>
                                                </div>

                                                <div className={`text-[15px] whitespace-pre-wrap break-words leading-relaxed ${msg._blocked ? 'text-neutral-600 italic' : 'text-neutral-300'}`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: msg.content
                                                            .replace(/@(\w+)/g, '<span class="text-white bg-white/10 px-1 rounded-md font-medium border border-white/20">@$1</span>')
                                                            .replace(/#(\w+)/g, '<span class="text-white font-semibold underline decoration-white/30 underline-offset-2">#$1</span>')
                                                    }}
                                                />

                                                {/* File attachments */}
                                                {msg.file_attachments && msg.file_attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {msg.file_attachments.map(file => (
                                                            <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all text-neutral-300">
                                                                <Paperclip size={14} className="text-neutral-500" />
                                                                {file.file_name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Meta Row: Reactions & Replies */}
                                                {(Object.keys(reactionGroups).length > 0 || threadCount > 0) && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                                        {Object.values(reactionGroups).map(r => (
                                                            <button
                                                                key={r.emoji}
                                                                onClick={() => handleReaction(msg.id, r.emoji)}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${r.users.includes(user?.id || '')
                                                                        ? 'bg-white/10 border border-white/20 text-white'
                                                                        : 'bg-white/[0.03] border border-white/10 text-neutral-400 hover:bg-white/[0.08]'
                                                                    }`}
                                                            >
                                                                <span>{r.emoji}</span>
                                                                <span className="font-bold">{r.count}</span>
                                                            </button>
                                                        ))}

                                                        {threadCount > 0 && (
                                                            <button onClick={() => openThread(msg.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] rounded-full text-[11px] font-bold uppercase tracking-wide text-white transition-colors border border-white/10">
                                                                <Reply size={13} />
                                                                {threadCount} {threadCount === 1 ? 'REPLY' : 'REPLIES'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons (on hover) */}
                                            {hoveredMessage === msg.id && !msg._blocked && (
                                                <div className="absolute right-6 -top-4 flex items-center bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                    <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" title="React">
                                                        <Smile size={16} />
                                                    </button>
                                                    <button onClick={() => openThread(msg.id)}
                                                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" title="Reply in thread">
                                                        <Reply size={16} />
                                                    </button>
                                                    {isOwn && (
                                                        <>
                                                            <button onClick={() => { setEditingMessage(msg); setInput(msg.content); }}
                                                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(msg.id)}
                                                                className="p-2 text-neutral-500 hover:text-white hover:bg-[#ff3333]/20 hover:text-[#ff3333] transition-colors" title="Delete">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handlePin(msg.id)}
                                                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" title="Pin">
                                                        <Pin size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Emoji picker */}
                                            {showEmojiPicker === msg.id && (
                                                <div className="absolute right-0 top-10 p-3 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl z-20 w-[280px] glass-card">
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {EMOJI_LIST.map(emoji => (
                                                            <button key={emoji} className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors" onClick={() => handleReaction(msg.id, emoji)}>
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </ScrollArea>

            {showScrollDown && (
                <button onClick={scrollToBottom}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white rounded-full p-2.5 shadow-2xl z-10 border border-white/20 transition-all">
                    <ArrowDown size={18} />
                </button>
            )}

            {/* Input */}
            <div className="p-6 bg-transparent border-t border-white/10 glass-card">
                <div className="max-w-4xl mx-auto relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-white/20 focus-within:bg-white/[0.05] transition-all duration-300 shadow-lg input-glow">
                    {editingMessage && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border-b border-white/10 rounded-t-2xl text-[11px] font-bold tracking-widest uppercase">
                            <Edit3 size={12} className="text-white" />
                            <span className="text-neutral-400">Editing message</span>
                            <button onClick={() => { setEditingMessage(null); setInput(''); }} className="ml-auto text-neutral-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-end gap-2 p-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="TRANSMIT MESSAGE..."
                            className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-neutral-600 placeholder:text-xs placeholder:tracking-widest placeholder:uppercase placeholder:font-bold resize-none p-3 max-h-[150px] min-h-[48px] outline-none"
                            rows={1}
                        />
                        <div className="flex items-center gap-1 p-1">
                            <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-white hover:bg-white/10 rounded-xl transition-all h-10 w-10">
                                <Paperclip size={18} />
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                size="icon"
                                className={`rounded-xl h-10 w-10 transition-all duration-300 ${input.trim() ? 'mono-gradient-btn text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-neutral-600'}`}
                            >
                                <Send size={16} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thread panel */}
            {activeThreadMessageId && <ThreadPanel />}
        </div>
    );
}
