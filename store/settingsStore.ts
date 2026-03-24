import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TV_SETTINGS_KEY = 'TV_SETTINGS';

interface DanmakuSettings {
  /** 弹幕透明度 0-1 */
  dmOpacity: number;
  /** 字体缩放 */
  dmFontScale: number;
  /** 显示区域比例 0-1 */
  dmAreaRatio: number;
  /** 屏蔽的弹幕模式 */
  dmFilterModes: number[];
  /** 弹幕开关 */
  dmEnabled: boolean;
}

interface SettingsState extends DanmakuSettings {
  coverQuality: 'hd' | 'normal';
  /** 默认播放清晰度 (qn) */
  defaultQn: number;

  setCoverQuality: (q: 'hd' | 'normal') => Promise<void>;
  setDefaultQn: (qn: number) => Promise<void>;
  setDmOpacity: (v: number) => Promise<void>;
  setDmFontScale: (v: number) => Promise<void>;
  setDmAreaRatio: (v: number) => Promise<void>;
  setDmFilterModes: (modes: number[]) => Promise<void>;
  setDmEnabled: (v: boolean) => Promise<void>;
  restore: () => Promise<void>;
}

/** 持久化当前 TV 设置到 AsyncStorage */
async function persistTvSettings(partial: Partial<DanmakuSettings & { defaultQn: number }>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TV_SETTINGS_KEY);
    const prev = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(TV_SETTINGS_KEY, JSON.stringify({ ...prev, ...partial }));
  } catch {
    // 存储写入失败无害
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  coverQuality: 'hd',
  defaultQn: 80,
  dmOpacity: 1,
  dmFontScale: 1,
  dmAreaRatio: 1,
  dmFilterModes: [],
  dmEnabled: true,

  setCoverQuality: async (q) => {
    try { await AsyncStorage.setItem('COVER_QUALITY', q); } catch { /* noop */ }
    set({ coverQuality: q });
  },

  setDefaultQn: async (qn) => {
    await persistTvSettings({ defaultQn: qn });
    set({ defaultQn: qn });
  },

  setDmOpacity: async (v) => {
    await persistTvSettings({ dmOpacity: v });
    set({ dmOpacity: v });
  },

  setDmFontScale: async (v) => {
    await persistTvSettings({ dmFontScale: v });
    set({ dmFontScale: v });
  },

  setDmAreaRatio: async (v) => {
    await persistTvSettings({ dmAreaRatio: v });
    set({ dmAreaRatio: v });
  },

  setDmFilterModes: async (modes) => {
    await persistTvSettings({ dmFilterModes: modes });
    set({ dmFilterModes: modes });
  },

  setDmEnabled: async (v) => {
    await persistTvSettings({ dmEnabled: v });
    set({ dmEnabled: v });
  },

  restore: async () => {
    try {
      const q = await AsyncStorage.getItem('COVER_QUALITY');
      if (q === 'hd' || q === 'normal') set({ coverQuality: q });
    } catch { /* noop */ }

    try {
      const raw = await AsyncStorage.getItem(TV_SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        set({
          ...(typeof s.defaultQn === 'number' && { defaultQn: s.defaultQn }),
          ...(typeof s.dmOpacity === 'number' && { dmOpacity: s.dmOpacity }),
          ...(typeof s.dmFontScale === 'number' && { dmFontScale: s.dmFontScale }),
          ...(typeof s.dmAreaRatio === 'number' && { dmAreaRatio: s.dmAreaRatio }),
          ...(Array.isArray(s.dmFilterModes) && { dmFilterModes: s.dmFilterModes }),
          ...(typeof s.dmEnabled === 'boolean' && { dmEnabled: s.dmEnabled }),
        });
      }
    } catch { /* noop */ }
  },
}));
