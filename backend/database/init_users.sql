-- Marketing Dashboard - User Login Setup
-- PostgreSQL Database User Initialization
-- 
-- This file creates the database schema and inserts default users for login
-- Run this file in your PostgreSQL database to set up authentication

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
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

-- Insert default admin user
-- Password: admin123
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (email, password_hash, name)
VALUES 
    ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User'),
    ('user@example.com', '$2a$10$3GzAi0pjAO5wb65Wl5XGEupYUEFAs8FV41I0pZSeA8pZKssmYRWxS', 'Regular User')
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT 
    id,
    email,
    name,
    created_at
FROM users
ORDER BY created_at;

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

