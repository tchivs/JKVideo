import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVVideoCard } from '../components/tv/TVVideoCard';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVEmptyState } from '../components/tv/TVEmptyState';
import { TVLoading } from '../components/tv/TVLoading';
import { TVButton } from '../components/tv/TVButton';
import { TVSkeleton } from '../components/tv/TVSkeleton';
import { TVPageShell } from '../components/tv/TVPageShell';
import { useSearch } from '../hooks/useSearch';
import { useHistoryStore } from '../store/historyStore';
import { getSearchSquare, type SearchHotItem } from '../services/bilibili';
import type { SearchVideoOrder } from '../services/bilibili';
import type { VideoItem } from '../services/types';
import { TV } from '../constants/tvTheme';
import { useTVLayout } from '../hooks/useTVLayout';

const SORT_OPTIONS: Array<{ label: string; value: SearchVideoOrder }> = [
  { label: '综合', value: 'totalrank' },
  { label: '最新', value: 'pubdate' },
  { label: '播放', value: 'click' },
  { label: '收藏', value: 'stow' },
  { label: '弹幕', value: 'dm' },
];

/**
 * TV 版搜索页。
 * 大号搜索框 + 搜索历史 + 网格搜索结果。
 */
export default function TVSearchScreen() {
  const router = useRouter();
  const { gridColumns, contentPaddingH, headerTopPadding, isCompact } = useTVLayout();
  const { keyword, setKeyword, sortOrder, setSortOrder, results, loading, search, loadMore } =
    useSearch();
  const { searchHistory, addSearchHistory, clearSearchHistory } =
    useHistoryStore();
  const inputRef = useRef<TextInput>(null);
  const [editingKeyword, setEditingKeyword] = useState(false);

  const [trending, setTrending] = useState<SearchHotItem[]>([]);

  useEffect(() => {
    getSearchSquare().then(setTrending).catch(console.warn);
  }, []);

  const handleSearch = useCallback(
    (kw?: string) => {
      const term = (kw ?? keyword).trim();
      if (term) {
        search(term, true, sortOrder);
        addSearchHistory(term);
        if (kw) setKeyword(term);
      }
    },
    [keyword, sortOrder, search, addSearchHistory, setKeyword],
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
  const historyChips = useMemo(() => {
    const seen = new Map<string, number>();
    return searchHistory.map(kw => {
      const count = (seen.get(kw) ?? 0) + 1;
      seen.set(kw, count);
      return { kw, key: `${kw}-${count}` };
    });
  }, [searchHistory]);
  const trendingChips = useMemo(() => {
    const seen = new Map<string, number>();
    return trending
      .map(item => ({ kw: item.show_name || item.keyword, icon: item.icon }))
      .filter(item => Boolean(item.kw))
      .map(item => {
        const kw = item.kw as string;
        const count = (seen.get(kw) ?? 0) + 1;
        seen.set(kw, count);
        return { kw, icon: item.icon, key: `trending-${kw}-${count}` };
      });
  }, [trending]);

  return (
    <TVPageShell>
      <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={[styles.header, { paddingHorizontal: contentPaddingH, paddingTop: headerTopPadding }]} accessibilityRole="header">
        <TVFocusable
          style={[styles.inputWrap, editingKeyword && styles.inputWrapActive]}
          onPress={() => {
            setEditingKeyword(true);
            inputRef.current?.focus();
          }}
          accessibilityLabel="输入搜索关键词"
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="搜索视频、UP主…"
            placeholderTextColor={TV.color.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            onFocus={() => setEditingKeyword(true)}
            onBlur={() => setEditingKeyword(false)}
            onSubmitEditing={() => {
              handleSearch();
              inputRef.current?.blur();
              setEditingKeyword(false);
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
          />
        </TVFocusable>

        <TVButton
          title="搜索"
          onPress={() => handleSearch()}
          variant="primary"
          disabled={loading}
        />
      </View>

      {/* 搜索历史区域 */}
      {showHistory && (
        <View style={[styles.historySection, { paddingHorizontal: contentPaddingH }]}>
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
            {historyChips.map(({ kw, key }) => (
              <TVFocusable
                key={key}
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
        <View style={[styles.historySection, { paddingHorizontal: contentPaddingH }]}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>B站热搜榜</Text>
          </View>
          <View style={styles.trendingGrid}>
            {trendingChips.map(({ kw, key, icon }, i) => {
              return (
                <TVFocusable
                  key={key}
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
                  {icon && (
                    <Text style={styles.trendingHotIcon}>热</Text>
                  )}
                </TVFocusable>
              );
            })}
          </View>
        </View>
      )}

      {/* 搜索结果 */}
      <View style={[styles.sortRow, { paddingHorizontal: contentPaddingH }]}>
        {SORT_OPTIONS.map(option => {
          const selected = option.value === sortOrder;
          return (
            <TVFocusable
              key={option.value}
              style={[styles.sortChip, selected && styles.sortChipActive]}
              onPress={() => {
                setSortOrder(option.value);
                if (keyword.trim()) {
                  search(keyword, true, option.value);
                }
              }}
              scaleFactor={1.05}
              borderColor={selected ? TV.color.accent : 'transparent'}
              accessibilityLabel={`按${option.label}排序`}
            >
              <Text style={[styles.sortChipText, selected && styles.sortChipTextActive]}>{option.label}</Text>
            </TVFocusable>
          );
        })}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, i) => item.bvid || String(i)}
        renderItem={renderItem}
        numColumns={gridColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <TVSkeleton columns={gridColumns} count={15} />
          ) : !showHistory ? (
            <TVEmptyState
              title={results.length === 0 && keyword.trim() ? '没有找到相关视频' : '输入关键词搜索'}
              icon="search-outline"
              style={{ paddingTop: isCompact ? TV.space.xxl : 80 }}
            />
          ) : null
        }
        ListFooterComponent={
          loading && results.length > 0 ? <TVLoading /> : null
        }
      />
      </View>
    </TVPageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingVertical: TV.layout.headerPaddingV,
    backgroundColor: 'transparent',
    paddingTop: TV.layout.headerPaddingV + TV.space.xl,
    gap: TV.space.md - 2,
  },
  inputWrap: {
    flex: 1,
    height: 40,
    backgroundColor: TV.color.surfaceLight,
    borderRadius: TV.radius.md,
    paddingHorizontal: TV.space.lg - 2,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapActive: {
    borderColor: TV.color.accent,
    backgroundColor: TV.color.accentBg,
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
  sortRow: {
    flexDirection: 'row',
    gap: TV.space.sm,
    paddingTop: TV.space.sm,
    paddingBottom: TV.space.xs,
  },
  sortChip: {
    minWidth: 84,
    height: 38,
    paddingHorizontal: TV.space.md,
    borderRadius: TV.radius.pill,
    backgroundColor: TV.color.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: TV.color.accentBg,
  },
  sortChipText: {
    fontSize: TV.font.sm,
    color: TV.color.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: TV.color.accent,
    fontWeight: '700',
  },
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
