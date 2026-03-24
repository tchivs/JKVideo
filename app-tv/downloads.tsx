import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { useDownloadStore, type DownloadTask } from '../store/downloadStore';
import { proxyImageUrl } from '../utils/imageUrl';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type TaskWithKey = DownloadTask & { key: string };

/**
 * TV 版下载管理页。
 * 所有操作使用 TVFocusable，D-Pad 可导航。
 */
export default function TVDownloadsScreen() {
  const router = useRouter();
  const { tasks, loadFromStorage, removeTask } = useDownloadStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const all = Object.entries(tasks).map(([key, task]) => ({
    key,
    ...task,
  }));
  const downloading = all.filter(
    t => t.status === 'downloading' || t.status === 'error',
  );
  const done = all.filter(t => t.status === 'done');

  const renderItem = ({ item }: { item: TaskWithKey }) => (
    <View style={styles.row}>
      <Image
        source={{ uri: proxyImageUrl(item.cover) }}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.qdesc}>
          {item.qdesc}
          {item.fileSize ? `  ·  ${formatFileSize(item.fileSize)}` : ''}
        </Text>
        {item.status === 'downloading' && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(item.progress * 100)}%` as any,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressTxt}>
              {Math.round(item.progress * 100)}%
            </Text>
          </View>
        )}
        {item.status === 'error' && (
          <Text style={styles.errorTxt}>{item.error ?? '下载失败'}</Text>
        )}
      </View>
      <View style={styles.actions}>
        {item.status === 'done' && item.localUri && (
          <TVFocusable
            style={styles.actionBtn}
            onPress={() => {
              // TV 上直接播放
              router.push(`/video/${item.bvid || ''}` as any);
            }}
            scaleFactor={1.1}
            accessibilityLabel="播放"
          >
            <Ionicons name="play-circle" size={20} color="#00AEEC" />
          </TVFocusable>
        )}
        <TVFocusable
          style={styles.actionBtn}
          onPress={() =>
            Alert.alert('确认删除', `删除「${item.title}」？`, [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => removeTask(item.key) },
            ])
          }
          scaleFactor={1.1}
          borderColor="#ff4757"
          accessibilityLabel="删除下载"
        >
          <Ionicons name="trash-outline" size={18} color="#888" />
        </TVFocusable>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>我的下载</Text>
      </View>

      {all.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-download-outline" size={56} color="#444" />
          <Text style={styles.emptyText}>暂无下载记录</Text>
          <Text style={styles.emptyHint}>在视频详情页点击下载按钮</Text>
        </View>
      ) : (
        <FlatList
          data={[...downloading, ...done]}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  listContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  cover: {
    width: 120,
    height: 68,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  info: { flex: 1 },
  title: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 18,
    marginBottom: 4,
  },
  qdesc: { fontSize: 12, color: '#888', marginBottom: 4 },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00AEEC',
    borderRadius: 2,
  },
  progressTxt: { fontSize: 11, color: '#888', marginLeft: 6 },
  errorTxt: { fontSize: 12, color: '#ff4757', marginTop: 2 },
  actions: { alignItems: 'center', gap: 8 },
  actionBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#555' },
  emptyHint: { fontSize: 12, color: '#444' },
});
