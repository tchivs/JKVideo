import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

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
 */
export function TVFocusable({
  children,
  onPress,
  style,
  focusStyle,
  scaleFactor = 1.05,
  borderColor = '#00AEEC',
  disabled = false,
  hasTVPreferredFocus = false,
  accessibilityLabel,
}: TVFocusableProps): React.JSX.Element {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [focusAnim]);

  const animatedScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, scaleFactor],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: animatedScale }],
          borderColor: focusAnim.interpolate({
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
    borderColor: '#00AEEC',
  },
});


