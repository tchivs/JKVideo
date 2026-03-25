import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVLoading } from '../components/tv/TVLoading';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVPageShell } from '../components/tv/TVPageShell';
import { getBangumiFollows } from '../services/bilibili';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store/playlistStore';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';

export default function TVFollowingScreen() {
  const router = useRouter();
  const { gridColumns, contentPaddingH, headerTopPadding } = useTVLayout();
  const { setPlaylist } = usePlaylistStore();
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
      const res = await getBangumiFollows(targetPn, 20);
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

  const renderItem = ({ item, index }: { item: VideoItem; index: number }) => (
    <TVVideoCard
      item={item}
      onPress={() => {
        if (!item.bvid) return;
        setPlaylist(items, index, hasMore, async (currentLength) => {
          const nextPn = Math.floor(currentLength / 20) + 1;
          const res = await getBangumiFollows(nextPn, 20);
          return res;
        });
        router.push(`/video/${item.bvid}` as any);
      }}
    />
  );

  return (
    <TVPageShell>
      <View style={styles.container}>
        <View style={[styles.header, { paddingHorizontal: contentPaddingH, paddingTop: headerTopPadding }]} accessibilityRole="header">
          <Text style={styles.headerTitle}>追番追剧</Text>
        </View>

      {!isLoggedIn ? (
        <TVEmptyState
          title="暂未登录"
          hint="请先在侧边栏底端登录您的账号以查看追番列表"
          icon="person-circle-outline"
          style={{ flex: 1 }}
        />
      ) : items.length === 0 ? (
        loading ? (
          <TVSkeleton columns={gridColumns} count={10} />
        ) : (
          <TVEmptyState
            title="暂无追番记录"
            hint="您在 B 站追的番剧和影视会在这里显示"
            icon="heart-outline"
            style={{ flex: 1 }}
          />
        )
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.bvid}-${index}`}
          renderItem={renderItem}
          numColumns={gridColumns}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={10}
          onEndReached={() => loadData()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <TVFocusable
                style={styles.loadMoreBtn}
                onPress={() => loadData()}
                onFocus={() => loadData()} // 焦点移到加载更多按钮上时顺便自动触发
                scaleFactor={1.05}
                accessibilityLabel="加载更多"
              >
                {loading ? <TVLoading /> : <Text style={styles.loadMoreText}>加载下一页</Text>}
              </TVFocusable>
            ) : null
          }
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
  loadMoreBtn: {
    paddingVertical: TV.space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: TV.space.lg,
    backgroundColor: TV.color.surface,
    borderRadius: TV.radius.md,
  },
  loadMoreText: {
    color: TV.color.textSecondary,
    fontSize: TV.font.md,
    fontWeight: '500',
  },
});
