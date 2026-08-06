export class ValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super("Please correct the highlighted fields.");
    this.name = "ValidationError";
  }
}

export function requiredText(value: FormDataEntryValue | null, label: string, maxLength = 160) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ValidationError({ [label]: `${label} is required.` });
  if (text.length > maxLength) throw new ValidationError({ [label]: `${label} must be ${maxLength} characters or fewer.` });
  return text;
}

export function optionalText(value: FormDataEntryValue | null, maxLength = 300) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > maxLength) throw new ValidationError({ value: `Value must be ${maxLength} characters or fewer.` });
  return text || null;
}

export function positiveNumber(value: FormDataEntryValue | null, label: string, allowZero = false) {
  const number = Number(typeof value === "string" ? value : NaN);
  const valid = Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
  if (!valid) throw new ValidationError({ [label]: `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.` });
  return number;
}

export function optionalEmail(value: FormDataEntryValue | null) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email) return null;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError({ email: "Enter a valid email address." });
  }
  return email;
}

export function safeNextPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
