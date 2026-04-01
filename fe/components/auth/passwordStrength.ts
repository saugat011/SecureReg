export type PasswordStrengthLabel = "Very weak" | "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrength = {
  score: number; // 0..100
  label: PasswordStrengthLabel;
  suggestions: string[];
};

const COMMON_PATTERNS = ["password", "123456", "12345678", "qwerty", "admin", "letmein", "abc123"];

function hasCommonPattern(pw: string) {
  const x = pw.toLowerCase();
  return COMMON_PATTERNS.some((p) => x.includes(p));
}

export function evaluatePassword(pw: string, username?: string): PasswordStrength {
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const hasSpace = /\s/.test(pw);

  let score = 0;

  if (pw.length >= 8) score += 15;
  if (pw.length >= 12) score += 25;
  if (pw.length >= 16) score += 10;

  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasDigit) score += 10;
  if (hasSymbol) score += 15;

  if (!hasSpace) score += 5;

  if (hasCommonPattern(pw)) score -= 25;
  if (/1234|abcd|qwer/i.test(pw)) score -= 10;

  if (username) {
    const u = username.trim().toLowerCase();
    if (u && pw.toLowerCase().includes(u)) score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  let label: PasswordStrengthLabel = "Very weak";
  if (score >= 85) label = "Strong";
  else if (score >= 70) label = "Good";
  else if (score >= 55) label = "Fair";
  else if (score >= 35) label = "Weak";

  const suggestions: string[] = [];
  if (pw.length < 12) suggestions.push("Use at least 12 characters.");
  if (!hasLower) suggestions.push("Add a lowercase letter (a-z).");
  if (!hasUpper) suggestions.push("Add an uppercase letter (A-Z).");
  if (!hasDigit) suggestions.push("Add a number (0-9).");
  if (!hasSymbol) suggestions.push("Add a symbol (e.g., ! @ # %).");
  if (hasSpace) suggestions.push("Remove spaces.");
  if (hasCommonPattern(pw)) suggestions.push("Avoid common passwords/patterns.");
  if (username && pw.toLowerCase().includes(username.toLowerCase()))
    suggestions.push("Don’t include your username in the password.");

  return { score, label, suggestions };
}
