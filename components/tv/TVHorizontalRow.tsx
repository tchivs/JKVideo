import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { TV } from '../../constants/tvTheme';
import { TVLoading } from './TVLoading';

interface Props<T> {
  title: string;
  data: T[];
  renderItem: (
    info: { item: T; index: number },
    onFocusChange: (focused: boolean) => void
  ) => React.ReactElement;
  onItemFocus?: (item: T) => void;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  loading?: boolean;
}

/**
 * TV 泳道布局的独立水平行组件。
 * 提供组级的十字方向焦点流动，及内建的按列元素聚焦抛出器。
 */
export function TVHorizontalRow<T>({
  title,
  data,
  renderItem,
  onItemFocus,
  keyExtractor,
  onEndReached,
  loading,
}: Props<T>) {
  if (!loading && (!data || data.length === 0)) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={false} // 禁止横向裁剪防焦点丢失
        ItemSeparatorComponent={() => <View style={{ width: TV.space.lg }} />}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingWrapper}>
              <TVLoading />
            </View>
          ) : null
        }
        renderItem={(info) => {
          const handleFocusChange = (focused: boolean) => {
            if (focused && onItemFocus) {
              onItemFocus(info.item);
            }
          };
          // 渲染并注入 focus 事件与剔除内部垂直 marginBottom
          return (
            <View style={styles.itemWrapper}>
              {renderItem(info, handleFocusChange)}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: TV.space.xl,
  },
  title: {
    fontSize: TV.font.xl,
    fontWeight: '700',
    color: TV.color.textPrimary,
    marginLeft: TV.layout.listPadding,
    marginBottom: TV.space.md,
  },
  listContent: {
    paddingHorizontal: TV.layout.listPadding,
    paddingBottom: TV.space.md,
  },
  itemWrapper: {
    // 强制清理内部预留的垂直边距以适应横向
    marginVertical: 0,
    marginBottom: 0,
  },
  loadingWrapper: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: TV.space.md,
  },
});
