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
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
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
    xs: 12,
    sm: 14,
    md: 16,
    base: 18,
    lg: 20,
    xl: 24,
    title: 28,
    heading: 32,
  },
  // ── 动画 ──
  timing: {
    /** 聚焦进入 */
    focusIn: 150,
    /** 聚焦离开（比进入快） */
    focusOut: 100,
    /** 内容淡入 */
    fadeIn: 300,
    /** 列表项交错延迟 */
    stagger: 60,
  },
  // ── 布局 ──
  layout: {
    /** 网格列间距 */
    gridGap: 16,
    /** 列表内边距 */
    listPadding: 16,
    /** 内容区水平内边距（TV 过扫描安全区，建议 48+） */
    contentPaddingH: 48,
    /** Header 垂直内边距 */
    headerPaddingV: 16,
  },
  // ── 侧边栏 ──
  sidebar: {
    width: 80,
  },
} as const;
