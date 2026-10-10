import { shootTypes, site } from "@/content/site";
import { formatShootDate, toWhatsAppDigits } from "@/lib/booking";

// Sends the studio an instant alert for each booking. Channels, in order:
//   1. WhatsApp via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
//      — env CALLMEBOT_APIKEY; CALLMEBOT_PHONE optionally overrides site.whatsapp.
//   2. Telegram bot — env TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (comma-separate for several chats).
// Telegram is used until CallMeBot is configured, and as a fallback if a WhatsApp send fails.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Best-effort per-instance rate limit — enough to blunt casual spam of the studio's phone.
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });

type Field = [label: string, value: string];

/** WhatsApp formatting: *bold*. Returns null when CallMeBot isn't configured. */
async function sendWhatsApp(fields: Field[], replyLink: string) {
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) return null;

  const text = [
    "📸 *New booking request* — website",
    "",
    ...fields.map(([label, value]) => `*${label}:* ${value}`),
    "",
    `Reply on WhatsApp: ${replyLink}`,
  ].join("\n");
  const to = process.env.CALLMEBOT_PHONE ?? `+${site.whatsapp}`;
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(to)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const reply = (await res.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const ok = res.ok && !/apikey is invalid|error/i.test(reply);
    if (!ok) console.error(`CallMeBot alert failed (${res.status}): ${reply.slice(0, 300)}`);
    return ok;
  } catch (err) {
    console.error("CallMeBot alert failed:", err);
    return false;
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Telegram HTML formatting. Returns null when the bot isn't configured. */
async function sendTelegram(fields: Field[], replyLink: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!token || chatIds.length === 0) return null;

  const text = [
    "📸 <b>New booking request</b> — website",
    "",
    ...fields.map(([label, value]) => `<b>${label}:</b> ${escapeHtml(value)}`),
    "",
    `<a href="${replyLink}">Reply on WhatsApp</a>`,
  ].join("\n");

  const results = await Promise.all(
    chatIds.map(async (chat_id) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
        if (!data?.ok) console.error(`Telegram alert to ${chat_id} failed (${res.status}): ${data?.description}`);
        return Boolean(data?.ok);
      } catch (err) {
        console.error(`Telegram alert to ${chat_id} failed:`, err);
        return false;
      }
    }),
  );
  return results.some(Boolean);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("forbidden", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_json", 400);
  }
  const str = (key: string, max: number) => (typeof body[key] === "string" ? body[key].trim().slice(0, max) : "");

  // Honeypot: real visitors never see this field, bots fill it. Pretend success.
  if (str("website", 200)) return Response.json({ ok: true });

  const shoot = str("shoot", 60);
  const date = str("date", 10);
  const name = str("name", 80);
  const customer = toWhatsAppDigits(str("phone", 20));
  if (
    !shootTypes.includes(shoot) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    !name ||
    !customer
  ) {
    return fail("invalid_booking", 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return fail("rate_limited", 429);

  const location = str("location", 120);
  const message = str("message", 600);
  const fields = [
    ["Shoot", shoot],
    ["Date", formatShootDate(date)],
    ["Time", str("time", 40) || "Not specified"],
    location ? ["Location", location] : null,
    ["Name", name],
    ["Phone", `+${customer}`],
    message ? ["Notes", message] : null,
  ].filter((f): f is Field => f !== null);
  const replyLink = `https://wa.me/${customer}`;

  const whatsapp = await sendWhatsApp(fields, replyLink);
  if (whatsapp) return Response.json({ ok: true, channel: "whatsapp" });

  const telegram = await sendTelegram(fields, replyLink);
  if (telegram) return Response.json({ ok: true, channel: "telegram" });

  if (whatsapp === null && telegram === null) return fail("not_configured", 503);
  return fail("send_failed", 502);
}
