import React, { useRef, useCallback } from 'react';
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
import { useSearch } from '../hooks/useSearch';
import { useHistoryStore } from '../store/historyStore';
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

        <TVFocusable
          style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
          onPress={() => handleSearch()}
          scaleFactor={1.05}
          accessibilityLabel="搜索"
          disabled={loading}
        >
          <Text style={styles.searchBtnText}>搜索</Text>
        </TVFocusable>
      </View>

      {/* 搜索历史区域 */}
      {showHistory && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>搜索历史</Text>
            <TVFocusable
              style={styles.clearBtn}
              onPress={() =>
                Alert.alert('确认清空', '清空所有搜索历史？', [
                  { text: '取消', style: 'cancel' },
                  { text: '清空', style: 'destructive', onPress: clearSearchHistory },
                ])
              }
              scaleFactor={1}
              accessibilityLabel="清空搜索历史"
            >
              <Ionicons name="trash-outline" size={14} color={TV.color.textTertiary} />
              <Text style={styles.clearText}>清空</Text>
            </TVFocusable>
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
          !loading && !showHistory ? (
            <TVFadeIn style={styles.emptyBox}>
              <Ionicons name="search-outline" size={48} color={TV.color.textTertiary} />
              <Text style={styles.emptyText}>
                {results.length === 0 && keyword.trim()
                  ? '没有找到相关视频'
                  : '输入关键词搜索'}
              </Text>
            </TVFadeIn>
          ) : null
        }
        ListFooterComponent={
          loading && results.length > 0 ? (
            <ActivityIndicator color={TV.color.accent} style={styles.loader} />
          ) : null
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
  searchBtn: {
    paddingHorizontal: TV.space.lg,
    paddingVertical: TV.space.sm,
    backgroundColor: TV.color.accent,
    borderRadius: TV.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { fontSize: TV.font.lg, color: TV.color.white, fontWeight: '600' },
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV.space.xs,
    paddingHorizontal: TV.space.sm,
    paddingVertical: TV.space.xs,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clearText: { fontSize: TV.font.md, color: TV.color.textTertiary },
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
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: TV.space.md,
  },
  emptyText: { fontSize: TV.font.xl, color: TV.color.textTertiary },
  loader: { marginVertical: TV.space.xl },
});
