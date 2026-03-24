import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { TV } from '../constants/tvTheme';

interface TVLayoutMetrics {
  width: number;
  isCompact: boolean;
  isMedium: boolean;
  gridColumns: number;
  sidebarWidth: number;
  contentPaddingH: number;
  headerTopPadding: number;
  heroTitleFontSize: number;
  heroTitleLineHeight: number;
  heroSubtitleFontSize: number;
  rowCardWidth: number;
}

export function useTVLayout(): TVLayoutMetrics {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isCompact = width < 900;
    const isMedium = width >= 900 && width < 1280;
    const gridColumns = width >= 1600 ? 5 : width >= 1280 ? 4 : width >= 900 ? 3 : 2;
    const sidebarWidth = isCompact ? 64 : isMedium ? 72 : TV.sidebar.width;
    const contentPaddingH = isCompact ? TV.space.md : isMedium ? TV.space.lg : TV.layout.contentPaddingH;
    const headerTopPadding = TV.layout.headerPaddingV + (isCompact ? TV.space.md : TV.space.xl);
    const heroTitleFontSize = isCompact ? 28 : isMedium ? 36 : 48;
    const heroTitleLineHeight = isCompact ? 36 : isMedium ? 46 : 64;
    const heroSubtitleFontSize = isCompact ? 16 : isMedium ? 20 : 24;
    const availableRowWidth = Math.max(width - sidebarWidth - contentPaddingH * 2, 320);
    const rowCardWidth = isCompact
      ? Math.min(Math.max((availableRowWidth - TV.layout.gridGap) / 2, 148), 220)
      : isMedium
        ? Math.min(Math.max(availableRowWidth * 0.24, 180), 240)
        : 260;

    return {
      width,
      isCompact,
      isMedium,
      gridColumns,
      sidebarWidth,
      contentPaddingH,
      headerTopPadding,
      heroTitleFontSize,
      heroTitleLineHeight,
      heroSubtitleFontSize,
      rowCardWidth,
    };
  }, [width]);
}
