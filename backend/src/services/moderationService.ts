import { supabase } from '../lib/supabase';

export class ModerationService {
    static async reportMessage(reporterId: string, messageId: string, reason: string) {
        return supabase
            .from('reports')
            .insert({ reporter_id: reporterId, message_id: messageId, reason })
            .select()
            .single();
    }

    static async reportUserWithContext(reporterId: string, targetUserId: string, conversationId: string, reason: string) {
        // Fetch last 5 messages for context
        const { data: messages } = await supabase
            .from('messages')
            .select(`
                id,
                content,
                author:accounts!author_id(display_name, email),
                created_at,
                attachments
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: report, error } = await supabase
            .from('user_reports')
            .insert({
                reporter_id: reporterId,
                target_user_id: targetUserId,
                conversation_id: conversationId,
                reason,
                context_messages: messages || []
            })
            .select()
            .single();

        if (error) throw error;

        // Simulate sending email to aneeshplays1175@gmail.com
        console.log(`📧 REPORT SYSTEM: Sending email to aneeshplays1175@gmail.com for report ${report.id}`);
        console.log(`   Target User: ${targetUserId}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Context: ${JSON.stringify(messages, null, 2)}`);

        return report;
    }

    static async getReports(conversationId: string) {
        return supabase
            .from('reports')
            .select(`
        *,
        reporter:accounts!reporter_id(id, display_name),
        message:messages!message_id(id, content, conversation_id, author:accounts!author_id(id, display_name))
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
    }

    static async muteUser(moderatorId: string, conversationId: string, userId: string, durationMinutes?: number) {
        const mutedUntil = durationMinutes
            ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
            : null;

        await supabase.from('muted_users').upsert({
            conversation_id: conversationId,
            user_id: userId,
            muted_until: mutedUntil,
        });

        await supabase.from('moderation_actions').insert({
            moderator_id: moderatorId,
            action_type: 'mute_user',
            target_user: userId,
            conversation_id: conversationId,
        });

        return { success: true };
    }

    static async unmuteUser(conversationId: string, userId: string) {
        return supabase
            .from('muted_users')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
    }

    static async isUserMuted(conversationId: string, userId: string): Promise<boolean> {
        const { data } = await supabase
            .from('muted_users')
            .select('muted_until')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        if (!data) return false;
        if (!data.muted_until) return true; // permanent mute
        return new Date(data.muted_until) > new Date();
    }

    static async banUser(moderatorId: string, conversationId: string, userId: string) {
        await supabase.from('banned_users').upsert({
            conversation_id: conversationId,
            user_id: userId,
        });

        // Remove from conversation
        await supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        await supabase.from('moderation_actions').insert({
            moderator_id: moderatorId,
            action_type: 'ban_user',
            target_user: userId,
            conversation_id: conversationId,
        });

        return { success: true };
    }

    static async unbanUser(moderatorId: string, conversationId: string, userId: string) {
        await supabase
            .from('banned_users')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        await supabase.from('moderation_actions').insert({
            moderator_id: moderatorId,
            action_type: 'unban_user',
            target_user: userId,
            conversation_id: conversationId,
        });

        return { success: true };
    }

    static async logAction(
        moderatorId: string,
        actionType: string,
        targetUser?: string,
        messageId?: string,
        conversationId?: string,
        reason?: string
    ) {
        return supabase.from('moderation_actions').insert({
            moderator_id: moderatorId,
            action_type: actionType,
            target_user: targetUser,
            message_id: messageId,
            conversation_id: conversationId,
            reason,
        });
    }
}
