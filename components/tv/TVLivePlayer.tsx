import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from './TVFocusable';
import { TV } from '../../constants/tvTheme';
import { useTVTheme } from '../../hooks/useTVTheme';

interface Props {
  hlsUrl: string;
  isLive: boolean;
  qualities?: { qn: number; desc: string }[];
  currentQn?: number;
  onQualityChange?: (qn: number) => void;
}

const HIDE_DELAY = 5000;

const HEADERS = {
  Referer: 'https://live.bilibili.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * TV 版直播播放器。
 * D-Pad 确认键暂停/播放，显示/隐藏控制栏。
 * 清晰度选择使用可聚焦列表。
 */
export function TVLivePlayer({
  hlsUrl,
  isLive,
  qualities = [],
  currentQn = 0,
  onQualityChange,
}: Props): React.JSX.Element {
  const tv = useTVTheme();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const VIDEO_H = SCREEN_H; // TV 全高

  if (!isLive || !hlsUrl) {
      return (
        <View style={[styles.container, { width: SCREEN_W, height: VIDEO_H }]}> 
          <Ionicons name="tv-outline" size={48} color={TV.color.textDisabled} />
        <Text style={[styles.offlineText, { fontSize: tv.font.md, marginTop: tv.space.sm }]}>暂未开播或无法获取直播流</Text>
        </View>
      );
  }

  return (
    <NativeTVLivePlayer
      hlsUrl={hlsUrl}
      screenW={SCREEN_W}
      screenH={SCREEN_H}
      qualities={qualities}
      currentQn={currentQn}
      onQualityChange={onQualityChange}
    />
  );
}

function NativeTVLivePlayer({
  hlsUrl,
  screenW,
  screenH,
  qualities,
  currentQn,
  onQualityChange,
}: {
  hlsUrl: string;
  screenW: number;
  screenH: number;
  qualities: { qn: number; desc: string }[];
  currentQn: number;
  onQualityChange?: (qn: number) => void;
}): React.JSX.Element {
  const tv = useTVTheme();
  const Video = require('react-native-video').default;

  const [showControls, setShowControls] = useState(true);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  const togglePause = useCallback(() => {
    setPaused(p => !p);
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const currentQnDesc = qualities.find(q => q.qn === currentQn)?.desc ?? '';
  const hasCurrentQuality = qualities.some(q => q.qn === currentQn);

  const closeQualityPanel = useCallback(() => {
    setShowQualityPanel(false);
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  return (
    <View style={[styles.container, { width: screenW, height: screenH }]}>
      <Video
        key={hlsUrl}
        ref={videoRef}
        source={{ uri: hlsUrl, headers: HEADERS }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        controls={false}
        paused={paused}
        onBuffer={({ isBuffering }: { isBuffering: boolean }) =>
          setBuffering(isBuffering)
        }
        onLoad={() => {
          setBuffering(false);
          setError(null);
        }}
        onError={(e: any) => {
          console.warn('TV Live playback error:', e);
          setError('直播流加载失败，请尝试刷新或切换清晰度');
        }}
      />

      {buffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <Text style={[styles.bufferingText, { fontSize: tv.font.sm }]}>缓冲中...</Text>
        </View>
      )}

      {/* 主焦点区域 */}
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
          <Text style={[styles.errorText, { fontSize: tv.font.md, marginTop: tv.space.xs }]}>{error}</Text>
        </View>
      )}

      {showControls && (
        <>
          {/* 中央暂停/播放 */}
          <View style={styles.centerBtn} pointerEvents="none">
            <View style={[styles.centerBtnBg, { width: Math.max(52, tv.font.heading * 2), height: Math.max(52, tv.font.heading * 2), borderRadius: Math.max(26, tv.font.heading) }]}>
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={36}
                color={TV.color.white}
              />
            </View>
          </View>

          {/* 底部控制栏 */}
          <View style={[styles.bottomBar, { paddingHorizontal: tv.space.md, paddingBottom: tv.space.md, paddingTop: tv.space.xl }]}>
            <TVFocusable
              style={[styles.ctrlBtn, { paddingHorizontal: tv.space.sm, paddingVertical: Math.max(6, tv.space.xs), borderRadius: tv.radius.sm }]}
              onPress={togglePause}
              scaleFactor={1.1}
            >
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={18}
                color={TV.color.white}
              />
            </TVFocusable>

            <View style={{ flex: 1 }} />

            {qualities.length > 0 && (
              <TVFocusable
                style={[styles.qualityBtn, { paddingHorizontal: tv.space.sm, paddingVertical: Math.max(6, tv.space.xs), borderRadius: tv.radius.sm }]}
                onPress={() => {
                  setShowQualityPanel(true);
                  resetHideTimer();
                }}
                scaleFactor={1.1}
              >
                <Text style={[styles.qualityText, { fontSize: tv.font.xs }]}>
                  {currentQnDesc || '清晰度'}
                </Text>
              </TVFocusable>
            )}
          </View>
        </>
      )}

      {/* 清晰度选择面板 */}
        {showQualityPanel && (
          <View style={styles.qualityOverlay}>
          <View style={[styles.qualityPanel, { paddingBottom: tv.space.md, minWidth: Math.max(180, 220 * (tv.font.base / TV.font.base)) }]}> 
            <Text style={[styles.qualityPanelTitle, { fontSize: tv.font.sm, paddingVertical: tv.space.sm } ]}>清晰度</Text>
            {qualities.map(q => (
              <TVFocusable
                key={q.qn}
                style={[
                  styles.qualityItem,
                  { paddingHorizontal: tv.space.lg - 4, paddingVertical: tv.space.sm, borderRadius: tv.radius.sm },
                  currentQn === q.qn && styles.qualityItemActive,
                ]}
                onPress={() => {
                  onQualityChange?.(q.qn);
                  closeQualityPanel();
                }}
                hasTVPreferredFocus={currentQn === q.qn}
                scaleFactor={1}
              >
                <Text
                  style={[
                    styles.qualityItemText,
                    { fontSize: tv.font.sm },
                    currentQn === q.qn && styles.qualityItemTextActive,
                  ]}
                >
                  {q.desc}
                </Text>
                {currentQn === q.qn && (
                  <Ionicons name="checkmark" size={16} color={TV.color.accent} />
                )}
              </TVFocusable>
            ))}
            <TVFocusable
              style={[styles.panelCancelBtn, { paddingHorizontal: tv.space.lg - 4, paddingVertical: tv.space.sm, borderRadius: tv.radius.sm, marginTop: tv.space.sm }]}
              onPress={closeQualityPanel}
              hasTVPreferredFocus={!hasCurrentQuality}
              scaleFactor={1}
              accessibilityLabel="取消清晰度面板"
            >
              <Text style={[styles.panelCancelBtnText, { fontSize: tv.font.sm }]}>取消</Text>
            </TVFocusable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: { color: TV.color.textDisabled, fontSize: 16, marginTop: 12 },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingText: { color: TV.color.white, fontSize: 15, opacity: 0.8 },
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
  mainFocusArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 30,
    zIndex: 3,
  },
  ctrlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityText: { color: TV.color.white, fontSize: 13, fontWeight: '600' },
  qualityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  qualityPanel: {
    backgroundColor: TV.color.surface,
    borderRadius: 12,
    paddingBottom: 16,
    minWidth: 220,
  },
  qualityPanelTitle: {
    color: TV.color.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TV.color.border,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  qualityItemActive: { backgroundColor: TV.color.accentBg },
  qualityItemText: { color: TV.color.textSecondary, fontSize: 15 },
  qualityItemTextActive: { color: TV.color.accent, fontWeight: '600' },
  panelCancelBtn: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: TV.color.surfaceLight,
  },
  panelCancelBtnText: {
    color: TV.color.white,
    fontWeight: '600',
  },
});
