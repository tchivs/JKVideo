import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VideoItem } from '../../services/types';
import { formatCount, formatDuration } from '../../utils/format';
import { coverImageUrl } from '../../utils/imageUrl';
import { useSettingsStore } from '../../store/settingsStore';
import { TVFocusable } from './TVFocusable';
import { useTVLayout } from '../../hooks/useTVLayout';
import { useTVTheme } from '../../hooks/useTVTheme';

interface Props {
  item: VideoItem;
  onPress: () => void;
  sidebarWidth?: number;
  onFocusChange?: (focused: boolean) => void;
  cardWidth?: number;
}

type TVTheme = ReturnType<typeof useTVTheme>;
export const TVVideoCard = React.memo(function TVVideoCard({
  item,
  onPress,
  sidebarWidth = 0,
  onFocusChange,
  cardWidth: propCardWidth,
}: Props) {
  const tv = useTVTheme();
  const styles = useMemo(() => createStyles(tv), [tv]);
  const { width } = useWindowDimensions();
  const { gridColumns } = useTVLayout();
  const fullCardWidth =
    (width - sidebarWidth - tv.layout.listPadding * 2 - tv.layout.gridGap * (gridColumns - 1)) /
    gridColumns;
  const cardWidth = propCardWidth ?? fullCardWidth;

  const coverQuality = useSettingsStore(s => s.coverQuality);

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setIsHovered(true), 600);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    setIsHovered(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isHovered ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isHovered, overlayOpacity]);

  return (
    <TVFocusable
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[styles.card, { width: cardWidth }]}
      focusStyle={{ borderRadius: tv.radius.md }}
      accessibilityLabel={item.title}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={{ uri: coverImageUrl(item.pic, coverQuality) }}
          style={[styles.thumb, { width: cardWidth, height: cardWidth * 0.5625 }]}
          resizeMode="cover"
          fadeDuration={200}
        />
        <View style={styles.meta}>
          <Ionicons name="play" size={12} color={tv.color.white} />
          <Text style={styles.metaText}>{formatCount(item.stat?.view ?? 0)}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>

        <Animated.View style={[styles.hoverOverlay, { opacity: overlayOpacity }]} pointerEvents="none">
          <View style={styles.hoverBackdrop} />
          <View style={styles.hoverContent}>
            <View style={styles.hoverStat}>
              <Ionicons name="thumbs-up-outline" size={14} color={tv.color.white} />
              <Text style={styles.hoverStatText}>{formatCount(item.stat?.like ?? 0)}</Text>
            </View>
            <View style={styles.hoverStat}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={tv.color.white} />
              <Text style={styles.hoverStatText}>{formatCount(item.stat?.danmaku ?? 0)}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.owner} numberOfLines={1}>
          {item.owner?.name ?? ''}
        </Text>
      </View>
    </TVFocusable>
  );
});

function createStyles(tv: TVTheme) {
  return StyleSheet.create({
    card: {
      marginBottom: tv.space.sm,
      backgroundColor: tv.color.surface,
      borderRadius: tv.radius.md,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbContainer: { position: 'relative' },
    thumb: {
      backgroundColor: tv.color.placeholder,
    },
    durationBadge: {
      position: 'absolute',
      bottom: tv.space.xs,
      right: tv.space.xs,
      borderRadius: tv.radius.sm,
      paddingHorizontal: 5,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingVertical: 1,
    },
    durationText: { color: tv.color.white, fontSize: tv.font.md },
    info: { padding: tv.space.sm },
    title: {
      fontSize: tv.font.lg,
      color: tv.color.textPrimary,
      lineHeight: Math.round(tv.font.lg * 1.15),
      marginBottom: tv.space.xs,
    },
    owner: { fontSize: tv.font.md, color: tv.color.textTertiary },
    meta: {
      position: 'absolute',
      bottom: tv.space.xs,
      left: tv.space.xs,
      paddingHorizontal: 5,
      borderRadius: tv.radius.sm,
      backgroundColor: 'rgba(0,0,0,0.7)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: { fontSize: tv.font.sm, color: tv.color.white },
    hoverOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hoverBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    hoverContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tv.space.lg,
    },
    hoverStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    hoverStatText: {
      fontSize: tv.font.md,
      color: tv.color.white,
      fontWeight: 'bold',
    },
  });
}
