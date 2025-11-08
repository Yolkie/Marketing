# Backend Setup Guide

This guide will help you set up the backend server with PostgreSQL, authentication, and webhook support.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Step 1: Install Dependencies

```bash
cd server
npm install
```

## Step 2: Set Up PostgreSQL Database

### Option A: Using PostgreSQL Command Line

1. Create the database:
```bash
createdb marketing_dashboard
```

2. Run the schema:
```bash
psql -U postgres -d marketing_dashboard -f database/schema.sql
```

### Option B: Using psql

1. Connect to PostgreSQL:
```bash
psql -U postgres
```

2. Create database:
```sql
CREATE DATABASE marketing_dashboard;
\c marketing_dashboard
```

3. Run the schema file:
```sql
\i database/schema.sql
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=your_actual_password

JWT_SECRET=generate-a-random-secret-key-here
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/caption-approved
WEBHOOK_SECRET=your-webhook-secret
```

### Generate JWT Secret

You can generate a secure JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Start the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:3001`

## Step 5: Test the API

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Content Management
- `GET /api/content` - Get all content items (requires auth)
- `GET /api/content/:id` - Get single content item (requires auth)
- `POST /api/content/sync` - Sync content from Google Drive (requires auth)
- `POST /api/content/:contentId/captions` - Create captions (requires auth)

### Captions
- `PUT /api/captions/:id` - Update caption (requires auth)
- `POST /api/captions/:id/approve` - Approve caption and trigger webhook (requires auth)

### Webhooks
- `POST /api/webhooks/drive` - Google Drive webhook endpoint
- `POST /api/webhooks/n8n` - n8n webhook endpoint

## Database Schema

The database includes the following tables:

- **users** - User accounts and authentication
- **content_items** - Videos and images from Google Drive
- **captions** - AI-generated captions for content
- **webhook_logs** - Webhook event tracking

## Default Admin User

The schema creates a default admin user:
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately in production!**

## n8n Integration

When a caption is approved via `POST /api/captions/:id/approve`, the backend will:

1. Update the caption status to 'approved'
2. Update the content item status to 'approved'
3. Send a webhook to your n8n instance (if `N8N_WEBHOOK_URL` is configured)

The webhook payload includes:
```json
{
  "event": "caption_approved",
  "captionId": "uuid",
  "contentItemId": "uuid",
  "caption": {
    "tone": "Professional",
    "content": "Caption text...",
    "version": 1
  },
  "content": {
    "filename": "video.mp4",
    "fileType": "video",
    "driveUrl": "https://drive.google.com/...",
    "embedUrl": "https://drive.google.com/..."
  },
  "approvedBy": "user-uuid",
  "approvedAt": "2024-01-01T00:00:00Z"
}
```

## Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong JWT secrets** - Generate random strings for production
3. **Restrict database access** - Use strong passwords and limit network access
4. **Use HTTPS in production** - Never send tokens over HTTP
5. **Validate webhook secrets** - Always verify webhook authenticity

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep marketing_dashboard`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3001

### JWT Token Invalid
- Check that `JWT_SECRET` matches between server restarts
- Verify token is being sent in Authorization header: `Bearer <token>`

### Webhook Not Triggering
- Check `N8N_WEBHOOK_URL` is set correctly
- Verify webhook endpoint is accessible
- Check server logs for webhook errors (non-critical errors won't fail the request)

## Next Steps

1. Update the frontend to use the backend API endpoints
2. Configure n8n webhook URL for automated publishing
3. Set up production database and environment
4. Implement additional security measures (rate limiting, CORS restrictions, etc.)



