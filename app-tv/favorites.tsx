import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVLoading } from '../components/tv/TVLoading';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { getFavorites } from '../services/bilibili';
import { useAuthStore } from '../store/authStore';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';

export default function TVFavoritesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pn, setPn] = useState(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pnRef = useRef(1);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    pnRef.current = pn;
  }, [pn]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isLoggedIn || loadingRef.current || (!hasMoreRef.current && !isRefresh)) return;
    const targetPn = isRefresh ? 1 : pnRef.current;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getFavorites(targetPn, 20);
      if (res.items.length > 0) {
        setItems(prev => isRefresh ? res.items : [...prev, ...res.items]);
        setPn(targetPn + 1);
        pnRef.current = targetPn + 1;
      }
      setHasMore(res.hasMore);
      hasMoreRef.current = res.hasMore;
    } catch (e) {
      console.warn(e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) loadData(true);
  }, [isLoggedIn, loadData]);

  const renderItem = ({ item }: { item: VideoItem }) => (
    <TVVideoCard
      item={item}
      onPress={() => router.push(`/video/${item.bvid}` as any)}
    />
  );

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
        <Text style={styles.headerTitle}>我的收藏</Text>
      </View>

      {!isLoggedIn ? (
        <TVEmptyState
          title="暂未登录"
          hint="请先在侧边栏底端登录您的账号以查看收藏"
          icon="person-circle-outline"
          style={{ flex: 1 }}
        />
      ) : items.length === 0 ? (
        loading ? (
          <TVSkeleton columns={5} count={10} />
        ) : (
          <TVEmptyState
            title="暂无收藏记录"
            hint="收藏的视频会自动同步到这里"
            icon="star-outline"
            style={{ flex: 1 }}
          />
        )
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.bvid}-${index}`}
          renderItem={renderItem}
          numColumns={5}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={10}
          onEndReached={() => loadData()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <TVLoading /> : null}
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
    backgroundColor: 'transparent',
    paddingTop: TV.layout.headerPaddingV + TV.space.xl, // 头端下压释放更多暗房空间
    gap: TV.space.md - 2,
  },
  backBtn: {
    padding: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: { fontSize: TV.font.heading, fontWeight: '800', color: TV.color.white },
  listContent: { padding: TV.layout.listPadding },
  gridRow: { gap: TV.layout.gridGap },
});
