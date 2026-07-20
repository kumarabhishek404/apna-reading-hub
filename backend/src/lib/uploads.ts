import fs from "fs";
import path from "path";

function resolveUploadsDir(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  // Vercel serverless filesystem is ephemeral; /tmp is writable
  if (process.env.VERCEL) return path.join("/tmp", "reading-hub-uploads");

  // backend/src/lib → backend/uploads (tsx / tsc)
  const fromBackendSrc = path.join(__dirname, "../../uploads");
  // frontend cwd on Vercel/local next → ../backend/uploads
  const fromFrontendCwd = path.join(process.cwd(), "..", "backend", "uploads");
  const fromRepoRoot = path.join(process.cwd(), "backend", "uploads");

  if (fs.existsSync(path.dirname(fromBackendSrc))) return fromBackendSrc;
  if (fs.existsSync(path.join(process.cwd(), "..", "backend"))) return fromFrontendCwd;
  return fromRepoRoot;
}

export const UPLOADS_DIR = resolveUploadsDir();

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
