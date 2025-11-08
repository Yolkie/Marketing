# API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for 7 days after login.

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Content Endpoints](#content-endpoints)
3. [Caption Endpoints](#caption-endpoints)
4. [Google Drive Endpoints](#google-drive-endpoints)
5. [Webhook Endpoints](#webhook-endpoints)
6. [Health Check](#health-check)
7. [Error Responses](#error-responses)
8. [Rate Limiting](#rate-limiting)

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "User Name"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters
- `name`: Required, minimum 2 characters

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400`: Validation error or email already exists
- `500`: Internal server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User"
  }'
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400`: Email and password are required
- `401`: Invalid credentials
- `500`: Database connection error or internal server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

---

### Get Current User

Get the authenticated user's information.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Invalid or missing token
- `404`: User not found
- `500`: Internal server error

**Example:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

## Content Endpoints

### Get All Content Items

Retrieve all content items with optional filtering.

**Endpoint:** `GET /api/content`

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (`pending_review`, `approved`, `published`)
- `fileType` (optional): Filter by file type (`video`, `image`)

**Success Response (200):**
```json
{
  "content": [
    {
      "id": "uuid-here",
      "filename": "video.mp4",
      "fileType": "video",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "status": "pending_review",
      "driveUrl": "https://drive.google.com/file/d/...",
      "thumbnailUrl": "https://drive.google.com/thumbnail?id=...",
      "embedUrl": "https://drive.google.com/file/d/.../preview",
      "mimeType": "video/mp4",
      "captions": [
        {
          "id": "caption-uuid",
          "version": 1,
          "tone": "Professional",
          "content": "Caption text here...",
          "status": "pending",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "approvedBy": null,
          "approvedAt": null
        }
      ]
    }
  ]
}
```

**Example:**
```bash
# Get all content
curl -X GET http://localhost:3001/api/content \
  -H "Authorization: Bearer <your_jwt_token>"

# Get only pending videos
curl -X GET "http://localhost:3001/api/content?status=pending_review&fileType=video" \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### Get Single Content Item

Retrieve a specific content item by ID.

**Endpoint:** `GET /api/content/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Content item UUID

**Success Response (200):**
```json
{
  "content": {
    "id": "uuid-here",
    "filename": "video.mp4",
    "fileType": "video",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "status": "pending_review",
    "driveUrl": "https://drive.google.com/file/d/...",
    "thumbnailUrl": "https://drive.google.com/thumbnail?id=...",
    "embedUrl": "https://drive.google.com/file/d/.../preview",
    "mimeType": "video/mp4",
    "captions": [...]
  }
}
```

**Error Responses:**
- `400`: Invalid UUID format
- `404`: Content item not found
- `500`: Internal server error

**Example:**
```bash
curl -X GET http://localhost:3001/api/content/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### Sync Content from Google Drive

Sync content items from Google Drive to the database.

**Endpoint:** `POST /api/content/sync`

**Authentication:** Required

**Request Body:**
```json
{
  "contentItems": [
    {
      "id": "google-drive-file-id",
      "filename": "video.mp4",
      "fileType": "video",
      "mimeType": "video/mp4",
      "driveUrl": "https://drive.google.com/file/d/...",
      "thumbnailUrl": "https://drive.google.com/thumbnail?id=...",
      "embedUrl": "https://drive.google.com/file/d/.../preview",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Validation:**
- `contentItems`: Required, array of content item objects
- Each item must have: `id`, `filename`, `fileType`, `mimeType`

**Success Response (200):**
```json
{
  "message": "Content synced successfully",
  "syncedCount": 5,
  "syncedIds": ["uuid-1", "uuid-2", "uuid-3", "uuid-4", "uuid-5"]
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/content/sync \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentItems": [...]
  }'
```

---

## Caption Endpoints

### Create Caption

Create a new caption for a content item.

**Endpoint:** `POST /api/content/:contentId/captions`

**Authentication:** Required

**URL Parameters:**
- `contentId`: Content item UUID

**Request Body:**
```json
{
  "captions": [
    {
      "tone": "Professional",
      "content": "Your caption text here..."
    },
    {
      "tone": "Casual",
      "content": "Another caption here..."
    }
  ]
}
```

**Validation:**
- `captions`: Required, array of caption objects
- Each caption must have:
  - `tone`: Required, one of: `Professional`, `Casual`, `Engaging`
  - `content`: Required, minimum 10 characters

**Success Response (201):**
```json
{
  "captions": [
    {
      "id": "caption-uuid",
      "version": 1,
      "tone": "Professional",
      "content": "Your caption text here...",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `400`: Validation error or invalid UUID
- `404`: Content item not found
- `500`: Internal server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/content/123e4567-e89b-12d3-a456-426614174000/captions \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "captions": [
      {
        "tone": "Professional",
        "content": "Check out our latest video!"
      },
      {
        "tone": "Casual",
        "content": "Hey! Check this out!"
      }
    ]
  }'
```

---

### Update Caption

Update an existing caption.

**Endpoint:** `PUT /api/captions/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Caption UUID

**Request Body:**
```json
{
  "content": "Updated caption text here...",
  "version": 2
}
```

**Validation:**
- `content`: Required, minimum 10 characters
- `version`: Optional, should be incremented

**Success Response (200):**
```json
{
  "caption": {
    "id": "caption-uuid",
    "contentItemId": "content-uuid",
    "version": 2,
    "tone": "Professional",
    "content": "Updated caption text here...",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z",
    "approvedBy": null,
    "approvedAt": null
  }
}
```

**Error Responses:**
- `400`: Validation error or invalid UUID
- `404`: Caption not found
- `500`: Internal server error

**Example:**
```bash
curl -X PUT http://localhost:3001/api/captions/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated caption text",
    "version": 2
  }'
```

---

### Approve Caption

Approve a caption and trigger webhook to n8n for publishing.

**Endpoint:** `POST /api/captions/:id/approve`

**Authentication:** Required

**URL Parameters:**
- `id`: Caption UUID

**Success Response (200):**
```json
{
  "message": "Caption approved successfully",
  "captionId": "caption-uuid",
  "webhookTriggered": true
}
```

**Error Responses:**
- `400`: Invalid UUID
- `404`: Caption not found
- `500`: Internal server error or webhook failure

**Example:**
```bash
curl -X POST http://localhost:3001/api/captions/123e4567-e89b-12d3-a456-426614174000/approve \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Note:** This endpoint:
1. Updates the caption status to `approved`
2. Updates the content item status to `approved`
3. Sends a webhook to n8n (if configured) with caption and content data
4. Logs the webhook request

---

## Google Drive Endpoints

### Fetch Files from Google Drive

Fetch files from a Google Drive folder (backend endpoint to avoid CORS).

**Endpoint:** `POST /api/drive/fetch`

**Authentication:** Optional (allows test token in development)

**Request Body:**
```json
{
  "folderId": "15p8KRq2np1fiClobWLDjOOAV95tBtorE",
  "apiKey": "AIzaSy..."
}
```

**Validation:**
- `folderId`: Required, non-empty string
- `apiKey`: Required, must start with `AIzaSy` (validates against Client Secret)

**Success Response (200):**
```json
{
  "files": [
    {
      "id": "google-drive-file-id",
      "filename": "video.mp4",
      "fileType": "video",
      "mimeType": "video/mp4",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "driveUrl": "https://drive.google.com/file/d/...",
      "thumbnailUrl": "https://drive.google.com/thumbnail?id=...",
      "embedUrl": "https://drive.google.com/file/d/.../preview"
    }
  ]
}
```

**Error Responses:**
- `400`: Missing/invalid folderId or apiKey, or API key format error
- `403`: Invalid token (in production)
- `500`: Google Drive API error or network error

**Example:**
```bash
curl -X POST http://localhost:3001/api/drive/fetch \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "folderId": "15p8KRq2np1fiClobWLDjOOAV95tBtorE",
    "apiKey": "AIzaSy..."
  }'
```

**Note:** This endpoint:
- Validates API key format (rejects Client Secrets starting with `GOCSPX-`)
- Fetches only video and image files from the specified folder
- Returns file metadata including thumbnails and embed URLs
- Handles CORS by proxying requests from the backend

---

## Webhook Endpoints

### Google Drive Webhook

Receive webhook notifications from Google Drive (for file uploads).

**Endpoint:** `POST /api/webhooks/drive`

**Authentication:** Optional (can use `WEBHOOK_SECRET` header)

**Request Headers:**
- `X-Webhook-Secret` (optional): Webhook secret for verification

**Request Body:**
```json
{
  "event": "file.created",
  "fileId": "google-drive-file-id",
  "folderId": "15p8KRq2np1fiClobWLDjOOAV95tBtorE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Success Response (200):**
```json
{
  "message": "Webhook received",
  "logged": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/webhooks/drive \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{
    "event": "file.created",
    "fileId": "google-drive-file-id",
    "folderId": "15p8KRq2np1fiClobWLDjOOAV95tBtorE"
  }'
```

---

### n8n Webhook

Receive webhook notifications from n8n workflows. Primarily used to store AI-generated captions.

**Endpoint:** `POST /api/webhooks/n8n`

**Authentication:** Optional (webhook secret recommended)

**Request Headers:**
- `X-Webhook-Secret` (optional): Webhook secret for verification

**Request Body:**
```json
{
  "event": "captions_generated",
  "data": {
    "driveFileId": "google-drive-file-id",
    "captions": [
      {
        "tone": "Professional",
        "content": "Your caption text here (minimum 10 characters)..."
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

**Alternative (using contentItemId UUID):**
```json
{
  "event": "captions_generated",
  "data": {
    "contentItemId": "uuid-from-database",
    "captions": [...]
  }
}
```

**Validation:**
- `event`: Required, should be `"captions_generated"`
- `data.captions`: Required, array of caption objects
- `data.driveFileId` OR `data.contentItemId`: Required (one or the other)
- Each caption must have:
  - `tone`: Required, one of `"Professional"`, `"Casual"`, `"Engaging"`
  - `content`: Required, minimum 10 characters

**Success Response (200):**
```json
{
  "received": true,
  "event": "captions_generated",
  "message": "Successfully stored 3 caption(s)",
  "contentItemId": "uuid-of-content-item",
  "captions": [
    {
      "id": "caption-uuid",
      "version": 1,
      "tone": "Professional",
      "content": "Your caption text here...",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `400`: Missing captions, no valid captions, or missing content item identifier
- `401`: Invalid webhook secret
- `404`: Content item not found (when using driveFileId)
- `500`: Internal server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{
    "event": "captions_generated",
    "data": {
      "driveFileId": "15p8KRq2np1fiClobWLDjOOAV95tBtorE",
      "captions": [
        {
          "tone": "Professional",
          "content": "This is a professional caption with enough characters to meet the minimum requirement."
        }
      ]
    }
  }'
```

**Note**: 
- Use `driveFileId` (Google Drive file ID) to link captions to content items
- The API will automatically look up the content item by `drive_file_id`
- Make sure the content item exists in the database before storing captions
- See `N8N_INTEGRATION_GUIDE.md` for detailed n8n workflow setup

---

## Health Check

### Check API Health

Check if the API and database are running.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (503):**
```json
{
  "status": "error",
  "database": "disconnected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/health
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```
or
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Content item not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An error occurred. Please try again."
}
```

### 503 Service Unavailable
```json
{
  "status": "error",
  "database": "disconnected"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints** (`/api/auth/*`): 5 requests per 15 minutes per IP
- **API endpoints** (`/api/*`): 100 requests per 15 minutes per IP

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## Data Models

### User
```typescript
{
  id: string (UUID)
  email: string
  name: string
  password_hash: string (not returned in API)
  created_at: ISO 8601 datetime
}
```

### Content Item
```typescript
{
  id: string (UUID)
  filename: string
  fileType: "video" | "image"
  uploadedAt: ISO 8601 datetime
  status: "pending_review" | "approved" | "published"
  driveUrl: string
  thumbnailUrl: string
  embedUrl: string
  mimeType: string
  captions: Caption[]
}
```

### Caption
```typescript
{
  id: string (UUID)
  contentItemId: string (UUID)
  version: number
  tone: "Professional" | "Casual" | "Engaging"
  content: string
  status: "pending" | "approved" | "rejected"
  createdAt: ISO 8601 datetime
  updatedAt: ISO 8601 datetime (optional)
  approvedBy: string | null
  approvedAt: ISO 8601 datetime | null
}
```

---

## Environment Variables

The API requires the following environment variables (in `server/.env`):

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=marketing_dashboard
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false

# Authentication
JWT_SECRET=your_jwt_secret_here

# Webhooks (optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/caption-approved
WEBHOOK_SECRET=your_webhook_secret
```

---

## Testing with cURL

### Complete Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.token')

# 3. Get current user
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Fetch files from Google Drive
curl -X POST http://localhost:3001/api/drive/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "folderId": "your-folder-id",
    "apiKey": "your-api-key"
  }'

# 5. Get all content
curl -X GET http://localhost:3001/api/content \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

You can import this API documentation into Postman or similar tools. All endpoints support:

- JSON request/response bodies
- Bearer token authentication
- Standard HTTP status codes
- CORS (if configured)

---

## Support

For issues or questions:
1. Check the error message in the response
2. Verify your authentication token is valid
3. Check that required environment variables are set
4. Ensure the database is running and accessible
5. Review server logs for detailed error information

---

**Last Updated:** 2024-01-01
**API Version:** 1.0.0

