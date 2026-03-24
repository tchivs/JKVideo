import { create } from 'zustand';
import type { VideoItem } from '../services/types';

interface PlaylistState {
  /** 当前播放列表 */
  videos: VideoItem[];
  /** 当前播放的视频在列表中的索引 */
  currentIndex: number;
  /** 列表是否还有更多数据可供加载 */
  hasMore: boolean;
  /** 触发加载更多的方法 */
  loadMoreFn?: (currentLength: number) => Promise<{ items: VideoItem[]; hasMore: boolean }>;

  setPlaylist: (
    videos: VideoItem[],
    index: number,
    hasMore?: boolean,
    loadMoreFn?: (currentLength: number) => Promise<{ items: VideoItem[]; hasMore: boolean }>
  ) => void;
  playNext: () => Promise<VideoItem | null>;
  playPrev: () => VideoItem | null;
  clear: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  videos: [],
  currentIndex: -1,
  hasMore: false,
  loadMoreFn: undefined,

  setPlaylist: (videos, index, hasMore = false, loadMoreFn) => {
    set({ videos, currentIndex: index, hasMore, loadMoreFn });
  },

  playNext: async () => {
    const { videos, currentIndex, hasMore, loadMoreFn } = get();
    // 列表为空或根本未初始化
    if (videos.length === 0 || currentIndex < 0) return null;

    const nextIdx = currentIndex + 1;
    // 有下一集，直接返回
    if (nextIdx < videos.length) {
      set({ currentIndex: nextIdx });
      return videos[nextIdx];
    }

    // 到了列表末尾且允许加载更多
    if (hasMore && loadMoreFn) {
      try {
        const res = await loadMoreFn(videos.length);
        if (res.items && res.items.length > 0) {
          const newVideos = [...videos, ...res.items];
          set({
            videos: newVideos,
            currentIndex: nextIdx,
            hasMore: res.hasMore,
          });
          return res.items[0];
        } else {
          set({ hasMore: false });
          return null;
        }
      } catch (e) {
        console.warn('playlist loadMore failed', e);
        return null; // 加载失败时不强制切回
      }
    }

    // 到底且无更多
    return null;
  },

  playPrev: () => {
    const { videos, currentIndex } = get();
    if (videos.length === 0 || currentIndex <= 0) return null;
    
    const prevIdx = currentIndex - 1;
    set({ currentIndex: prevIdx });
    return videos[prevIdx];
  },

  clear: () => {
    set({ videos: [], currentIndex: -1, hasMore: false, loadMoreFn: undefined });
  },
}));
