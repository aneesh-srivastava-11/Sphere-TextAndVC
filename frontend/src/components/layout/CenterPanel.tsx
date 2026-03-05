'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMessageStore } from '@/stores/messageStore';
import { useCallStore } from '@/stores/callStore';
import { useNicknameStore } from '@/stores/nicknameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { Message, Account } from '@/types';
import ThreadPanel from '@/components/message/ThreadPanel';
import {
    Send, Paperclip, Smile, Phone, Hash, Users, MessageSquare,
    Edit3, Trash2, Pin, Reply, X, Loader2, ArrowDown, Menu, Image, Video, FileText, Volume2,
} from 'lucide-react';
import { FormEvent } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '✅', '👏', '🚀', '💡', '⭐', '🤔', '😮', '😢', '😡'];

export default function CenterPanel() {
    const { user } = useAuthStore();
    const { activeConversation, setSidebarOpen } = useConversationStore();
    const { messages, loading, fetchMessages, activeThreadMessageId } = useMessageStore();
    const { startCall } = useCallStore();
    const { getDisplayName } = useNicknameStore();
    const isMobile = useIsMobile();

    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeConversation?.id) {
            fetchMessages(activeConversation.id);
            const socket = getSocket();
            if (socket) {
                socket.emit('join_conversation', activeConversation.id);
                return () => { socket.emit('leave_conversation', activeConversation.id); };
            }
        }
    }, [activeConversation?.id, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    }, []);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleSend = async () => {
        if ((!input.trim() && !attachment) || !activeConversation || sending || uploadingAttachment) return;

        setSending(true);
        try {
            let uploadedAttachmentData = undefined;

            if (attachment) {
                setUploadingAttachment(true);
                const url = await api.uploadFile(attachment, 'attachments');
                uploadedAttachmentData = {
                    url,
                    name: attachment.name,
                    size: attachment.size,
                    type: attachment.type,
                };
            }

            if (editingMessage) {
                await api.editMessage(editingMessage.id, input.trim());
                useMessageStore.getState().updateMessage({ ...editingMessage, content: input.trim() });
                setEditingMessage(null);
            } else {
                const newMsg = await api.sendMessage(activeConversation.id, input.trim(), uploadedAttachmentData);
                useMessageStore.getState().addMessage(newMsg);
            }
            setInput('');
            setAttachment(null);
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message or upload file.');
        } finally {
            setSending(false);
            setUploadingAttachment(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                alert('File is too large. Maximum size is 20MB.');
                return;
            }
            setAttachment(file);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
        if (activeConversation) getSocket()?.emit('typing_start', { conversationId: activeConversation.id });
    };

    const handleReaction = (messageId: string, emoji: string) => {
        getSocket()?.emit('toggle_reaction', { messageId, emoji, conversationId: activeConversation?.id });
        setShowEmojiPicker(null);
    };

    const handleDelete = (messageId: string) => {
        getSocket()?.emit('delete_message', { messageId, conversationId: activeConversation?.id });
    };

    const handlePin = async (messageId: string) => {
        if (!activeConversation) return;
        try { await api.pinMessage(activeConversation.id, messageId); } catch { }
    };

    const openThread = (messageId: string) => useMessageStore.getState().openThread(messageId);

    const getTitle = () => {
        if (!activeConversation) return '';
        if (activeConversation.title) return activeConversation.title;
        if (activeConversation.type === 'direct') {
            const other = activeConversation.participants?.find((p: Account) => p.id !== user?.id);
            if (other) {
                return getDisplayName(other.id, other.display_name);
            }
            return 'Direct Message';
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

    const fmtTime = (d: string) => format(new Date(d), 'h:mm a');
    const fmtDate = (d: string) => {
        const dt = new Date(d);
        if (isToday(dt)) return 'Today';
        if (isYesterday(dt)) return 'Yesterday';
        return format(dt, 'MMMM d, yyyy');
    };

    const grouped = messages.reduce<{ date: string; messages: Message[] }[]>((g, msg) => {
        const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
        const last = g[g.length - 1];
        if (last?.date === date) last.messages.push(msg);
        else g.push({ date, messages: [msg] });
        return g;
    }, []);

    // Empty state
    if (!activeConversation) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', position: 'relative', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(20px)',
                    }}>
                        <MessageSquare size={28} style={{ opacity: 0.8 }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>Select a conversation</h2>
                    <p style={{ fontSize: 10, color: '#525252', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Connect with the ecosystem</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
            {/* Header */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {isMobile && (
                        <button onClick={() => setSidebarOpen(true)}
                            style={{
                                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', cursor: 'pointer',
                            }}
                        >
                            <Menu size={18} />
                        </button>
                    )}
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {getTypeIcon()}
                    </div>
                    <div>
                        <h2 style={{ fontWeight: 600, fontSize: 15, letterSpacing: '0.02em' }}>{getTitle()}</h2>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#525252', textTransform: 'uppercase' }}>
                            {activeConversation.participants?.length || 0} members
                        </p>
                    </div>
                </div>
                <button onClick={() => startCall(activeConversation.id)}
                    style={{
                        width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#737373', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                    <Phone size={16} />
                </button>
            </header>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }} onScroll={handleScroll}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: '#fff' }} />
                    </div>
                ) : (
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                        {grouped.map(group => (
                            <div key={group.date} style={{ paddingBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px 0', position: 'sticky', top: 8, zIndex: 5 }}>
                                    <span style={{
                                        padding: '6px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 20, color: '#737373',
                                    }}>
                                        {fmtDate(group.messages[0].created_at)}
                                    </span>
                                </div>

                                {group.messages.map(msg => {
                                    const isOwn = msg.author_id === user?.id;
                                    const threadCount = msg.threads?.[0]?.count || 0;
                                    const reactions = (msg.reactions || []).reduce<Record<string, { emoji: string; count: number; users: string[] }>>((a, r) => {
                                        if (!a[r.emoji]) a[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
                                        a[r.emoji].count++;
                                        a[r.emoji].users.push(r.user_id);
                                        return a;
                                    }, {});
                                    const isHovered = hoveredMessage === msg.id;

                                    return (
                                        <div key={msg.id}
                                            style={{
                                                display: 'flex', gap: 14, padding: isMobile ? '10px' : '10px 14px',
                                                marginLeft: isMobile ? 0 : -14, marginRight: isMobile ? 0 : -14,
                                                borderRadius: 16, transition: 'background 0.2s',
                                                background: isHovered ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                position: 'relative',
                                                flexDirection: isOwn ? 'row-reverse' : 'row',
                                            }}
                                            onMouseEnter={() => setHoveredMessage(msg.id)}
                                            onMouseLeave={() => { setHoveredMessage(null); setShowEmojiPicker(null); }}
                                        >
                                            {!isOwn && (
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 600,
                                                }}>
                                                    {msg.author?.display_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}

                                            <div style={{
                                                flex: 1, minWidth: 0,
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: isOwn ? 'flex-end' : 'flex-start'
                                            }}>
                                                {!isOwn && (
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                                        <span style={{ fontWeight: 600, fontSize: 14, color: msg._blocked ? '#404040' : '#fff' }}>
                                                            {getDisplayName ? getDisplayName(msg.author_id, msg.author?.display_name || 'Unknown') : (msg.author?.display_name || 'Unknown')}
                                                        </span>
                                                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#525252', textTransform: 'uppercase' }}>
                                                            {fmtTime(msg.created_at)}
                                                            {msg.edited_at && <span style={{ marginLeft: 6 }}>(edited)</span>}
                                                        </span>
                                                    </div>
                                                )}
                                                {isOwn && (
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#525252', textTransform: 'uppercase' }}>
                                                            {msg.edited_at && <span style={{ marginRight: 6 }}>(edited)</span>}
                                                            {fmtTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div style={{
                                                    fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
                                                    color: msg._blocked ? '#404040' : (isOwn ? '#fff' : '#d4d4d4'),
                                                    fontStyle: msg._blocked ? 'italic' : 'normal',
                                                    background: isOwn ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                    padding: isOwn ? '8px 14px' : '0',
                                                    borderRadius: isOwn ? '14px 14px 0 14px' : '0',
                                                    border: isOwn ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                                    textAlign: isOwn ? 'right' : 'left',
                                                    maxWidth: '85%',
                                                }}>
                                                    {msg.file_attachments && msg.file_attachments.map((file: any) => {
                                                        const type = file.mime_type.split('/')[0];
                                                        return (
                                                            <div key={file.id} style={{ marginBottom: msg.content ? 8 : 0, borderRadius: 8, overflow: 'hidden' }}>
                                                                {type === 'image' ? (
                                                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <img src={file.file_url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }} />
                                                                    </a>
                                                                ) : type === 'video' ? (
                                                                    <video src={file.file_url} controls style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                                                                ) : type === 'audio' ? (
                                                                    <audio src={file.file_url} controls style={{ maxWidth: '100%', width: 250 }} />
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                        <FileText size={24} color="#a3a3a3" />
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                                                                            <p style={{ margin: 0, fontSize: 10, color: '#737373' }}>{(file.file_size / 1024).toFixed(1)} KB</p>
                                                                        </div>
                                                                        <a href={file.file_url} download target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                                                                            Download
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {msg.content}
                                                </div>

                                                {/* Reactions & thread */}
                                                {(Object.keys(reactions).length > 0 || threadCount > 0) && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                                                        {Object.values(reactions).map(r => (
                                                            <button key={r.emoji} onClick={() => handleReaction(msg.id, r.emoji)}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                    padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                                    background: r.users.includes(user?.id || '') ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                                    border: `1px solid ${r.users.includes(user?.id || '') ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                                                    color: r.users.includes(user?.id || '') ? '#fff' : '#737373',
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                }}>
                                                                <span>{r.emoji}</span><span>{r.count}</span>
                                                            </button>
                                                        ))}
                                                        {threadCount > 0 && (
                                                            <button onClick={() => openThread(msg.id)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                                    padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                                                    letterSpacing: '0.05em', textTransform: 'uppercase',
                                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                                                    color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                                                                }}>
                                                                <Reply size={12} /> {threadCount} {threadCount === 1 ? 'REPLY' : 'REPLIES'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action toolbar */}
                                            {isHovered && !msg._blocked && (
                                                <div style={{
                                                    position: 'absolute', [isOwn ? 'left' : 'right']: 14, top: -12,
                                                    display: 'flex', alignItems: 'center', flexDirection: isOwn ? 'row-reverse' : 'row',
                                                    background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
                                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                                    overflow: 'hidden',
                                                }}>
                                                    {[
                                                        { icon: <Smile size={15} />, onClick: () => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id), title: 'React' },
                                                        { icon: <Reply size={15} />, onClick: () => openThread(msg.id), title: 'Reply' },
                                                        ...(isOwn ? [
                                                            { icon: <Edit3 size={15} />, onClick: () => { setEditingMessage(msg); setInput(msg.content); }, title: 'Edit' },
                                                            { icon: <Trash2 size={15} />, onClick: () => handleDelete(msg.id), title: 'Delete' },
                                                        ] : []),
                                                        { icon: <Pin size={15} />, onClick: () => handlePin(msg.id), title: 'Pin' },
                                                    ].map((a, i) => (
                                                        <button key={i} onClick={a.onClick} title={a.title}
                                                            style={{
                                                                padding: 8, color: '#525252', background: 'transparent',
                                                                border: 'none', cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', transition: 'all 0.15s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = '#525252'; e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            {a.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Emoji picker */}
                                            {showEmojiPicker === msg.id && (
                                                <div style={{
                                                    position: 'absolute', [isOwn ? 'left' : 'right']: 0, top: 32, padding: 10, borderRadius: 16,
                                                    background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                                                    backdropFilter: 'blur(20px)', zIndex: 20, width: 260,
                                                    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4,
                                                }}>
                                                    {EMOJI_LIST.map(emoji => (
                                                        <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                                                            style={{
                                                                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: 16, background: 'transparent', border: 'none', borderRadius: 6,
                                                                cursor: 'pointer', transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} style={{ height: 16 }} />
                    </div>
                )}
            </div>

            {/* Scroll to bottom */}
            {showScrollDown && (
                <button onClick={scrollToBottom}
                    style={{
                        position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', zIndex: 10,
                    }}>
                    <ArrowDown size={18} />
                </button>
            )}

            {/* Input */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
                <div style={{
                    maxWidth: 800, margin: '0 auto', borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                }}>
                    {editingMessage && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                            background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px 16px 0 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                        }}>
                            <Edit3 size={12} />
                            <span style={{ color: '#737373' }}>Editing message</span>
                            <button onClick={() => { setEditingMessage(null); setInput(''); }}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#525252', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {attachment && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: editingMessage ? '0' : '16px 16px 0 0',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {attachment.type.startsWith('image/') ? <Image size={16} color="#3b82f6" /> :
                                    attachment.type.startsWith('video/') ? <Video size={16} color="#ef4444" /> :
                                        attachment.type.startsWith('audio/') ? <Volume2 size={16} color="#10b981" /> :
                                            <FileText size={16} color="#8b5cf6" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</p>
                                <p style={{ fontSize: 11, color: '#737373', margin: 0 }}>{(attachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => setAttachment(null)}
                                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', display: 'flex', padding: 4 }}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 8 }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={attachment ? "Add a message..." : "TRANSMIT MESSAGE..."}
                            style={{
                                flex: 1, background: 'transparent', border: 'none', color: '#fff',
                                fontSize: 13, resize: 'none', padding: '10px 12px',
                                minHeight: 44, maxHeight: 150, outline: 'none',
                                fontFamily: 'inherit', letterSpacing: '0.02em',
                            }}
                            rows={1}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4 }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: attachment ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: attachment ? '#fff' : '#525252', cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = attachment ? '#fff' : '#525252'; }}
                            >
                                <Paperclip size={18} />
                            </button>
                            <button onClick={handleSend} disabled={(!input.trim() && !attachment) || sending || uploadingAttachment}
                                style={{
                                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', cursor: (input.trim() || attachment) ? 'pointer' : 'default',
                                    background: (input.trim() || attachment) ? 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)' : 'rgba(255,255,255,0.05)',
                                    color: (input.trim() || attachment) ? '#000' : '#404040',
                                    transition: 'all 0.3s',
                                    opacity: sending || uploadingAttachment ? 0.7 : 1
                                }}>
                                {(sending || uploadingAttachment) ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {activeThreadMessageId && <ThreadPanel />}
        </div>
    );
}
