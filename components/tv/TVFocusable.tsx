import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { TV } from '../../constants/tvTheme';

interface TVFocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  focusStyle?: ViewStyle;
  scaleFactor?: number;
  borderColor?: string;
  disabled?: boolean;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel?: string;
}

/**
 * TV 专用可聚焦容器。
 * 聚焦时平滑显示高亮边框并轻微放大，按确认键触发 onPress。
 * - scale 使用 native driver 保证 60fps
 * - borderColor 使用 JS driver（不支持 native）
 * - 退出动画比进入更快，符合自然运动规律
 */
export function TVFocusable({
  children,
  onPress,
  style,
  focusStyle,
  scaleFactor = 1.05,
  borderColor = TV.color.accent,
  disabled = false,
  hasTVPreferredFocus = false,
  accessibilityLabel,
}: TVFocusableProps): React.JSX.Element {
  // scale 动画 — native driver
  const scaleAnim = useRef(new Animated.Value(0)).current;
  // border 动画 — JS driver（borderColor 不支持 native）
  const borderAnim = useRef(new Animated.Value(0)).current;

  const easeOut = Easing.out(Easing.quad);

  const handleFocus = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: TV.timing.focusIn,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: TV.timing.focusIn,
        easing: easeOut,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, borderAnim]);

  const handleBlur = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: TV.timing.focusOut,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: TV.timing.focusOut,
        easing: easeOut,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, borderAnim]);

  const animatedScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, scaleFactor],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: animatedScale }],
          borderColor: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', borderColor],
          }),
        },
        focusStyle && {
          ...Object.fromEntries(
            Object.entries(focusStyle).map(([k, v]) => [k, v]),
          ),
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        hasTVPreferredFocus={hasTVPreferredFocus}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        style={{ flex: undefined }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  focusBorder: {
    borderWidth: 2,
    borderColor: TV.color.accent,
  },
});


