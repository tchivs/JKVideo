import * as React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { TV } from '../../constants/tvTheme';

interface TVLoadingProps {
  /** 是否占满并绝对居中（用于整页加载） */
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const TVLoading: React.FC<TVLoadingProps> = ({ fullScreen, style }) => {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        <ActivityIndicator size="large" color={TV.color.accent} />
      </View>
    );
  }
  return <ActivityIndicator color={TV.color.accent} style={[styles.inlineLoader, style]} />;
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TV.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  inlineLoader: {
    marginVertical: TV.space.xl,
  },
});
