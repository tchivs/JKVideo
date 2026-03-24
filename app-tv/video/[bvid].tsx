import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoPlayer } from '../../components/tv/TVVideoPlayer';
import { TVFocusable } from '../../components/tv/TVFocusable';
import { TVEmptyState } from '../../components/tv/TVEmptyState';
import { TVLoading } from '../../components/tv/TVLoading';
import { getDanmaku } from '../../services/bilibili';
import type { DanmakuItem, VideoItem } from '../../services/types';
import { useVideoDetail } from '../../hooks/useVideoDetail';
import { useComments } from '../../hooks/useComments';
import { useRelatedVideos } from '../../hooks/useRelatedVideos';
import { useHistoryStore } from '../../store/historyStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCount } from '../../utils/format';
import { proxyImageUrl } from '../../utils/imageUrl';
import { TV } from '../../constants/tvTheme';

type InfoTab = 'intro' | 'comments';

/**
 * TV 版视频详情页。
 * 左侧 3/4 播放器，右侧 1/4 信息面板（简介/合集/评论/推荐）。
 */
export default function TVVideoDetailScreen() {
  const { bvid } = useLocalSearchParams<{ bvid: string }>();
  const router = useRouter();
  const {
    video,
    playData,
    loading: videoLoading,
    error: videoError,
    qualities,
    currentQn,
    changeQuality,
  } = useVideoDetail(bvid as string);

  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [infoTab, setInfoTab] = useState<InfoTab>('intro');
  const { saveProgress, getProgress, addHistory } = useHistoryStore();
  const savedProgress = getProgress(bvid as string);
  const lastSaveRef = useRef(0);

  const [commentSort, setCommentSort] = useState<0 | 2>(2);
  const {
    comments,
    loading: cmtLoading,
    hasMore: cmtHasMore,
    load: loadComments,
  } = useComments(video?.aid ?? 0, commentSort);

  const {
    videos: relatedVideos,
    loading: relatedLoading,
    load: loadRelated,
  } = useRelatedVideos();

  useEffect(() => {
    loadRelated();
  }, []);

  useEffect(() => {
    if (video?.aid) loadComments();
  }, [video?.aid, commentSort]);

  useEffect(() => {
    if (!video?.cid) return;
    getDanmaku(video.cid).then(setDanmakus);
  }, [video?.cid]);

  // 记录观看历史
  useEffect(() => {
    if (!video) return;
    addHistory({
      bvid: bvid as string,
      title: video.title,
      pic: video.pic ?? '',
      ownerName: video.owner?.name ?? '',
      duration: video.duration ?? 0,
    });
  }, [video?.bvid]);

  // 节流保存播放进度（每 10 秒保存一次）
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      const now = Date.now();
      if (now - lastSaveRef.current > 10000) {
        lastSaveRef.current = now;
        saveProgress(bvid as string, time);
      }
    },
    [bvid, saveProgress],
  );

  // 合集/选集数据
  const episodes = video?.ugc_season?.sections?.[0]?.episodes ?? [];
  const hasEpisodes = episodes.length > 0;
  const currentEpIndex = episodes.findIndex(ep => ep.bvid === bvid);

  // 分P数据
  const pages = video?.pages ?? [];
  const hasPages = pages.length > 1;
  const [currentPage, setCurrentPage] = useState(0);

  // 倒序功能
  const [episodesReversed, setEpisodesReversed] = useState(false);
  const [pagesReversed, setPagesReversed] = useState(false);
  const epSortAnim = useRef(new Animated.Value(0)).current;
  const pageSortAnim = useRef(new Animated.Value(0)).current;

  const toggleEpisodesOrder = useCallback(() => {
    const next = !episodesReversed;
    setEpisodesReversed(next);
    Animated.spring(epSortAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [episodesReversed, epSortAnim]);

  const togglePagesOrder = useCallback(() => {
    const next = !pagesReversed;
    setPagesReversed(next);
    Animated.spring(pageSortAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [pagesReversed, pageSortAnim]);

  const displayedEpisodes = useMemo(
    () => (episodesReversed ? [...episodes].reverse() : episodes),
    [episodes, episodesReversed],
  );
  const displayedPages = useMemo(
    () => (pagesReversed ? [...pages].reverse() : pages),
    [pages, pagesReversed],
  );

  const handlePageChange = useCallback(
    (cid: number, index: number) => {
      setCurrentPage(index);
      // 重新加载弹幕
      getDanmaku(cid).then(setDanmakus);
    },
    [],
  );

  // 给播放器内置选集面板准备数据
  const playerEpisodes = useMemo(() => {
    if (hasEpisodes) {
      return episodes.map(ep => ({
        id: ep.bvid,
        title: ep.title,
        isCurrent: ep.bvid === bvid,
      }));
    }
    if (hasPages) {
      return pages.map((p, i) => ({
        id: String(p.cid),
        title: `P${i + 1} ${p.part}`,
        isCurrent: i === currentPage,
      }));
    }
    return undefined;
  }, [episodes, pages, bvid, currentPage, hasEpisodes, hasPages]);

  const handlePlayerEpisodeChange = useCallback(
    (id: string) => {
      if (hasEpisodes) {
        router.replace(`/video/${id}`);
      } else if (hasPages) {
        const idx = pages.findIndex(p => String(p.cid) === id);
        if (idx >= 0) handlePageChange(pages[idx].cid, idx);
      }
    },
    [hasEpisodes, hasPages, pages, router, handlePageChange],
  );

  // 计算自动连播的下一个标识
  const nextEpId = useMemo(() => {
    if (hasEpisodes && currentEpIndex >= 0 && currentEpIndex < episodes.length - 1) {
      return episodes[currentEpIndex + 1].bvid;
    }
    if (hasPages && currentPage >= 0 && currentPage < pages.length - 1) {
      return String(pages[currentPage + 1].cid);
    }
    return undefined;
  }, [hasEpisodes, currentEpIndex, episodes, hasPages, currentPage, pages]);

  const { nextVideoSource } = useSettingsStore();

  const fallbackNextId = useMemo(() => {
    if (!relatedVideos || relatedVideos.length === 0) return undefined;
    if (nextVideoSource === 'recommend') {
      return relatedVideos[0].bvid;
    }
    if (nextVideoSource === 'uploader') {
      const authorId = video?.owner?.mid;
      const sameAuthorVideo = relatedVideos.find(v => v.owner?.mid === authorId);
      if (sameAuthorVideo) return sameAuthorVideo.bvid;
      return relatedVideos[0].bvid; // 没有作者其它稿件，就退回推荐第一个
    }
    return undefined;
  }, [nextVideoSource, relatedVideos, video?.owner?.mid]);

  const autoPlayAvail = !!nextEpId || !!fallbackNextId;

  return (
    <View style={styles.container}>
      {/* 左侧播放器 */}
      <View style={styles.playerSection}>
        <TVVideoPlayer
          playData={playData}
          qualities={qualities}
          currentQn={currentQn}
          onQualityChange={changeQuality}
          bvid={bvid as string}
          cid={video?.cid}
          danmakus={danmakus}
          isFullscreen
          onTimeUpdate={handleTimeUpdate}
          initialTime={savedProgress}
          episodes={playerEpisodes}
          onEpisodeChange={handlePlayerEpisodeChange}
          hasNextEpisode={autoPlayAvail}
          onAutoPlayNext={() => {
            if (nextEpId) {
              handlePlayerEpisodeChange(nextEpId);
            } else if (fallbackNextId) {
              router.replace(`/video/${fallbackNextId}`);
            }
          }}
        />
      </View>

      {/* 右侧信息面板 */}
      <View style={styles.infoSection}>
        {videoLoading ? (
          <TVLoading style={{ flex: 1, justifyContent: 'center' }} />
        ) : videoError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={36} color={TV.color.danger} />
            <Text style={styles.errorText}>加载失败：{videoError}</Text>
          </View>
        ) : video ? (
          <>
            {/* Tab 栏 */}
            <View style={styles.tabBar}>
              <TVFocusable
                style={[
                  styles.tabItem,
                  infoTab === 'intro' && styles.tabItemActive,
                ]}
                onPress={() => setInfoTab('intro')}
                scaleFactor={1}
              >
                <Text
                  style={[
                    styles.tabText,
                    infoTab === 'intro' && styles.tabTextActive,
                  ]}
                >
                  简介
                </Text>
              </TVFocusable>
              <TVFocusable
                style={[
                  styles.tabItem,
                  infoTab === 'comments' && styles.tabItemActive,
                ]}
                onPress={() => setInfoTab('comments')}
                scaleFactor={1}
              >
                <Text
                  style={[
                    styles.tabText,
                    infoTab === 'comments' && styles.tabTextActive,
                  ]}
                >
                  评论 {video.stat?.reply ? formatCount(video.stat.reply) : ''}
                </Text>
              </TVFocusable>
            </View>

            {infoTab === 'intro' ? (
              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
              >
                {/* UP 主信息 */}
                <View style={styles.upRow}>
                  <Image
                    source={{ uri: proxyImageUrl(video.owner.face) }}
                    style={styles.avatar}
                  />
                  <Text style={styles.upName} numberOfLines={1}>{video.owner.name}</Text>
                </View>

                {/* 标题 */}
                <Text style={styles.title}>{video.title}</Text>

                {/* 统计 */}
                <View style={styles.statsRow}>
                  <StatBadge icon="play" count={video.stat?.view ?? 0} />
                  <StatBadge icon="heart" count={video.stat?.like ?? 0} />
                  <StatBadge icon="star" count={video.stat?.favorite ?? 0} />
                  <StatBadge
                    icon="chatbubble"
                    count={video.stat?.reply ?? 0}
                  />
                </View>

                {/* 简介 */}
                {!!video.desc && (
                  <Text style={styles.desc}>{video.desc}</Text>
                )}

                {/* 合集/剧集列表 */}
                {hasEpisodes && (
                  <View style={styles.seasonBox}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        合集 · {video.ugc_season!.title} ({video.ugc_season!.ep_count}集)
                      </Text>
                      <TVFocusable
                        style={styles.sortToggle}
                        onPress={toggleEpisodesOrder}
                        scaleFactor={1.1}
                        accessibilityLabel={episodesReversed ? '正序排列' : '倒序排列'}
                      >
                        <Animated.View
                          style={{
                            transform: [{
                              rotate: epSortAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '180deg'],
                              }),
                            }],
                          }}
                        >
                          <Ionicons
                            name="swap-vertical"
                            size={16}
                            color={episodesReversed ? TV.color.accent : TV.color.textTertiary}
                          />
                        </Animated.View>
                        <Text style={[
                          styles.sortToggleText,
                          episodesReversed && styles.sortToggleTextActive,
                        ]}>
                          {episodesReversed ? '倒序' : '正序'}
                        </Text>
                      </TVFocusable>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.episodeRow}>
                        {displayedEpisodes.map((ep, i) => (
                          <TVFocusable
                            key={ep.bvid}
                            style={[
                              styles.episodeChip,
                              ep.bvid === bvid &&
                                styles.episodeChipActive,
                            ]}
                            onPress={() =>
                              router.replace(`/video/${ep.bvid}`)
                            }
                            scaleFactor={1}
                            hasTVPreferredFocus={ep.bvid === bvid}
                          >
                            <Text
                              style={[
                                styles.episodeText,
                                ep.bvid === bvid &&
                                  styles.episodeTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {ep.title}
                            </Text>
                          </TVFocusable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* 分P选集 */}
                {hasPages && (
                  <View style={styles.seasonBox}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        选集 ({pages.length}P)
                      </Text>
                      {pages.length > 10 && (
                        <TVFocusable
                          style={styles.sortToggle}
                          onPress={togglePagesOrder}
                          scaleFactor={1.1}
                          accessibilityLabel={pagesReversed ? '正序排列' : '倒序排列'}
                        >
                          <Animated.View
                            style={{
                              transform: [{
                                rotate: pageSortAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg'],
                                }),
                              }],
                            }}
                          >
                            <Ionicons
                              name="swap-vertical"
                              size={16}
                              color={pagesReversed ? TV.color.accent : TV.color.textTertiary}
                            />
                          </Animated.View>
                          <Text style={[
                            styles.sortToggleText,
                            pagesReversed && styles.sortToggleTextActive,
                          ]}>
                            {pagesReversed ? '倒序' : '正序'}
                          </Text>
                        </TVFocusable>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.episodeRow}>
                        {displayedPages.map((p, i) => {
                          const realIndex = pagesReversed ? pages.length - 1 - i : i;
                          return (
                            <TVFocusable
                              key={p.cid}
                              style={[
                                styles.episodeChip,
                                realIndex === currentPage &&
                                  styles.episodeChipActive,
                              ]}
                              onPress={() =>
                                handlePageChange(p.cid, realIndex)
                              }
                              scaleFactor={1}
                            >
                              <Text
                                style={[
                                  styles.episodeText,
                                  realIndex === currentPage &&
                                    styles.episodeTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                P{realIndex + 1} {p.part}
                              </Text>
                            </TVFocusable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* 推荐视频 */}
                <Text style={styles.sectionTitle}>推荐视频</Text>
                {relatedVideos.map(item => (
                  <TVFocusable
                    key={item.bvid}
                    style={styles.relatedCard}
                    onPress={() =>
                      router.push(`/video/${item.bvid}` as any)
                    }
                    scaleFactor={1.02}
                  >
                    <Image
                      source={{ uri: proxyImageUrl(item.pic) }}
                      style={styles.relatedThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedInfo}>
                      <Text
                        style={styles.relatedTitle}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.relatedMeta} numberOfLines={1}>
                        {item.owner?.name ?? ''} ·{' '}
                        {formatCount(item.stat?.view ?? 0)}播放
                      </Text>
                    </View>
                  </TVFocusable>
                ))}
                {relatedLoading && (
                  <TVLoading />
                )}
              </ScrollView>
            ) : (
              /* 评论 Tab */
              <FlatList
                style={styles.scrollArea}
                data={comments}
                keyExtractor={c => String(c.rpid)}
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                  if (cmtHasMore && !cmtLoading) loadComments();
                }}
                onEndReachedThreshold={0.3}
                ListHeaderComponent={
                  <View style={styles.sortRow}>
                    <TVFocusable
                      style={[
                        styles.sortBtn,
                        commentSort === 2 && styles.sortBtnActive,
                      ]}
                      onPress={() => setCommentSort(2)}
                      scaleFactor={1}
                    >
                      <Text
                        style={[
                          styles.sortBtnText,
                          commentSort === 2 &&
                            styles.sortBtnTextActive,
                        ]}
                      >
                        热门
                      </Text>
                    </TVFocusable>
                    <TVFocusable
                      style={[
                        styles.sortBtn,
                        commentSort === 0 && styles.sortBtnActive,
                      ]}
                      onPress={() => setCommentSort(0)}
                      scaleFactor={1}
                    >
                      <Text
                        style={[
                          styles.sortBtnText,
                          commentSort === 0 &&
                            styles.sortBtnTextActive,
                        ]}
                      >
                        最新
                      </Text>
                    </TVFocusable>
                  </View>
                }
                renderItem={({ item: c }) => (
                  <View style={styles.commentItem}>
                    <Image
                      source={{
                        uri: proxyImageUrl(c.member?.avatar ?? ''),
                      }}
                      style={styles.cmtAvatar}
                    />
                    <View style={styles.cmtBody}>
                      <Text style={styles.cmtName}>
                        {c.member?.uname ?? ''}
                      </Text>
                      <Text style={styles.cmtContent}>
                        {c.content?.message ?? ''}
                      </Text>
                      <View style={styles.cmtMeta}>
                        <Ionicons
                          name="heart-outline"
                          size={12}
                          color={TV.color.textDisabled}
                        />
                        <Text style={styles.cmtLike}>
                          {formatCount(c.like ?? 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  !cmtLoading ? (
                    <TVEmptyState title="暂无评论" icon="chatbubble-outline" />
                  ) : null
                }
                ListFooterComponent={cmtLoading ? <TVLoading /> : null}
              />
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

function StatBadge({ icon, count }: { icon: string; count: number }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon as any} size={13} color={TV.color.textTertiary} />
      <Text style={styles.statText}>{formatCount(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: TV.color.bg,
  },
  playerSection: { flex: 3 },
  infoSection: {
    flex: 1,
    backgroundColor: TV.color.surface,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: TV.space.xl,
    gap: TV.space.md,
  },
  errorText: {
    color: TV.color.textSecondary,
    fontSize: TV.font.md,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TV.color.border,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  tabItemActive: { borderBottomColor: TV.color.accent },
  tabText: { fontSize: 13, color: TV.color.textTertiary },
  tabTextActive: { color: TV.color.accent, fontWeight: '600' },
  scrollArea: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  // UP 主
  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TV.color.surfaceAlt,
  },
  upName: { fontSize: 13, color: TV.color.textSecondary, fontWeight: '500', flexShrink: 1 },
  // 标题
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: TV.color.textPrimary,
    lineHeight: 21,
    marginBottom: 8,
  },
  // 统计
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: TV.color.textTertiary },
  // 简介
  desc: {
    fontSize: 12,
    color: TV.color.textTertiary,
    lineHeight: 18,
    marginBottom: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TV.color.border,
  },
  // 合集 & 分P
  seasonBox: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TV.color.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TV.color.textSecondary,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: TV.color.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortToggleText: {
    fontSize: 11,
    color: TV.color.textTertiary,
  },
  sortToggleTextActive: {
    color: TV.color.accent,
    fontWeight: '600',
  },
  episodeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  episodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: TV.color.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    maxWidth: 140,
  },
  episodeChipActive: {
    borderColor: TV.color.accent,
    backgroundColor: TV.color.accentBg,
  },
  episodeText: { fontSize: 11, color: TV.color.textSecondary },
  episodeTextActive: { color: TV.color.accent, fontWeight: '600' },
  // 推荐
  relatedCard: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: TV.color.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  relatedThumb: {
    width: 100,
    height: 56,
    backgroundColor: TV.color.surfaceAlt,
  },
  relatedInfo: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  relatedTitle: { fontSize: 12, color: TV.color.textSecondary, lineHeight: 16 },
  relatedMeta: { fontSize: 10, color: TV.color.textDisabled },
  // 评论
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: TV.color.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortBtnActive: {
    backgroundColor: TV.color.accentBg,
    borderColor: TV.color.accent,
  },
  sortBtnText: { fontSize: 12, color: TV.color.textTertiary },
  sortBtnTextActive: { color: TV.color.accent, fontWeight: '600' },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  cmtAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TV.color.surfaceAlt,
  },
  cmtBody: { flex: 1 },
  cmtName: { fontSize: 11, color: TV.color.textTertiary, marginBottom: 2 },
  cmtContent: { fontSize: 12, color: TV.color.textSecondary, lineHeight: 17 },
  cmtMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  cmtLike: { fontSize: 10, color: TV.color.textDisabled },
});
