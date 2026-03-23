import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVLivePlayer } from '../../components/tv/TVLivePlayer';
import { TVFocusable } from '../../components/tv/TVFocusable';
import { useLiveDetail } from '../../hooks/useLiveDetail';
import { useLiveDanmaku } from '../../hooks/useLiveDanmaku';
import { formatCount } from '../../utils/format';
import { proxyImageUrl } from '../../utils/imageUrl';

/**
 * TV 版直播详情页。
 * 全屏播放器 + 浮动信息 + 实时弹幕。
 */
export default function TVLiveDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const id = parseInt(roomId ?? '0', 10);
  const { room, anchor, stream, loading, error, changeQuality } =
    useLiveDetail(id);

  const isLive = room?.live_status === 1;
  const hlsUrl = stream?.hlsUrl ?? '';
  const qualities = stream?.qualities ?? [];
  const currentQn = stream?.qn ?? 0;

  // 实际 roomid（可能和 URL 中的短 ID 不同）
  const actualRoomId = room?.roomid ?? id;
  const { danmakus, giftCounts } = useLiveDanmaku(isLive ? actualRoomId : 0);
  const [showInfo, setShowInfo] = useState(true);
  const danmakuScrollRef = useRef<ScrollView>(null);

  // M-8: 弹幕自动滚动到底部
  useEffect(() => {
    if (danmakuScrollRef.current) {
      danmakuScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [danmakus.length]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00AEEC" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Ionicons name="alert-circle" size={48} color="#ff4757" />
        <Text style={styles.errorText}>{error}</Text>
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

      {/* 浮动信息面板（右侧） */}
      {showInfo && room && (
        <View style={styles.infoPanel}>
          {/* 主播头像 + 名字 */}
          {anchor && (
            <View style={styles.anchorRow}>
              <Image
                source={{ uri: proxyImageUrl(anchor.face) }}
                style={styles.avatar}
              />
              <View style={styles.anchorInfo}>
                <Text style={styles.anchorName}>{anchor.uname}</Text>
                <View style={styles.metaRow}>
                  {isLive && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>直播中</Text>
                    </View>
                  )}
                  <Ionicons name="eye-outline" size={12} color="#999" />
                  <Text style={styles.metaText}>
                    {formatCount(room.online ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 房间标题 */}
          <Text style={styles.roomTitle} numberOfLines={2}>
            {room.title}
          </Text>

          {/* 分区标签 */}
          <View style={styles.areaRow}>
            {room.parent_area_name && (
              <View style={styles.areaTag}>
                <Text style={styles.areaTagText}>
                  {room.parent_area_name}
                </Text>
              </View>
            )}
            {room.area_name && (
              <View style={styles.areaTag}>
                <Text style={styles.areaTagText}>{room.area_name}</Text>
              </View>
            )}
          </View>

          {/* 实时弹幕列表 */}
          {danmakus.length > 0 && (
            <View style={styles.danmakuSection}>
              <Text style={styles.danmakuTitle}>
                弹幕 ({danmakus.length})
              </Text>
              <ScrollView ref={danmakuScrollRef} style={styles.danmakuList}>
                {danmakus.slice(-30).map((d, i) => (
                  <Text key={i} style={styles.danmakuItem} numberOfLines={1}>
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
  container: { flex: 1, backgroundColor: '#000' },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: '#ff4757', fontSize: 14 },
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
  metaText: { fontSize: 11, color: '#999' },
  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e0e0',
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
  areaTagText: { fontSize: 10, color: '#00AEEC' },
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
