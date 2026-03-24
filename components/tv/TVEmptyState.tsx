import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TVFadeIn } from './TVFadeIn';
import { TVButton } from './TVButton';
import { TV } from '../../constants/tvTheme';

export interface TVEmptyStateProps {
  /** 提示主标题 */
  title: string;
  /** 副标题、详细描述（可选） */
  hint?: string;
  /** 顶部展示的大图标（可选，默认 cloud-offline-outline） */
  icon?: keyof typeof Ionicons.glyphMap;
  /** 设置该属性后，会渲染一个主要重试/刷新按钮 */
  onRetry?: () => void;
  /** 重试按钮文字（默认 '重试'） */
  retryText?: string;
  /** 外层容器样式 */
  style?: ViewStyle;
}

/**
 * TV 端标准的数据空状态/错误占位组件。
 * 整合了图标、提示文案以及带有下划线引导的重试按钮。
 */
export const TVEmptyState: React.FC<TVEmptyStateProps> = ({
  title,
  hint,
  icon = 'cloud-offline-outline',
  onRetry,
  retryText = '重试',
  style,
}) => {
  return (
    <TVFadeIn style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={TV.color.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      
      {onRetry && (
        <TVButton
          title={retryText}
          onPress={onRetry}
          variant="primary"
          style={styles.retryBtn}
        />
      )}
    </TVFadeIn>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: TV.layout.contentPaddingH,
  },
  title: {
    fontSize: TV.font.xl,
    color: TV.color.textSecondary,
    marginTop: TV.space.md,
    marginBottom: TV.space.sm,
  },
  hint: {
    fontSize: TV.font.lg,
    color: TV.color.textTertiary,
    marginBottom: TV.space.xl,
  },
  retryBtn: {
    marginTop: TV.space.md,
  },
});
