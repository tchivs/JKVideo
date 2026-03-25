import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVLiveCard } from '../components/tv/TVLiveCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVSidebar } from '../components/tv/TVSidebar';
import { HeroBackdrop } from '../components/tv/HeroBackdrop';
import { useVideoList } from '../hooks/useVideoList';
import { useLiveList } from '../hooks/useLiveList';
import type { VideoItem, LiveRoom } from '../services/types';
import { getDynamicFeeds } from '../services/bilibili';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';
import { isHomeMode, type HomeMode } from './sidebarConfig';

/**
 * TV 首页：十字泳道 (Leanback UI) 终极重构版。
 * 底层海报 + 横向内容轨道 (Swimlanes) + 精简侧栏。
 */
export default function TVHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { rowCardWidth, isCompact } = useTVLayout();

  // -- 数据源 Hook --
  const { pages, loading, load } = useVideoList();
  const { rooms, loading: liveLoading, load: liveLoad } = useLiveList();
  const [homeMode, setHomeMode] = useState<HomeMode>(isHomeMode(mode) ? mode : 'recommend');

  const [dynamicItems, setDynamicItems] = useState<VideoItem[]>([]);
  const [dynamicOffset, setDynamicOffset] = useState('');
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const dynamicOffsetRef = useRef('');
  const dynamicLoadingRef = useRef(false);
  
  // -- 沉浸式焦点项 (Hero Backdrop) --
  const [heroActiveItem, setHeroActiveItem] = useState<VideoItem | LiveRoom | null>(null);

  useEffect(() => {
    if (isHomeMode(mode)) {
      setHomeMode(mode);
    }
  }, [mode]);

  // 读取所有管线的数据
  const loadDynamic = useCallback(async (isRefresh = false) => {
    if (dynamicLoadingRef.current) return;
    dynamicLoadingRef.current = true;
    setDynamicLoading(true);
    try {
      const targetOffset = isRefresh ? '' : dynamicOffsetRef.current;
      const { items, nextOffset } = await getDynamicFeeds(targetOffset);
      if (items.length > 0) {
        setDynamicItems(prev => isRefresh ? items : [...prev, ...items]);
        setDynamicOffset(nextOffset);
        dynamicOffsetRef.current = nextOffset;
      }
    } catch (e) {
      console.warn('Load dynamic feeds failed', e);
    } finally {
      dynamicLoadingRef.current = false;
      setDynamicLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    liveLoad();

    let mounted = true;
    (async () => {
      setDynamicLoading(true);
      try {
        const { items, nextOffset } = await getDynamicFeeds('');
        if (!mounted) return;
        setDynamicItems(items);
        setDynamicOffset(nextOffset);
      } catch (e) {
        console.warn('Load dynamic feeds failed', e);
      } finally {
        if (mounted) setDynamicLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [load, liveLoad]);

  const allVideos = useMemo(() => {
    const items: VideoItem[] = [];
    for (const page of pages) items.push(...page);
    return items;
  }, [pages]);

  const headerCopy = useMemo(() => {
    if (homeMode === 'live') {
      return {
        title: '直播间正在进行中',
        subtitle: '左右切换直播卡片，按确认键立即进入直播',
      };
    }
    if (homeMode === 'hot') {
      return {
        title: '全站热门内容',
        subtitle: '当前为热门视频瀑布流，向下继续加载更多',
      };
    }
    return {
      title: '推荐视频瀑布流',
      subtitle: '首页仅展示推荐视频，热门和直播请用左侧菜单切换',
    };
  }, [homeMode]);

  const activeVideos = homeMode === 'hot' ? allVideos : dynamicItems;
  const activeVideoLoading = homeMode === 'hot' ? loading : dynamicLoading;

  return (
    <View style={styles.container}>
      {/* 背景层：视差沉浸海报 */}
      <HeroBackdrop activeItem={heroActiveItem} />

      <TVSidebar currentHomeMode={homeMode} onHomeModeChange={setHomeMode} />

      {/* 右侧流体主控区：嵌套多行 TVHorizontalRow */}
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <View style={styles.contentHeader}>
          <View style={styles.headerCopyWrap}>
            <Text style={styles.headerTitle}>{headerCopy.title}</Text>
            <Text style={styles.headerSubtitle}>{headerCopy.subtitle}</Text>
          </View>

          <View style={styles.headerActions}>
            <TVFocusable
              style={styles.searchEntry}
              onPress={() => router.push('/search' as any)}
              scaleFactor={1.04}
              borderColor={TV.color.info}
              accessibilityLabel="搜索视频"
              hasTVPreferredFocus
            >
              <Ionicons name="search" size={20} color={TV.color.white} />
              <Text style={styles.searchEntryText}>搜索视频、UP主、番剧</Text>
            </TVFocusable>

            <TVFocusable
              style={styles.quickAction}
              onPress={() => router.push('/ranking' as any)}
              scaleFactor={1.05}
              accessibilityLabel="进入排行榜"
            >
              <Ionicons name="trophy-outline" size={18} color={TV.color.gold} />
              <Text style={styles.quickActionText}>排行</Text>
            </TVFocusable>
          </View>
        </View>

        {homeMode === 'live' ? (
          <FlatList<LiveRoom>
            data={rooms}
            keyExtractor={(item, index) => `room-${item.roomid}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
            onEndReached={() => {
              liveLoad();
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <TVLiveCard
                item={item}
                onPress={() => router.push(`/live/${item.roomid}` as any)}
                cardWidth={rowCardWidth}
                onFocusChange={focused => focused && setHeroActiveItem(item)}
              />
            )}
            ListFooterComponent={liveLoading ? <Text style={styles.footerLoading}>加载中…</Text> : null}
          />
        ) : (
          <FlatList<VideoItem>
            data={activeVideos}
            keyExtractor={(item, index) => `video-${item.bvid}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.waterfallContent}
            numColumns={isCompact ? 2 : 5}
            columnWrapperStyle={styles.waterfallRow}
            onEndReached={() => {
              if (homeMode === 'hot') {
                load();
              } else {
                loadDynamic();
              }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <TVVideoCard
                item={item}
                onPress={() => router.push(`/video/${item.bvid}` as any)}
                cardWidth={rowCardWidth}
                onFocusChange={focused => focused && setHeroActiveItem(item)}
              />
            )}
            ListFooterComponent={activeVideoLoading ? <Text style={styles.footerLoading}>加载中…</Text> : null}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: TV.color.bg,
  },
  mainFeedContent: {
    paddingTop: TV.space.md,
    paddingBottom: TV.space.xxl,
  },
  waterfallContent: {
    paddingTop: TV.space.md,
    paddingBottom: TV.space.xxl,
    paddingHorizontal: TV.space.sm,
  },
  waterfallRow: {
    gap: TV.layout.gridGap,
    marginBottom: TV.layout.gridGap,
  },
  content: {
    flex: 1,
    zIndex: 2,
    paddingTop: TV.space.xxl,
    paddingHorizontal: TV.space.md,
  },
  contentCompact: {
    paddingTop: TV.space.lg,
    paddingHorizontal: TV.space.sm,
  },
  contentHeader: {
    marginBottom: TV.space.lg,
    gap: TV.space.md,
  },
  headerCopyWrap: {
    gap: 6,
  },
  headerTitle: {
    fontSize: TV.font.title,
    color: TV.color.white,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: TV.font.sm,
    color: TV.color.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.md,
  },
  searchEntry: {
    flex: 1,
    maxWidth: 720,
    height: 56,
    borderRadius: TV.radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(18, 30, 40, 0.72)',
    paddingHorizontal: TV.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.sm,
  },
  searchEntryText: {
    fontSize: TV.font.base,
    color: TV.color.textPrimary,
    fontWeight: '500',
  },
  quickAction: {
    minWidth: 120,
    height: 56,
    borderRadius: TV.radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(32, 32, 32, 0.72)',
    paddingHorizontal: TV.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TV.space.xs,
  },
  quickActionText: {
    fontSize: TV.font.md,
    color: TV.color.textPrimary,
    fontWeight: '600',
  },
  footerLoading: {
    color: TV.color.textSecondary,
    textAlign: 'center',
    fontSize: TV.font.sm,
    paddingVertical: TV.space.lg,
  },
});
