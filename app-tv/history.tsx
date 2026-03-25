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
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVButton } from '../components/tv/TVButton';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVPageShell } from '../components/tv/TVPageShell';
import { useHistoryStore, type HistoryItem } from '../store/historyStore';
import { proxyImageUrl } from '../utils/imageUrl';
import { formatDuration } from '../utils/format';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';

/**
 * TV 版观看历史页。
 */
export default function TVHistoryScreen() {
  const router = useRouter();
  const { gridColumns, contentPaddingH, headerTopPadding } = useTVLayout();
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
    <TVPageShell>
      <View style={styles.container}>
        <View style={[styles.header, { paddingHorizontal: contentPaddingH, paddingTop: headerTopPadding }]} accessibilityRole="header">
          <Text style={styles.headerTitle}>观看历史</Text>
          <View style={{ flex: 1 }} />
        {items.length > 0 && (
          <TVButton
            title="清空"
            icon="trash-outline"
            variant="secondary"
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
          />
        )}
        </View>

      {items.length === 0 ? (
        <TVEmptyState
          title="暂无观看记录"
          hint="观看视频后自动记录在这里"
          icon="time-outline"
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.bvid}
          renderItem={renderItem}
          numColumns={gridColumns}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
      </View>
    </TVPageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingVertical: TV.layout.headerPaddingV,
    backgroundColor: 'transparent',
    paddingTop: TV.layout.headerPaddingV + TV.space.xl,
    gap: TV.space.md - 2,
  },
  headerTitle: { fontSize: TV.font.heading, fontWeight: '800', color: TV.color.white },
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
});
