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
          <Ionicons name="chevron-back" size={24} color="#ccc" />
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
              color={category === cat.id ? '#00AEEC' : '#888'}
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
          <Ionicons name="cloud-offline-outline" size={48} color="#666" />
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
              <ActivityIndicator color="#00AEEC" style={styles.loader} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#e0e0e0' },
  categoryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#1a3040',
    borderColor: '#00AEEC',
  },
  categoryText: { fontSize: 12, color: '#aaa' },
  categoryTextActive: { color: '#00AEEC', fontWeight: '600' },
  listContent: { padding: 8 },
  row: { gap: 8 },
  loader: { marginVertical: 20 },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { fontSize: 14, color: '#888' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#00AEEC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginTop: 4,
  },
  retryText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
