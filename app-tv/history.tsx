import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVFadeIn } from '../components/tv/TVFadeIn';
import { useHistoryStore, type HistoryItem } from '../store/historyStore';
import { proxyImageUrl } from '../utils/imageUrl';
import { formatDuration } from '../utils/format';

/**
 * TV 版观看历史页。
 */
export default function TVHistoryScreen() {
  const router = useRouter();
  const { items, clearHistory, progress } = useHistoryStore();

  const formatTime = (ms: number): string => {
    const d = new Date(ms);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday) {
      return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const prog = progress[item.bvid] ?? 0;
    const percent =
      item.duration > 0 ? Math.min(1, prog / item.duration) : 0;

    return (
      <TVFocusable
        style={styles.row}
        onPress={() => router.push(`/video/${item.bvid}` as any)}
        scaleFactor={1.02}
      >
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: proxyImageUrl(item.pic) }}
            style={styles.thumb}
            resizeMode="cover"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          {/* 进度条 */}
          {percent > 0 && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(percent * 100)}%` as any },
                ]}
              />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta}>
            {item.ownerName}
          </Text>
          <Text style={styles.time}>{formatTime(item.watchedAt)}</Text>
        </View>
      </TVFocusable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TVFocusable
          onPress={() => router.back()}
          style={styles.backBtn}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TVFocusable>
        <Text style={styles.headerTitle}>观看历史</Text>
        <View style={{ flex: 1 }} />
        {items.length > 0 && (
          <TVFocusable
            style={styles.clearBtn}
            onPress={() =>
              Alert.alert(
                '确认清空',
                '确定要清空所有观看记录吗？',
                [
                  { text: '取消', style: 'cancel' },
                  { text: '清空', style: 'destructive', onPress: clearHistory },
                ],
              )
            }
            scaleFactor={1}
            accessibilityLabel="清空观看历史"
          >
            <Ionicons name="trash-outline" size={16} color="#888" />
            <Text style={styles.clearText}>清空</Text>
          </TVFocusable>
        )}
      </View>

      {items.length === 0 ? (
        <TVFadeIn style={styles.empty}>
          <Ionicons name="time-outline" size={56} color="#444" />
          <Text style={styles.emptyText}>暂无观看记录</Text>
          <Text style={styles.emptyHint}>观看视频后自动记录在这里</Text>
        </TVFadeIn>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.bvid}
          renderItem={renderItem}
          numColumns={4}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#e0e0e0' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clearText: { fontSize: 13, color: '#888' },
  listContent: { padding: 12 },
  gridRow: { gap: 10 },
  row: {
    flex: 1,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#333',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: { color: '#fff', fontSize: 11 },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00AEEC',
  },
  info: { padding: 8 },
  title: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 18,
    marginBottom: 4,
  },
  meta: { fontSize: 11, color: '#888', marginBottom: 2 },
  time: { fontSize: 10, color: '#666' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#555' },
  emptyHint: { fontSize: 12, color: '#444' },
});
