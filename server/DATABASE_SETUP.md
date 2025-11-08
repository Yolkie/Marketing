# Database Setup Guide

## Quick Setup

### Step 1: Create Database

```sql
CREATE DATABASE marketing_dashboard;
```

### Step 2: Import Schema

Choose one of the following SQL files:

#### Option A: Complete Schema (Recommended)
```bash
psql -U postgres -d marketing_dashboard -f server/database/complete_schema.sql
```

This includes:
- All tables (users, content_items, captions, webhook_logs)
- Indexes
- Triggers
- Default users for login

#### Option B: Users Only (if tables already exist)
```bash
psql -U postgres -d marketing_dashboard -f server/database/init_users.sql
```

This only creates/updates the users table.

### Step 3: Verify Setup

```sql
-- Check users
SELECT email, name FROM users;

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'content_items', 'captions', 'webhook_logs');
```

## Default Login Credentials

After importing the SQL file, you can login with:

### Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Regular User
- **Email**: `user@example.com`
- **Password**: `user123`

⚠️ **IMPORTANT**: Change these passwords in production!

## Backend .env Configuration

Make sure your `server/.env` file has these database credentials:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=marketing_dashboard
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_here

# Other settings
PORT=3001
NODE_ENV=development
```

## Creating New Users

### Method 1: Via Backend API (Recommended)

```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User"
}
```

### Method 2: Direct SQL Insert

1. Generate password hash in Node.js:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('yourpassword', 10).then(console.log);
```

2. Insert into database:
```sql
INSERT INTO users (email, password_hash, name)
VALUES ('newuser@example.com', 'generated_hash_here', 'User Name');
```

## Changing Passwords

1. Generate new password hash:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('newpassword', 10).then(console.log);
```

2. Update in database:
```sql
UPDATE users 
SET password_hash = 'new_hash_here' 
WHERE email = 'user@example.com';
```

## Troubleshooting

### Database Connection Error

1. Check PostgreSQL is running:
```bash
# Windows
net start postgresql-x64-14

# Linux/Mac
sudo systemctl status postgresql
```

2. Verify credentials in `server/.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=marketing_dashboard
DB_PASSWORD=your_password
DB_PORT=5432
```

3. Test connection:
```bash
psql -U postgres -d marketing_dashboard -c "SELECT NOW();"
```

### Users Table Not Found

Run the complete schema:
```bash
psql -U postgres -d marketing_dashboard -f server/database/complete_schema.sql
```

### Login Not Working

1. Verify user exists:
```sql
SELECT email, name FROM users WHERE email = 'admin@example.com';
```

2. Check password hash is correct (should start with `$2a$10$`)

3. Verify backend is using correct database credentials

## File Locations

- **Complete Schema**: `server/database/complete_schema.sql`
- **Users Only**: `server/database/init_users.sql`
- **Original Schema**: `server/database/schema.sql`

