// Helpers for name + phone + PIN authentication.
// Supabase Auth needs an email/password underneath, so we synthesise a
// non-routable email from the phone number, and use `phone:pin` as the
// password. Users never see any of this — they only see phone + PIN.

export const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India", digits: [10, 10] as [number, number] },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada", digits: [10, 10] as [number, number] },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom", digits: [10, 10] as [number, number] },
  { code: "+61", flag: "🇦🇺", name: "Australia", digits: [9, 9] as [number, number] },
  { code: "+65", flag: "🇸🇬", name: "Singapore", digits: [8, 8] as [number, number] },
  { code: "+971", flag: "🇦🇪", name: "UAE", digits: [9, 9] as [number, number] },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh", digits: [10, 10] as [number, number] },
  { code: "+977", flag: "🇳🇵", name: "Nepal", digits: [10, 10] as [number, number] },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka", digits: [9, 9] as [number, number] },
];

export function validatePhone(dial: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  const rule = COUNTRY_CODES.find((c) => c.code === dial);
  if (!rule) return { ok: false as const, msg: "Pick a country" };
  const [min, max] = rule.digits;
  if (digits.length < min || digits.length > max) {
    return { ok: false as const, msg: `Enter ${min === max ? min : `${min}\u2013${max}`} digits after ${dial}` };
  }
  return { ok: true as const, digits };
}

/** Full E.164 e.g. +919876543210 */
export function toE164(dial: string, digits: string) {
  return `${dial}${digits}`;
}

/** Synthetic, non-routable email used only inside Supabase Auth. */
export function syntheticEmail(e164: string) {
  return `writer${e164.replace(/[^0-9]/g, "")}@shraddha.local`;
}

/** Composite password = e164 + ":" + pin. Elder-friendly (short PIN) but not just 4 digits when hashed. */
export function composePassword(e164: string, pin: string) {
  return `${e164}:${pin}`;
}

export function isValidPin(pin: string) {
  return /^\d{4}$/.test(pin);
}
