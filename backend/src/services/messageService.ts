import { supabase } from '../lib/supabase';
import { BlockService } from './blockService';

export class MessageService {
    static async getMessages(conversationId: string, userId: string, limit = 50, before?: string) {
        const blockedIds = await BlockService.getBlockedUserIds(userId);

        let query = supabase
            .from('messages')
            .select(`
        *,
        author:accounts!author_id(id, display_name, avatar_url),
        reactions(id, emoji, user_id),
        threads(count),
        file_attachments(id, file_url, file_name, file_size, mime_type)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data, error } = await query;

        if (error) return { data: null, error };

        // Apply ghost block: replace blocked user messages
        const messages = data?.map(msg => {
            if (blockedIds.includes(msg.author_id)) {
                return {
                    ...msg,
                    content: '[Message hidden]',
                    author: { id: msg.author_id, display_name: 'Hidden User', avatar_url: null },
                    reactions: [],
                    file_attachments: [],
                    _blocked: true,
                };
            }
            return msg;
        });

        return { data: messages?.reverse(), error: null };
    }

    static async sendMessage(conversationId: string, authorId: string, content: string, attachment?: { url: string, name: string, size: number, type: string }) {
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({ conversation_id: conversationId, author_id: authorId, content })
            .select(`
        *,
        author:accounts!author_id(id, display_name, avatar_url)
      `)
            .single();

        if (messageError) return { data: null, error: messageError };

        let fileObj = null;
        if (attachment && message) {
            const { data: fileData, error: fileError } = await supabase
                .from('file_attachments')
                .insert({
                    message_id: message.id,
                    file_url: attachment.url,
                    file_name: attachment.name,
                    file_size: attachment.size,
                    mime_type: attachment.type,
                    uploaded_by: authorId
                })
                .select('id, file_url, file_name, file_size, mime_type')
                .single();

            if (!fileError) {
                fileObj = fileData;
            }
        }

        return { data: { ...message, file_attachments: fileObj ? [fileObj] : [] }, error: null };
    }

    static async editMessage(messageId: string, authorId: string, content: string) {
        return supabase
            .from('messages')
            .update({ content, edited_at: new Date().toISOString() })
            .eq('id', messageId)
            .eq('author_id', authorId)
            .select()
            .single();
    }

    static async deleteMessage(messageId: string, authorId: string, isModeratorAction = false) {
        let query = supabase.from('messages').delete().eq('id', messageId);
        if (!isModeratorAction) {
            query = query.eq('author_id', authorId);
        }
        return query;
    }

    static async toggleReaction(messageId: string, userId: string, emoji: string) {
        // Check if reaction exists
        const { data: existing } = await supabase
            .from('reactions')
            .select('id')
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji)
            .single();

        if (existing) {
            await supabase.from('reactions').delete().eq('id', existing.id);
            return { action: 'removed', emoji };
        } else {
            await supabase.from('reactions').insert({ message_id: messageId, user_id: userId, emoji });
            return { action: 'added', emoji };
        }
    }

    static async pinMessage(conversationId: string, messageId: string, userId: string) {
        return supabase.from('pinned_messages').insert({
            conversation_id: conversationId,
            message_id: messageId,
            pinned_by: userId,
        });
    }

    static async unpinMessage(conversationId: string, messageId: string) {
        return supabase
            .from('pinned_messages')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('message_id', messageId);
    }

    static async getPinnedMessages(conversationId: string) {
        return supabase
            .from('pinned_messages')
            .select(`
        *,
        message:messages(
          *,
          author:accounts!author_id(id, display_name, avatar_url)
        )
      `)
            .eq('conversation_id', conversationId)
            .order('pinned_at', { ascending: false });
    }

    static async getThreadReplies(parentMessageId: string) {
        return supabase
            .from('threads')
            .select(`
        *,
        author:accounts!author_id(id, display_name, avatar_url)
      `)
            .eq('parent_message_id', parentMessageId)
            .order('created_at', { ascending: true });
    }

    static async addThreadReply(parentMessageId: string, authorId: string, content: string) {
        return supabase
            .from('threads')
            .insert({ parent_message_id: parentMessageId, author_id: authorId, content })
            .select(`
        *,
        author:accounts!author_id(id, display_name, avatar_url)
      `)
            .single();
    }
}
