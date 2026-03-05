import { supabase } from '../lib/supabase';
import { BlockService } from './blockService';

export class ConversationService {
    static async findOrCreateDM(userId: string, otherUserId: string) {
        // Check for existing DM between these two users
        const { data: existing } = await supabase
            .from('conversations')
            .select(`
        *,
        conversation_participants!inner(user_id)
      `)
            .eq('type', 'direct');

        // Filter to find conversation where both users are participants
        if (existing) {
            for (const conv of existing) {
                const participantIds = conv.conversation_participants.map((p: any) => p.user_id);
                if (
                    participantIds.length === 2 &&
                    participantIds.includes(userId) &&
                    participantIds.includes(otherUserId)
                ) {
                    return { data: conv, error: null, created: false };
                }
            }
        }

        // Create new DM
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
                type: 'direct',
                created_by: userId,
                is_accepted: false // New DMs start as pending
            })
            .select()
            .single();

        if (convError) return { data: null, error: convError, created: false };

        // Add both participants
        await supabase.from('conversation_participants').insert([
            { conversation_id: conversation.id, user_id: userId, role: 'owner' },
            { conversation_id: conversation.id, user_id: otherUserId, role: 'member' },
        ]);

        return { data: conversation, error: null, created: true };
    }

    static async createGroup(userId: string, title: string, memberIds: string[]) {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ type: 'group', title, created_by: userId })
            .select()
            .single();

        if (convError) return { data: null, error: convError };

        const participants = [
            { conversation_id: conversation.id, user_id: userId, role: 'owner' },
            ...memberIds.map(id => ({
                conversation_id: conversation.id,
                user_id: id,
                role: 'member',
            })),
        ];

        await supabase.from('conversation_participants').insert(participants);

        return { data: conversation, error: null };
    }

    static async createTopic(userId: string, spaceId: string, title: string) {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ type: 'topic', title, space_id: spaceId, created_by: userId })
            .select()
            .single();

        if (convError) return { data: null, error: convError };

        await supabase.from('conversation_participants').insert({
            conversation_id: conversation.id,
            user_id: userId,
            role: 'owner',
        });

        return { data: conversation, error: null };
    }

    static async getUserConversations(userId: string) {
        const blockedIds = await BlockService.getBlockedUserIds(userId);

        const { data, error } = await supabase
            .from('conversation_participants')
            .select(`
        conversation:conversations(
          id, type, title, avatar_url, space_id, created_at, updated_at,
          conversation_participants(
            user_id,
            role,
            user:accounts(id, display_name, avatar_url, email, status)
          )
        )
      `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (error) return { data: null, error };

        // Flatten & enrich with last message
        const conversations = data
            ?.map((d: any) => d.conversation)
            .filter(Boolean)
            .map((conv: any) => ({
                ...conv,
                participants: conv.conversation_participants
                    ?.map((p: any) => ({ ...p.user, role: p.role }))
                    .filter((p: any) => !blockedIds.includes(p.id)) || [],
            }));

        return { data: conversations, error: null };
    }

    static async getConversation(conversationId: string, userId: string) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        conversation_participants(
          user_id,
          role,
          user:accounts(id, display_name, avatar_url, email, status)
        )
      `)
            .eq('id', conversationId)
            .single();

        if (error) return { data: null, error };

        return {
            data: {
                ...data,
                participants: data.conversation_participants?.map((p: any) => ({
                    ...p.user,
                    role: p.role,
                })) || [],
            },
            error: null,
        };
    }

    static async addParticipant(conversationId: string, userId: string, role = 'member') {
        return supabase.from('conversation_participants').insert({
            conversation_id: conversationId,
            user_id: userId,
            role,
        });
    }

    static async removeParticipant(conversationId: string, userId: string) {
        return supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
    }

    static async updateConversation(conversationId: string, updates: { title?: string; avatar_url?: string; is_accepted?: boolean }) {
        return supabase
            .from('conversations')
            .update(updates)
            .eq('id', conversationId)
            .select()
            .single();
    }

    static async acceptConversation(conversationId: string) {
        return this.updateConversation(conversationId, { is_accepted: true });
    }

    static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
        const { data } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        return !!data;
    }

    static async getUserRole(conversationId: string, userId: string): Promise<string | null> {
        const { data } = await supabase
            .from('conversation_participants')
            .select('role')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        return data?.role || null;
    }
}
