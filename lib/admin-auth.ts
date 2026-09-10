import crypto from "node:crypto";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI ?? "";

if (!mongoUri) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local",
  );
}

let connection: typeof mongoose | null = null;

async function dbConnect() {
  if (connection) return connection;
  connection = await mongoose.connect(mongoUri);
  return connection;
}

const adminSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const adminAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true, expires: 0 },
});

const AdminSession =
  mongoose.models.AdminSession ||
  mongoose.model("AdminSession", adminSessionSchema);
const AdminAttempt =
  mongoose.models.AdminAttempt ||
  mongoose.model("AdminAttempt", adminAttemptSchema);

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function createAdminSession(providedToken: string, ip: string) {
  await dbConnect();

  const now = Date.now();
  const attemptKey = hash(`admin-attempt:${ip}`);
  const attempt = await AdminAttempt.findOne({ key: attemptKey });
  const expectedToken = process.env.ADMIN_TOKEN ?? "";
  const tokenIsValid = Boolean(expectedToken) && safeEqual(providedToken, expectedToken);

  if (
    !tokenIsValid &&
    attempt &&
    attempt.resetAt.getTime() > now &&
    attempt.count >= MAX_AUTH_ATTEMPTS
  ) {
    return { ok: false, rateLimited: true };
  }

  if (tokenIsValid) {
    await AdminAttempt.deleteOne({ key: attemptKey });
  } else if (!attempt || attempt.resetAt.getTime() <= now) {
    await AdminAttempt.findOneAndUpdate(
      { key: attemptKey },
      { count: 1, resetAt: new Date(now + AUTH_WINDOW_MS) },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } else {
    await AdminAttempt.updateOne({ _id: attempt._id }, { $inc: { count: 1 } });
  }

  if (!tokenIsValid) {
    return { ok: false, rateLimited: false };
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  await AdminSession.create({
    tokenHash: hash(sessionToken),
    expiresAt: new Date(now + SESSION_DURATION_MS),
  });

  return { ok: true, sessionToken, expiresAt: now + SESSION_DURATION_MS };
}

export async function isValidAdminSession(sessionToken: string | undefined) {
  if (!sessionToken) return false;
  await dbConnect();
  const session = await AdminSession.findOne({
    tokenHash: hash(sessionToken),
    expiresAt: { $gt: new Date() },
  });
  return Boolean(session);
}
