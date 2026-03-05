import { supabase } from '../lib/supabase';

export class BlockService {
    // Check if a block relationship exists in either direction
    static async isBlocked(userA: string, userB: string): Promise<boolean> {
        const { data } = await supabase
            .from('blocks')
            .select('id')
            .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
            .limit(1);

        return (data && data.length > 0) || false;
    }

    // Get all user IDs blocked by a user
    static async getBlockedByUser(userId: string): Promise<string[]> {
        const { data } = await supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userId);

        return data?.map(b => b.blocked_id) || [];
    }

    // Get all user IDs who have blocked this user
    static async getBlockedUserIds(userId: string): Promise<string[]> {
        const { data: blockedBy } = await supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userId);

        const { data: blockers } = await supabase
            .from('blocks')
            .select('blocker_id')
            .eq('blocked_id', userId);

        const ids = new Set<string>();
        blockedBy?.forEach(b => ids.add(b.blocked_id));
        blockers?.forEach(b => ids.add(b.blocker_id));
        return Array.from(ids);
    }

    static async blockUser(blockerId: string, blockedId: string) {
        return supabase
            .from('blocks')
            .insert({ blocker_id: blockerId, blocked_id: blockedId })
            .select()
            .single();
    }

    static async unblockUser(blockerId: string, blockedId: string) {
        return supabase
            .from('blocks')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId);
    }
}
