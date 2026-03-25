import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVPageShell } from '../components/tv/TVPageShell';
import { getRegionVideos, BILI_REGIONS } from '../services/bilibili';
import { usePlaylistStore } from '../store/playlistStore';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';

type BiliRegion = (typeof BILI_REGIONS)[number];

export default function PartitionScreen() {
  const router = useRouter();
  const { gridColumns, headerTopPadding, isCompact } = useTVLayout();
  const { setPlaylist } = usePlaylistStore();
  const regionSidebarWidth = isCompact ? 92 : 140;
  const [selectedTid, setSelectedTid] = useState<number>(BILI_REGIONS[0].tid);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = useCallback(async (tid: number, pn: number, reset = false) => {
    if (reset) setLoading(true);
    try {
      const items = await getRegionVideos(tid, pn, 20);
      if (reset) {
        setVideos(items);
      } else {
        setVideos(prev => [...prev, ...items]);
      }
      setHasMore(items.length >= 20);
    } catch (e) {
      console.warn('load partition videos failed', e);
      if (reset) setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchVideos(selectedTid, 1, true);
  }, [selectedTid, fetchVideos]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(selectedTid, nextPage);
  }, [hasMore, loading, page, selectedTid, fetchVideos]);

  const renderItem = useCallback(({ item, index }: { item: VideoItem; index: number }) => (
      <TVVideoCard
        item={item}
        sidebarWidth={regionSidebarWidth}
      onPress={() => {
        setPlaylist(videos, index, hasMore, async (currentLength) => {
          const nextPn = Math.floor(currentLength / 20) + 1;
          const res = await getRegionVideos(selectedTid, nextPn, 20);
          return { items: res, hasMore: res.length >= 20 };
        });
        router.push(`/video/${item.bvid}` as any);
      }}
    />
  ), [regionSidebarWidth, router, videos, hasMore, selectedTid, setPlaylist]);

  const selected = BILI_REGIONS.find(r => r.tid === selectedTid);

  return (
    <TVPageShell>
      <View style={[styles.container, { paddingTop: headerTopPadding }]}> 
      {/* 分区侧边栏 */}
      <View style={[styles.sidebar, { width: regionSidebarWidth, paddingTop: isCompact ? TV.space.lg : TV.space.xl }]}> 
        <Text style={styles.sidebarTitle}>分区</Text>
        <FlatList<BiliRegion>
          data={BILI_REGIONS as unknown as BiliRegion[]}
          keyExtractor={(item) => String(item.tid)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = item.tid === selectedTid;
            return (
              <TVFocusable
                style={[styles.regionItem, isActive && styles.regionItemActive]}
                onPress={() => setSelectedTid(item.tid)}
                scaleFactor={1.05}
              >
                <Text style={[styles.regionIcon]}>{item.icon}</Text>
                <Text style={[styles.regionName, isActive && styles.regionNameActive]}>
                  {item.name}
                </Text>
              </TVFocusable>
            );
          }}
        />
      </View>

      {/* 内容区 */}
      <View style={[styles.content, { paddingTop: isCompact ? TV.space.lg : TV.space.xl, paddingHorizontal: isCompact ? TV.space.md : TV.space.xl }]}>
        <Text style={styles.title}>{selected?.icon} {selected?.name}</Text>

        {loading && videos.length === 0 ? (
          <TVSkeleton count={10} columns={gridColumns} sidebarWidth={regionSidebarWidth} />
        ) : videos.length === 0 ? (
          <TVEmptyState icon="albums-outline" title="暂无内容" hint="该分区暂时没有视频" />
        ) : (
          <FlatList
            data={videos}
            renderItem={renderItem}
            keyExtractor={item => item.bvid}
            numColumns={gridColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore ? (
                <ActivityIndicator color={TV.color.accent} style={{ marginVertical: TV.space.xl }} />
              ) : null
            }
          />
        )}
      </View>
      </View>
    </TVPageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  sidebar: {
    backgroundColor: 'transparent',
    paddingHorizontal: TV.space.sm,
  },
  sidebarTitle: {
    color: TV.color.textSecondary,
    fontSize: TV.font.md,
    fontWeight: '600',
    marginBottom: TV.space.md,
    paddingHorizontal: TV.space.sm,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TV.space.sm + 2,
    paddingHorizontal: TV.space.sm,
    borderRadius: TV.radius.md,
    marginBottom: 2,
  },
  regionItemActive: {
    backgroundColor: TV.color.accentBg,
  },
  regionIcon: {
    fontSize: TV.font.lg,
    marginRight: TV.space.sm,
  },
  regionName: {
    color: TV.color.textSecondary,
    fontSize: TV.font.md,
  },
  regionNameActive: {
    color: TV.color.accent,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    color: TV.color.white,
    fontSize: TV.font.xl,
    fontWeight: '700',
    marginBottom: TV.space.lg,
  },
  row: {
    gap: TV.space.md,
    marginBottom: TV.space.md,
  },
  listContent: {
    paddingBottom: TV.space.xxl,
  },
});
