#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required (PostgreSQL connection string)."
  exit 1
fi

echo "Syncing database schema..."
cd /app/backend
npx prisma db push --skip-generate

echo "Starting API on port 4000..."
# Platform PORT is reserved for the public Next.js process
PORT=4000 node dist/index.js &
API_PID=$!

echo "Waiting for API health..."
i=0
until node -e "fetch('http://127.0.0.1:4000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "ERROR: API failed to become healthy"
    kill "$API_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done
echo "API is healthy."

echo "Starting frontend on port ${PORT:-3000}..."
cd /app/frontend
exec npx next start -p "${PORT:-3000}"
