import { describe, expect, it, vi } from 'vitest';
import { runWithInFlightGuard } from '../../utils/inFlightGuard';
import { buildSpaceRoute, normalizeSpaceMidParam } from '../../utils/tvSpaceRoute';

describe('tv space flow integration', () => {
  it('prevents duplicate in-flight fetch execution', async () => {
    const guard = { current: false };
    let firstRun = true;
    const worker = vi.fn(async () => {
      if (firstRun) {
        firstRun = false;
        await new Promise<void>(resolve => setTimeout(resolve, 20));
      }
      return 'done';
    });

    const first = runWithInFlightGuard(guard, worker);
    const second = runWithInFlightGuard(guard, worker);

    expect(worker).toHaveBeenCalledTimes(1);
    expect(await second).toBeUndefined();
    await first;

    const third = await runWithInFlightGuard(guard, worker);
    expect(third).toBe('done');
    expect(worker).toHaveBeenCalledTimes(2);
  });

  it('keeps uploader mid route chain stable', () => {
    const route = buildSpaceRoute(123456);
    expect(route).toBe('/space/123456');

    const extracted = normalizeSpaceMidParam('123456');
    expect(extracted).toBe('123456');

    const fromArray = normalizeSpaceMidParam([' 987654 ', 'fallback']);
    expect(fromArray).toBe('987654');
  });

  it('rejects empty mid params', () => {
    expect(normalizeSpaceMidParam('')).toBeNull();
    expect(normalizeSpaceMidParam(['   '])).toBeNull();
    expect(normalizeSpaceMidParam(undefined)).toBeNull();
  });
});
