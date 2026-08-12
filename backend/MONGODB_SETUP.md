# MongoDB Migration Guide

This document explains how to set up MongoDB for both local development and production after migrating from Prisma/SQLite to MongoDB.

## Local Development Setup

### Option 1: Using Docker (Recommended)

1. Start MongoDB using Docker Compose:
   ```bash
   cd backend
   docker-compose up -d
   ```

2. Verify MongoDB is running:
   ```bash
   docker-compose ps
   ```

3. Create a `.env` file in the `backend/` directory:
   ```bash
   MONGODB_URI="mongodb://localhost:27017/reading-hub"
   PORT=4000
   FRONTEND_URL=https://reading-hub-web.onrender.com
   UPLOADS_DIR=./uploads
   ```

### Option 2: Using Local MongoDB Installation

If you have MongoDB installed locally:

1. Start MongoDB service:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

2. Create a `.env` file in the `backend/` directory:
   ```bash
   MONGODB_URI="mongodb://localhost:27017/reading-hub"
   PORT=4000
   FRONTEND_URL=https://reading-hub-web.onrender.com
   UPLOADS_DIR=./uploads
   ```

## Production Setup

### MongoDB Atlas (Recommended for Production)

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas

2. Create a new cluster:
   - Choose the free tier (M0)
   - Select a region closest to your users
   - Wait for cluster creation

3. Set up database access:
   - Create a database user with username and password
   - Choose "Read and write to any database" permission

4. Set up network access:
   - Add IP address `0.0.0.0/0` (allows access from anywhere)
   - Or add specific IP addresses for better security

5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Choose "Node.js" and version 6.0 or later
   - Copy the connection string

6. Update production environment variables:
   ```
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/reading-hub"
   PORT=4000
   FRONTEND_URL=https://reading-hub-web.onrender.com
   UPLOADS_DIR=./uploads
   ```

### Other MongoDB Hosting Options

- MongoDB Atlas (recommended)
- Render MongoDB
- DigitalOcean Managed MongoDB
- AWS DocumentDB
- Azure Cosmos DB (MongoDB API)

## Environment Variables

### Required Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 4000)
- `FRONTEND_URL`: Frontend application URL
- `UPLOADS_DIR`: Directory for file uploads

### Local Development .env Example
```env
MONGODB_URI="mongodb://localhost:27017/reading-hub"
PORT=4000
FRONTEND_URL=http://localhost:3000
UPLOADS_DIR=./uploads
```

### Production .env Example
```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/reading-hub"
PORT=4000
FRONTEND_URL=https://reading-hub-web.onrender.com
UPLOADS_DIR=./uploads
```

## Data Migration

Since MongoDB has a different data structure than the previous SQLite database, you'll need to migrate your existing data. Here's a suggested approach:

1. Export existing data from SQLite (if any)
2. Transform data to match MongoDB schema
3. Import into MongoDB using mongoimport or custom scripts

## Testing the Connection

Start the backend server:
```bash
cd backend
npm run dev
```

The server will connect to MongoDB on startup. Check the console for connection status.

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `docker-compose ps` or check service status
- Verify connection string format
- Check network/firewall settings
- Ensure MongoDB user has correct permissions

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Check TypeScript compilation: `npm run build`
- Verify MongoDB connection string is set

## Cleanup

To stop local MongoDB (Docker):
```bash
cd backend
docker-compose down
```

To remove MongoDB data:
```bash
cd backend
docker-compose down -v
```