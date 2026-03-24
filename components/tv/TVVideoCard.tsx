import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VideoItem } from '../../services/types';
import { formatCount, formatDuration } from '../../utils/format';
import { coverImageUrl } from '../../utils/imageUrl';
import { useSettingsStore } from '../../store/settingsStore';
import { TVFocusable } from './TVFocusable';
import { TV } from '../../constants/tvTheme';

interface Props {
  item: VideoItem;
  onPress: () => void;
}

/**
 * TV 版视频卡片。使用 TVFocusable 提供遥控器焦点支持。
 * 字体比手机版稍大，适配客厅观看距离。
 */
export const TVVideoCard = React.memo(function TVVideoCard({
  item,
  onPress,
}: Props) {
  const { width } = useWindowDimensions();
  // TV 横屏 5 列布局，留 40px 总间距
  const CARD_WIDTH = (width - 40) / 5;

  const coverQuality = useSettingsStore(s => s.coverQuality);

  return (
    <TVFocusable
      onPress={onPress}
      style={[styles.card, { width: CARD_WIDTH }]}
      focusStyle={{ borderRadius: TV.radius.md }}
      accessibilityLabel={item.title}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={{ uri: coverImageUrl(item.pic, coverQuality) }}
          style={[styles.thumb, { width: CARD_WIDTH, height: CARD_WIDTH * 0.5625 }]}
          resizeMode="cover"
          fadeDuration={200}
        />
        <View style={styles.meta}>
          <Ionicons name="play" size={12} color={TV.color.white} />
          <Text style={styles.metaText}>
            {formatCount(item.stat?.view ?? 0)}
          </Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
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
  durationBadge: {
    position: 'absolute',
    bottom: TV.space.xs,
    right: TV.space.xs,
    borderRadius: TV.radius.sm,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 1,
  },
  durationText: { color: TV.color.white, fontSize: TV.font.md },
  info: { padding: TV.space.sm },
  title: {
    fontSize: TV.font.lg,
    color: TV.color.textPrimary,
    lineHeight: 20,
    marginBottom: TV.space.xs,
  },
  owner: { fontSize: TV.font.md, color: TV.color.textTertiary },
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
});

