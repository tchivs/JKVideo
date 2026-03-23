/**
 * TV 版设计令牌。
 * 集中管理颜色、间距等，避免硬编码值散布各文件。
 */
export const TV = {
  // ── 颜色 ──
  color: {
    /** 主背景 */
    bg: '#121212',
    /** 卡片 / 面板 / 表面 */
    surface: '#1e1e1e',
    /** 侧边栏 / 标题栏 */
    surfaceAlt: '#1a1a1a',
    /** 输入框 / 二级面板 */
    surfaceLight: '#2a2a2a',
    /** 分割线 */
    border: '#333',
    /** 主视觉色 */
    accent: '#00AEEC',
    /** 主色弱化背景 */
    accentBg: '#1a3040',
    /** 危险/错误 */
    danger: '#ff4757',
    /** 主文本 */
    textPrimary: '#e0e0e0',
    /** 二级文本 */
    textSecondary: '#aaa',
    /** 三级/弱文本 */
    textTertiary: '#888',
    /** 最弱文本 */
    textDisabled: '#666',
    /** 占位/骨架 */
    placeholder: '#333',
    /** 纯白（叠加层文字等） */
    white: '#fff',
  },
  // ── 间距 ──
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 32,
  },
  // ── 圆角 ──
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 20,
    round: 9999,
  },
  // ── 字号 ──
  font: {
    xs: 10,
    sm: 11,
    md: 12,
    base: 13,
    lg: 14,
    xl: 15,
    title: 18,
    heading: 20,
  },
  // ── 侧边栏 ──
  sidebar: {
    width: 80,
  },
} as const;
