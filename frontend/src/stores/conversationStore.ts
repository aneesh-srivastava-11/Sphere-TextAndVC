'use client';

import { create } from 'zustand';
import { Conversation, Space } from '@/types';
import { api } from '@/lib/api';

interface ConversationState {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    spaces: Space[];
    activeSpace: Space | null;
    loading: boolean;
    sidebarTab: 'conversations' | 'spaces';

    fetchConversations: () => Promise<void>;
    setActiveConversation: (conversation: Conversation | null) => void;
    loadConversation: (id: string) => Promise<void>;

    fetchSpaces: () => Promise<void>;
    setActiveSpace: (space: Space | null) => void;
    loadSpace: (id: string) => Promise<void>;

    createDM: (userId: string) => Promise<Conversation>;
    createGroup: (title: string, memberIds: string[]) => Promise<Conversation>;
    createTopic: (spaceId: string, title: string) => Promise<Conversation>;
    createSpace: (name: string, description?: string) => Promise<Space>;

    setSidebarTab: (tab: 'conversations' | 'spaces') => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
    conversations: [],
    activeConversation: null,
    spaces: [],
    activeSpace: null,
    loading: false,
    sidebarTab: 'conversations',

    fetchConversations: async () => {
        try {
            set({ loading: true });
            const data = await api.getConversations();
            set({ conversations: data, loading: false });
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            set({ loading: false });
        }
    },

    setActiveConversation: (conversation) => {
        set({ activeConversation: conversation });
    },

    loadConversation: async (id) => {
        try {
            const data = await api.getConversation(id);
            set({ activeConversation: data });
        } catch (err) {
            console.error('Failed to load conversation:', err);
        }
    },

    fetchSpaces: async () => {
        try {
            const data = await api.getSpaces();
            set({ spaces: data });
        } catch (err) {
            console.error('Failed to fetch spaces:', err);
        }
    },

    setActiveSpace: (space) => {
        set({ activeSpace: space });
    },

    loadSpace: async (id) => {
        try {
            const data = await api.getSpace(id);
            set({ activeSpace: data });
        } catch (err) {
            console.error('Failed to load space:', err);
        }
    },

    createDM: async (userId) => {
        const conv = await api.createDM(userId);
        await get().fetchConversations();
        return conv;
    },

    createGroup: async (title, memberIds) => {
        const conv = await api.createGroup(title, memberIds);
        await get().fetchConversations();
        return conv;
    },

    createTopic: async (spaceId, title) => {
        const conv = await api.createTopic(spaceId, title);
        return conv;
    },

    createSpace: async (name, description) => {
        const space = await api.createSpace(name, description);
        await get().fetchSpaces();
        return space;
    },

    setSidebarTab: (tab) => set({ sidebarTab: tab }),
}));
