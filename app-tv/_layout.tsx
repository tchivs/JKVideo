import { Stack, useRootNavigationState } from 'expo-router';
import { View, BackHandler, ToastAndroid } from 'react-native';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { TV } from '../constants/tvTheme';

export default function TVRootLayout(): React.JSX.Element {
  const restore = useAuthStore(s => s.restore);
  const restoreSettings = useSettingsStore(s => s.restore);
  const restoreHistory = useHistoryStore(s => s.restore);
  const lastBackRef = useRef(0);
  const navState = useRootNavigationState();
  const isRootRef = useRef(true);

  // 判断是否在根屏幕
  useEffect(() => {
    isRootRef.current = (navState?.index ?? 0) === 0;
  }, [navState?.index]);

  useEffect(() => {
    restore();
    restoreSettings();
    restoreHistory();

    // TV 双击返回键退出（仅在首页生效）
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isRootRef.current) return false; // 非首页让 Stack 处理返回
      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackRef.current = now;
      try {
        ToastAndroid.show('再按一次退出', ToastAndroid.SHORT);
      } catch {
        // Web 无 ToastAndroid
      }
      return true; // 首页拦截返回键
    });
    return () => handler.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: TV.color.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="video" />
        <Stack.Screen name="live" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="history" />
        <Stack.Screen name="ranking" />
      </Stack>
    </View>
  );
}
