-- Phase 15: Safety & Social features

-- 1. Add acceptance flag to conversations for DM requests
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT TRUE;
-- Update existing DMs to be accepted (topics and groups are always accepted by creators)
UPDATE conversations SET is_accepted = TRUE;

-- 2. Create reports table if not exists (checking if Phase 7 handled it)
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    context_messages JSONB, -- Store last 5 messages as JSON
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user_reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON user_reports FOR INSERT WITH CHECK (auth.uid()::text = (SELECT supabase_uid FROM accounts WHERE id = reporter_id));
CREATE POLICY "Admins can view reports" ON user_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM accounts WHERE supabase_uid = auth.uid()::text AND is_admin = TRUE)
);
