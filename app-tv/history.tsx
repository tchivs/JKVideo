import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVFadeIn } from '../components/tv/TVFadeIn';
import { useHistoryStore, type HistoryItem } from '../store/historyStore';
import { proxyImageUrl } from '../utils/imageUrl';
import { formatDuration } from '../utils/format';
import { TV } from '../constants/tvTheme';

/**
 * TV 版观看历史页。
 */
export default function TVHistoryScreen() {
  const router = useRouter();
  const { items, clearHistory, progress } = useHistoryStore();

  const formatTime = (ms: number): string => {
    const d = new Date(ms);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday) {
      return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const prog = progress[item.bvid] ?? 0;
    const percent =
      item.duration > 0 ? Math.min(1, prog / item.duration) : 0;

    return (
      <TVFocusable
        style={styles.row}
        onPress={() => router.push(`/video/${item.bvid}` as any)}
        scaleFactor={1.02}
      >
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: proxyImageUrl(item.pic) }}
            style={styles.thumb}
            resizeMode="cover"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          {/* 进度条 */}
          {percent > 0 && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(percent * 100)}%` as any },
                ]}
              />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta}>
            {item.ownerName}
          </Text>
          <Text style={styles.time}>{formatTime(item.watchedAt)}</Text>
        </View>
      </TVFocusable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TVFocusable
          onPress={() => router.back()}
          style={styles.backBtn}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color={TV.color.textSecondary} />
        </TVFocusable>
        <Text style={styles.headerTitle}>观看历史</Text>
        <View style={{ flex: 1 }} />
        {items.length > 0 && (
          <TVFocusable
            style={styles.clearBtn}
            onPress={() =>
              Alert.alert(
                '确认清空',
                '确定要清空所有观看记录吗？',
                [
                  { text: '取消', style: 'cancel' },
                  { text: '清空', style: 'destructive', onPress: clearHistory },
                ],
              )
            }
            scaleFactor={1}
            accessibilityLabel="清空观看历史"
          >
            <Ionicons name="trash-outline" size={16} color={TV.color.textTertiary} />
            <Text style={styles.clearText}>清空</Text>
          </TVFocusable>
        )}
      </View>

      {items.length === 0 ? (
        <TVFadeIn style={styles.empty}>
          <Ionicons name="time-outline" size={56} color={TV.color.textTertiary} />
          <Text style={styles.emptyText}>暂无观看记录</Text>
          <Text style={styles.emptyHint}>观看视频后自动记录在这里</Text>
        </TVFadeIn>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.bvid}
          renderItem={renderItem}
          numColumns={5}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingVertical: TV.layout.headerPaddingV,
    backgroundColor: TV.color.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TV.color.border,
    gap: TV.space.md - 2,
  },
  backBtn: {
    padding: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: { fontSize: TV.font.title, fontWeight: '600', color: TV.color.textPrimary },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.xs,
    paddingHorizontal: TV.space.md,
    paddingVertical: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clearText: { fontSize: TV.font.base, color: TV.color.textTertiary },
  listContent: { padding: TV.layout.listPadding },
  gridRow: { gap: TV.layout.gridGap },
  row: {
    flex: 1,
    marginBottom: TV.layout.gridGap,
    borderRadius: TV.radius.md,
    overflow: 'hidden',
    backgroundColor: TV.color.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: TV.color.placeholder,
  },
  durationBadge: {
    position: 'absolute',
    bottom: TV.space.sm - 2,
    right: TV.space.sm - 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 3,
    paddingHorizontal: TV.space.xs,
    paddingVertical: 1,
  },
  durationText: { color: TV.color.white, fontSize: TV.font.sm },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: 3,
    backgroundColor: TV.color.accent,
  },
  info: { padding: TV.space.sm },
  title: {
    fontSize: TV.font.base,
    color: TV.color.textPrimary,
    lineHeight: 18,
    marginBottom: TV.space.xs,
  },
  meta: { fontSize: TV.font.sm, color: TV.color.textTertiary, marginBottom: 2 },
  time: { fontSize: TV.font.xs, color: TV.color.textDisabled },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: TV.space.md,
  },
  emptyText: { fontSize: TV.font.xl, color: TV.color.textSecondary },
  emptyHint: { fontSize: TV.font.md, color: TV.color.textTertiary },
});
