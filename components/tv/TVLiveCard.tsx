import React from 'react';
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
import { TV } from '../../constants/tvTheme';

interface Props {
  item: LiveRoom;
  onPress?: () => void;
  sidebarWidth?: number;
}

/**
 * TV 版直播卡片。聚焦时显示高亮边框。
 */
export const TVLiveCard = React.memo(function TVLiveCard({
  item,
  onPress,
  sidebarWidth = 0,
}: Props) {
  const { width } = useWindowDimensions();
  const NUM_COLUMNS = 5;
  const CARD_WIDTH =
    (width - sidebarWidth - TV.layout.listPadding * 2 - TV.layout.gridGap * (NUM_COLUMNS - 1)) /
    NUM_COLUMNS;

  return (
    <TVFocusable
      onPress={onPress}
      style={[styles.card, { width: CARD_WIDTH }]}
      focusStyle={{ borderRadius: TV.radius.md }}
      accessibilityLabel={`${item.uname} \u76f4\u64ad\u4e2d: ${item.title}`}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={{ uri: proxyImageUrl(item.cover) }}
          style={[styles.thumb, { width: CARD_WIDTH, height: CARD_WIDTH * 0.5625 }]}
          resizeMode="cover"
          fadeDuration={200}
        />
        <View style={styles.liveBadge}>
          <LivePulse />
          <Text style={styles.liveBadgeText}>{'\u76f4\u64ad\u4e2d'}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="people" size={12} color={TV.color.white} />
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

const styles = StyleSheet.create({
  card: {
    marginBottom: TV.space.sm,
    backgroundColor: TV.color.surface,
    borderRadius: TV.radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbContainer: { position: 'relative' },
  thumb: {
    backgroundColor: TV.color.placeholder,
  },
  liveBadge: {
    position: 'absolute',
    top: TV.space.xs,
    left: TV.space.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: TV.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveBadgeText: { color: TV.color.white, fontSize: TV.font.sm, fontWeight: '500' },
  meta: {
    position: 'absolute',
    bottom: TV.space.xs,
    left: TV.space.xs,
    paddingHorizontal: 5,
    borderRadius: TV.radius.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: { fontSize: TV.font.sm, color: TV.color.white },
  areaBadge: {
    position: 'absolute',
    bottom: TV.space.xs,
    right: TV.space.xs,
    borderRadius: TV.radius.sm,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  areaText: { color: TV.color.white, fontSize: TV.font.sm },
  info: { padding: TV.space.sm },
  title: {
    fontSize: TV.font.lg,
    color: TV.color.textPrimary,
    lineHeight: 20,
    marginBottom: TV.space.xs,
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
    backgroundColor: TV.color.placeholder,
  },
  owner: { fontSize: TV.font.md, color: TV.color.textTertiary, flex: 1 },
});

