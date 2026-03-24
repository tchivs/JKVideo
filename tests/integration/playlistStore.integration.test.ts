import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlaylistStore } from '../../store/playlistStore';
import type { VideoItem } from '../../services/types';

function makeVideo(id: number): VideoItem {
  return {
    bvid: `BV${id}`,
    aid: id,
    title: `video-${id}`,
    pic: `https://example.com/${id}.jpg`,
    owner: { mid: id, name: `owner-${id}`, face: '' },
    stat: {
      view: 0,
      danmaku: 0,
      reply: 0,
      like: 0,
      coin: 0,
      favorite: 0,
    },
    duration: 60,
    desc: '',
  };
}

describe('playlistStore integration', () => {
  beforeEach(() => {
    usePlaylistStore.getState().clear();
  });

  it('plays next item from existing playlist', async () => {
    const videos = [makeVideo(1), makeVideo(2), makeVideo(3)];
    usePlaylistStore.getState().setPlaylist(videos, 0, false);

    const next = await usePlaylistStore.getState().playNext();

    expect(next?.bvid).toBe('BV2');
    expect(usePlaylistStore.getState().currentIndex).toBe(1);
  });

  it('loads more when reaching end and hasMore is true', async () => {
    const initial = [makeVideo(1)];
    const loaded = [makeVideo(2), makeVideo(3)];
    const loadMoreFn = vi.fn(async () => ({ items: loaded, hasMore: false }));

    usePlaylistStore.getState().setPlaylist(initial, 0, true, loadMoreFn);
    const next = await usePlaylistStore.getState().playNext();

    expect(loadMoreFn).toHaveBeenCalledWith(1);
    expect(next?.bvid).toBe('BV2');
    expect(usePlaylistStore.getState().videos.map(v => v.bvid)).toEqual(['BV1', 'BV2', 'BV3']);
    expect(usePlaylistStore.getState().currentIndex).toBe(1);
    expect(usePlaylistStore.getState().hasMore).toBe(false);
  });

  it('does not move before first item on playPrev', () => {
    const videos = [makeVideo(1), makeVideo(2)];
    usePlaylistStore.getState().setPlaylist(videos, 0, false);

    const prev = usePlaylistStore.getState().playPrev();

    expect(prev).toBeNull();
    expect(usePlaylistStore.getState().currentIndex).toBe(0);
  });
});
