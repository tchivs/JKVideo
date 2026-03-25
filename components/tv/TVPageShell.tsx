import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { TV } from '../../constants/tvTheme';
import { TVSidebar } from './TVSidebar';

/**
 * Shared shell for secondary TV screens: renders the persistent sidebar
 * alongside the page content.
 *
 * NOTE: The home screen (`app-tv/index.tsx`) intentionally does NOT use
 * this shell because it renders `HeroBackdrop` as a full-bleed layer
 * behind *both* the sidebar and the content area — something this
 * simple row layout cannot express.  If you change the sidebar here,
 * keep `index.tsx` in sync.
 */
interface TVPageShellProps {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function TVPageShell({ children, contentStyle }: TVPageShellProps) {
  return (
    <View style={styles.container}>
      <TVSidebar />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: TV.color.bg,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
