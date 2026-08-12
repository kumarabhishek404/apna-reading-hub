import type { NextApiRequest, NextApiResponse } from "next";
import app from "@backend/app";
import connectDB from "@backend/lib/mongodb";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

function isHealthPath(req: NextApiRequest) {
  const path = (req.url || "").split("?")[0];
  return path === "/api/health" || path === "/health";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isHealthPath(req)) {
    try {
      // Cold-start safety for Vercel: connect before Express handles DB routes.
      await connectDB();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Database connection failed";
      console.error("[api catch-all] MongoDB connection failed:", message);
      return res.status(503).json({ error: message });
    }
  }

  return app(req, res);
}
