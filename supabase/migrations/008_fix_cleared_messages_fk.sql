-- Fix conversation_cleared foreign key to use accounts(id) instead of supabase_uid
-- This is more consistent with other tables and avoids potential type/reference issues

-- 1. Drop the existing table if it exists (or just the FK, but dropping table is safer for a clean fix)
DROP TABLE IF EXISTS conversation_cleared;

-- 2. Re-create with correct reference
CREATE TABLE conversation_cleared (
    user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    cleared_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, conversation_id)
);

-- 3. Add index
CREATE INDEX idx_conversation_cleared_user_convo ON conversation_cleared(user_id, conversation_id);

-- 4. RLS Policies
ALTER TABLE conversation_cleared ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cleared timestamps"
    ON conversation_cleared
    FOR ALL
    USING (auth.uid()::TEXT IN (SELECT supabase_uid FROM accounts WHERE id = user_id))
    WITH CHECK (auth.uid()::TEXT IN (SELECT supabase_uid FROM accounts WHERE id = user_id));
