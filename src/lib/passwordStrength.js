// Lightweight, dependency-free password-strength estimate for accessible
// sign-up feedback. Returns a 0-4 score plus a translation key and suggestion keys
// so the UI can render localized, screen-reader-friendly guidance.

export function evaluatePasswordStrength(password = "") {
  const value = String(password || "");
  const suggestions = [];

  if (!value) {
    return { score: 0, labelKey: "password_strength.empty", percent: 0, suggestions: [] };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  else suggestions.push("password_strength.suggest_length");

  if (value.length >= 12) score += 1;

  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_case");

  if (/\d/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_number");

  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_symbol");

  // Clamp to a 0-4 band.
  score = Math.min(4, score);

  const labelKey = [
    "password_strength.very_weak",
    "password_strength.weak",
    "password_strength.fair",
    "password_strength.good",
    "password_strength.strong",
  ][score];

  return {
    score,
    labelKey,
    percent: (score / 4) * 100,
    suggestions: suggestions.slice(0, 2),
  };
}

export function isPasswordAcceptable(password = "") {
  return evaluatePasswordStrength(password).score >= 2;
}
