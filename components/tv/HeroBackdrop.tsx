import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { coverImageUrl, proxyImageUrl } from '../../utils/imageUrl';
import { useSettingsStore } from '../../store/settingsStore';
import { TV } from '../../constants/tvTheme';
import { useTVLayout } from '../../hooks/useTVLayout';
import type { VideoItem, LiveRoom } from '../../services/types';

interface Props {
  activeItem: VideoItem | LiveRoom | null;
}

/**
 * 位于所有图层最下方的巨幕海报沉浸底板。
 * 根据向上游提报的焦点项 (activeItem) 进行视差和内容的动态加载与平滑切换，提供 Leanback 灵魂级的压迫质感视觉。
 */
export const HeroBackdrop = React.memo(function HeroBackdrop({ activeItem }: Props) {
  const coverQuality = useSettingsStore((s) => s.coverQuality);
  const { sidebarWidth, heroTitleFontSize, heroTitleLineHeight, heroSubtitleFontSize, isCompact } = useTVLayout();
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  
  // 持有用于淡出入交叉切换的动画钩子
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeItem) return;
    
    let uri = '';
    // 使用鸭子类型判定资源路由
    if ('bvid' in activeItem) {
      uri = coverImageUrl(activeItem.pic || '', coverQuality);
    } else if ('roomid' in activeItem) {
      uri = proxyImageUrl(activeItem.cover || '');
    }
    
    if (uri && uri !== currentUri) {
      // 执行交叉淡变掩盖生硬闪烁
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentUri(uri);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [activeItem, coverQuality, currentUri, opacity]);

  if (!currentUri) {
    return <View style={styles.container} />;
  }

  const isVideo = activeItem && 'bvid' in activeItem;
  const title = activeItem?.title || '';
  const subtitle = isVideo 
    ? ((activeItem as VideoItem).owner?.name || '')
    : ((activeItem as LiveRoom)?.uname || '');

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.Image
        source={{ uri: currentUri }}
        style={[styles.image, { opacity }]}
        resizeMode="cover"
        fadeDuration={0} // 已由外部 Animated 负责缓入
      />
      
      {/* 左侧深邃暗房遮罩：为了保护侧边导航与左前排文本 */}
      <LinearGradient
        colors={[
          TV.color.bg,
          `${TV.color.bg}E6`,  // 90% opacity of bg
          `${TV.color.bg}66`,  // 40% opacity of bg
          'transparent'
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.6, y: 0.5 }}
        style={styles.gradientLeft}
      />

      {/* 底部向上侵蚀的深色渐变：为了给前排的一溜视频卡片打底 */}
      <LinearGradient
        colors={[
          'transparent',
          `${TV.color.bg}99`,  // 60% opacity of bg
          TV.color.bg
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBottom}
      />
      
      {/* 元信息：仅展示于左上空旷域 */}
      <Animated.View
        style={[
          styles.infoContainer,
          {
            opacity,
            top: isCompact ? 88 : '12%',
            left: sidebarWidth + TV.space.xl,
            width: isCompact ? '62%' : '50%',
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { fontSize: heroTitleFontSize, lineHeight: heroTitleLineHeight },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={[styles.subtitle, { fontSize: heroSubtitleFontSize }]} numberOfLines={1}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TV.color.bg,
    zIndex: 0,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  gradientLeft: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBottom: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    position: 'absolute',
  },
  title: {
    fontWeight: '900',
    color: TV.color.white,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: TV.space.md,
  },
  subtitle: {
    fontWeight: '500',
    color: TV.color.textSecondary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  }
});
