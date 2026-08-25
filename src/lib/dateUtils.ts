/**
 * Robust date normalization utilities to ensure 100% interoperability
 * between SQLite DATETIME strings (from SQLAlchemy/Alembic) and JavaScript Date / ISO strings.
 */

export function parseFlexibleDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  if (typeof val === "number") {
    // If Unix timestamp in seconds (< 1e11), convert to milliseconds
    const ms = val < 1e11 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === "string") {
    // Numeric string check
    if (/^\d+$/.test(val)) {
      const num = parseInt(val, 10);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }

    // Replace space with 'T' (e.g., "2026-08-23 19:40:00" -> "2026-08-23T19:40:00")
    const trimmed = val.trim();
    const normalized = trimmed.includes(" ") ? trimmed.replace(" ", "T") : trimmed;
    const withZ =
      normalized.endsWith("Z") || normalized.includes("+") || normalized.includes("-", 10)
        ? normalized
        : `${normalized}Z`;

    const d = new Date(withZ);
    if (!isNaN(d.getTime())) {
      return d;
    }

    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  return null;
}

export function safeToISOString(val: unknown, fallbackNow = false): string | null {
  const d = parseFlexibleDate(val);
  if (d) {
    return d.toISOString();
  }
  return fallbackNow ? new Date().toISOString() : null;
}

export function formatSQLiteDateTime(date: Date): string {
  // Format as standard ISO / SQLite datetime: YYYY-MM-DD HH:MM:SS
  return date.toISOString().replace("T", " ").substring(0, 19);
}
