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
import { useVideoList } from '../hooks/useVideoList';
import { useLiveList } from '../hooks/useLiveList';
import { useAuthStore } from '../store/authStore';
import { proxyImageUrl } from '../utils/imageUrl';
import type { VideoItem, LiveRoom } from '../services/types';
import { TV } from '../constants/tvTheme';

type TabKey = 'hot' | 'live';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hot', label: '热门', icon: 'flame' },
  { key: 'live', label: '直播', icon: 'radio' },
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
  const [activeTab, setActiveTab] = useState<TabKey>('hot');
  const [showLogin, setShowLogin] = useState(false);
  const [liveAreaId, setLiveAreaId] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    load();
  }, []);

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
      />
    ),
    [router],
  );

  const renderLiveItem = useCallback(
    ({ item }: { item: LiveRoom }) => (
      <TVLiveCard
        item={item}
        onPress={() => router.push(`/live/${item.roomid}` as any)}
      />
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      {/* 左侧导航栏 */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>JK</Text>

        {TABS.map(tab => (
          <TVFocusable
            key={tab.key}
            style={[
              styles.sidebarItem,
              activeTab === tab.key && styles.sidebarItemActive,
            ]}
            onPress={() => handleTabChange(tab.key)}
            scaleFactor={1}
            accessibilityLabel={tab.label}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? TV.color.accent : TV.color.textTertiary}
            />
            <Text
              style={[
                styles.sidebarText,
                activeTab === tab.key && styles.sidebarTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TVFocusable>
        ))}

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/search' as any)}
          scaleFactor={1}
          accessibilityLabel="搜索"
        >
          <Ionicons name="search" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>搜索</Text>
        </TVFocusable>

        <TVFocusable
          style={styles.sidebarItem}
          onPress={() => router.push('/history' as any)}
          scaleFactor={1}
          accessibilityLabel="历史记录"
        >
          <Ionicons name="time-outline" size={20} color={TV.color.textTertiary} />
          <Text style={styles.sidebarText}>历史</Text>
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
            ListFooterComponent={
              loading ? (
                <ActivityIndicator
                  color={TV.color.accent}
                  style={styles.loader}
                />
              ) : null
            }
            ListEmptyComponent={
              loading ? (
                <TVSkeleton columns={NUM_COLUMNS} count={NUM_COLUMNS * 2} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cloud-offline-outline" size={64} color={TV.color.textTertiary} />
                  <Text style={styles.emptyText}>内容加载失败</Text>
                  <Text style={styles.emptyHint}>请检查网络状态后重试</Text>
                  <TVFocusable onPress={() => load(true)} style={styles.retryBtn} scaleFactor={1.05}>
                    <Text style={styles.retryText}>重试</Text>
                  </TVFocusable>
                </View>
              )
            }
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
            ListFooterComponent={
              liveLoading ? (
                <ActivityIndicator
                  color={TV.color.accent}
                  style={styles.loader}
                />
              ) : null
            }
            ListEmptyComponent={
              liveLoading ? (
                <TVSkeleton columns={NUM_COLUMNS} count={NUM_COLUMNS * 2} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cloud-offline-outline" size={64} color={TV.color.textTertiary} />
                  <Text style={styles.emptyText}>直播流获取失败</Text>
                  <Text style={styles.emptyHint}>可能是网络受到限制，请稍后重试</Text>
                  <TVFocusable onPress={() => liveLoad(true, liveAreaId)} style={styles.retryBtn} scaleFactor={1.05}>
                    <Text style={styles.retryText}>重试</Text>
                  </TVFocusable>
                </View>
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
  sidebarItemActive: {
    backgroundColor: 'rgba(0,174,236,0.1)',
  },
  sidebarText: {
    fontSize: TV.font.xs,
    color: TV.color.textTertiary,
    marginTop: TV.space.xs,
  },
  sidebarTextActive: {
    color: TV.color.accent,
    fontWeight: '600',
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
  loader: {
    marginVertical: TV.space.xl,
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
    backgroundColor: TV.color.accentBg,
    borderColor: TV.color.accent,
  },
  areaChipText: {
    fontSize: TV.font.md,
    color: TV.color.textSecondary,
  },
  areaChipTextActive: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: TV.space.md,
  },
  emptyText: {
    color: TV.color.textSecondary,
    fontSize: TV.font.lg,
    fontWeight: '600',
  },
  emptyHint: {
    color: TV.color.textTertiary,
    fontSize: TV.font.md,
  },
  retryBtn: {
    marginTop: TV.space.lg,
    paddingHorizontal: TV.space.xl,
    paddingVertical: TV.space.md,
    backgroundColor: TV.color.surfaceAlt,
    borderRadius: TV.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  retryText: {
    color: TV.color.textPrimary,
    fontSize: TV.font.md,
    fontWeight: '500',
  },
});
