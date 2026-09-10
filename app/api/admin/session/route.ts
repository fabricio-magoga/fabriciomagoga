import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(1).max(256) });

function getClientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const { token } = tokenSchema.parse(await request.json());
    const result = await createAdminSession(token, getClientIp(request));

    if (result.rateLimited) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em 15 minutos." },
        { status: 429 },
      );
    }

    if (!result.ok) {
      return NextResponse.json({ message: "Token inválido." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(result.expiresAt),
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Token inválido." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor" },
      { status: 500 },
    );
  }
}
