import * as React from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from './TVFocusable';
import { TV } from '../../constants/tvTheme';

export interface TVButtonProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  scaleFactor?: number;
  disabled?: boolean;
}

/**
 * 核心 TV 按钮组件。
 * 封装了不同的外观（primary, secondary, danger）与带图标的布局，内置标准化 TVFocusable 交互。
 */
export const TVButton: React.FC<TVButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'secondary',
  style,
  textStyle,
  scaleFactor = 1.05,
  disabled = false,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: TV.color.accent, text: TV.color.white, icon: TV.color.white };
      case 'danger': return { bg: 'rgba(255,71,87,0.15)', text: TV.color.danger, icon: TV.color.danger };
      case 'secondary':
      default:
        return { bg: TV.color.surfaceAlt, text: TV.color.textPrimary, icon: TV.color.textTertiary };
    }
  };

  const { bg, text, icon: iconColor } = getColors();

  return (
    <TVFocusable
      onPress={onPress}
      style={[styles.button, { backgroundColor: bg }, disabled && styles.disabled, style]}
      scaleFactor={disabled ? 1 : scaleFactor}
      disabled={disabled}
      accessibilityLabel={title}
    >
      {icon && <Ionicons name={icon} size={20} color={iconColor} />}
      <Text style={[styles.text, { color: text }, textStyle]}>{title}</Text>
    </TVFocusable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TV.space.xl,
    paddingVertical: TV.space.md,
    borderRadius: TV.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: TV.space.sm,
  },
  text: {
    fontSize: TV.font.xl,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
