-- Domain restrictions for Sphere
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS allowed_domains (
    domain TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_overrides (
    email TEXT PRIMARY KEY,
    added_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_overrides ENABLE ROW LEVEL SECURITY;

-- Allow public read of allowed domains (to check during signup)
CREATE POLICY "Public read allowed domains" ON allowed_domains FOR SELECT USING (true);
CREATE POLICY "Public read overrides" ON domain_overrides FOR SELECT USING (true);

-- Backend (service role) will manage these
CREATE POLICY "Service role full access allowed_domains" ON allowed_domains FOR ALL USING (true);
CREATE POLICY "Service role full access domain_overrides" ON domain_overrides FOR ALL USING (true);

-- Insert initial allowed domain
INSERT INTO allowed_domains (domain) VALUES ('muj.manipal.edu') ON CONFLICT DO NOTHING;
