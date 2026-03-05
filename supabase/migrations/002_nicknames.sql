-- User Nicknames (private per-user)
-- Each user can assign a nickname to any other user, visible only to themselves.

CREATE TABLE user_nicknames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_nicknames_user ON user_nicknames(user_id);

ALTER TABLE user_nicknames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access nicknames" ON user_nicknames
  FOR ALL USING (true) WITH CHECK (true);
