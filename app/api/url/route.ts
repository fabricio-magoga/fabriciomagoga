import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

const mongoUri = process.env.MONGO_URI ?? "";

if (!mongoUri) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local",
  );
}

// It's more efficient to reuse the connection
let conn: any = null;

async function dbConnect() {
  if (conn) {
    return conn;
  }
  conn = await mongoose.connect(mongoUri as string);
  return conn;
}

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});

const Url = mongoose.models.Url || mongoose.model("Url", urlSchema);

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
});

const RateLimit =
  mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

async function isRateLimited(key: string) {
  const now = Date.now();
  const record = await RateLimit.findOne({ key });

  if (!record || record.resetAt.getTime() <= now) {
    await RateLimit.findOneAndUpdate(
      { key },
      { count: 1, resetAt: new Date(now + RATE_LIMIT_WINDOW_MS) },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  await RateLimit.updateOne({ _id: record._id }, { $inc: { count: 1 } });
  return false;
}

async function generateUniqueShortUrl() {
  let shortUrl;
  let urlExists = true;
  while (urlExists) {
    shortUrl = Math.random().toString(36).substring(2, 8);
    const existingUrl = await Url.findOne({ shortUrl });
    if (!existingUrl) {
      urlExists = false;
    }
  }
  return shortUrl;
}

const urlValidationSchema = z.object({
  originalUrl: z
    .string()
    .url({ message: "URL inválida" })
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "A URL deve usar HTTP ou HTTPS"),
});

export async function POST(request: Request) {
  try {
    await dbConnect();

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (await isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          message:
            "Limite de solicitações excedido. Tente novamente em um minuto.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const body = await request.json();
    const { originalUrl } = urlValidationSchema.parse(body);

    const shortUrl = await generateUniqueShortUrl();
    const url = new Url({ originalUrl, shortUrl });
    await url.save();

    return NextResponse.json({ originalUrl, shortUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor" },
      { status: 500 },
    );
  }
}
