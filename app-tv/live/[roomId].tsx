import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVLivePlayer } from '../../components/tv/TVLivePlayer';
import { TVFocusable } from '../../components/tv/TVFocusable';
import { useLiveDetail } from '../../hooks/useLiveDetail';
import { useLiveDanmaku } from '../../hooks/useLiveDanmaku';
import { formatCount } from '../../utils/format';
import { proxyImageUrl } from '../../utils/imageUrl';
import { TV } from '../../constants/tvTheme';
import { useTVTheme } from '../../hooks/useTVTheme';

/**
 * TV 版直播详情页。
 * 全屏播放器 + 浮动信息 + 实时弹幕。
 */
export default function TVLiveDetailScreen() {
  const tv = useTVTheme();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const id = parseInt(roomId ?? '0', 10);
  const { room, anchor, stream, loading, error, changeQuality } =
    useLiveDetail(id);

  const isLive = room?.live_status === 1;
  const hlsUrl = stream?.hlsUrl ?? '';
  const qualities = stream?.qualities ?? [];
  const currentQn = stream?.qn ?? 0;

  // 实际 roomid（可能和 URL 中的短 ID 不同）
  const actualRoomId = room?.roomid ?? id;
  const { danmakus } = useLiveDanmaku(isLive ? actualRoomId : 0);
  const [showInfo, setShowInfo] = useState(false);
  const danmakuScrollRef = useRef<ScrollView>(null);

  if (loading) {
    return (
      <View style={[styles.loading, { gap: tv.space.sm }]}>
        <ActivityIndicator color={TV.color.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loading, { gap: tv.space.sm }]}>
        <Ionicons name="alert-circle" size={48} color={TV.color.danger} />
        <Text style={[styles.errorText, { fontSize: tv.font.sm }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TVLivePlayer
        hlsUrl={hlsUrl}
        isLive={isLive}
        qualities={qualities}
        currentQn={currentQn}
        onQualityChange={changeQuality}
      />

        {room && (
        <TVFocusable
          style={[styles.infoToggle, { top: tv.space.lg, right: tv.space.lg, gap: tv.space.xs, paddingHorizontal: tv.space.md }]}
          onPress={() => setShowInfo(v => !v)}
          scaleFactor={1.05}
          borderColor={TV.color.accent}
          accessibilityLabel={showInfo ? '收起直播信息面板' : '展开直播信息面板'}
          hasTVPreferredFocus
        >
          <Ionicons
            name={showInfo ? 'chevron-forward' : 'information-circle-outline'}
            size={18}
            color={TV.color.textPrimary}
          />
          <Text style={[styles.infoToggleText, { fontSize: tv.font.sm }]}>{showInfo ? '收起信息' : '直播信息'}</Text>
        </TVFocusable>
      )}

      {/* 浮动信息面板（右侧） */}
      {showInfo && room && (
        <View style={[styles.infoPanel, { width: Math.max(220, 260 * (tv.font.base / TV.font.base)), padding: Math.max(12, tv.space.sm) }]}>
          {/* 主播头像 + 名字 */}
          {anchor && (
            <View style={[styles.anchorRow, { gap: tv.space.xs, marginBottom: tv.space.sm }]}>
              <Image
                source={{ uri: proxyImageUrl(anchor.face) }}
                style={styles.avatar}
              />
              <View style={styles.anchorInfo}>
                <Text style={[styles.anchorName, { fontSize: tv.font.sm }]}>{anchor.uname}</Text>
                <View style={[styles.metaRow, { gap: Math.max(4, tv.space.xs - 2) }]}>
                  {isLive && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={[styles.liveText, { fontSize: 10 } ]}>直播中</Text>
                    </View>
                  )}
                  <Ionicons name="eye-outline" size={12} color={TV.color.textTertiary} />
                  <Text style={[styles.metaText, { fontSize: Math.max(11, tv.font.xs) }]}>
                    {formatCount(room.online ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 房间标题 */}
          <Text style={[styles.roomTitle, { fontSize: tv.font.sm, lineHeight: Math.round(tv.font.sm * 1.45), marginBottom: tv.space.xs }]} numberOfLines={2}>
            {room.title}
          </Text>

          {/* 分区标签 */}
          <View style={[styles.areaRow, { gap: Math.max(4, tv.space.xs - 2), marginBottom: tv.space.sm }]}>
            {room.parent_area_name && (
              <View style={styles.areaTag}>
                <Text style={[styles.areaTagText, { fontSize: 10 }]}>
                  {room.parent_area_name}
                </Text>
              </View>
            )}
            {room.area_name && (
              <View style={styles.areaTag}>
                <Text style={[styles.areaTagText, { fontSize: 10 }]}>{room.area_name}</Text>
              </View>
            )}
          </View>

          {/* 实时弹幕列表 */}
          {danmakus.length > 0 && (
            <View style={[styles.danmakuSection, { paddingTop: tv.space.xs }]}>
              <Text style={[styles.danmakuTitle, { fontSize: tv.font.xs, marginBottom: Math.max(4, tv.space.xs - 2) }]}>
                弹幕 ({danmakus.length})
              </Text>
              <ScrollView
                ref={danmakuScrollRef}
                style={styles.danmakuList}
                onContentSizeChange={() => danmakuScrollRef.current?.scrollToEnd({ animated: true })}
              >
                {danmakus.slice(-30).map((d, i) => (
                  <Text key={`${d.timeline ?? ''}-${d.uname ?? ''}-${d.text}-${i}`} style={[styles.danmakuItem, { fontSize: Math.max(11, tv.font.xs), lineHeight: Math.round(tv.font.xs * 1.5) }]} numberOfLines={1}>
                    <Text style={styles.danmakuUser}>{d.uname}: </Text>
                    {d.text}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  loading: {
    flex: 1,
    backgroundColor: TV.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: TV.color.danger, fontSize: 14 },
  infoToggle: {
    position: 'absolute',
    top: TV.space.lg,
    right: TV.space.lg,
    height: 42,
    minWidth: 120,
    borderRadius: TV.radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TV.space.xs,
    paddingHorizontal: TV.space.md,
  },
  infoToggleText: {
    color: TV.color.textPrimary,
    fontSize: TV.font.sm,
    fontWeight: '600',
  },
  infoPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 260,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 14,
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  anchorInfo: { flex: 1 },
  anchorName: { fontSize: 13, color: '#fff', fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,0,0,0.2)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f00',
  },
  liveText: { fontSize: 10, color: '#f66', fontWeight: '600' },
  metaText: { fontSize: 11, color: TV.color.textTertiary },
  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TV.color.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  areaRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  areaTag: {
    backgroundColor: 'rgba(0,174,236,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  areaTagText: { fontSize: 10, color: TV.color.accent },
  danmakuSection: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#444',
    paddingTop: 8,
  },
  danmakuTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  danmakuList: { flex: 1 },
  danmakuItem: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 18,
  },
  danmakuUser: { color: '#888' },
});
