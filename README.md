# Reading Hub

A personal knowledge library monorepo with separate **frontend** (Next.js) and **backend** (Express API) packages.

Save and organize blog articles, website links, PDF documents, and personal notes — no authentication required.

## Monorepo Structure

```
apna-reading-hub/
├── frontend/          # Next.js 15+ UI (port 3000)
├── backend/           # Express REST API (port 4000)
│   ├── prisma/        # SQLite database schema & migrations
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic
│   │   └── lib/       # Prisma client, utilities
│   └── uploads/       # PDF file storage
└── package.json       # Root workspace scripts
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express, TypeScript, Prisma ORM |
| Database | **SQLite** (free, local, no external services) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all workspace dependencies
npm install

# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Run database migrations
npm run db:migrate

# Start both frontend and backend
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

### Run Individually

```bash
npm run dev:frontend   # Next.js only (port 3000)
npm run dev:backend    # Express API only (port 4000)
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/blogs` | GET, POST, PATCH, DELETE | Blog CRUD |
| `/api/links` | GET, POST, PATCH, DELETE | Link CRUD |
| `/api/pdfs` | GET, POST, PATCH, DELETE | PDF CRUD |
| `/api/pdfs/upload` | POST | Upload PDF (multipart) |
| `/api/notes` | GET, POST, PATCH, DELETE | Note CRUD |
| `/api/notes/:id?format=markdown` | GET | Export note as Markdown |
| `/api/search?q=` | GET | Global search |
| `/api/tags` | GET | List tags with counts |
| `/api/dashboard` | GET | Dashboard stats & recent items |
| `/uploads/*` | GET | Serve uploaded PDF files |

## Database

SQLite is used — completely free with no cloud setup. The database file is created at `backend/prisma/dev.db` after running migrations.

```bash
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Prisma Studio GUI
```

## Environment Variables

**backend/.env**
```
DATABASE_URL="file:./dev.db"
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Features

- Dashboard with stats, recent items, and favorites
- Blogs, Links, PDFs, Notes collections with full CRUD
- Global instant search
- Tag filtering across all content
- Markdown notes with preview and export
- PDF upload and in-browser viewing
- PWA support (installable app)
- Favorites, pinned notes, copy link button

## Deploy to Render

See **[DEPLOY.md](./DEPLOY.md)** for full step-by-step instructions.

Quick start: push to GitHub → Render **+ New** → **Blueprint** → connect repo → set env vars → deploy.

## License

MIT
