'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface NicknameState {
    nicknames: Record<string, string>; // targetUserId -> nickname
    loaded: boolean;

    fetchNicknames: () => Promise<void>;
    setNickname: (targetUserId: string, nickname: string) => Promise<void>;
    removeNickname: (targetUserId: string) => Promise<void>;
    getDisplayName: (userId: string, originalName: string) => string;
}

export const useNicknameStore = create<NicknameState>((set, get) => ({
    nicknames: {},
    loaded: false,

    fetchNicknames: async () => {
        try {
            const data = await api.getNicknames();
            const map: Record<string, string> = {};
            for (const item of data) {
                map[item.target_user_id] = item.nickname;
            }
            set({ nicknames: map, loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    setNickname: async (targetUserId, nickname) => {
        try {
            await api.setNickname(targetUserId, nickname);
            set({ nicknames: { ...get().nicknames, [targetUserId]: nickname } });
        } catch { }
    },

    removeNickname: async (targetUserId) => {
        try {
            await api.removeNickname(targetUserId);
            const updated = { ...get().nicknames };
            delete updated[targetUserId];
            set({ nicknames: updated });
        } catch { }
    },

    getDisplayName: (userId, originalName) => {
        return get().nicknames[userId] || originalName;
    },
}));
