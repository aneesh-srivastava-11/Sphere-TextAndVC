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
        <div className="fixed right-0 top-0 h-full glass-panel-strong flex flex-col z-40 animate-slide-right"
            style={{ width: '380px', borderLeft: '1px solid var(--border-color)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4"
                style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <Reply size={18} style={{ color: 'var(--accent)' }} />
                    <h3 className="font-semibold text-sm">Thread</h3>
                </div>
                <button onClick={closeThread} className="btn btn-icon btn-ghost" style={{ padding: '0.25rem' }}>
                    <X size={18} />
                </button>
            </div>

            {/* Parent message */}
            {parentMessage && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="avatar avatar-sm">
                            {parentMessage.author?.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium">{parentMessage.author?.display_name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(parentMessage.created_at), 'h:mm a')}
                        </span>
                    </div>
                    <p className="text-sm ml-10" style={{ color: 'var(--text-secondary)' }}>
                        {parentMessage.content}
                    </p>
                </div>
            )}

            {/* Thread replies */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {threadMessages.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <p className="text-sm">No replies yet</p>
                        <p className="text-xs mt-1">Be the first to reply</p>
                    </div>
                ) : (
                    threadMessages.map((reply: ThreadReply) => (
                        <div key={reply.id} className="flex gap-3 py-2 animate-fade-in">
                            <div className="avatar avatar-sm mt-0.5">
                                {reply.author?.display_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-semibold">{reply.author?.display_name}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {format(new Date(reply.created_at), 'h:mm a')}
                                    </span>
                                </div>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                    {reply.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Reply in thread..."
                        className="input flex-1 resize-none"
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '100px', fontSize: '0.8125rem' }}
                    />
                    <button onClick={handleSend} disabled={!input.trim()}
                        className="btn btn-primary btn-icon"
                        style={{ height: '40px', width: '40px', opacity: input.trim() ? 1 : 0.5 }}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
