import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'WATCH_HISTORY';
const PROGRESS_KEY = 'PLAYBACK_PROGRESS';
const SEARCH_HISTORY_KEY = 'SEARCH_HISTORY';
const MAX_HISTORY = 100;
const MAX_SEARCH_HISTORY = 20;

export interface HistoryItem {
  bvid: string;
  title: string;
  pic: string;
  ownerName: string;
  duration: number;
  /** 上次观看时间戳 (ms) */
  watchedAt: number;
}

interface ProgressMap {
  [bvid: string]: number; // seconds
}

interface HistoryState {
  /** 观看历史 */
  items: HistoryItem[];
  /** 播放进度 (bvid → seconds) */
  progress: ProgressMap;
  /** 搜索历史 */
  searchHistory: string[];

  /** 从 AsyncStorage 恢复 */
  restore: () => Promise<void>;
  /** 添加/更新一条观看记录 */
  addHistory: (item: Omit<HistoryItem, 'watchedAt'>) => Promise<void>;
  /** 清空历史 */
  clearHistory: () => Promise<void>;
  /** 保存播放进度 */
  saveProgress: (bvid: string, seconds: number) => Promise<void>;
  /** 获取播放进度 */
  getProgress: (bvid: string) => number;
  /** 添加搜索关键词 */
  addSearchHistory: (keyword: string) => Promise<void>;
  /** 清空搜索历史 */
  clearSearchHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  progress: {},
  searchHistory: [],

  restore: async () => {
    try {
      const [historyRaw, progressRaw, searchRaw] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(SEARCH_HISTORY_KEY),
      ]);
      const items: HistoryItem[] = historyRaw ? JSON.parse(historyRaw) : [];
      const progress: ProgressMap = progressRaw ? JSON.parse(progressRaw) : {};
      const searchHistory: string[] = searchRaw ? JSON.parse(searchRaw) : [];
      set({ items, progress, searchHistory });
    } catch {
      // 存储损坏时重置为空状态
      set({ items: [], progress: {}, searchHistory: [] });
    }
  },

  addHistory: async (item) => {
    const { items } = get();
    // 去重：移除已有同 bvid 的记录
    const filtered = items.filter(h => h.bvid !== item.bvid);
    const newItem: HistoryItem = { ...item, watchedAt: Date.now() };
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    set({ items: updated });
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // 存储写入失败，内存状态已更新
    }
  },

  clearHistory: async () => {
    set({ items: [] });
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {
      // 存储删除失败无害
    }
  },

  saveProgress: async (bvid, seconds) => {
    const { progress } = get();
    // 不保存 <5 秒的进度（刚开始看）
    if (seconds < 5) return;
    const updated = { ...progress, [bvid]: seconds };
    set({ progress: updated });
    try {
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    } catch {
      // 存储写入失败
    }
  },

  getProgress: (bvid) => {
    return get().progress[bvid] ?? 0;
  },

  addSearchHistory: async (keyword) => {
    const kw = keyword.trim();
    if (!kw) return;
    const { searchHistory } = get();
    const filtered = searchHistory.filter(k => k !== kw);
    const updated = [kw, ...filtered].slice(0, MAX_SEARCH_HISTORY);
    set({ searchHistory: updated });
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // 存储写入失败
    }
  },

  clearSearchHistory: async () => {
    set({ searchHistory: [] });
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // 存储删除失败无害
    }
  },
}));
