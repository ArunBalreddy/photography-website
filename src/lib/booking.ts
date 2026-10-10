// Shared by the booking form (client) and the /api/booking alert route (server).

export type Booking = {
  shoot: string;
  date: string;
  time: string;
  location: string;
  name: string;
  phone: string;
  message: string;
};

/** "2026-11-14" → "Sat, 14 Nov 2026" */
export function formatShootDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Normalise a customer's number to WhatsApp digits (country code, no "+"), assuming India for 10-digit numbers. */
export function toWhatsAppDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}
