import { describe, expect, it } from 'vitest';
import { buildSearchVideosParams } from '../../utils/searchVideosParams';

describe('buildSearchVideosParams integration', () => {
  it('forwards selected sort order to search params', () => {
    const params = buildSearchVideosParams('test', 3, 'pubdate');

    expect(params.keyword).toBe('test');
    expect(params.page).toBe(3);
    expect(params.search_type).toBe('video');
    expect(params.order).toBe('pubdate');
  });

  it('supports click order for play-count sorting', () => {
    const params = buildSearchVideosParams('demo', 1, 'click');
    expect(params.order).toBe('click');
  });
});
