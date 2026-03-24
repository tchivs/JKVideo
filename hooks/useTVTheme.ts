import { useMemo } from 'react';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from './useTVLayout';

function scaleToken(value: number, factor: number, min: number): number {
  return Math.max(min, Math.round(value * factor));
}

export function useTVTheme() {
  const { isCompact, isMedium, sidebarWidth } = useTVLayout();

  return useMemo(() => {
    const factor = isCompact ? 0.78 : isMedium ? 0.9 : 1;

    return {
      ...TV,
      space: {
        xs: scaleToken(TV.space.xs, factor, 6),
        sm: scaleToken(TV.space.sm, factor, 8),
        md: scaleToken(TV.space.md, factor, 10),
        lg: scaleToken(TV.space.lg, factor, 14),
        xl: scaleToken(TV.space.xl, factor, 20),
        xxl: scaleToken(TV.space.xxl, factor, 28),
      },
      font: {
        xs: scaleToken(TV.font.xs, factor, 11),
        sm: scaleToken(TV.font.sm, factor, 12),
        md: scaleToken(TV.font.md, factor, 13),
        base: scaleToken(TV.font.base, factor, 14),
        lg: scaleToken(TV.font.lg, factor, 16),
        xl: scaleToken(TV.font.xl, factor, 18),
        title: scaleToken(TV.font.title, factor, 22),
        heading: scaleToken(TV.font.heading, factor, 24),
      },
      layout: {
        gridGap: scaleToken(TV.layout.gridGap, factor, 10),
        listPadding: scaleToken(TV.layout.listPadding, factor, 10),
        contentPaddingH: scaleToken(TV.layout.contentPaddingH, factor, 16),
        headerPaddingV: scaleToken(TV.layout.headerPaddingV, factor, 10),
      },
      sidebar: {
        width: sidebarWidth,
      },
    };
  }, [isCompact, isMedium, sidebarWidth]);
}
