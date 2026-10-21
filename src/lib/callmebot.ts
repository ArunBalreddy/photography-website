import { site } from "@/content/site";

// WhatsApp alerts to the studio via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/).
// Needs CALLMEBOT_APIKEY set in Vercel; CALLMEBOT_PHONE optionally overrides site.whatsapp.

export type AlertResult = "sent" | "not_configured" | "failed";

export async function sendWhatsAppAlert(text: string): Promise<AlertResult> {
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) return "not_configured";

  const to = process.env.CALLMEBOT_PHONE ?? `+${site.whatsapp}`;
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(to)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const reply = (await res.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const ok = res.ok && !/apikey is invalid|error/i.test(reply);
    if (!ok) console.error(`CallMeBot alert failed (${res.status}): ${reply.slice(0, 300)}`);
    return ok ? "sent" : "failed";
  } catch (err) {
    console.error("CallMeBot alert failed:", err);
    return "failed";
  }
}
