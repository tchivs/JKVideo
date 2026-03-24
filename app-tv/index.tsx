import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVLiveCard } from '../components/tv/TVLiveCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVLoginModal } from '../components/tv/TVLoginModal';
import { TVHorizontalRow } from '../components/tv/TVHorizontalRow';
import { HeroBackdrop } from '../components/tv/HeroBackdrop';
import { useVideoList } from '../hooks/useVideoList';
import { useLiveList } from '../hooks/useLiveList';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import { proxyImageUrl } from '../utils/imageUrl';
import type { VideoItem, LiveRoom } from '../services/types';
import { getDynamicFeeds } from '../services/bilibili';
import { TV } from '../constants/tvTheme';

const SIDEBAR_ITEMS = [
  { key: 'home', label: '首页', icon: 'home', route: null, color: TV.color.white },
  { key: 'search', label: '搜索', icon: 'search', route: '/search', color: TV.color.info },
  { key: 'history', label: '历史', icon: 'time-outline', route: '/history', color: TV.color.success },
  { key: 'favorites', label: '收藏', icon: 'star-outline', route: '/favorites', color: TV.color.gold },
  { key: 'following', label: '追番', icon: 'heart-outline', route: '/following', color: TV.color.hot },
  { key: 'partition', label: '分区', icon: 'grid-outline', route: '/partition', color: TV.color.info },
  { key: 'ranking', label: '排行', icon: 'trophy-outline', route: '/ranking', color: TV.color.textPrimary },
];

/**
 * TV 首页：十字泳道 (Leanback UI) 终极重构版。
 * 底层海报 + 横向内容轨道 (Swimlanes) + 精简侧栏。
 */
export default function TVHomeScreen(): React.JSX.Element {
  const router = useRouter();

  // -- 数据源 Hook --
  const { pages, loading, load } = useVideoList();
  const { rooms, loading: liveLoading, load: liveLoad } = useLiveList();
  const { isLoggedIn, face } = useAuthStore();
  const { items: historyItems, restore: restoreHistory } = useHistoryStore();

  const [dynamicItems, setDynamicItems] = useState<VideoItem[]>([]);
  const [dynamicOffset, setDynamicOffset] = useState('');
  const [dynamicLoading, setDynamicLoading] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);

  // -- 沉浸式焦点项 (Hero Backdrop) --
  const [heroActiveItem, setHeroActiveItem] = useState<VideoItem | LiveRoom | null>(null);

  // 读取所有管线的数据
  const loadDynamic = useCallback(async (isRefresh = false) => {
    if (dynamicLoading) return;
    setDynamicLoading(true);
    try {
      const targetOffset = isRefresh ? '' : dynamicOffset;
      const { items, nextOffset } = await getDynamicFeeds(targetOffset);
      if (items.length > 0) {
        setDynamicItems(prev => isRefresh ? items : [...prev, ...items]);
        setDynamicOffset(nextOffset);
      }
    } catch (e) {
      console.warn('Load dynamic feeds failed', e);
    } finally {
      setDynamicLoading(false);
    }
  }, [dynamicOffset, dynamicLoading]);

  useEffect(() => {
    restoreHistory();
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
  }, [restoreHistory, load, liveLoad]);

  const allVideos = useMemo(() => {
    const items: VideoItem[] = [];
    for (const page of pages) items.push(...page);
    return items;
  }, [pages]);

  // -- 组装泳道配置 --
  const ROW_CARD_WIDTH = 260; // 专属的泳道横向卡片尺寸
  type RowConfig = {
    id: string;
    title: string;
    data: VideoItem[];
    type: 'video';
    loading: boolean;
    onLoadMore?: () => void;
  } | {
    id: string;
    title: string;
    data: LiveRoom[];
    type: 'live';
    loading: boolean;
    onLoadMore?: () => void;
  };

  // 主屏幕滚动项
  const rowConfig: RowConfig[] = [
    {
      id: 'history',
      title: '继续观看',
      data: historyItems.slice(0, 15).map(h => ({
        bvid: h.bvid,
        aid: 0,
        title: h.title,
        pic: h.pic,
        duration: h.duration,
        desc: '',
        owner: {
          mid: 0,
          name: h.ownerName,
          face: '',
        },
        stat: {
          view: 0,
          danmaku: 0,
          reply: 0,
          like: 0,
          coin: 0,
          favorite: 0,
        },
      })), // 映射为 VideoItem 结构
      type: 'video' as const,
      loading: false,
      onLoadMore: undefined
    },
    {
      id: 'hot',
      title: '热门精选',
      data: allVideos,
      type: 'video' as const,
      loading: loading,
      onLoadMore: () => load()
    },
    {
      id: 'live',
      title: '正在直播',
      data: rooms,
      type: 'live' as const,
      loading: liveLoading,
      onLoadMore: () => liveLoad()
    },
    {
      id: 'dynamic',
      title: '最新动态',
      data: dynamicItems,
      type: 'video' as const,
      loading: dynamicLoading,
      onLoadMore: () => loadDynamic()
    }
  ].filter(row => row.data.length > 0 || row.loading); // 隐藏无数据的轨道（例如未登录时历史记录为空）

  return (
    <View style={styles.container}>
      {/* 背景层：视差沉浸海报 */}
      <HeroBackdrop activeItem={heroActiveItem} />

      {/* 左侧导航栏 - 精简模式 */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>JK</Text>

        {SIDEBAR_ITEMS.map(tab => {
          const isHome = tab.key === 'home';
          return (
            <TVFocusable
              key={tab.key}
              style={[
                styles.sidebarItem,
                isHome && { backgroundColor: `rgba(255,255,255,0.1)` },
              ]}
              onPress={() => {
                if (tab.route) router.push(tab.route as any);
              }}
              scaleFactor={1.1}
              borderColor={tab.color}
              accessibilityLabel={tab.label}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={isHome ? tab.color : TV.color.textTertiary}
              />
              <Text
                style={[
                  styles.sidebarText,
                  isHome && { color: tab.color, fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TVFocusable>
          );
        })}

        <View style={{ flex: 1 }} />

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/settings' as any)}
          scaleFactor={1.1}
          accessibilityLabel="设置"
        >
          <Ionicons name="settings-outline" size={22} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>设置</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => {
            if (!isLoggedIn) setShowLogin(true);
          }}
          scaleFactor={1.1}
          accessibilityLabel={isLoggedIn ? '已登录' : '登录'}
        >
          {isLoggedIn && face ? (
            <Image
              source={{ uri: proxyImageUrl(face) }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={26} color={TV.color.textTertiary} />
          )}
          <Text style={styles.sidebarText}>
            {isLoggedIn ? '已登录' : '登录'}
          </Text>
        </TVFocusable>
      </View>

      {/* 右侧流体主控区：嵌套多行 TVHorizontalRow */}
      <View style={styles.content}>
        <FlatList
          data={rowConfig}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainFeedContent}
          renderItem={({ item }) => {
            if (item.type === 'video') {
              return (
                <TVHorizontalRow<VideoItem>
                  title={item.title}
                  data={item.data}
                  loading={item.loading}
                  onEndReached={item.onLoadMore}
                  keyExtractor={(d, index) => `${item.id}-${d.bvid}-${index}`}
                  onItemFocus={focusedItem => setHeroActiveItem(focusedItem)}
                  renderItem={(info, onFocusChange) => (
                    <TVVideoCard
                      item={info.item}
                      onPress={() => router.push(`/video/${info.item.bvid}` as any)}
                      cardWidth={ROW_CARD_WIDTH}
                      onFocusChange={onFocusChange}
                    />
                  )}
                />
              );
            }

            return (
              <TVHorizontalRow<LiveRoom>
                title={item.title}
                data={item.data}
                loading={item.loading}
                onEndReached={item.onLoadMore}
                keyExtractor={(d, index) => `${item.id}-${d.roomid}-${index}`}
                onItemFocus={focusedItem => setHeroActiveItem(focusedItem)}
                renderItem={(info, onFocusChange) => (
                  <TVLiveCard
                    item={info.item}
                    onPress={() => router.push(`/live/${info.item.roomid}` as any)}
                    cardWidth={ROW_CARD_WIDTH}
                    onFocusChange={onFocusChange}
                  />
                )}
              />
            );
          }}
        />
      </View>

      <TVLoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: TV.color.bg,
  },
  sidebar: {
    width: TV.sidebar.width,
    backgroundColor: 'transparent',
    paddingVertical: TV.space.lg,
    alignItems: 'center',
    zIndex: 10,
    // 左栏加入一道阴影遮罩以便图标总能看清
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: TV.color.white,
    marginBottom: TV.space.xxl,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sidebarItem: {
    width: TV.sidebar.width - TV.space.lg,
    alignItems: 'center',
    paddingVertical: TV.space.sm,
    borderRadius: TV.radius.md,
    marginBottom: TV.space.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sidebarText: {
    fontSize: TV.font.xs,
    color: TV.color.textTertiary,
    marginTop: 4,
  },
  mainFeedContent: {
    paddingTop: '25%', // 顶部留出巨大空间给英雄海报展示
    paddingBottom: TV.space.xxl,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TV.color.placeholder,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
