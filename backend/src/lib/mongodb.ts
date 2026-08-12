import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __readingHubMongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__readingHubMongoose ?? {
  conn: null,
  promise: null,
};

if (!global.__readingHubMongoose) {
  global.__readingHubMongoose = cached;
}

function resolveMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return uri;

  // Local/dev fallback only — never silently use localhost on Vercel.
  if (process.env.VERCEL) {
    throw new Error(
      "MONGODB_URI is not set. Add it in Vercel → Project Settings → Environment Variables."
    );
  }

  return "mongodb://localhost:27017/reading-hub";
}

/**
 * Ensures a live mongoose connection before any model call.
 * Safe for Vercel serverless cold starts (cached across warm invocations).
 */
export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a previous attempt failed or the socket dropped, clear and reconnect.
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
  }

  if (!cached.promise) {
    const uri = resolveMongoUri();
    cached.promise = mongoose
      .connect(uri, {
        // With buffering off, callers MUST await connectDB() first (see ensureDb middleware).
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
        retryWrites: true,
      })
      .then((instance) => instance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

export function getDbReadyState() {
  return mongoose.connection.readyState;
}

export default connectDB;
