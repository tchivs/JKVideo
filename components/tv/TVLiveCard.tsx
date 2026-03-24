import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LivePulse } from '../LivePulse';
import type { LiveRoom } from '../../services/types';
import { formatCount } from '../../utils/format';
import { proxyImageUrl } from '../../utils/imageUrl';
import { TVFocusable } from './TVFocusable';
import { useTVLayout } from '../../hooks/useTVLayout';
import { useTVTheme } from '../../hooks/useTVTheme';

interface Props {
  item: LiveRoom;
  onPress?: () => void;
  sidebarWidth?: number;
  onFocusChange?: (focused: boolean) => void;
  cardWidth?: number;
}

type TVTheme = ReturnType<typeof useTVTheme>;
export const TVLiveCard = React.memo(function TVLiveCard({
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

  return (
    <TVFocusable
      onPress={onPress}
      onFocus={() => onFocusChange?.(true)}
      onBlur={() => onFocusChange?.(false)}
      style={[styles.card, { width: cardWidth }]}
      focusStyle={{ borderRadius: tv.radius.md }}
      accessibilityLabel={`${item.uname} 直播中: ${item.title}`}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={{ uri: proxyImageUrl(item.cover) }}
          style={[styles.thumb, { width: cardWidth, height: cardWidth * 0.5625 }]}
          resizeMode="cover"
          fadeDuration={200}
        />
        <View style={styles.liveBadge}>
          <LivePulse />
          <Text style={styles.liveBadgeText}>直播中</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="people" size={12} color={tv.color.white} />
          <Text style={styles.metaText}>{formatCount(item.online)}</Text>
        </View>
        <View style={styles.areaBadge}>
          <Text style={styles.areaText}>{item.area_name}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.ownerRow}>
          <Image
            source={{ uri: proxyImageUrl(item.face) }}
            style={styles.avatar}
            fadeDuration={100}
          />
          <Text style={styles.owner} numberOfLines={1}>
            {item.uname}
          </Text>
        </View>
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
    liveBadge: {
      position: 'absolute',
      top: tv.space.xs,
      left: tv.space.xs,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: tv.radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    liveBadgeText: { color: tv.color.white, fontSize: tv.font.sm, fontWeight: '500' },
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
    areaBadge: {
      position: 'absolute',
      bottom: tv.space.xs,
      right: tv.space.xs,
      borderRadius: tv.radius.sm,
      paddingHorizontal: 5,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    areaText: { color: tv.color.white, fontSize: tv.font.sm },
    info: { padding: tv.space.sm },
    title: {
      fontSize: tv.font.lg,
      color: tv.color.textPrimary,
      lineHeight: Math.round(tv.font.lg * 1.15),
      marginBottom: tv.space.xs,
    },
    ownerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    avatar: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: tv.color.placeholder,
    },
    owner: { fontSize: tv.font.md, color: tv.color.textTertiary, flex: 1 },
  });
}
