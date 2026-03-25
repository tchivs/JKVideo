import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { proxyImageUrl } from '../../utils/imageUrl';
import { TV } from '../../constants/tvTheme';
import { useTVLayout } from '../../hooks/useTVLayout';
import { HOME_MODE_ITEMS, NAV_ITEMS, SETTINGS_ITEM, type HomeMode } from '../../app-tv/sidebarConfig';
import { TVFocusable } from './TVFocusable';
import { TVLoginModal } from './TVLoginModal';

interface TVSidebarProps {
  currentHomeMode?: HomeMode;
  onHomeModeChange?: (mode: HomeMode) => void;
}

export function TVSidebar({ currentHomeMode, onHomeModeChange }: TVSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarWidth } = useTVLayout();
  const { isLoggedIn, face } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  const sidebarItemWidth = useMemo(() => sidebarWidth - TV.space.lg, [sidebarWidth]);

  const handleHomeModePress = (mode: HomeMode) => {
    // Always navigate via URL so the address bar stays in sync.
    // index.tsx reads `mode` from useLocalSearchParams and mirrors it
    // into local state, so this covers both "already on /" and
    // "navigating back to /" cases.
    router.replace({ pathname: '/', params: { mode } } as any);
  };

  const handleRoutePress = (route: string) => {
    if (pathname === route) return;
    router.replace(route as any);
  };

  return (
    <View style={[styles.sidebar, { width: sidebarWidth }]} role="navigation" accessibilityLabel="主导航">
      <Text style={styles.logo}>JK</Text>

      {HOME_MODE_ITEMS.map(tab => {
        const isActive = pathname === '/' && currentHomeMode === tab.key;
        return (
          <TVFocusable
            key={tab.key}
            style={[
              styles.sidebarItem,
              { width: sidebarItemWidth },
              isActive && { backgroundColor: TV.color.surfaceActive },
            ]}
            onPress={() => handleHomeModePress(tab.key)}
            scaleFactor={1.1}
            borderColor={tab.color}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={tab.icon as any} size={22} color={isActive ? tab.color : TV.color.textTertiary} />
            <Text style={[styles.sidebarText, isActive && { color: tab.color, fontWeight: '600' }]}>{tab.label}</Text>
          </TVFocusable>
        );
      })}

      <View style={[styles.sidebarDivider, { width: sidebarItemWidth }]} />

      {NAV_ITEMS.map(tab => {
        const isActive = pathname === tab.route;
        return (
          <TVFocusable
            key={tab.key}
            style={[
              styles.sidebarItem,
              { width: sidebarItemWidth },
              isActive && { backgroundColor: TV.color.surfaceActive },
            ]}
            onPress={() => handleRoutePress(tab.route)}
            scaleFactor={1.1}
            borderColor={tab.color}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={tab.icon as any} size={22} color={isActive ? tab.color : TV.color.textTertiary} />
            <Text style={[styles.sidebarText, isActive && { color: tab.color, fontWeight: '600' }]}>{tab.label}</Text>
          </TVFocusable>
        );
      })}

      <View style={{ flex: 1 }} />

      <TVFocusable
        style={[
          styles.sidebarItem,
          { width: sidebarItemWidth },
          pathname === SETTINGS_ITEM.route && { backgroundColor: TV.color.surfaceActive },
        ]}
        onPress={() => handleRoutePress(SETTINGS_ITEM.route)}
        scaleFactor={1.1}
        accessibilityLabel={SETTINGS_ITEM.label}
      >
        <Ionicons
          name={SETTINGS_ITEM.icon as any}
          size={22}
          color={pathname === SETTINGS_ITEM.route ? SETTINGS_ITEM.color : TV.color.textTertiary}
        />
        <Text style={[
          styles.sidebarText,
          pathname === SETTINGS_ITEM.route && { color: SETTINGS_ITEM.color, fontWeight: '600' },
        ]}>
          {SETTINGS_ITEM.label}
        </Text>
      </TVFocusable>

      <TVFocusable
        style={[styles.sidebarItem, { width: sidebarItemWidth }]}
        onPress={() => {
          if (!isLoggedIn) setShowLogin(true);
        }}
        scaleFactor={1.1}
        accessibilityLabel={isLoggedIn ? '已登录' : '登录'}
      >
        {isLoggedIn && face ? (
          <Image source={{ uri: proxyImageUrl(face) }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={26} color={TV.color.textTertiary} />
        )}
        <Text style={styles.sidebarText}>{isLoggedIn ? '已登录' : '登录'}</Text>
      </TVFocusable>

      <TVLoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: 'transparent',
    paddingVertical: TV.space.lg,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: TV.color.white,
    marginBottom: TV.space.xxl,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: TV.space.sm,
    borderRadius: TV.radius.md,
    marginBottom: TV.space.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sidebarText: {
    fontSize: TV.font.xs,
    color: TV.color.textTertiary,
    marginTop: 4,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: TV.space.sm,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TV.color.placeholder,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
