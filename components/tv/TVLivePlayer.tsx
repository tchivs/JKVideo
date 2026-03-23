import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from './TVFocusable';

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
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const VIDEO_H = SCREEN_H; // TV 全高

  if (!isLive || !hlsUrl) {
    return (
      <View style={[styles.container, { width: SCREEN_W, height: VIDEO_H }]}>
        <Ionicons name="tv-outline" size={48} color="#555" />
        <Text style={styles.offlineText}>暂未开播</Text>
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
  const Video = require('react-native-video').default;

  const [showControls, setShowControls] = useState(true);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
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
  }, []);

  const togglePause = useCallback(() => {
    setPaused(p => !p);
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const currentQnDesc = qualities.find(q => q.qn === currentQn)?.desc ?? '';

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
        onLoad={() => setBuffering(false)}
      />

      {buffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <Text style={styles.bufferingText}>缓冲中...</Text>
        </View>
      )}

      {/* 主焦点区域 */}
      <TVFocusable
        onPress={togglePause}
        style={styles.mainFocusArea}
        scaleFactor={1}
        borderColor="transparent"
        hasTVPreferredFocus
      >
        <View style={StyleSheet.absoluteFill} />
      </TVFocusable>

      {showControls && (
        <>
          {/* 中央暂停/播放 */}
          <View style={styles.centerBtn} pointerEvents="none">
            <View style={styles.centerBtnBg}>
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={36}
                color="#fff"
              />
            </View>
          </View>

          {/* 底部控制栏 */}
          <View style={styles.bottomBar}>
            <TVFocusable
              style={styles.ctrlBtn}
              onPress={togglePause}
              scaleFactor={1.1}
            >
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={18}
                color="#fff"
              />
            </TVFocusable>

            <View style={{ flex: 1 }} />

            {qualities.length > 0 && (
              <TVFocusable
                style={styles.qualityBtn}
                onPress={() => {
                  setShowQualityPanel(true);
                  resetHideTimer();
                }}
                scaleFactor={1.1}
              >
                <Text style={styles.qualityText}>
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
          <View style={styles.qualityPanel}>
            <Text style={styles.qualityPanelTitle}>清晰度</Text>
            {qualities.map(q => (
              <TVFocusable
                key={q.qn}
                style={[
                  styles.qualityItem,
                  currentQn === q.qn && styles.qualityItemActive,
                ]}
                onPress={() => {
                  onQualityChange?.(q.qn);
                  setShowQualityPanel(false);
                }}
                hasTVPreferredFocus={currentQn === q.qn}
                scaleFactor={1}
              >
                <Text
                  style={[
                    styles.qualityItemText,
                    currentQn === q.qn && styles.qualityItemTextActive,
                  ]}
                >
                  {q.desc}
                </Text>
                {currentQn === q.qn && (
                  <Ionicons name="checkmark" size={16} color="#00AEEC" />
                )}
              </TVFocusable>
            ))}
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
  offlineText: { color: '#999', fontSize: 16, marginTop: 12 },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingText: { color: '#fff', fontSize: 15, opacity: 0.8 },
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
  qualityText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  qualityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  qualityPanel: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingBottom: 16,
    minWidth: 220,
  },
  qualityPanelTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#444',
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
  qualityItemActive: { backgroundColor: 'rgba(0,174,236,0.15)' },
  qualityItemText: { color: '#ccc', fontSize: 15 },
  qualityItemTextActive: { color: '#00AEEC', fontWeight: '600' },
});
