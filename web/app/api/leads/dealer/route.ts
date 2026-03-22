import { NextResponse } from "next/server";
import { dealerFormSchema } from "@/lib/validations";

function isHoneypotTripped(body: unknown): boolean {
  if (typeof body !== "object" || body === null || !("honeypot" in body)) return false;
  const hp = (body as { honeypot?: unknown }).honeypot;
  return typeof hp === "string" && hp.trim() !== "";
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (isHoneypotTripped(body)) {
      return NextResponse.json({}, { status: 200 });
    }

    const parsed = dealerFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { honeypot: _h, consent: _c, email, message, company, ...rest } = parsed.data;
    const strapiUrl = process.env.STRAPI_INTERNAL_URL || "http://cms:1337";
    const token = process.env.STRAPI_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const data: Record<string, unknown> = {
      type: "dealer",
      name: rest.name,
      phone: rest.phone,
    };
    if (email) data.email = email;
    if (message) data.message = message;
    if (company) data.company = company;

    const res = await fetch(`${strapiUrl.replace(/\/$/, "")}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Strapi POST /api/leads failed", res.status, text);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
