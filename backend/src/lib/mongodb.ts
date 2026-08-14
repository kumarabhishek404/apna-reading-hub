import mongoose from "mongoose";
import { getEnv } from "./env";

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

/**
 * Ensures a live mongoose connection before any model call.
 * Safe for Vercel serverless cold starts (cached across warm invocations).
 */
export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
  }

  if (!cached.promise) {
    const { mongodbUri, isProd, isVercel } = getEnv();
    cached.promise = mongoose
      .connect(mongodbUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: isProd || isVercel ? 8_000 : 10_000,
        // Keep pools modest on serverless; larger on long-lived hosts.
        maxPoolSize: isVercel ? 5 : 20,
        minPoolSize: isVercel ? 0 : 2,
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
