-- Add role column to users table and create settings table
-- Run this migration to add admin functionality

-- ============================================
-- ADD ROLE COLUMN TO USERS TABLE
-- ============================================
-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        -- Set existing admin user (if exists) to admin role
        UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
        -- Create index for role lookups
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        RAISE NOTICE 'Role column added to users table';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for key lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (key, value, description)
VALUES 
    ('google_drive_folder_id', '', 'Google Drive Folder ID for content sync'),
    ('google_drive_api_key', '', 'Google Drive API Key for authentication')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify role column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Verify settings table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'settings';

-- Show current settings
SELECT key, value, description FROM settings;

