# Marketing Dashboard - Content Workflow Platform

A full-stack application for managing marketing content with Google Drive integration, AI-generated captions, and automated social media publishing via n8n webhooks.

## 🚀 Features

- 🔐 **Authentication** - JWT-based user authentication
- 📁 **Google Drive Integration** - Sync videos and images from Google Drive folders
- 🤖 **AI Caption Generation** - Generate multiple caption variations (Professional, Casual, Engaging)
- ✅ **Content Review** - Review, edit, and approve captions
- 🔗 **n8n Integration** - Store AI-generated captions from n8n workflows
- 💾 **PostgreSQL Database** - Persistent storage for content, captions, and users
- 🎨 **Modern UI** - Neo-Brutalism 2.0 design with dark/light themes
- 📊 **Dashboard** - Beautiful UI for content management

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- TypeScript
- Lucide React Icons

### Backend
- Node.js / Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Google Drive API credentials
- (Optional) n8n instance for automation

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

The easiest way to deploy is using Docker Compose:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Marketing-Dashboard

# 2. Create .env file with your configuration
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3001/api
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete Docker documentation.

### Option 2: Manual Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Marketing-Dashboard
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up PostgreSQL database
# Create database
createdb marketing_dashboard

# Run schema
psql -U postgres -d marketing_dashboard -f database/complete_schema.sql

# Configure environment variables
# Copy .env.example to .env and fill in your values
# See server/.env.example for required variables

# Start server
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# From project root
npm install

# Configure environment variables
# Create .env file with:
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id
VITE_GOOGLE_API_KEY=your_api_key

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Default Credentials

- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **Change this password in production!**

## 📁 Project Structure

```
Marketing-Dashboard/
├── server/                    # Backend API
│   ├── index.js               # Express server
│   ├── database/              # Database schemas
│   │   ├── complete_schema.sql
│   │   ├── schema.sql
│   │   └── init_users.sql
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.js
│   │   ├── security.js
│   │   └── validation.js
│   ├── scripts/              # Utility scripts
│   │   └── verify-caption-links.js
│   └── package.json
├── src/                       # Frontend source
│   ├── components/           # React components
│   │   ├── ContentReviewDashboard.jsx
│   │   └── LoginComponent.jsx
│   ├── contexts/             # React contexts
│   │   └── ThemeContext.jsx
│   ├── api-config.js        # API configuration
│   ├── App.jsx              # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── docs/                     # Documentation
│   ├── n8n/                 # n8n integration docs
│   └── archive/             # Archived docs
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## 📚 Documentation

### Getting Started
- **[Docker Deployment Guide](./DOCKER_DEPLOYMENT.md)** - 🐳 Complete Docker setup (Recommended)
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[n8n Integration Guide](./docs/n8n/N8N_INTEGRATION_GUIDE.md)** - Setting up n8n workflows
- **[n8n Data Integrity Guide](./docs/n8n/N8N_DATA_INTEGRITY_GUIDE.md)** - Ensuring correct caption linking

### Setup Guides
- **[Backend Setup](./server/DATABASE_SETUP.md)** - Database setup instructions
- **[Environment Setup](./server/ENV_SETUP_INSTRUCTIONS.md)** - Environment variables configuration

### n8n Workflows
- **[n8n Workflow (Modified)](./docs/n8n/N8N_WORKFLOW_MODIFIED.md)** - API-integrated workflow
- **[n8n Workflow (Reference)](./docs/n8n/N8N_WORKFLOW_REFERENCE.md)** - Original workflow reference
- **[Migration Guide](./docs/n8n/N8N_MIGRATION_GUIDE.md)** - Migrating from direct DB access to API

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Content
- `GET /api/content` - Get all content items
- `GET /api/content/:id` - Get single content item
- `POST /api/content/sync` - Sync from Google Drive
- `POST /api/drive/fetch` - Fetch files from Google Drive

### Captions
- `POST /api/content/:id/captions` - Create captions
- `PUT /api/captions/:id` - Update caption
- `POST /api/captions/:id/approve` - Approve caption (triggers webhook)
- `DELETE /api/captions/:id` - Delete caption

### Webhooks
- `POST /api/webhooks/drive` - Google Drive webhook
- `POST /api/webhooks/n8n` - n8n webhook (for storing AI-generated captions)

### Health
- `GET /api/health` - Health check

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🔐 Environment Variables

### Backend (`server/.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Webhooks (Optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
WEBHOOK_SECRET=your-webhook-secret
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id
VITE_GOOGLE_API_KEY=your_api_key
```

## 🔄 Workflow

1. **User logs in** → Gets JWT token
2. **Sync Google Drive** → Fetches videos/images and stores in database
3. **n8n generates captions** → AI generates captions via n8n workflow
4. **Store captions** → n8n sends captions to `/api/webhooks/n8n`
5. **Review & Edit** → User reviews and edits captions in dashboard
6. **Approve** → Caption approved, webhook triggered to n8n
7. **Publish** → n8n workflow publishes to social media platforms

## 🔗 n8n Integration

### Storing Captions from n8n

When n8n generates captions, send them to the API:

```json
POST /api/webhooks/n8n
{
  "event": "captions_generated",
  "data": {
    "driveFileId": "google-drive-file-id",
    "captions": [
      {
        "tone": "Professional",
        "content": "Your caption text here..."
      },
      {
        "tone": "Casual",
        "content": "Another caption here..."
      },
      {
        "tone": "Engaging",
        "content": "Third caption here..."
      }
    ]
  }
}
```

The API automatically:
- Looks up the content item by `driveFileId`
- Validates captions (tone and content)
- Stores captions linked to the correct content item
- Returns verification details

See [n8n Integration Guide](./docs/n8n/N8N_INTEGRATION_GUIDE.md) for complete setup.

## 🧪 Testing

### Verify Caption Links

```bash
# Verify all caption-content item links
node server/scripts/verify-caption-links.js

# Verify specific file
node server/scripts/verify-caption-links.js "google-drive-file-id"
```

## 🔒 Security Notes

- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ JWT tokens for authentication
- ✅ SQL injection protection (parameterized queries)
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Helmet.js for security headers
- ⚠️ Change default admin password
- ⚠️ Use strong JWT secrets in production
- ⚠️ Enable HTTPS in production
- ⚠️ Restrict CORS in production
- ⚠️ Never commit `.env` files

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `server/.env`
- Ensure database exists: `psql -l | grep marketing_dashboard`
- For remote databases, check SSL configuration

### Authentication Issues
- Verify `JWT_SECRET` is set in `server/.env`
- Check token expiration (7 days default)
- Ensure token is sent in `Authorization: Bearer <token>` header

### Google Drive Issues
- Verify API key is correct (starts with `AIzaSy...`)
- Check folder is accessible
- Ensure Google Drive API is enabled in Google Cloud Console
- See [GET_API_KEY.md](./GET_API_KEY.md) for API key setup

### n8n Integration Issues
- Verify `driveFileId` matches between nodes
- Check API response for verification details
- Run verification script to check data integrity
- See [n8n Data Integrity Guide](./docs/n8n/N8N_DATA_INTEGRITY_GUIDE.md)

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [documentation](./docs/)
- Review [API Documentation](./API_DOCUMENTATION.md)
- Check [n8n Integration Guide](./docs/n8n/N8N_INTEGRATION_GUIDE.md)

---

**Built with ❤️ for marketing teams**
