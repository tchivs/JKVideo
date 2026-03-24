import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PlayUrlResponse, DanmakuItem } from '../../services/types';
import { buildDashMpdUri } from '../../utils/dash';
import { formatDuration } from '../../utils/format';
import DanmakuOverlay from '../DanmakuOverlay';
import { TVFocusable } from './TVFocusable';
import { useSettingsStore } from '../../store/settingsStore';
import { TV } from '../../constants/tvTheme';

const HIDE_DELAY = 5000;
const SEEK_STEP = 10; // 秒

const HEADERS = {
  Referer: 'https://www.bilibili.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export interface TVVideoPlayerRef {
  seek: (t: number) => void;
  setPaused: (v: boolean) => void;
}

interface EpisodeInfo {
  id: string;
  title: string;
  isCurrent?: boolean;
}

interface Props {
  playData: PlayUrlResponse | null;
  qualities: { qn: number; desc: string }[];
  currentQn: number;
  onQualityChange: (qn: number) => void;
  style?: object;
  bvid?: string;
  cid?: number;
  danmakus?: DanmakuItem[];
  isFullscreen?: boolean;
  onTimeUpdate?: (t: number) => void;
  initialTime?: number;
  /** 合集/分P 集数列表，用于播放器内快速选集 */
  episodes?: EpisodeInfo[];
  /** 用户选择集数后回调，参数为 episode id */
  onEpisodeChange?: (id: string) => void;
}

/**
 * TV 版视频播放器。
 * 使用 D-Pad 控制：确认键=播放暂停，左右=快进快退，上=显示控制栏，下=聚焦控制按钮。
 * 不使用 PanResponder 触摸手势。
 */
export const TVVideoPlayer = forwardRef<TVVideoPlayerRef, Props>(
  function TVVideoPlayer(
    {
      playData,
      qualities,
      currentQn,
      onQualityChange,
      style,
      danmakus,
      isFullscreen,
      onTimeUpdate,
      initialTime,
      episodes: episodesProp,
      onEpisodeChange,
    }: Props,
    ref,
  ) {
    const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
    // TV 始终横屏，播放器取满宽，高度按 16:9
    const VIDEO_H = isFullscreen ? SCREEN_H : SCREEN_W * 0.5625;

    const [resolvedUrl, setResolvedUrl] = useState<string | undefined>();
    const isDash = !!playData?.dash;

    const [showControls, setShowControls] = useState(true);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [paused, setPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const durationRef = useRef(0);
    const currentTimeRef = useRef(0);

    const [buffered, setBuffered] = useState(0);
    const [showQuality, setShowQuality] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showSpeed, setShowSpeed] = useState(false);
    const [showDanmakuConfig, setShowDanmakuConfig] = useState(false);
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [epReversed, setEpReversed] = useState(false);

    const hasEpisodes = !!episodesProp?.length && episodesProp.length > 1;
    const displayedEpisodes = useMemo(
      () => (epReversed && episodesProp ? [...episodesProp].reverse() : episodesProp ?? []),
      [episodesProp, epReversed],
    );

    // 弹幕全局配置（从 settingsStore 读取 / 写回）
    const showDanmaku = useSettingsStore(s => s.dmEnabled);
    const setShowDanmaku = useSettingsStore(s => s.setDmEnabled);
    const dmOpacity = useSettingsStore(s => s.dmOpacity);
    const setDmOpacity = useSettingsStore(s => s.setDmOpacity);
    const dmFontScale = useSettingsStore(s => s.dmFontScale);
    const setDmFontScale = useSettingsStore(s => s.setDmFontScale);
    const dmAreaRatio = useSettingsStore(s => s.dmAreaRatio);
    const setDmAreaRatio = useSettingsStore(s => s.setDmAreaRatio);
    const dmFilterModes = useSettingsStore(s => s.dmFilterModes);
    const setDmFilterModes = useSettingsStore(s => s.setDmFilterModes);

    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<VideoRef>(null);

    useImperativeHandle(ref, () => ({
      seek: (t: number) => videoRef.current?.seek(t),
      setPaused: (v: boolean) => setPaused(v),
    }));

    const currentDesc =
      qualities.find(q => q.qn === currentQn)?.desc ??
      String(currentQn || 'HD');

    // 解析播放链接
    useEffect(() => {
      if (!playData) {
        setResolvedUrl(undefined);
        return;
      }
      if (isDash) {
        buildDashMpdUri(playData, currentQn)
          .then((uri) => {
            setResolvedUrl(uri);
            setError(null);
          })
          .catch(() => {
            const fallback = playData.dash!.video[0]?.baseUrl;
            setResolvedUrl(fallback);
            setError(null);
          });
      } else {
        setResolvedUrl(playData.durl?.[0]?.url);
        setError(null);
      }
    }, [playData, currentQn]);

    useEffect(() => {
      durationRef.current = duration;
    }, [duration]);

    useEffect(() => {
      currentTimeRef.current = currentTime;
    }, [currentTime]);

    // 控制栏自动隐藏
    const resetHideTimer = useCallback(() => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => setShowControls(false),
        HIDE_DELAY,
      );
    }, []);

    const showAndReset = useCallback(() => {
      setShowControls(true);
      resetHideTimer();
    }, [resetHideTimer]);

    useEffect(() => {
      resetHideTimer();
      return () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
      };
    }, []);

    // D-Pad 快进快退
    const seekForward = useCallback(() => {
      const t = clamp(currentTimeRef.current + SEEK_STEP, 0, durationRef.current);
      videoRef.current?.seek(t);
      setCurrentTime(t);
      showAndReset();
    }, [showAndReset]);

    const seekBackward = useCallback(() => {
      const t = clamp(currentTimeRef.current - SEEK_STEP, 0, durationRef.current);
      videoRef.current?.seek(t);
      setCurrentTime(t);
      showAndReset();
    }, [showAndReset]);

    const togglePause = useCallback(() => {
      setPaused(p => !p);
      showAndReset();
    }, [showAndReset]);

    const progressRatio =
      duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
    const bufferedRatio =
      duration > 0 ? clamp(buffered / duration, 0, 1) : 0;

    return (
      <View
        style={[
          isFullscreen
            ? styles.fsContainer
            : [styles.container, { width: SCREEN_W, height: VIDEO_H }],
          style,
        ]}
      >
        {resolvedUrl ? (
          <Video
            key={resolvedUrl}
            ref={videoRef}
            source={
              isDash
                ? { uri: resolvedUrl, type: 'mpd', headers: HEADERS }
                : { uri: resolvedUrl, headers: HEADERS }
            }
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            controls={false}
            paused={paused}
            rate={speed}
            onProgress={({
              currentTime: ct,
              seekableDuration: dur,
              playableDuration: buf,
            }) => {
              setCurrentTime(ct);
              if (dur > 0) setDuration(dur);
              setBuffered(buf);
              onTimeUpdate?.(ct);
            }}
            onLoad={() => {
              if (initialTime && initialTime > 0) {
                videoRef.current?.seek(initialTime);
              }
            }}
            onError={(e) => {
              if (currentQn === 126) {
                onQualityChange(80);
                return;
              }
              console.warn('TV Video playback error:', e);
              setError('视频加载失败，请尝试切换清晰度');
            }}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        {!!danmakus?.length && (
          <DanmakuOverlay
            danmakus={danmakus}
            currentTime={currentTime}
            screenWidth={SCREEN_W}
            screenHeight={VIDEO_H}
            visible={showDanmaku}
            opacity={dmOpacity}
            fontScale={dmFontScale}
            areaRatio={dmAreaRatio}
            filterModes={dmFilterModes}
          />
        )}

        {/* 主焦点区域：确认键暂停/播放 */}
        <TVFocusable
          onPress={togglePause}
          style={styles.mainFocusArea}
          scaleFactor={1}
          borderColor="transparent"
          hasTVPreferredFocus
          accessibilityLabel={error ? '播放失败' : (paused ? '播放' : '暂停')}
        >
          <View style={StyleSheet.absoluteFill} />
        </TVFocusable>

        {error && (
          <View style={styles.errorContainer} pointerEvents="none">
            <Ionicons name="warning-outline" size={48} color={TV.color.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {showControls && (
          <>
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent']}
              style={styles.topBar}
              pointerEvents="box-none"
            />

            {/* 中央播放/暂停图标 */}
            <View style={styles.centerBtn} pointerEvents="none">
              <View style={styles.centerBtnBg}>
                <Ionicons
                  name={paused ? 'play' : 'pause'}
                  size={36}
                  color="#fff"
                />
              </View>
            </View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.bottomBar}
              pointerEvents="box-none"
            >
              {/* 进度条（TV 上仅展示，不可拖动） */}
              <View style={styles.trackWrapper}>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackLayer,
                      {
                        width: `${bufferedRatio * 100}%` as any,
                        backgroundColor: 'rgba(255,255,255,0.35)',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trackLayer,
                      {
                        width: `${progressRatio * 100}%` as any,
                        backgroundColor: TV.color.accent,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 控制按钮栏 */}
              <View style={styles.ctrlRow}>
                <TVFocusable
                  onPress={seekBackward}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                >
                  <Ionicons name="play-back" size={18} color="#fff" />
                </TVFocusable>

                <TVFocusable
                  onPress={togglePause}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                >
                  <Ionicons
                    name={paused ? 'play' : 'pause'}
                    size={18}
                    color="#fff"
                  />
                </TVFocusable>

                <TVFocusable
                  onPress={seekForward}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                >
                  <Ionicons name="play-forward" size={18} color="#fff" />
                </TVFocusable>

                <Text style={styles.timeText}>
                  {formatDuration(Math.floor(currentTime))} / {formatDuration(duration)}
                </Text>

                <View style={{ flex: 1 }} />

                <TVFocusable
                  onPress={() => setShowQuality(true)}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                >
                  <Text style={styles.qualityText}>{currentDesc}</Text>
                </TVFocusable>

                <TVFocusable
                  onPress={() => setShowSpeed(true)}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                >
                  <Text style={styles.qualityText}>{speed === 1 ? '倍速' : `${speed}x`}</Text>
                </TVFocusable>

                <TVFocusable
                  onPress={() => setShowDanmaku(!showDanmaku)}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                  accessibilityLabel={showDanmaku ? '关闭弹幕' : '开启弹幕'}
                >
                  <Ionicons
                    name={showDanmaku ? 'chatbubbles' : 'chatbubbles-outline'}
                    size={18}
                    color="#fff"
                  />
                </TVFocusable>

                <TVFocusable
                  onPress={() => setShowDanmakuConfig(true)}
                  style={styles.ctrlBtn}
                  scaleFactor={1.1}
                  accessibilityLabel="弹幕设置"
                >
                  <Ionicons name="settings-outline" size={16} color="#fff" />
                </TVFocusable>

                {hasEpisodes && (
                  <TVFocusable
                    onPress={() => { setShowEpisodes(true); setPaused(true); }}
                    style={styles.ctrlBtn}
                    scaleFactor={1.1}
                    accessibilityLabel="选集"
                  >
                    <Ionicons name="list-outline" size={18} color="#fff" />
                  </TVFocusable>
                )}
              </View>
            </LinearGradient>
          </>
        )}

        {/* 清晰度选择面板 */}
        {showQuality && (
          <View style={styles.qualityOverlay}>
            <View style={styles.qualityList}>
              <Text style={styles.qualityTitle}>选择清晰度</Text>
              {qualities.map(q => (
                <TVFocusable
                  key={q.qn}
                  style={styles.qualityItem}
                  onPress={() => {
                    setShowQuality(false);
                    onQualityChange(q.qn);
                    showAndReset();
                  }}
                  scaleFactor={1}
                  hasTVPreferredFocus={q.qn === currentQn}
                >
                  <Text
                    style={[
                      styles.qualityItemText,
                      q.qn === currentQn && styles.qualityItemActive,
                    ]}
                  >
                    {q.desc}
                    {q.qn === 126 ? ' DV' : ''}
                  </Text>
                  {q.qn === currentQn && (
                    <Ionicons name="checkmark" size={18} color={TV.color.accent} />
                  )}
                </TVFocusable>
              ))}
            </View>
          </View>
        )}

        {/* 倍速选择面板 */}
        {showSpeed && (
          <View style={styles.qualityOverlay}>
            <View style={styles.qualityList}>
              <Text style={styles.qualityTitle}>播放速度</Text>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <TVFocusable
                  key={s}
                  style={styles.qualityItem}
                  onPress={() => {
                    setSpeed(s);
                    setShowSpeed(false);
                    showAndReset();
                  }}
                  scaleFactor={1}
                  hasTVPreferredFocus={s === speed}
                >
                  <Text
                    style={[
                      styles.qualityItemText,
                      s === speed && styles.qualityItemActive,
                    ]}
                  >
                    {s === 1 ? '正常' : `${s}x`}
                  </Text>
                  {s === speed && (
                    <Ionicons name="checkmark" size={18} color="#00AEEC" />
                  )}
                </TVFocusable>
              ))}
            </View>
          </View>
        )}

        {/* 弹幕设置面板 */}
        {showDanmakuConfig && (
          <View style={styles.qualityOverlay}>
            <View style={styles.dmConfigPanel}>
              <Text style={styles.qualityTitle}>弹幕设置</Text>

              {/* 透明度 */}
              <Text style={styles.dmConfigLabel}>透明度</Text>
              <View style={styles.dmConfigRow}>
                {[0.25, 0.5, 0.75, 1].map(v => (
                  <TVFocusable
                    key={v}
                    style={[styles.dmChip, dmOpacity === v && styles.dmChipActive]}
                    onPress={() => setDmOpacity(v)}
                    scaleFactor={1}
                  >
                    <Text style={[styles.dmChipText, dmOpacity === v && styles.dmChipTextActive]}>
                      {Math.round(v * 100)}%
                    </Text>
                  </TVFocusable>
                ))}
              </View>

              {/* 字号 */}
              <Text style={styles.dmConfigLabel}>字号</Text>
              <View style={styles.dmConfigRow}>
                {([0.7, 1, 1.3] as const).map((v, i) => {
                  const labels = ['小', '标准', '大'];
                  return (
                    <TVFocusable
                      key={v}
                      style={[styles.dmChip, dmFontScale === v && styles.dmChipActive]}
                      onPress={() => setDmFontScale(v)}
                      scaleFactor={1}
                    >
                      <Text style={[styles.dmChipText, dmFontScale === v && styles.dmChipTextActive]}>
                        {labels[i]}
                      </Text>
                    </TVFocusable>
                  );
                })}
              </View>

              {/* 显示区域 */}
              <Text style={styles.dmConfigLabel}>显示区域</Text>
              <View style={styles.dmConfigRow}>
                {[0.25, 0.5, 0.75, 1].map(v => {
                  const labels: Record<number, string> = { 0.25: '1/4屏', 0.5: '半屏', 0.75: '3/4屏', 1: '全屏' };
                  return (
                    <TVFocusable
                      key={v}
                      style={[styles.dmChip, dmAreaRatio === v && styles.dmChipActive]}
                      onPress={() => setDmAreaRatio(v)}
                      scaleFactor={1}
                    >
                      <Text style={[styles.dmChipText, dmAreaRatio === v && styles.dmChipTextActive]}>
                        {labels[v]}
                      </Text>
                    </TVFocusable>
                  );
                })}
              </View>

              {/* 屏蔽类型 */}
              <Text style={styles.dmConfigLabel}>屏蔽类型</Text>
              <View style={styles.dmConfigRow}>
                {([{ mode: 1, label: '滚动' }, { mode: 5, label: '顶部' }, { mode: 4, label: '底部' }] as const).map(({ mode, label }) => {
                  const isFiltered = dmFilterModes.includes(mode);
                  return (
                    <TVFocusable
                      key={mode}
                      style={[styles.dmChip, isFiltered && styles.dmChipFiltered]}
                      onPress={() => {
                        const next = isFiltered
                          ? dmFilterModes.filter((m: number) => m !== mode)
                          : [...dmFilterModes, mode];
                        setDmFilterModes(next);
                      }}
                      scaleFactor={1}
                    >
                      <Text style={[styles.dmChipText, isFiltered && styles.dmChipFilteredText]}>
                        {isFiltered ? `✗ ${label}` : label}
                      </Text>
                    </TVFocusable>
                  );
                })}
              </View>

              {/* 关闭按钮 */}
              <TVFocusable
                style={styles.dmCloseBtn}
                onPress={() => setShowDanmakuConfig(false)}
                scaleFactor={1}
                hasTVPreferredFocus
                accessibilityLabel="关闭弹幕设置"
              >
                <Text style={styles.dmCloseBtnText}>完成</Text>
              </TVFocusable>
            </View>
          </View>
        )}

        {/* 快速选集抽屉面板 */}
        {showEpisodes && (
          <View style={styles.episodeOverlay}>
            <View style={styles.episodeDrawer}>
              <View style={styles.episodeHeader}>
                <Text style={styles.qualityTitle}>选集 ({episodesProp?.length})</Text>
                <TVFocusable
                  style={styles.epSortBtn}
                  onPress={() => setEpReversed(r => !r)}
                  scaleFactor={1.1}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={epReversed ? TV.color.accent : '#aaa'}
                  />
                  <Text style={[
                    styles.epSortText,
                    epReversed && { color: TV.color.accent },
                  ]}>
                    {epReversed ? '倒序' : '正序'}
                  </Text>
                </TVFocusable>
              </View>
              <ScrollView
                style={styles.episodeScroll}
                showsVerticalScrollIndicator={false}
              >
                {displayedEpisodes.map(ep => (
                  <TVFocusable
                    key={ep.id}
                    style={[
                      styles.episodeItem,
                      ep.isCurrent && styles.episodeItemActive,
                    ]}
                    onPress={() => {
                      setShowEpisodes(false);
                      setPaused(false);
                      onEpisodeChange?.(ep.id);
                    }}
                    scaleFactor={1}
                    hasTVPreferredFocus={ep.isCurrent}
                  >
                    {ep.isCurrent && (
                      <Ionicons name="play" size={14} color={TV.color.accent} />
                    )}
                    <Text
                      style={[
                        styles.episodeItemText,
                        ep.isCurrent && styles.episodeItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {ep.title}
                    </Text>
                  </TVFocusable>
                ))}
              </ScrollView>
              <TVFocusable
                style={styles.dmCloseBtn}
                onPress={() => { setShowEpisodes(false); setPaused(false); }}
                scaleFactor={1}
              >
                <Text style={styles.dmCloseBtnText}>关闭</Text>
              </TVFocusable>
            </View>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { backgroundColor: '#000' },
  fsContainer: { flex: 1, backgroundColor: '#000' },
  placeholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  mainFocusArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 2,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -40 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: 200,
  },
  errorText: {
    color: TV.color.white,
    fontSize: TV.font.md,
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  centerBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    zIndex: 2,
  },
  centerBtnBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingTop: 40,
    zIndex: 3,
  },
  trackWrapper: {
    marginHorizontal: 16,
    height: 4,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  trackLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
  },
  ctrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  ctrlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '600',
  },
  qualityText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  qualityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  qualityList: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 220,
  },
  qualityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    paddingVertical: 10,
    textAlign: 'center',
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#444',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityItemText: { fontSize: 15, color: '#ccc' },
  qualityItemActive: { color: TV.color.accent, fontWeight: '700' },
  // 弹幕设置面板
  dmConfigPanel: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 320,
    maxWidth: 420,
  },
  dmConfigLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 12,
    marginBottom: 6,
  },
  dmConfigRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dmChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dmChipActive: {
    backgroundColor: '#1a3040',
    borderColor: TV.color.accent,
  },
  dmChipText: { fontSize: 13, color: '#ccc' },
  dmChipTextActive: { color: TV.color.accent, fontWeight: '600' },
  dmChipFiltered: {
    backgroundColor: 'rgba(255,71,87,0.15)',
    borderColor: TV.color.danger,
  },
  dmChipFilteredText: { color: TV.color.danger },
  dmCloseBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: TV.color.accent,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dmCloseBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  // 选集抽屉
  episodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  episodeDrawer: {
    width: 300,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  epSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  epSortText: {
    fontSize: 12,
    color: '#aaa',
  },
  episodeScroll: {
    flex: 1,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  episodeItemActive: {
    backgroundColor: TV.color.accentBg,
    borderColor: TV.color.accent,
  },
  episodeItemText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  episodeItemTextActive: {
    color: TV.color.accent,
    fontWeight: '600',
  },
});
