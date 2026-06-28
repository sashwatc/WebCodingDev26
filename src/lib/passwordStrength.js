// passwordStrength.js
// -----------------------------------------------------------------------------
// Lightweight, dependency-free password-strength estimate for accessible
// sign-up feedback. Returns a 0-4 score plus a translation key and suggestion keys
// so the UI can render localized, screen-reader-friendly guidance.

/**
 * Score a password 0-4 by accumulating points for length (>=8 and >=12),
 * mixed case, a digit, and a symbol. Missing criteria add (up to two)
 * suggestion keys. Empty input short-circuits to score 0.
 * @returns {object} { score (0-4), labelKey, percent (0-100), suggestions[] } —
 *   labelKey/suggestions are i18n keys for the UI to render.
 */
export function evaluatePasswordStrength(password = "") {
  const value = String(password || "");
  const suggestions = [];

  // Empty password: zero everything, no suggestions.
  if (!value) {
    return { score: 0, labelKey: "password_strength.empty", percent: 0, suggestions: [] };
  }

  let score = 0;
  // +1 for minimum length; otherwise suggest a longer password.
  if (value.length >= 8) score += 1;
  else suggestions.push("password_strength.suggest_length");

  // +1 bonus for a comfortably long password.
  if (value.length >= 12) score += 1;

  // +1 for mixing upper and lower case; otherwise suggest it.
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_case");

  // +1 for including a digit; otherwise suggest it.
  if (/\d/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_number");

  // +1 for including a symbol; otherwise suggest it.
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  else suggestions.push("password_strength.suggest_symbol");

  // Clamp to a 0-4 band.
  score = Math.min(4, score);

  // Map the numeric score to a label translation key.
  const labelKey = [
    "password_strength.very_weak",
    "password_strength.weak",
    "password_strength.fair",
    "password_strength.good",
    "password_strength.strong",
  ][score];

  // `percent` drives a strength meter; only the first two suggestions are kept.
  return {
    score,
    labelKey,
    percent: (score / 4) * 100,
    suggestions: suggestions.slice(0, 2),
  };
}

// Minimum bar for accepting a password at sign-up: score of at least 2 ("fair").
export function isPasswordAcceptable(password = "") {
  return evaluatePasswordStrength(password).score >= 2;
}
