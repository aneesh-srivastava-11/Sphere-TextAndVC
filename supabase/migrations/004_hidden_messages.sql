-- Create conversation_cleared table to track local chat clearing
CREATE TABLE IF NOT EXISTS conversation_cleared (
    user_id TEXT REFERENCES accounts(supabase_uid) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    cleared_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, conversation_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversation_cleared_user_convo ON conversation_cleared(user_id, conversation_id);

-- RLS Policies
ALTER TABLE conversation_cleared ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cleared timestamps"
    ON conversation_cleared
    FOR ALL
    USING (auth.uid()::TEXT = user_id)
    WITH CHECK (auth.uid()::TEXT = user_id);
