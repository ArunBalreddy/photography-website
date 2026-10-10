import { shootTypes, site } from "@/content/site";
import { formatShootDate, toWhatsAppDigits } from "@/lib/booking";

// Sends the studio an instant WhatsApp alert for each booking via CallMeBot
// (https://www.callmebot.com/blog/free-api-whatsapp-messages/).
// Needs CALLMEBOT_APIKEY set in Vercel; CALLMEBOT_PHONE optionally overrides site.whatsapp.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Best-effort per-instance rate limit — enough to blunt casual spam of Nikhil's WhatsApp.
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });

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

  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) return fail("not_configured", 503);

  const location = str("location", 120);
  const message = str("message", 600);
  const text = [
    "📸 *New booking request* — website",
    "",
    `*Shoot:* ${shoot}`,
    `*Date:* ${formatShootDate(date)}`,
    `*Time:* ${str("time", 40) || "Not specified"}`,
    location ? `*Location:* ${location}` : null,
    `*Name:* ${name}`,
    `*Phone:* +${customer}`,
    message ? `*Notes:* ${message}` : null,
    "",
    `Reply on WhatsApp: https://wa.me/${customer}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const to = process.env.CALLMEBOT_PHONE ?? `+${site.whatsapp}`;
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(to)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const reply = (await res.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const ok = res.ok && !/apikey is invalid|error/i.test(reply);
    if (!ok) console.error(`CallMeBot alert failed (${res.status}): ${reply.slice(0, 300)}`);
    return ok ? Response.json({ ok: true }) : fail("send_failed", 502);
  } catch (err) {
    console.error("CallMeBot alert failed:", err);
    return fail("send_failed", 502);
  }
}
