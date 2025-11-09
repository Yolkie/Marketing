-- Marketing Dashboard Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content items table (videos and images from Google Drive)
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

-- Captions table
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

-- Webhook logs table (for tracking webhook events)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type VARCHAR(50) NOT NULL, -- 'drive', 'n8n', etc.
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(50) DEFAULT 'received', -- 'received', 'processed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_file_type ON content_items(file_type);
CREATE INDEX IF NOT EXISTS idx_content_items_drive_file_id ON content_items(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_captions_content_item_id ON captions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_captions_status ON captions(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captions_updated_at BEFORE UPDATE ON captions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- To generate a new password hash, run in Node.js:
-- const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(console.log);
-- Password hash for 'admin123' (bcrypt, rounds: 10)
INSERT INTO users (email, password_hash, name)
VALUES ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User')
ON CONFLICT (email) DO NOTHING;

