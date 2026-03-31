import { NextResponse } from "next/server";
import { dealerFormSchema, DEALER_ATTACHMENT_MAX_SIZE, DEALER_ATTACHMENT_ACCEPTED_TYPES } from "@/lib/validations";

function isHoneypotTripped(honeypot: unknown): boolean {
  return typeof honeypot === "string" && honeypot.trim() !== "";
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const honeypot = formData.get("honeypot");
    if (isHoneypotTripped(honeypot)) {
      return NextResponse.json({}, { status: 200 });
    }

    const body = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      company: formData.get("company") || undefined,
      message: formData.get("message") || undefined,
      consent: formData.get("consent") === "true",
      honeypot: (formData.get("honeypot") as string) || undefined,
    };

    const parsed = dealerFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const attachment = formData.get("attachment") as File | null;
    if (attachment && attachment.size > 0) {
      if (!DEALER_ATTACHMENT_ACCEPTED_TYPES.includes(attachment.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
      }
      if (attachment.size > DEALER_ATTACHMENT_MAX_SIZE) {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
      }
    }

    const strapiUrl = process.env.STRAPI_INTERNAL_URL || "http://cms:1337";
    const token = process.env.STRAPI_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { consent: _c, honeypot: _h, email, message, company, ...rest } = parsed.data;
    const leadData: Record<string, unknown> = {
      type: "dealer",
      name: rest.name,
      phone: rest.phone,
    };
    if (email) leadData.email = email;
    if (message) leadData.message = message;
    if (company) leadData.company = company;

    const leadRes = await fetch(`${strapiUrl.replace(/\/$/, "")}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: leadData }),
    });

    if (!leadRes.ok) {
      const text = await leadRes.text();
      console.error("Strapi POST /api/leads failed", leadRes.status, text);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    if (attachment && attachment.size > 0) {
      const leadJson = await leadRes.json();
      const leadId = leadJson.data?.id;

      if (leadId) {
        const uploadForm = new FormData();
        uploadForm.append("files", attachment, attachment.name);
        uploadForm.append("ref", "api::lead.lead");
        uploadForm.append("refId", String(leadId));
        uploadForm.append("field", "attachment");

        const uploadRes = await fetch(`${strapiUrl.replace(/\/$/, "")}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          console.error("Strapi file upload failed", uploadRes.status, text);
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
