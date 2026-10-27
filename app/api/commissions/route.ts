import { put } from "@vercel/blob";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { CommissionRequestModel } from "@/lib/models/CommissionRequest";
import { notifyNewCommission } from "@/lib/notify";
import { createCommissionSchema, validateReferenceFiles } from "@/lib/validation/commission";

const TEXT_FIELDS = [
  "name",
  "email",
  "phone",
  "projectType",
  "size",
  "description",
  "colors",
  "referenceUrl",
  "budget",
  "deadline",
  "contactLanguage",
  "sourceArtwork",
  "website",
] as const;

export type CommissionApiResponse =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<CommissionApiResponse>(
      { ok: false, error: "Invalid form submission." },
      { status: 400 },
    );
  }

  const localeValue = String(formData.get("locale") ?? "");
  const locale = hasLocale(localeValue) ? localeValue : "en";
  const t = (await getDictionary(locale)).commission.errors;

  const raw = Object.fromEntries(TEXT_FIELDS.map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = createCommissionSchema(t).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([key, messages]) => [
        key,
        messages?.[0] ?? t.generic,
      ]),
    );
    // A filled honeypot means a bot: pretend success so it doesn't retry.
    if (fieldErrors.website) return NextResponse.json<CommissionApiResponse>({ ok: true, id: "ok" });
    return NextResponse.json<CommissionApiResponse>(
      { ok: false, error: t.generic, fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const files = formData
    .getAll("referenceImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const fileError = validateReferenceFiles(files, t);
  if (fileError) {
    return NextResponse.json<CommissionApiResponse>(
      { ok: false, error: fileError, fieldErrors: { referenceImages: fileError } },
      { status: 422 },
    );
  }

  try {
    const images = process.env.BLOB_READ_WRITE_TOKEN
      ? await Promise.all(
          files.map(async (file) => {
            const blob = await put(`commissions/${Date.now()}-${file.name}`, file, {
              access: "public",
              addRandomSuffix: true,
              contentType: file.type,
            });
            return { url: blob.url, pathname: blob.pathname, contentType: file.type, size: file.size };
          }),
        )
      : [];
    if (files.length > 0 && images.length === 0) {
      console.warn("[commissions] BLOB_READ_WRITE_TOKEN not set; reference images were not stored.");
    }

    await connectToDatabase();
    const doc = await CommissionRequestModel.create({
      client: {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        contactLanguage: data.contactLanguage,
      },
      project: {
        type: data.projectType,
        size: data.size,
        description: data.description,
        colors: data.colors || undefined,
        budget: data.budget,
        deadline: data.deadline ? new Date(`${data.deadline}T12:00:00Z`) : undefined,
      },
      references: {
        links: data.referenceUrl ? [data.referenceUrl] : [],
        images,
      },
      sourceArtwork: data.sourceArtwork || undefined,
      locale,
      status: "pending",
    });

    const id = doc._id.toString();
    // Respond right away; email/webhook delivery finishes after the response.
    after(() => notifyNewCommission({ ...data, id, imageUrls: images.map((image) => image.url) }));

    return NextResponse.json<CommissionApiResponse>({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("[commissions] Failed to save request:", error);
    return NextResponse.json<CommissionApiResponse>({ ok: false, error: t.generic }, { status: 500 });
  }
}
