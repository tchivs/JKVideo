import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVPageShell } from '../components/tv/TVPageShell';
import { getPopularVideos, getRegionVideos } from '../services/bilibili';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';

const CATEGORIES = [
  { id: 0, name: '综合热门', icon: 'flame' },
  { id: 1, name: '动画', icon: 'color-palette' },
  { id: 3, name: '音乐', icon: 'musical-notes' },
  { id: 4, name: '游戏', icon: 'game-controller' },
  { id: 5, name: '娱乐', icon: 'happy' },
  { id: 36, name: '知识', icon: 'school' },
  { id: 188, name: '科技', icon: 'hardware-chip' },
  { id: 160, name: '生活', icon: 'cafe' },
  { id: 211, name: '美食', icon: 'restaurant' },
  { id: 119, name: '鬼畜', icon: 'skull' },
  { id: 155, name: '时尚', icon: 'shirt' },
];

/**
 * TV 版排行/分区浏览页。
 */
export default function TVRankingScreen() {
  const router = useRouter();
  const { gridColumns, contentPaddingH, headerTopPadding } = useTVLayout();
  const [category, setCategory] = useState(0);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(
    async (pn: number, reset = false) => {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
      try {
        const items = category === 0
          ? await getPopularVideos(pn)
          : await getRegionVideos(category, pn, 20);
        setError(null);
        if (reset) {
          setVideos(items);
          setPage(2);
        } else {
          setVideos(prev => [...prev, ...items]);
          setPage(p => p + 1);
        }
      } catch (e) {
        if (reset) setError('加载失败，请检查网络连接');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category],
  );

  useEffect(() => {
    fetchVideos(1, true);
  }, [fetchVideos]);

  const handleCategory = useCallback(
    (id: number) => {
      setCategory(id);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <TVVideoCard
        item={item}
        onPress={() => router.push(`/video/${item.bvid}` as any)}
      />
    ),
    [router],
  );

  return (
    <TVPageShell>
      <View style={styles.container}>
      {/* 顶栏 */}
      <View style={[styles.header, { paddingHorizontal: contentPaddingH, paddingTop: headerTopPadding }]} accessibilityRole="header">
        <Text style={styles.headerTitle}>排行榜</Text>
      </View>

      {/* 分区筛选 */}
      <View style={styles.categoryBar}>
        {CATEGORIES.map(cat => (
          <TVFocusable
            key={cat.id}
            style={[
              styles.categoryChip,
              category === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => handleCategory(cat.id)}
            scaleFactor={1}
            accessibilityLabel={`选择分类 ${cat.name}`}
            hasTVPreferredFocus={cat.id === category}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={category === cat.id ? TV.color.accent : TV.color.textTertiary}
            />
            <Text
              style={[
                styles.categoryText,
                category === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TVFocusable>
        ))}
      </View>

      {/* 内容 */}
      {loading ? (
        <TVSkeleton />
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={48} color={TV.color.textTertiary} />
          <Text style={styles.errorText}>{error}</Text>
          <TVFocusable
            style={styles.retryBtn}
            onPress={() => fetchVideos(1, true)}
            scaleFactor={1.05}
            accessibilityLabel="重试"
          >
            <Text style={styles.retryText}>重试</Text>
          </TVFocusable>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={item => item.bvid}
          renderItem={renderItem}
          numColumns={gridColumns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (!loadingMore) fetchVideos(page);
          }}
          onEndReachedThreshold={0.5}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={15}
          removeClippedSubviews
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={TV.color.accent} style={styles.loader} />
            ) : null
          }
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
    paddingVertical: TV.space.md - 2,
    backgroundColor: 'transparent',
    paddingTop: TV.layout.headerPaddingV + TV.space.xl,
    gap: TV.space.md - 2,
  },
  headerTitle: { fontSize: TV.font.heading, fontWeight: '800', color: TV.color.white },
  categoryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV.space.sm - 2,
    paddingHorizontal: TV.space.md,
    paddingVertical: TV.space.sm,
    backgroundColor: TV.color.surfaceAlt,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.xs,
    paddingHorizontal: TV.space.md,
    paddingVertical: TV.space.sm - 2,
    borderRadius: TV.radius.xl,
    backgroundColor: TV.color.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: TV.color.accentBg,
    borderColor: TV.color.accent,
  },
  categoryText: { fontSize: TV.font.md, color: TV.color.textSecondary },
  categoryTextActive: { color: TV.color.accent, fontWeight: '600' },
  listContent: { padding: TV.layout.listPadding },
  row: { gap: TV.layout.gridGap },
  loader: { marginVertical: TV.space.xl },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: TV.space.md,
  },
  errorText: { fontSize: TV.font.lg, color: TV.color.textTertiary },
  retryBtn: {
    paddingHorizontal: TV.space.xl,
    paddingVertical: TV.space.sm,
    backgroundColor: TV.color.accent,
    borderRadius: TV.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    marginTop: TV.space.xs,
  },
  retryText: { fontSize: TV.font.lg, color: TV.color.white, fontWeight: '600' },
});
