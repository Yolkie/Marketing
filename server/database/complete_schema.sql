-- Marketing Dashboard - Complete Database Schema
-- PostgreSQL Database Setup
-- 
-- This file contains the complete database schema including:
-- - Users table (for authentication/login)
-- - Content items table (for Google Drive files)
-- - Captions table (for AI-generated captions)
-- - Webhook logs table (for tracking webhook events)
--
-- Run this file in your PostgreSQL database to set up the complete schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (for authentication/login)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONTENT ITEMS TABLE (for Google Drive files)
-- ============================================
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_file_id VARCHAR(255) UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'video' or 'image'
    mime_type VARCHAR(100),
    drive_url TEXT NOT NULL,
    thumbnail_url TEXT,
    embed_url TEXT,
    status VARCHAR(50) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'published'
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CAPTIONS TABLE (for AI-generated captions)
-- ============================================
CREATE TABLE IF NOT EXISTS captions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    tone VARCHAR(50) NOT NULL, -- 'Professional', 'Casual', 'Engaging'
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WEBHOOK LOGS TABLE (for tracking webhook events)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type VARCHAR(50) NOT NULL, -- 'drive', 'n8n', etc.
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(50) DEFAULT 'received', -- 'received', 'processed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES (for better performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_file_type ON content_items(file_type);
CREATE INDEX IF NOT EXISTS idx_content_items_drive_file_id ON content_items(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_captions_content_item_id ON captions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_captions_status ON captions(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_captions_updated_at ON captions;
CREATE TRIGGER update_captions_updated_at BEFORE UPDATE ON captions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT USERS FOR LOGIN
-- ============================================
-- 
-- Password hashes are generated using bcrypt (10 rounds)
-- To generate a new password hash, run in Node.js:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('yourpassword', 10).then(console.log);
--
-- Default credentials:
-- Email: admin@example.com
-- Password: admin123
--
-- Email: user@example.com
-- Password: user123
--
-- ⚠️ IMPORTANT: Change these passwords in production!

-- Insert default admin user (password: admin123)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (email, password_hash, name)
VALUES 
    ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User'),
    ('user@example.com', '$2a$10$3GzAi0pjAO5wb65Wl5XGEupYUEFAs8FV41I0pZSeA8pZKssmYRWxS', 'Regular User')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify users were created
SELECT 
    id,
    email,
    name,
    created_at
FROM users
ORDER BY created_at;

-- Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('users', 'content_items', 'captions', 'webhook_logs')
ORDER BY table_name;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Default admin credentials:
--    Email: admin@example.com
--    Password: admin123
--
-- 2. Default user credentials:
--    Email: user@example.com
--    Password: user123
--    Hash: $2a$10$3GzAi0pjAO5wb65Wl5XGEupYUEFAs8FV41I0pZSeA8pZKssmYRWxS
--
-- 3. To create a new user with a custom password:
--    a. Generate password hash in Node.js:
--       const bcrypt = require('bcryptjs');
--       bcrypt.hash('yourpassword', 10).then(console.log);
--    b. Insert into database:
--       INSERT INTO users (email, password_hash, name)
--       VALUES ('newuser@example.com', 'generated_hash_here', 'User Name');
--
-- 4. To change a user's password:
--    a. Generate new hash
--    b. UPDATE users SET password_hash = 'new_hash' WHERE email = 'user@example.com';
--
-- 5. To delete a user:
--    DELETE FROM users WHERE email = 'user@example.com';
--
-- 6. Database connection settings (in server/.env):
--    DB_USER=postgres
--    DB_HOST=localhost
--    DB_NAME=marketing_dashboard
--    DB_PASSWORD=your_password
--    DB_PORT=5432

