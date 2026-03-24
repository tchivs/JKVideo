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

export type PreferredCodec = 'auto' | 'avc' | 'hevc' | 'av1';

export type SponsorBlockCategory = 'sponsor' | 'selfpromo' | 'interaction' | 'intro' | 'outro' | 'preview' | 'filler' | 'music_offtopic';

export const ALL_SB_CATEGORIES: { key: SponsorBlockCategory; label: string }[] = [
  { key: 'sponsor', label: '赞助/广告' },
  { key: 'selfpromo', label: '自我推广' },
  { key: 'interaction', label: '互动提醒' },
  { key: 'intro', label: '片头' },
  { key: 'outro', label: '片尾' },
  { key: 'preview', label: '内容预览' },
  { key: 'filler', label: '填充内容' },
  { key: 'music_offtopic', label: '离题音乐' },
];

export interface ExtendedSettings {
  preferredCodec: PreferredCodec;
  autoPlayNext: boolean;
  ffPreview: boolean;
  startupAnim: boolean;
  miniProgressBar: boolean;
  autoHideControls: boolean;
  showPlayerTime: boolean;
  partitionOrder: number[];
  downKeyAction: 'controls' | 'nextVideo';
  nextVideoSource: 'uploader' | 'recommend';
  sponsorBlockEnabled: boolean;
  sponsorBlockCategories: SponsorBlockCategory[];
}

interface PersistedSettings extends DanmakuSettings, ExtendedSettings {
  defaultQn: number;
}

interface SettingsState extends DanmakuSettings, ExtendedSettings {
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
  
  setPreferredCodec: (v: PreferredCodec) => Promise<void>;
  setAutoPlayNext: (v: boolean) => Promise<void>;
  setFfPreview: (v: boolean) => Promise<void>;
  setStartupAnim: (v: boolean) => Promise<void>;
  setMiniProgressBar: (v: boolean) => Promise<void>;
  setAutoHideControls: (v: boolean) => Promise<void>;
  setShowPlayerTime: (v: boolean) => Promise<void>;
  setPartitionOrder: (v: number[]) => Promise<void>;
  setDownKeyAction: (v: 'controls' | 'nextVideo') => Promise<void>;
  setNextVideoSource: (v: 'uploader' | 'recommend') => Promise<void>;
  setSponsorBlockEnabled: (v: boolean) => Promise<void>;
  setSponsorBlockCategories: (v: SponsorBlockCategory[]) => Promise<void>;

  restore: () => Promise<void>;
}

/** 持久化当前 TV 设置到 AsyncStorage */
async function persistTvSettings(partial: Partial<PersistedSettings>): Promise<void> {
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
  preferredCodec: 'auto',
  autoPlayNext: false,
  ffPreview: true,
  startupAnim: true,
  miniProgressBar: true,
  autoHideControls: true,
  showPlayerTime: true,
  partitionOrder: [],
  downKeyAction: 'controls',
  nextVideoSource: 'uploader',
  sponsorBlockEnabled: true,
  sponsorBlockCategories: ['sponsor', 'selfpromo'] as SponsorBlockCategory[],

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

  setPreferredCodec: async (v) => { await persistTvSettings({ preferredCodec: v }); set({ preferredCodec: v }); },
  setAutoPlayNext: async (v) => { await persistTvSettings({ autoPlayNext: v }); set({ autoPlayNext: v }); },
  setFfPreview: async (v) => { await persistTvSettings({ ffPreview: v }); set({ ffPreview: v }); },
  setStartupAnim: async (v) => { await persistTvSettings({ startupAnim: v }); set({ startupAnim: v }); },
  setMiniProgressBar: async (v) => { await persistTvSettings({ miniProgressBar: v }); set({ miniProgressBar: v }); },
  setAutoHideControls: async (v) => { await persistTvSettings({ autoHideControls: v }); set({ autoHideControls: v }); },
  setShowPlayerTime: async (v) => { await persistTvSettings({ showPlayerTime: v }); set({ showPlayerTime: v }); },
  setPartitionOrder: async (v) => { await persistTvSettings({ partitionOrder: v }); set({ partitionOrder: v }); },
  setDownKeyAction: async (v) => { await persistTvSettings({ downKeyAction: v }); set({ downKeyAction: v }); },
  setNextVideoSource: async (v) => { await persistTvSettings({ nextVideoSource: v }); set({ nextVideoSource: v }); },
  setSponsorBlockEnabled: async (v) => { await persistTvSettings({ sponsorBlockEnabled: v } as any); set({ sponsorBlockEnabled: v }); },
  setSponsorBlockCategories: async (v) => { await persistTvSettings({ sponsorBlockCategories: v } as any); set({ sponsorBlockCategories: v }); },

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
          ...(typeof s.preferredCodec === 'string' && { preferredCodec: s.preferredCodec }),
          ...(typeof s.autoPlayNext === 'boolean' && { autoPlayNext: s.autoPlayNext }),
          ...(typeof s.ffPreview === 'boolean' && { ffPreview: s.ffPreview }),
          ...(typeof s.startupAnim === 'boolean' && { startupAnim: s.startupAnim }),
          ...(typeof s.miniProgressBar === 'boolean' && { miniProgressBar: s.miniProgressBar }),
          ...(typeof s.autoHideControls === 'boolean' && { autoHideControls: s.autoHideControls }),
          ...(typeof s.showPlayerTime === 'boolean' && { showPlayerTime: s.showPlayerTime }),
          ...(Array.isArray(s.partitionOrder) && { partitionOrder: s.partitionOrder }),
          ...(typeof s.downKeyAction === 'string' && { downKeyAction: s.downKeyAction as any }),
          ...(typeof s.nextVideoSource === 'string' && { nextVideoSource: s.nextVideoSource as any }),
          ...(typeof s.sponsorBlockEnabled === 'boolean' && { sponsorBlockEnabled: s.sponsorBlockEnabled }),
          ...(Array.isArray(s.sponsorBlockCategories) && { sponsorBlockCategories: s.sponsorBlockCategories }),
        });
      }
    } catch { /* noop */ }
  },
}));
