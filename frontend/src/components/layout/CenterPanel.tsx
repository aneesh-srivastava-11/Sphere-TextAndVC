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
    Send, Paperclip, Smile, Phone, MoreVertical, Hash, Users, MessageSquare,
    Edit3, Trash2, Pin, Reply, AtSign, X, Loader2, ImageIcon, ArrowDown,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

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
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowScrollDown(distFromBottom > 200);
        }
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
            case 'direct': return <MessageSquare size={18} />;
            case 'group': return <Users size={18} />;
            case 'topic': return <Hash size={18} />;
            default: return <MessageSquare size={18} />;
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
            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                        <MessageSquare size={36} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Welcome to Sphere</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Select a conversation or start a new one
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="glass-panel-strong flex items-center justify-between px-5 py-3 animate-fade-in"
                style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--accent)' }}>{getTypeIcon()}</span>
                    <div>
                        <h2 className="font-semibold text-base">{getConversationTitle()}</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {activeConversation.participants?.length || 0} members
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => startCall(activeConversation.id)} className="btn btn-icon btn-ghost" title="Start call">
                        <Phone size={18} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div ref={scrollContainerRef} onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-5 py-4 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    </div>
                ) : (
                    groupedMessages.map(group => (
                        <div key={group.date}>
                            {/* Date separator */}
                            <div className="flex items-center my-6">
                                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                <span className="px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                    {formatDateHeader(group.messages[0].created_at)}
                                </span>
                                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
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
                                        className="group flex gap-3 py-1.5 px-3 mx-[-12px] rounded-xl transition-colors duration-100 animate-fade-in"
                                        style={{ background: hoveredMessage === msg.id ? 'var(--bg-secondary)' : 'transparent' }}
                                        onMouseEnter={() => setHoveredMessage(msg.id)}
                                        onMouseLeave={() => { setHoveredMessage(null); setShowEmojiPicker(null); }}
                                    >
                                        {/* Avatar */}
                                        <div className="avatar avatar-sm mt-0.5 flex-shrink-0">
                                            {msg.author?.avatar_url ? (
                                                <img src={msg.author.avatar_url} alt="" />
                                            ) : (
                                                msg.author?.display_name?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold text-sm" style={{ color: msg._blocked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                                    {msg.author?.display_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {formatMessageTime(msg.created_at)}
                                                    {msg.edited_at && <span className="ml-1">(edited)</span>}
                                                </span>
                                            </div>

                                            <div className="text-sm mt-0.5 whitespace-pre-wrap break-words"
                                                style={{ color: msg._blocked ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: '1.5' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: msg.content
                                                        .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
                                                        .replace(/#(\w+)/g, '<span class="tag">#$1</span>')
                                                }}
                                            />

                                            {/* File attachments */}
                                            {msg.file_attachments && msg.file_attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {msg.file_attachments.map(file => (
                                                        <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer"
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                                                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                                            <Paperclip size={14} />
                                                            {file.file_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reactions */}
                                            {Object.keys(reactionGroups).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {Object.values(reactionGroups).map(r => (
                                                        <button
                                                            key={r.emoji}
                                                            onClick={() => handleReaction(msg.id, r.emoji)}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors"
                                                            style={{
                                                                background: r.users.includes(user?.id || '') ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                                                                border: `1px solid ${r.users.includes(user?.id || '') ? 'var(--accent)' : 'var(--border-color)'}`,
                                                            }}
                                                        >
                                                            {r.emoji} {r.count}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Thread count */}
                                            {threadCount > 0 && (
                                                <button onClick={() => openThread(msg.id)}
                                                    className="flex items-center gap-1.5 mt-2 text-xs font-medium"
                                                    style={{ color: 'var(--accent)' }}>
                                                    <Reply size={14} />
                                                    {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Action buttons (on hover) */}
                                        {hoveredMessage === msg.id && !msg._blocked && (
                                            <div className="flex items-start gap-0.5 flex-shrink-0 animate-fade-in">
                                                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                                    className="btn btn-icon btn-ghost" style={{ padding: '0.25rem' }} title="React">
                                                    <Smile size={16} />
                                                </button>
                                                <button onClick={() => openThread(msg.id)}
                                                    className="btn btn-icon btn-ghost" style={{ padding: '0.25rem' }} title="Reply in thread">
                                                    <Reply size={16} />
                                                </button>
                                                {isOwn && (
                                                    <>
                                                        <button onClick={() => { setEditingMessage(msg); setInput(msg.content); }}
                                                            className="btn btn-icon btn-ghost" style={{ padding: '0.25rem' }} title="Edit">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(msg.id)}
                                                            className="btn btn-icon btn-ghost" style={{ padding: '0.25rem', color: 'var(--danger)' }} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handlePin(msg.id)}
                                                    className="btn btn-icon btn-ghost" style={{ padding: '0.25rem' }} title="Pin">
                                                    <Pin size={16} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Emoji picker */}
                                        {showEmojiPicker === msg.id && (
                                            <div className="absolute right-8 mt-8 p-2 rounded-xl z-20 glass-panel-strong animate-fade-in"
                                                style={{ width: '280px' }}>
                                                <div className="emoji-grid">
                                                    {EMOJI_LIST.map(emoji => (
                                                        <button key={emoji} className="emoji-btn" onClick={() => handleReaction(msg.id, emoji)}>
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
                    ))
                )}
                <div ref={messagesEndRef} />

                {showScrollDown && (
                    <button onClick={scrollToBottom}
                        className="fixed bottom-28 right-1/2 translate-x-1/2 btn btn-primary btn-icon shadow-lg z-10"
                        style={{ borderRadius: '50%', padding: '0.75rem' }}>
                        <ArrowDown size={16} />
                    </button>
                )}
            </div>

            {/* Input */}
            <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                {editingMessage && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-glow)' }}>
                        <Edit3 size={14} style={{ color: 'var(--accent)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Editing message</span>
                        <button onClick={() => { setEditingMessage(null); setInput(''); }} className="ml-auto">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="input resize-none"
                            rows={1}
                            style={{
                                paddingRight: '3rem',
                                minHeight: '44px',
                                maxHeight: '120px',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="btn btn-primary btn-icon"
                        style={{ height: '44px', width: '44px', borderRadius: '0.75rem', opacity: input.trim() ? 1 : 0.5 }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Thread panel */}
            {activeThreadMessageId && <ThreadPanel />}
        </div>
    );
}
