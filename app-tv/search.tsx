import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVFadeIn } from '../components/tv/TVFadeIn';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVLoading } from '../components/tv/TVLoading';
import { TVButton } from '../components/tv/TVButton';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { useSearch } from '../hooks/useSearch';
import { useHistoryStore } from '../store/historyStore';
import { getSearchSquare, type SearchHotItem } from '../services/bilibili';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';

const NUM_COLUMNS = 5;

/**
 * TV 版搜索页。
 * 大号搜索框 + 搜索历史 + 网格搜索结果。
 */
export default function TVSearchScreen() {
  const router = useRouter();
  const { keyword, setKeyword, results, loading, search, loadMore } =
    useSearch();
  const { searchHistory, addSearchHistory, clearSearchHistory } =
    useHistoryStore();
  const inputRef = useRef<TextInput>(null);

  const [trending, setTrending] = useState<SearchHotItem[]>([]);

  useEffect(() => {
    getSearchSquare().then(setTrending).catch(console.warn);
  }, []);

  const handleSearch = useCallback(
    (kw?: string) => {
      const term = (kw ?? keyword).trim();
      if (term) {
        search(term, true);
        addSearchHistory(term);
        if (kw) setKeyword(term);
      }
    },
    [keyword, search, addSearchHistory, setKeyword],
  );

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <TVVideoCard
        item={item}
        onPress={() => router.push(`/video/${item.bvid}` as any)}
      />
    ),
    [router],
  );

  const showHistory = results.length === 0 && !loading && searchHistory.length > 0;
  const showTrending = results.length === 0 && !loading && trending.length > 0;

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.header}>
        <TVFocusable
          onPress={() => router.back()}
          style={styles.backBtn}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color={TV.color.textSecondary} />
        </TVFocusable>

        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="搜索视频、UP主..."
            placeholderTextColor={TV.color.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TVButton
          title="搜索"
          onPress={() => handleSearch()}
          variant="primary"
          disabled={loading}
        />
      </View>

      {/* 搜索历史区域 */}
      {showHistory && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>搜索历史</Text>
            <TVButton
              title="清空"
              icon="trash-outline"
              variant="secondary"
              onPress={() =>
                Alert.alert('确认清空', '清空所有搜索历史？', [
                  { text: '取消', style: 'cancel' },
                  { text: '清空', style: 'destructive', onPress: clearSearchHistory },
                ])
              }
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          >
            {searchHistory.map((kw, i) => (
              <TVFocusable
                key={`${kw}-${i}`}
                style={styles.historyChip}
                onPress={() => {
                  setKeyword(kw);
                  handleSearch(kw);
                }}
                scaleFactor={1.03}
              >
                <Text style={styles.historyChipText}>{kw}</Text>
              </TVFocusable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 热搜推荐 */}
      {showTrending && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>B站热搜榜</Text>
          </View>
          <View style={styles.trendingGrid}>
            {trending.map((item, i) => {
              const kw = item.show_name || item.keyword;
              // 过滤掉过于奇怪或非视频方向的搜索词（可选保障）
              if (!kw) return null;
              return (
                <TVFocusable
                  key={`trending-${kw}-${i}`}
                  style={[styles.trendingChip, { width: '31%' }]}
                  onPress={() => {
                    setKeyword(kw);
                    handleSearch(kw);
                  }}
                  scaleFactor={1.03}
                >
                  <Text style={styles.trendingIndex}>{i + 1}</Text>
                  <Text style={styles.trendingChipText} numberOfLines={1}>
                    {kw}
                  </Text>
                  {item.icon && (
                    <Text style={styles.trendingHotIcon}>热</Text>
                  )}
                </TVFocusable>
              );
            })}
          </View>
        </View>
      )}

      {/* 搜索结果 */}
      <FlatList
        data={results}
        keyExtractor={(item, i) => item.bvid || String(i)}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <TVSkeleton columns={NUM_COLUMNS} count={15} />
          ) : !showHistory ? (
            <TVEmptyState
              title={results.length === 0 && keyword.trim() ? '没有找到相关视频' : '输入关键词搜索'}
              icon="search-outline"
              style={{ paddingTop: 80 }}
            />
          ) : null
        }
        ListFooterComponent={
          loading && results.length > 0 ? <TVLoading /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingVertical: TV.layout.headerPaddingV,
    backgroundColor: TV.color.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TV.color.border,
    gap: TV.space.md - 2,
  },
  backBtn: {
    padding: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrap: {
    flex: 1,
    height: 40,
    backgroundColor: TV.color.surfaceLight,
    borderRadius: TV.radius.md,
    paddingHorizontal: TV.space.lg - 2,
    justifyContent: 'center',
  },
  input: {
    fontSize: TV.font.xl,
    color: TV.color.textPrimary,
    padding: 0,
  },
  // 搜索历史
  historySection: {
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingTop: TV.space.md,
    paddingBottom: TV.space.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TV.space.sm,
  },
  historyTitle: { fontSize: TV.font.base, color: TV.color.textTertiary },
  historyList: { gap: TV.space.sm },
  historyChip: {
    paddingHorizontal: TV.space.lg - 2,
    paddingVertical: TV.space.sm - 1,
    borderRadius: TV.radius.xl,
    backgroundColor: TV.color.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyChipText: { fontSize: TV.font.base, color: TV.color.textSecondary },
  // 结果
  listContent: { padding: TV.layout.listPadding },
  row: { gap: TV.layout.gridGap },
  // 热搜
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV.space.md,
    marginTop: TV.space.xs,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TV.color.surfaceLight,
    paddingHorizontal: TV.space.md,
    paddingVertical: TV.space.md,
    borderRadius: TV.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: TV.space.sm,
  },
  trendingIndex: {
    fontSize: TV.font.xl,
    fontWeight: 'bold',
    color: TV.color.accent,
    width: 28,
    textAlign: 'center',
  },
  trendingChipText: {
    fontSize: TV.font.lg,
    color: TV.color.textSecondary,
    flex: 1,
  },
  trendingHotIcon: {
    fontSize: TV.font.sm,
    color: TV.color.danger,
    backgroundColor: 'rgba(255,71,87,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
