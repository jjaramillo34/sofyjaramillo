import "server-only";
import { Resend } from "resend";
import type { CommissionInput } from "@/lib/validation/commission";
import en from "@/lib/i18n/dictionaries/en";

type NewCommission = CommissionInput & {
  id: string;
  imageUrls: string[];
};

function summary(c: NewCommission): string {
  const t = en.commission;
  return [
    `New commission request (${c.id})`,
    "",
    `Name: ${c.name}`,
    `Email: ${c.email}`,
    `Phone / WhatsApp: ${c.phone || "—"}`,
    `Reply in: ${t.languages[c.contactLanguage]}`,
    "",
    `Project: ${t.projectTypes[c.projectType]}`,
    `Size: ${c.size}`,
    `Budget: ${t.budgets[c.budget]}`,
    `Deadline: ${c.deadline || "—"}`,
    `Colors: ${c.colors || "—"}`,
    c.sourceArtwork ? `Inspired by gallery piece: ${c.sourceArtwork}` : "",
    "",
    "Idea:",
    c.description,
    "",
    `Reference link: ${c.referenceUrl || "—"}`,
    ...c.imageUrls.map((url, i) => `Reference image ${i + 1}: ${url}`),
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

/**
 * Sends the studio notification through whichever channels are configured.
 * Each channel is optional and failures are logged, never thrown: the request
 * is already saved in MongoDB by the time this runs.
 */
export async function notifyNewCommission(commission: NewCommission): Promise<void> {
  const text = summary(commission);
  const tasks: Promise<unknown>[] = [];

  const { RESEND_API_KEY, COMMISSION_NOTIFY_EMAIL, COMMISSION_FROM_EMAIL, COMMISSION_WEBHOOK_URL } =
    process.env;

  if (RESEND_API_KEY && COMMISSION_NOTIFY_EMAIL) {
    const resend = new Resend(RESEND_API_KEY);
    tasks.push(
      resend.emails
        .send({
          from: COMMISSION_FROM_EMAIL ?? "Sofy Studio <onboarding@resend.dev>",
          to: COMMISSION_NOTIFY_EMAIL.split(",").map((s) => s.trim()),
          replyTo: commission.email,
          subject: `🎨 New commission: ${en.commission.projectTypes[commission.projectType]} — ${commission.name}`,
          text,
        })
        .then(({ error }) => {
          if (error) throw new Error(error.message);
        }),
    );
  }

  if (COMMISSION_WEBHOOK_URL) {
    tasks.push(
      fetch(COMMISSION_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `text` doubles as the message body for Slack/Discord-style incoming webhooks.
        body: JSON.stringify({ event: "commission.created", text, content: text, commission }),
      }).then((res) => {
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      }),
    );
  }

  if (tasks.length === 0) {
    console.warn("[commissions] No notification channel configured; request saved only.");
    return;
  }

  for (const result of await Promise.allSettled(tasks)) {
    if (result.status === "rejected") console.error("[commissions] Notification failed:", result.reason);
  }
}
