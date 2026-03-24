import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVFadeIn } from '../components/tv/TVFadeIn';
import { getPopularVideos } from '../services/bilibili';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';

const CATEGORIES = [
  { id: 0, name: '综合热门', icon: 'flame' },
  { id: 1, name: '动画', icon: 'color-palette' },
  { id: 3, name: '音乐', icon: 'musical-notes' },
  { id: 4, name: '游戏', icon: 'game-controller' },
  { id: 5, name: '娱乐', icon: 'happy' },
  { id: 36, name: '科技', icon: 'hardware-chip' },
  { id: 188, name: '科普', icon: 'school' },
  { id: 160, name: '生活', icon: 'cafe' },
  { id: 211, name: '美食', icon: 'restaurant' },
  { id: 119, name: '鬼畜', icon: 'skull' },
  { id: 155, name: '时尚', icon: 'shirt' },
];

const NUM_COLUMNS = 5;

/**
 * TV 版排行/分区浏览页。
 */
export default function TVRankingScreen() {
  const router = useRouter();
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
        const items = await getPopularVideos(pn);
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
    [],
  );

  useEffect(() => {
    fetchVideos(1, true);
  }, []);

  const handleCategory = useCallback(
    (id: number) => {
      setCategory(id);
      // 目前 getPopularVideos 不支持分区过滤，但 UI 先做好
      fetchVideos(1, true);
    },
    [fetchVideos],
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
    <View style={styles.container}>
      {/* 顶栏 */}
      <View style={styles.header}>
        <TVFocusable
          onPress={() => router.back()}
          style={styles.backBtn}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color={TV.color.textSecondary} />
        </TVFocusable>
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
        <TVFadeIn style={styles.errorBox}>
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
        </TVFadeIn>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={item => item.bvid}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
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
  backBtn: {
    padding: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
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
