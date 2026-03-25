import { TV } from '../constants/tvTheme';

export type HomeMode = 'recommend' | 'hot' | 'live';

export const HOME_MODE_ITEMS = [
  { key: 'recommend' as const, label: '推荐', icon: 'sparkles-outline', color: TV.color.accent },
  { key: 'hot' as const, label: '热门', icon: 'flame-outline', color: TV.color.hot },
  { key: 'live' as const, label: '直播', icon: 'radio-outline', color: TV.color.premium },
];

export const NAV_ITEMS = [
  { key: 'history', label: '历史', icon: 'time-outline', route: '/history', color: TV.color.success },
  { key: 'favorites', label: '收藏', icon: 'star-outline', route: '/favorites', color: TV.color.gold },
  { key: 'following', label: '追番', icon: 'heart-outline', route: '/following', color: TV.color.hot },
  { key: 'partition', label: '分区', icon: 'grid-outline', route: '/partition', color: TV.color.info },
  { key: 'ranking', label: '排行', icon: 'trophy-outline', route: '/ranking', color: TV.color.textPrimary },
] as const;

export const SETTINGS_ITEM = {
  key: 'settings',
  label: '设置',
  icon: 'settings-outline',
  route: '/settings',
  color: TV.color.textPrimary,
} as const;

export function isHomeMode(value: string | undefined): value is HomeMode {
  return value === 'recommend' || value === 'hot' || value === 'live';
}
