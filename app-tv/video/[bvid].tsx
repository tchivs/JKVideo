import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoPlayer } from '../../components/tv/TVVideoPlayer';
import { TVFocusable } from '../../components/tv/TVFocusable';
import { getDanmaku } from '../../services/bilibili';
import type { DanmakuItem, VideoItem } from '../../services/types';
import { useVideoDetail } from '../../hooks/useVideoDetail';
import { useComments } from '../../hooks/useComments';
import { useRelatedVideos } from '../../hooks/useRelatedVideos';
import { useHistoryStore } from '../../store/historyStore';
import { formatCount } from '../../utils/format';
import { proxyImageUrl } from '../../utils/imageUrl';

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

  const handlePageChange = useCallback(
    (cid: number, index: number) => {
      setCurrentPage(index);
      // 重新加载弹幕
      getDanmaku(cid).then(setDanmakus);
    },
    [],
  );

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
        />
      </View>

      {/* 右侧信息面板 */}
      <View style={styles.infoSection}>
        {videoLoading ? (
          <ActivityIndicator color="#00AEEC" style={styles.loader} />
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
                  <Text style={styles.upName}>{video.owner.name}</Text>
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
                    <Text style={styles.sectionTitle}>
                      合集 · {video.ugc_season!.title} ({video.ugc_season!.ep_count}集)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.episodeRow}>
                        {episodes.map((ep, i) => (
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
                    <Text style={styles.sectionTitle}>
                      选集 ({pages.length}P)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.episodeRow}>
                        {pages.map((p, i) => (
                          <TVFocusable
                            key={p.cid}
                            style={[
                              styles.episodeChip,
                              i === currentPage &&
                                styles.episodeChipActive,
                            ]}
                            onPress={() =>
                              handlePageChange(p.cid, i)
                            }
                            scaleFactor={1}
                          >
                            <Text
                              style={[
                                styles.episodeText,
                                i === currentPage &&
                                  styles.episodeTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              P{i + 1} {p.part}
                            </Text>
                          </TVFocusable>
                        ))}
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
                      <Text style={styles.relatedMeta}>
                        {item.owner?.name ?? ''} ·{' '}
                        {formatCount(item.stat?.view ?? 0)}播放
                      </Text>
                    </View>
                  </TVFocusable>
                ))}
                {relatedLoading && (
                  <ActivityIndicator
                    color="#00AEEC"
                    style={styles.loader}
                  />
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
                          color="#666"
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
                    <Text style={styles.emptyText}>暂无评论</Text>
                  ) : null
                }
                ListFooterComponent={
                  cmtLoading ? (
                    <ActivityIndicator
                      color="#00AEEC"
                      style={styles.loader}
                    />
                  ) : null
                }
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
      <Ionicons name={icon as any} size={13} color="#888" />
      <Text style={styles.statText}>{formatCount(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#121212',
  },
  playerSection: { flex: 3 },
  infoSection: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loader: { marginVertical: 20 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  tabItemActive: { borderBottomColor: '#00AEEC' },
  tabText: { fontSize: 13, color: '#888' },
  tabTextActive: { color: '#00AEEC', fontWeight: '600' },
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
    backgroundColor: '#333',
  },
  upName: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  // 标题
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0e0e0',
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
  statText: { fontSize: 11, color: '#888' },
  // 简介
  desc: {
    fontSize: 12,
    color: '#777',
    lineHeight: 18,
    marginBottom: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  // 合集 & 分P
  seasonBox: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  episodeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  episodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: 'transparent',
    maxWidth: 140,
  },
  episodeChipActive: {
    borderColor: '#00AEEC',
    backgroundColor: '#1a3040',
  },
  episodeText: { fontSize: 11, color: '#aaa' },
  episodeTextActive: { color: '#00AEEC', fontWeight: '600' },
  // 推荐
  relatedCard: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#252525',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  relatedThumb: {
    width: 100,
    height: 56,
    backgroundColor: '#333',
  },
  relatedInfo: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  relatedTitle: { fontSize: 12, color: '#ccc', lineHeight: 16 },
  relatedMeta: { fontSize: 10, color: '#666' },
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
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortBtnActive: {
    backgroundColor: '#1a3040',
    borderColor: '#00AEEC',
  },
  sortBtnText: { fontSize: 12, color: '#888' },
  sortBtnTextActive: { color: '#00AEEC', fontWeight: '600' },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  cmtAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  cmtBody: { flex: 1 },
  cmtName: { fontSize: 11, color: '#888', marginBottom: 2 },
  cmtContent: { fontSize: 12, color: '#ccc', lineHeight: 17 },
  cmtMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  cmtLike: { fontSize: 10, color: '#666' },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    marginTop: 20,
  },
});
