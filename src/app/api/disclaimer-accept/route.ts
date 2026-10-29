import { NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, timestamp } = body;

    if (!address || !timestamp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const record = JSON.stringify({
      address,
      timestamp,
      ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    const logPath = join(process.cwd(), "disclaimer-acceptances.log");
    await appendFile(logPath, record + "\n", "utf-8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
