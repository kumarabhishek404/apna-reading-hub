import app, { UPLOADS_DIR } from "./app";
import { getEnv } from "./lib/env";
import connectDB from "./lib/mongodb";

const env = getEnv();
const PORT = env.port;

let server: ReturnType<typeof app.listen> | null = null;

async function start() {
  if (env.isVercel) {
    // On Vercel the Express app is imported by the Next.js API catch-all.
    return;
  }

  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`[Backend] Reading Hub API on port ${PORT} (${env.nodeEnv})`);
    console.log(`[Backend] Uploads directory: ${UPLOADS_DIR}`);
  });
}

function shutdown(signal: string) {
  console.log(`[Backend] Received ${signal}, shutting down…`);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("unhandledRejection", (reason) => {
  console.error("[Backend] Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Backend] Uncaught exception:", error);
  if (env.isProd) process.exit(1);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((error) => {
  console.error("[Backend] Failed to start:", error);
  process.exit(1);
});

export default app;
