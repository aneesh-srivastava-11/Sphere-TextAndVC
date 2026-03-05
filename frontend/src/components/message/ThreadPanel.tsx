'use client';

import { useState, useRef, useEffect } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { getSocket } from '@/lib/socket';
import { ThreadReply } from '@/types';
import { X, Send, Reply } from 'lucide-react';
import { format } from 'date-fns';

export default function ThreadPanel() {
    const { user } = useAuthStore();
    const { activeConversation } = useConversationStore();
    const { activeThreadMessageId, threadMessages, messages, closeThread } = useMessageStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const parentMessage = messages.find(m => m.id === activeThreadMessageId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadMessages]);

    const handleSend = () => {
        if (!input.trim() || !activeThreadMessageId || !activeConversation) return;

        const socket = getSocket();
        socket?.emit('thread_reply', {
            parentMessageId: activeThreadMessageId,
            content: input,
            conversationId: activeConversation.id,
        });

        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!activeThreadMessageId) return null;

    return (
        <div
            style={{
                position: 'fixed',
                right: 0,
                top: 0,
                height: '100%',
                width: 380,
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 40,
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#fff',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Reply size={16} style={{ color: '#fff' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#737373' }}>
                        Thread
                    </span>
                </div>
                <button
                    onClick={closeThread}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#737373',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Parent message */}
            {parentMessage && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {parentMessage.author?.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{parentMessage.author?.display_name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#525252' }}>
                            {format(new Date(parentMessage.created_at), 'h:mm a')}
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#a3a3a3', marginLeft: 36, lineHeight: 1.5 }}>
                        {parentMessage.content}
                    </p>
                </div>
            )}

            {/* Thread replies */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {threadMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            No replies yet
                        </p>
                        <p style={{ fontSize: 10, color: '#404040', marginTop: 4 }}>
                            Be the first to reply
                        </p>
                    </div>
                ) : (
                    threadMessages.map((reply: ThreadReply) => (
                        <div key={reply.id} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    marginTop: 2,
                                }}
                            >
                                {reply.author?.display_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{reply.author?.display_name}</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#525252' }}>
                                        {format(new Date(reply.created_at), 'h:mm a')}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: '#a3a3a3', marginTop: 2, lineHeight: 1.5 }}>
                                    {reply.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="REPLY IN THREAD..."
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: 13,
                            outline: 'none',
                            resize: 'none',
                            minHeight: 40,
                            maxHeight: 100,
                            fontFamily: 'inherit',
                            letterSpacing: '0.02em',
                        }}
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: input.trim() ? 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)' : 'rgba(255,255,255,0.05)',
                            color: input.trim() ? '#000' : '#525252',
                            border: 'none',
                            cursor: input.trim() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
