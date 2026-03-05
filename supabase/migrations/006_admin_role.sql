-- Add admin role to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create an initial admin (replace with YOUR email after first login)
-- UPDATE accounts SET is_admin = TRUE WHERE email = 'YOUR_EMAIL@HERE.com';
