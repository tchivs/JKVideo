export type SearchVideoOrder = 'totalrank' | 'pubdate' | 'click' | 'stow' | 'dm';

export function buildSearchVideosParams(
  keyword: string,
  page: number,
  order: SearchVideoOrder,
): Record<string, string | number> {
  return {
    keyword,
    search_type: 'video',
    page,
    page_size: 20,
    order,
  };
}
