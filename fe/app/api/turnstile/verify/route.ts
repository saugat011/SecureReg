// app/api/turnstile/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

const VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY!; // set in .env.local

export async function POST(request: NextRequest) {
  const { token } = (await request.json()) as { token?: string };

  if (!token) {
    return NextResponse.json({ success: false, error: "missing-token" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.append("secret", SECRET_KEY);
  params.append("response", token);

  const cfRes = await fetch(VERIFY_ENDPOINT, {
    method: "POST",
    body: params,
  });

  const data = await cfRes.json();

  return NextResponse.json(data, {
    status: data.success ? 200 : 400,
  });
}
