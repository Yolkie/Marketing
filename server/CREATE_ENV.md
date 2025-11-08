# How to Create Your .env File

Since `.env` files are protected, follow these steps to create your configuration file:

## Quick Setup

### Option 1: Copy the Template (Recommended)

1. **Copy the template file:**
   ```bash
   cd server
   copy .env.template .env
   ```
   (On Windows PowerShell: `Copy-Item .env.template .env`)
   (On Mac/Linux: `cp .env.template .env`)

2. **Open `.env` in a text editor** and fill in the values

### Option 2: Create Manually

1. **Create a new file** named `.env` in the `server` directory

2. **Copy and paste this template:**

```env
# Server Configuration
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Secret (generate a random string)
JWT_SECRET=YOUR_JWT_SECRET_HERE

# Webhook Configuration (optional)
N8N_WEBHOOK_URL=
WEBHOOK_SECRET=

# Google Drive API (optional)
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_API_KEY=
```

3. **Fill in the required values** (see instructions below)

## Required Values to Fill In

### 1. DB_PASSWORD ⚠️ REQUIRED
Your PostgreSQL password (the one you set when installing PostgreSQL)

**Example:**
```env
DB_PASSWORD=mypassword123
```

**If you don't know your password:**
- It's the password you set during PostgreSQL installation
- Or check your PostgreSQL configuration
- You may need to reset it if forgotten

### 2. JWT_SECRET ⚠️ REQUIRED
A strong random string for JWT token signing

**Generate one using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Or create a long random string manually**

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 3. Optional Values

**N8N_WEBHOOK_URL** - Only if using n8n
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/caption-approved
```

**GOOGLE_DRIVE_FOLDER_ID** - Only if using Google Drive
```env
GOOGLE_DRIVE_FOLDER_ID=1aB2cD3eF4gH5iJ6kL7mN8oP9qR
```

**GOOGLE_API_KEY** - Only if using Google Drive
```env
GOOGLE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
```

## Complete Example

Here's what a complete `.env` file might look like:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=mypassword123
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/caption-approved
WEBHOOK_SECRET=my-webhook-secret
GOOGLE_DRIVE_FOLDER_ID=1aB2cD3eF4gH5iJ6kL7mN8oP9qR
GOOGLE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
```

## Verify Your Setup

After creating your `.env` file:

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Look for this message:**
   ```
   ✅ Database connected successfully
   🚀 Server running on http://localhost:3001
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

## Need Help?

- See `ENV_SETUP_INSTRUCTIONS.md` for detailed explanations
- Check `BACKEND_SETUP.md` for full setup guide
- Verify PostgreSQL is running: `pg_isready`



