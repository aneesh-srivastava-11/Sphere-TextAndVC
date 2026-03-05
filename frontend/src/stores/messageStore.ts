'use client';

import { create } from 'zustand';
import { Message, ThreadReply } from '@/types';
import { api } from '@/lib/api';

interface MessageState {
    messages: Message[];
    loading: boolean;
    threadMessages: ThreadReply[];
    activeThreadMessageId: string | null;
    typingUsers: Map<string, string>;

    fetchMessages: (conversationId: string) => Promise<void>;
    addMessage: (message: Message) => void;
    updateMessage: (message: Message) => void;
    removeMessage: (messageId: string) => void;
    updateReaction: (data: { messageId: string; userId: string; emoji: string; action: string }) => void;

    openThread: (messageId: string) => Promise<void>;
    closeThread: () => void;
    addThreadReply: (reply: ThreadReply) => void;

    setTypingUser: (conversationId: string, userId: string) => void;
    clearTypingUser: (conversationId: string, userId: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
    messages: [],
    loading: false,
    threadMessages: [],
    activeThreadMessageId: null,
    typingUsers: new Map(),

    fetchMessages: async (conversationId) => {
        try {
            set({ loading: true, messages: [] });
            const data = await api.getMessages(conversationId);
            set({ messages: data || [], loading: false });
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            set({ loading: false });
        }
    },

    addMessage: (message) => {
        set((state) => {
            if (state.messages.find(m => m.id === message.id)) return state;
            return { messages: [...state.messages, message] };
        });
    },

    updateMessage: (message) => {
        set((state) => ({
            messages: state.messages.map(m => m.id === message.id ? { ...m, ...message } : m),
        }));
    },

    removeMessage: (messageId) => {
        set((state) => ({
            messages: state.messages.filter(m => m.id !== messageId),
        }));
    },

    updateReaction: (data) => {
        set((state) => ({
            messages: state.messages.map(m => {
                if (m.id !== data.messageId) return m;
                const reactions = [...(m.reactions || [])];
                if (data.action === 'added') {
                    reactions.push({ id: '', message_id: data.messageId, user_id: data.userId, emoji: data.emoji });
                } else {
                    const idx = reactions.findIndex(r => r.user_id === data.userId && r.emoji === data.emoji);
                    if (idx >= 0) reactions.splice(idx, 1);
                }
                return { ...m, reactions };
            }),
        }));
    },

    openThread: async (messageId) => {
        try {
            set({ activeThreadMessageId: messageId, threadMessages: [] });
            const { data } = await api.getThreadReplies(messageId);
            set({ threadMessages: data || [] });
        } catch (err) {
            console.error('Failed to fetch thread:', err);
        }
    },

    closeThread: () => {
        set({ activeThreadMessageId: null, threadMessages: [] });
    },

    addThreadReply: (reply) => {
        set((state) => ({
            threadMessages: [...state.threadMessages, reply],
        }));
    },

    setTypingUser: (conversationId, userId) => {
        set((state) => {
            const map = new Map(state.typingUsers);
            map.set(`${conversationId}:${userId}`, userId);
            return { typingUsers: map };
        });
    },

    clearTypingUser: (conversationId, userId) => {
        set((state) => {
            const map = new Map(state.typingUsers);
            map.delete(`${conversationId}:${userId}`);
            return { typingUsers: map };
        });
    },
}));
