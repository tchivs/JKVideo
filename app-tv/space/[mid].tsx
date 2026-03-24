import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../../components/tv/TVFocusable';
import { TVVideoCard } from '../../components/tv/TVVideoCard';
import { TVLoading } from '../../components/tv/TVLoading';
import { TVEmptyState } from '../../components/tv/TVEmptyState';
import { getUserSpaceInfo, getUserSpaceVideos } from '../../services/bilibili';
import { usePlaylistStore } from '../../store/playlistStore';
import { proxyImageUrl } from '../../utils/imageUrl';
import { formatCount } from '../../utils/format';
import type { VideoItem } from '../../services/types';
import { TV } from '../../constants/tvTheme';

export default function TVSpaceScreen() {
  const { mid } = useLocalSearchParams<{ mid: string }>();
  const router = useRouter();
  const { setPlaylist } = usePlaylistStore();

  const [info, setInfo] = useState<any>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [pn, setPn] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 初始化获取 UP主信息与第一页视频
  useEffect(() => {
    if (!mid) return;
    setLoadingTop(true);
    getUserSpaceInfo(mid).then(data => {
      setInfo(data);
      setLoadingTop(false);
    });
    // fetch first page
    loadVideos(1, true);
  }, [mid]);

  const loadVideos = useCallback(async (page: number, isRefresh = false) => {
    if (loadingList) return;
    setLoadingList(true);
    try {
      const res = await getUserSpaceVideos(mid, page, 20);
      setVideos(prev => isRefresh ? res.items : [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setPn(page + 1);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingList(false);
    }
  }, [loadingList, mid]);

  const renderItem = useCallback(({ item, index }: { item: VideoItem; index: number }) => (
    <TVVideoCard
      item={item}
      onPress={() => {
        if (!item.bvid) return;
        setPlaylist(videos, index, hasMore, async (currentLength) => {
          const nextPn = Math.floor(currentLength / 20) + 1;
          const res = await getUserSpaceVideos(mid, nextPn, 20);
          return res;
        });
        router.push(`/video/${item.bvid}`);
      }}
    />
  ), [router, videos, hasMore, mid, setPlaylist]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TVFocusable
        style={styles.backBtn}
        onPress={() => router.back()}
        scaleFactor={1.1}
      >
        <Ionicons name="arrow-back" size={32} color={TV.color.textPrimary} />
      </TVFocusable>
      
      {loadingTop ? (
        <ActivityIndicator size="small" color={TV.color.accent} style={{ marginLeft: TV.space.lg }} />
      ) : info ? (
        <View style={styles.profile}>
          <Image source={{ uri: proxyImageUrl(info.face) }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{info.name}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>粉丝 {formatCount(info.stat?.follower)}</Text>
              <Text style={styles.statText}>投稿 {formatCount(info.stat?.pub_vdo)}</Text>
            </View>
            <Text style={styles.sign} numberOfLines={1}>{info.sign}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {!loadingTop && videos.length === 0 && !loadingList ? (
        <TVEmptyState title="暂无投稿" hint="该 UP 主还没有投稿视频" />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.bvid || String(Math.random())}
          numColumns={5}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasMore && !loadingList) loadVideos(pn);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <TVFocusable
                style={styles.loadMoreBtn}
                onPress={() => loadVideos(pn)}
                onFocus={() => loadVideos(pn)}
                scaleFactor={1.05}
              >
                {loadingList ? <TVLoading /> : <Text style={styles.loadMoreText}>加载下一页</Text>}
              </TVFocusable>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TV.color.bg,
  },
  header: {
    paddingTop: TV.layout.headerPaddingV,
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingBottom: TV.space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TV.color.surface,
  },
  backBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: TV.color.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: TV.space.xl,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: TV.color.border,
  },
  profileInfo: {
    marginLeft: TV.space.xl,
    flex: 1,
  },
  name: {
    fontSize: TV.font.title,
    fontWeight: 'bold',
    color: TV.color.textPrimary,
    marginBottom: TV.space.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: TV.space.lg,
    marginBottom: TV.space.sm,
  },
  statText: {
    fontSize: TV.font.md,
    color: TV.color.textSecondary,
  },
  sign: {
    fontSize: TV.font.md,
    color: TV.color.textSecondary,
    opacity: 0.8,
  },
  listContent: {
    padding: TV.layout.contentPaddingH,
    paddingTop: TV.space.lg,
  },
  gridRow: {
    gap: TV.layout.gridGap,
    marginBottom: TV.layout.gridGap,
  },
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
