import { parsePhoneNumber } from "react-phone-number-input";

/**
 * Normalise un numéro pour PhoneInput (format E.164).
 * Si l’API renvoie un numéro local (ex. 97240460), on le convertit avec le pays par défaut
 * pour que le sélecteur de pays affiche correctement le drapeau.
 */
export function toE164(
  phone: string | null | undefined,
  defaultCountry: string = "TG"
): string | undefined {
  if (!phone || !phone.trim()) return undefined;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  try {
    const parsed = parsePhoneNumber(trimmed, defaultCountry as "TG");
    return parsed?.number;
  } catch {
    return undefined;
  }
}
