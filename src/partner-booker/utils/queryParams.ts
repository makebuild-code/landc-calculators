const CASE_INSENSITIVE = true;

// Must exist & be non-empty in the query string
const REQUIRED_QUERY_PARAMS = [
] as const;

// Must equal one of these values in the query string
const EXACT_QUERY_VALUES: Readonly<Record<string, readonly string[]>> = {
};

/** Utility: read a param. Makes sure that we're accountint for upper and lower case */
function getQP(sp: URLSearchParams, key: string): string | null {
  return sp.get(key) ?? sp.get(key.toLowerCase()) ?? sp.get(key.toUpperCase());
}

/** Normalise the string for comparison*/
function norm(v: string | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  return CASE_INSENSITIVE ? t.toLowerCase() : t;
}

/** Detailed check based on the hard-coded lists above */
export function checkProceedableFromQuery() {
  const sp = new URLSearchParams(window.location.search);
  const missing: string[] = [];
  const invalid: Array<{ key: string; got: string | null; allowed: string[] }> = [];

  // Presence
  for (const key of REQUIRED_QUERY_PARAMS) {
    const raw = getQP(sp, key);
    if (raw == null || raw.trim() === '') missing.push(key);
  }

  // Exact values
  for (const [key, allowed] of Object.entries(EXACT_QUERY_VALUES)) {
    const got = norm(getQP(sp, key));
    if (got == null) {
      invalid.push({ key, got: null, allowed: [...allowed] });
      continue;
    }
    const cmp = CASE_INSENSITIVE ? allowed.map((x) => x.toLowerCase()) : [...allowed];
    if (!cmp.includes(got)) invalid.push({ key, got, allowed: [...allowed] });
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}
