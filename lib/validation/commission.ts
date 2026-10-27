import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export const projectTypes = ["canvas", "sneakers", "clothing", "drawing", "other"] as const;
export const budgetRanges = ["under50", "50to100", "100to250", "250plus", "unsure"] as const;
export const contactLanguages = ["en", "es"] as const;

export type ProjectType = (typeof projectTypes)[number];
export type BudgetRange = (typeof budgetRanges)[number];

export const REFERENCE_IMAGE_LIMITS = {
  maxFiles: 3,
  // Vercel Functions accept request bodies up to 4.5 MB; leave headroom for the text fields.
  maxTotalBytes: 4 * 1024 * 1024,
} as const;

type ErrorMessages = Dictionary["commission"]["errors"];

/**
 * One schema for client and server. The messages come from the dictionary,
 * so validation errors appear in the visitor's language on both sides.
 */
export function createCommissionSchema(t: ErrorMessages) {
  const optionalText = (max: number) => z.string().trim().max(max, { error: t.tooLong });

  return z.object({
    name: z.string().trim().min(2, { error: t.nameRequired }).max(100, { error: t.tooLong }),
    email: z.string().trim().pipe(z.email({ error: t.emailInvalid })),
    phone: optionalText(20).refine((v) => v === "" || /^\+?[\d\s().-]{7,20}$/.test(v), {
      error: t.phoneInvalid,
    }),
    projectType: z.enum(projectTypes, { error: t.projectTypeRequired }),
    size: z.string().trim().min(1, { error: t.sizeRequired }).max(80, { error: t.tooLong }),
    description: z
      .string()
      .trim()
      .min(20, { error: t.descriptionShort })
      .max(2000, { error: t.descriptionLong }),
    colors: optionalText(300),
    referenceUrl: optionalText(500).refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), {
      error: t.urlInvalid,
    }),
    budget: z.enum(budgetRanges, { error: t.budgetRequired }),
    deadline: z
      .string()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: t.deadlinePast })
      .refine((v) => v === "" || v >= new Date().toISOString().slice(0, 10), {
        error: t.deadlinePast,
      }),
    contactLanguage: z.enum(contactLanguages, { error: t.languageRequired }),
    sourceArtwork: optionalText(120),
    // Honeypot: real visitors never see or fill this field.
    website: z.string().max(0),
  });
}

export type CommissionInput = z.infer<ReturnType<typeof createCommissionSchema>>;

/** Returns the first error message that applies to the attached files, if any. */
export function validateReferenceFiles(
  files: Pick<File, "type" | "size">[],
  t: ErrorMessages,
): string | null {
  if (files.length > REFERENCE_IMAGE_LIMITS.maxFiles) return t.tooManyFiles;
  if (files.some((file) => !file.type.startsWith("image/"))) return t.fileType;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > REFERENCE_IMAGE_LIMITS.maxTotalBytes) return t.fileTooLarge;
  return null;
}
