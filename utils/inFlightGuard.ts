export async function runWithInFlightGuard<T>(
  flagRef: { current: boolean },
  task: () => Promise<T>,
): Promise<T | undefined> {
  if (flagRef.current) return undefined;
  flagRef.current = true;
  try {
    return await task();
  } finally {
    flagRef.current = false;
  }
}
