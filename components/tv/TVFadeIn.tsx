import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle, type StyleProp } from 'react-native';
import { TV } from '../../constants/tvTheme';

interface Props {
  children: React.ReactNode;
  /** 延迟启动，用于列表交错淡入 */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * TV 版淡入动画包装器。
 * 组件挂载时从下方 10px 淡入，用于内容入场和空状态展示。
 */
export function TVFadeIn({ children, delay = 0, style }: Props): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: TV.timing.fadeIn,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: TV.timing.fadeIn,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
