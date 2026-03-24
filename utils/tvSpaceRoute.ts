export function buildSpaceRoute(mid: string | number): `/space/${string}` {
  const normalized = String(mid).trim();
  return `/space/${normalized}`;
}

export function normalizeSpaceMidParam(mid: string | string[] | undefined): string | null {
  if (Array.isArray(mid)) {
    const first = mid[0]?.trim();
    return first ? first : null;
  }
  const normalized = mid?.trim();
  return normalized ? normalized : null;
}
