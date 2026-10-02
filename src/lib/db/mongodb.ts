import mongoose from "mongoose";

/**
 * MongoDB Atlas Connection Manager with Mongoose connection pooling for Next.js App Router
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define MONGODB_URI in your environment variables (.env.local / production settings)"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: process.env.MONGODB_DB_NAME || "restaurant_pos",
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Executes an operation inside a MongoDB session transaction if supported (replica set),
 * otherwise falls back to a direct execution if standalone dev database.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const mongooseInstance = await connectToDatabase();
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongooseInstance.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error: unknown) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // If standalone MongoDB does not support transactions, fallback gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Transactions are not supported")) {
      return await fn(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
