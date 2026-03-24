import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { TV } from '../../constants/tvTheme';

interface Props {
  /** 骨架条数，默认 5 列 x 3 行 = 15 */
  count?: number;
  /** 每列宽度覆盖 */
  columns?: number;
  /** 侧边栏宽度，默认 0 */
  sidebarWidth?: number;
}

/**
 * TV 版骨架屏加载占位。
 * 模拟视频卡片网格的加载状态，含闪烁动画。
 */
export function TVSkeleton({ count = 15, columns = 5, sidebarWidth = 0 }: Props) {
  const { width } = useWindowDimensions();
  const CARD_W = (width - sidebarWidth - TV.layout.listPadding * 2 - TV.layout.gridGap * (columns - 1)) / columns;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const cards = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      {cards.map(i => (
        <Animated.View
          key={i}
          style={[
            styles.card,
            { width: CARD_W, opacity },
          ]}
        >
          <View
            style={[
              styles.thumb,
              { width: CARD_W, height: CARD_W * 0.5625 },
            ]}
          />
          <View style={styles.textBlock}>
            <View style={styles.titleLine} />
            <View style={styles.subtitleLine} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: TV.layout.listPadding,
    gap: TV.layout.gridGap,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: TV.color.surface,
  },
  thumb: {
    backgroundColor: TV.color.surfaceAlt,
  },
  textBlock: {
    padding: 8,
    gap: 6,
  },
  titleLine: {
    height: 12,
    borderRadius: 3,
    backgroundColor: TV.color.surfaceAlt,
    width: '80%',
  },
  subtitleLine: {
    height: 10,
    borderRadius: 3,
    backgroundColor: TV.color.surfaceAlt,
    width: '50%',
  },
});
