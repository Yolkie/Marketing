# Repository Structure

This document explains the organization of files in this repository.

## 📁 Directory Structure

```
Marketing-Dashboard/
│
├── 📄 Root Files
│   ├── README.md                    # Main project documentation
│   ├── API_DOCUMENTATION.md         # Complete API reference
│   ├── GITHUB_SETUP.md             # GitHub upload guide
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── tsconfig.json               # TypeScript config
│   └── index.html                  # HTML entry point
│
├── 📂 src/                          # Frontend source code
│   ├── components/                 # React components
│   │   ├── ContentReviewDashboard.jsx
│   │   └── LoginComponent.jsx
│   ├── contexts/                   # React contexts
│   │   └── ThemeContext.jsx
│   ├── api-config.js               # API configuration
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
│
├── 📂 server/                       # Backend API
│   ├── index.js                    # Express server
│   ├── package.json                # Backend dependencies
│   │
│   ├── 📂 database/                 # Database schemas
│   │   ├── complete_schema.sql     # Full database schema
│   │   ├── schema.sql              # Basic schema
│   │   └── init_users.sql          # User initialization
│   │
│   ├── 📂 middleware/               # Express middleware
│   │   ├── errorHandler.js         # Error handling
│   │   ├── security.js             # Security middleware
│   │   └── validation.js           # Input validation
│   │
│   └── 📂 scripts/                  # Utility scripts
│       └── verify-caption-links.js  # Data integrity verification
│
└── 📂 docs/                         # Documentation
    ├── README.md                    # Documentation index
    ├── STRUCTURE.md                 # This file
    │
    ├── 📂 n8n/                      # n8n integration documentation
    │   ├── N8N_INTEGRATION_GUIDE.md      # Setup guide
    │   ├── N8N_DATA_INTEGRITY_GUIDE.md  # Data integrity
    │   ├── N8N_MIGRATION_GUIDE.md        # Migration guide
    │   ├── N8N_WORKFLOW_MODIFIED.md       # API-integrated workflow
    │   └── N8N_WORKFLOW_REFERENCE.md       # Original workflow
    │
    └── 📂 archive/                   # Archived documentation
        └── (old/debug documentation files)
```

## 📋 File Categories

### Core Application Files
- **Frontend**: `src/` - React application
- **Backend**: `server/` - Express API server
- **Config**: Root level config files (vite, tailwind, typescript)

### Documentation Files
- **Main Docs**: Root level `.md` files (README, API docs)
- **n8n Docs**: `docs/n8n/` - n8n integration guides
- **Archive**: `docs/archive/` - Old/debug documentation

### Database Files
- **Schemas**: `server/database/` - SQL schema files
- **Scripts**: `server/scripts/` - Database utility scripts

## 🔍 Finding Files

### Documentation
- **Getting Started**: See `README.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **n8n Setup**: See `docs/n8n/N8N_INTEGRATION_GUIDE.md`
- **GitHub Setup**: See `GITHUB_SETUP.md`

### Code
- **Frontend Components**: `src/components/`
- **Backend Routes**: `server/index.js`
- **Database Schema**: `server/database/complete_schema.sql`
- **Middleware**: `server/middleware/`

### Configuration
- **Frontend Config**: `vite.config.js`, `tailwind.config.js`
- **TypeScript Config**: `tsconfig.json`, `tsconfig.node.json`
- **Package Files**: `package.json`, `server/package.json`

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `ContentReviewDashboard.jsx`)
- **Utilities**: camelCase (e.g., `api-config.js`)
- **Documentation**: UPPERCASE_WITH_UNDERSCORES (e.g., `API_DOCUMENTATION.md`)
- **Config Files**: lowercase (e.g., `vite.config.js`)

## 🗑️ Excluded Files

The following are excluded from Git (see `.gitignore`):
- `.env` files (environment variables)
- `node_modules/` (dependencies)
- `dist/`, `build/` (build outputs)
- Log files, IDE files, OS files

## 📦 Dependencies

### Frontend (`package.json`)
- React 18
- Vite
- Tailwind CSS
- TypeScript
- Lucide React

### Backend (`server/package.json`)
- Express.js
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- bcryptjs
- dotenv

---

**Last Updated**: 2024-01-01

