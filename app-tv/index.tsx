import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVLiveCard } from '../components/tv/TVLiveCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVLoginModal } from '../components/tv/TVLoginModal';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVLoading } from '../components/tv/TVLoading';
import { useVideoList } from '../hooks/useVideoList';
import { useLiveList } from '../hooks/useLiveList';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import { proxyImageUrl } from '../utils/imageUrl';
import { LinearGradient } from 'expo-linear-gradient';
import type { VideoItem, LiveRoom } from '../services/types';
import { TV } from '../constants/tvTheme';

function formatDuration(sec: number): string {
  if (sec <= 0 || isNaN(sec)) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type TabKey = 'hot' | 'dynamic' | 'live';

const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: 'hot', label: '热门', icon: 'flame', color: TV.color.hot },
  { key: 'dynamic', label: '动态', icon: 'planet', color: TV.color.info },
  { key: 'live', label: '直播', icon: 'radio', color: TV.color.premium },
];

const LIVE_AREAS = [
  { id: 0, name: '推荐' },
  { id: 2, name: '网游' },
  { id: 3, name: '手游' },
  { id: 6, name: '单机' },
  { id: 1, name: '娱乐' },
  { id: 9, name: '虚拟' },
  { id: 10, name: '生活' },
];

/**
 * TV 首页：横屏布局，左侧导航栏 + 右侧内容网格。
 * 使用 D-Pad 焦点导航。
 */
export default function TVHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { pages, loading, load, refresh, refreshing } = useVideoList();
  const {
    rooms,
    loading: liveLoading,
    load: liveLoad,
    refresh: liveRefresh,
    refreshing: liveRefreshing,
  } = useLiveList();
  const { isLoggedIn, face } = useAuthStore();
  const { items: historyItems, getProgress, restore: restoreHistory } = useHistoryStore();
  const [activeTab, setActiveTab] = useState<TabKey>('hot');
  const [showLogin, setShowLogin] = useState(false);
  const [liveAreaId, setLiveAreaId] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // 动态数据流状态
  const [dynamicItems, setDynamicItems] = useState<VideoItem[]>([]);
  const [dynamicOffset, setDynamicOffset] = useState('');
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const { getDynamicFeeds } = require('../services/bilibili');

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
    } finally {
      setDynamicLoading(false);
    }
  }, [dynamicOffset, dynamicLoading]);

  useEffect(() => {
    restoreHistory();
    load();
  }, []);

  // 获取最近播放的一条记录
  const lastWatched = activeTab === 'hot' && historyItems.length > 0 ? historyItems[0] : null;

  // 将 pages 展平为 VideoItem 数组
  const allVideos = useMemo(() => {
    const items: VideoItem[] = [];
    for (const page of pages) {
      items.push(...page);
    }
    return items;
  }, [pages]);

  const handleTabChange = useCallback(
    (key: TabKey) => {
      // 淡出 → 切换 → 淡入
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setActiveTab(key);
        if (key === 'live' && rooms.length === 0) {
          liveLoad(true, liveAreaId);
        } else if (key === 'dynamic' && dynamicItems.length === 0) {
          loadDynamic(true);
        }
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    },
    [rooms.length, liveLoad, liveAreaId, contentOpacity],
  );

  const handleLiveArea = useCallback(
    (areaId: number) => {
      setLiveAreaId(areaId);
      liveLoad(true, areaId);
    },
    [liveLoad],
  );

  // 5 列网格
  const NUM_COLUMNS = 5;

  const renderVideoItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <TVVideoCard
        item={item}
        onPress={() => router.push(`/video/${item.bvid}` as any)}
        sidebarWidth={TV.sidebar.width}
      />
    ),
    [router],
  );

  const renderLiveItem = useCallback(
    ({ item }: { item: LiveRoom }) => (
      <TVLiveCard
        item={item}
        onPress={() => router.push(`/live/${item.roomid}` as any)}
        sidebarWidth={TV.sidebar.width}
      />
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      {/* 左侧导航栏 */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>JK</Text>

        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TVFocusable
              key={tab.key}
              style={[
                styles.sidebarItem,
                isActive && { backgroundColor: `${tab.color}25` }, // 0.15 hex alpha approx
              ]}
              onPress={() => handleTabChange(tab.key)}
              scaleFactor={1}
              borderColor={tab.color}
              accessibilityLabel={tab.label}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={isActive ? tab.color : TV.color.textTertiary}
              />
              <Text
                style={[
                  styles.sidebarText,
                  isActive && { color: tab.color, fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TVFocusable>
          );
        })}

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/search' as any)}
          scaleFactor={1}
          borderColor={TV.color.info}
          accessibilityLabel="搜索"
        >
          <Ionicons name="search" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>搜索</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/history' as any)}
          scaleFactor={1}
          borderColor={TV.color.success}
          accessibilityLabel="历史记录"
        >
          <Ionicons name="time-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>历史</Text>
        </TVFocusable>
        
        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/favorites' as any)}
          scaleFactor={1}
          borderColor={TV.color.gold}
          accessibilityLabel="我的收藏"
        >
          <Ionicons name="star-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>收藏</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/following' as any)}
          scaleFactor={1}
          borderColor={TV.color.hot}
          accessibilityLabel="追番追剧"
        >
          <Ionicons name="heart-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>追番</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/ranking' as any)}
          scaleFactor={1}
          accessibilityLabel="排行榜"
        >
          <Ionicons name="trophy-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>排行</Text>
        </TVFocusable>

        <View style={{ flex: 1 }} />

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() =>
            router.push('/settings' as any)
          }
          scaleFactor={1}
          accessibilityLabel="设置"
        >
          <Ionicons name="settings-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>设置</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => {
            if (!isLoggedIn) setShowLogin(true);
          }}
          scaleFactor={1}
          accessibilityLabel={isLoggedIn ? '已登录' : '登录'}
        >
          {isLoggedIn && face ? (
            <Image
              source={{ uri: proxyImageUrl(face) }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={24} color={TV.color.textTertiary} />
          )}
          <Text style={styles.sidebarText}>
            {isLoggedIn ? '已登录' : '登录'}
          </Text>
        </TVFocusable>
      </View>

      {/* 右侧内容区 */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        {activeTab === 'hot' ? (
          <FlatList
            data={allVideos}
            keyExtractor={item => item.bvid}
            renderItem={renderVideoItem}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            onEndReached={() => load()}
            onEndReachedThreshold={0.5}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            removeClippedSubviews
            ListHeaderComponent={
              lastWatched ? (
                <View style={[styles.resumeSection, { flex: 1 }]}>
                  <Text style={styles.resumeHeaderTitle}>最近播放</Text>
                  <TVFocusable
                    style={styles.resumeCard}
                    onPress={() => router.push(`/video/${lastWatched.bvid}` as any)}
                    scaleFactor={1.02}
                    hasTVPreferredFocus
                  >
                    <Image
                      source={{ uri: proxyImageUrl(lastWatched.pic) }}
                      style={styles.resumeCover}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={styles.resumeGradient}
                    />
                    <View style={styles.resumeInfo}>
                      <Text style={styles.resumeVideoTitle} numberOfLines={2}>
                        {lastWatched.title}
                      </Text>
                      <View style={styles.resumeMetaWrap}>
                        <Ionicons name="play-circle" size={18} color={TV.color.accent} />
                        <Text style={styles.resumeAuthor}>
                          {lastWatched.ownerName}
                          {' · '}
                          看到 {formatDuration(getProgress(lastWatched.bvid))}
                          {lastWatched.duration ? ` / ${formatDuration(lastWatched.duration)}` : ''}
                        </Text>
                      </View>
                    </View>
                  </TVFocusable>
                </View>
              ) : null
            }
            ListFooterComponent={loading ? <TVLoading /> : null}
            ListEmptyComponent={
              loading ? (
                <TVSkeleton columns={NUM_COLUMNS} count={NUM_COLUMNS * 2} sidebarWidth={TV.sidebar.width} />
              ) : (
                <TVEmptyState
                  title="内容加载失败"
                  hint="请检查网络状态后重试"
                  onRetry={() => load(true)}
                  style={{ flex: 1, paddingTop: 100 }}
                />
              )
            }
          />
        ) : activeTab === 'dynamic' ? (
          <FlatList
            data={dynamicItems}
            keyExtractor={(item, index) => `${item.bvid}-${index}`}
            renderItem={renderVideoItem}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            onEndReached={() => loadDynamic()}
            onEndReachedThreshold={0.5}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            removeClippedSubviews
            ListEmptyComponent={
              !dynamicLoading ? (
                <TVEmptyState
                  title="动态空空如也"
                  hint="也许网络出小差了，或 UP 主们都去摸鱼了"
                  onRetry={() => loadDynamic(true)}
                  style={{ flex: 1, paddingTop: 100 }}
                />
              ) : null
            }
            ListFooterComponent={dynamicLoading ? <TVLoading /> : null}
          />
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={item => String(item.roomid)}
            renderItem={renderLiveItem}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            onEndReached={() => liveLoad()}
            onEndReachedThreshold={1.5}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            removeClippedSubviews
            ListHeaderComponent={
              <View style={styles.areaBar}>
                {LIVE_AREAS.map(area => (
                  <TVFocusable
                    key={area.id}
                    style={[
                      styles.areaChip,
                      liveAreaId === area.id && styles.areaChipActive,
                    ]}
                    onPress={() => handleLiveArea(area.id)}
                    scaleFactor={1}
                  >
                    <Text
                      style={[
                        styles.areaChipText,
                        liveAreaId === area.id && styles.areaChipTextActive,
                      ]}
                    >
                      {area.name}
                    </Text>
                  </TVFocusable>
                ))}
              </View>
            }
            ListFooterComponent={liveLoading ? <TVLoading /> : null}
            ListEmptyComponent={
              liveLoading ? (
                <TVSkeleton columns={NUM_COLUMNS} count={NUM_COLUMNS * 2} sidebarWidth={TV.sidebar.width} />
              ) : (
                <TVEmptyState
                  title="直播流获取失败"
                  hint="可能是网络受到限制，请稍后重试"
                  onRetry={() => liveLoad(true, liveAreaId)}
                  style={{ flex: 1, paddingTop: 100 }}
                />
              )
            }
          />
        )}
      </Animated.View>

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
    backgroundColor: TV.color.surfaceAlt,
    paddingVertical: TV.space.lg,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: TV.color.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: TV.color.accent,
    marginBottom: TV.space.xxl - TV.space.sm,
  },
  sidebarItem: {
    width: TV.sidebar.width - TV.space.lg,
    alignItems: 'center',
    paddingVertical: TV.space.md,
    borderRadius: TV.radius.md,
    marginBottom: TV.space.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sidebarText: {
    fontSize: TV.font.xs,
    color: TV.color.textTertiary,
    marginTop: TV.space.xs,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: TV.layout.listPadding,
  },
  row: {
    gap: TV.layout.gridGap,
    paddingHorizontal: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TV.color.placeholder,
  },
  areaBar: {
    flexDirection: 'row',
    gap: TV.space.sm - 2,
    paddingVertical: TV.space.sm,
    paddingHorizontal: TV.space.xs,
  },
  areaChip: {
    paddingHorizontal: TV.space.md,
    paddingVertical: TV.space.sm - 2,
    borderRadius: TV.radius.xl,
    backgroundColor: TV.color.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  areaChipActive: {
    backgroundColor: `${TV.color.premium}25`, // roughly 15% opacity premium indigo
    borderColor: TV.color.premium,
  },
  areaChipText: {
    fontSize: TV.font.md,
    color: TV.color.textSecondary,
  },
  areaChipTextActive: {
    fontSize: 14,
    color: TV.color.premium,
    fontWeight: '600',
  },
  // 续播卡片
  resumeSection: {
    paddingHorizontal: TV.layout.gridGap,
    marginBottom: TV.space.xl,
  },
  resumeHeaderTitle: {
    fontSize: TV.font.xl,
    color: TV.color.textSecondary,
    fontWeight: 'bold',
    marginBottom: TV.space.md,
  },
  resumeCard: {
    width: '100%',
    height: 220,
    borderRadius: TV.radius.lg,
    overflow: 'hidden',
    backgroundColor: TV.color.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resumeCover: {
    ...StyleSheet.absoluteFillObject,
  },
  resumeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  resumeInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: TV.space.xl,
  },
  resumeVideoTitle: {
    fontSize: TV.font.heading,
    fontWeight: 'bold',
    color: TV.color.white,
    marginBottom: TV.space.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resumeMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.xs,
  },
  resumeAuthor: {
    fontSize: TV.font.xl,
    color: TV.color.textSecondary,
  },
});
