import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI ?? '';

if (!mongoUri) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}   
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
  clicks: { type: Number, default: 0 },
  lastClickedAt: { type: Date },
}, { timestamps: true });

const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    await dbConnect();
    const { shortId } = await params;
    const url = await Url.findOne({ shortUrl: shortId });

    if (!url) {
      return NextResponse.json({ message: 'URL not found' }, { status: 404 });
    }

    await Url.updateOne(
      { _id: url._id },
      { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } },
    );

    return NextResponse.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Ocorreu um erro interno no servidor' }, { status: 500 });
  }
}
