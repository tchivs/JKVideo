import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVLoginModal } from '../components/tv/TVLoginModal';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCheckUpdate } from '../hooks/useCheckUpdate';

/**
 * TV 版设置页。所有选项使用 TVFocusable，D-Pad 可导航。
 */
export default function TVSettingsScreen() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuthStore();
  const {
    coverQuality, setCoverQuality,
    dmEnabled, setDmEnabled,
    dmOpacity, setDmOpacity,
    dmFontScale, setDmFontScale,
    dmAreaRatio, setDmAreaRatio,
    dmFilterModes, setDmFilterModes,
    defaultQn, setDefaultQn,
  } = useSettingsStore();
  const { currentVersion, isChecking, downloadProgress, checkUpdate } =
    useCheckUpdate();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TVFocusable
          onPress={() => router.back()}
          style={styles.backBtn}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TVFocusable>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <View style={styles.content}>
        {/* 版本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>版本信息</Text>
          <View style={styles.row}>
            <Text style={styles.label}>当前版本</Text>
            <Text style={styles.value}>v{currentVersion}</Text>
          </View>
        </View>

        {/* 更新 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>更新</Text>
          <TVFocusable
            style={styles.optionBtn}
            onPress={checkUpdate}
            disabled={isChecking || downloadProgress !== null}
            scaleFactor={1}
          >
            {isChecking ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#00AEEC"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.optionBtnText}>检查中...</Text>
              </>
            ) : downloadProgress !== null ? (
              <Text style={styles.optionBtnText}>
                下载中 {downloadProgress}%
              </Text>
            ) : (
              <Text style={styles.optionBtnText}>检查更新</Text>
            )}
          </TVFocusable>
        </View>

        {/* 封面图清晰度 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>封面图清晰度</Text>
          <View style={styles.optionRow}>
            <TVFocusable
              style={[
                styles.option,
                coverQuality === 'hd' && styles.optionActive,
              ]}
              onPress={() => setCoverQuality('hd')}
              scaleFactor={1}
            >
              <Text
                style={[
                  styles.optionText,
                  coverQuality === 'hd' && styles.optionTextActive,
                ]}
              >
                高清
              </Text>
            </TVFocusable>
            <TVFocusable
              style={[
                styles.option,
                coverQuality === 'normal' && styles.optionActive,
              ]}
              onPress={() => setCoverQuality('normal')}
              scaleFactor={1}
            >
              <Text
                style={[
                  styles.optionText,
                  coverQuality === 'normal' && styles.optionTextActive,
                ]}
              >
                普通
              </Text>
            </TVFocusable>
          </View>
        </View>

        {/* 默认播放清晰度 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>默认播放清晰度</Text>
          <View style={styles.optionRow}>
            {[
              { qn: 16, label: '360P' },
              { qn: 32, label: '480P' },
              { qn: 64, label: '720P' },
              { qn: 80, label: '1080P' },
              { qn: 116, label: '1080P60' },
            ].map(q => (
              <TVFocusable
                key={q.qn}
                style={[styles.option, defaultQn === q.qn && styles.optionActive]}
                onPress={() => setDefaultQn(q.qn)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, defaultQn === q.qn && styles.optionTextActive]}>
                  {q.label}
                </Text>
              </TVFocusable>
            ))}
          </View>
        </View>

        {/* 弹幕设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>弹幕设置</Text>

          <View style={[styles.row, { marginBottom: 12 }]}>
            <Text style={styles.label}>弹幕开关</Text>
            <TVFocusable
              style={[styles.option, dmEnabled && styles.optionActive]}
              onPress={() => setDmEnabled(!dmEnabled)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, dmEnabled && styles.optionTextActive]}>
                {dmEnabled ? '已开启' : '已关闭'}
              </Text>
            </TVFocusable>
          </View>

          <Text style={styles.sublabel}>透明度</Text>
          <View style={[styles.optionRow, { marginBottom: 10 }]}>
            {[0.25, 0.5, 0.75, 1].map(v => (
              <TVFocusable
                key={v}
                style={[styles.option, dmOpacity === v && styles.optionActive]}
                onPress={() => setDmOpacity(v)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, dmOpacity === v && styles.optionTextActive]}>
                  {Math.round(v * 100)}%
                </Text>
              </TVFocusable>
            ))}
          </View>

          <Text style={styles.sublabel}>字号</Text>
          <View style={[styles.optionRow, { marginBottom: 10 }]}>
            {([{ v: 0.7, l: '小' }, { v: 1, l: '标准' }, { v: 1.3, l: '大' }] as const).map(({ v, l }) => (
              <TVFocusable
                key={v}
                style={[styles.option, dmFontScale === v && styles.optionActive]}
                onPress={() => setDmFontScale(v)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, dmFontScale === v && styles.optionTextActive]}>
                  {l}
                </Text>
              </TVFocusable>
            ))}
          </View>

          <Text style={styles.sublabel}>显示区域</Text>
          <View style={[styles.optionRow, { marginBottom: 10 }]}>
            {([{ v: 0.25, l: '1/4屏' }, { v: 0.5, l: '半屏' }, { v: 0.75, l: '3/4屏' }, { v: 1, l: '全屏' }] as const).map(({ v, l }) => (
              <TVFocusable
                key={v}
                style={[styles.option, dmAreaRatio === v && styles.optionActive]}
                onPress={() => setDmAreaRatio(v)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, dmAreaRatio === v && styles.optionTextActive]}>
                  {l}
                </Text>
              </TVFocusable>
            ))}
          </View>

          <Text style={styles.sublabel}>屏蔽类型</Text>
          <View style={styles.optionRow}>
            {([{ mode: 1, label: '滚动' }, { mode: 5, label: '顶部' }, { mode: 4, label: '底部' }] as const).map(({ mode, label }) => {
              const isFiltered = dmFilterModes.includes(mode);
              return (
                <TVFocusable
                  key={mode}
                  style={[styles.option, isFiltered && styles.optionFiltered]}
                  onPress={() => {
                    const next = isFiltered
                      ? dmFilterModes.filter((m: number) => m !== mode)
                      : [...dmFilterModes, mode];
                    setDmFilterModes(next);
                  }}
                  scaleFactor={1}
                >
                  <Text style={[styles.optionText, isFiltered && styles.optionFilteredText]}>
                    {isFiltered ? `✗ ${label}` : label}
                  </Text>
                </TVFocusable>
              );
            })}
          </View>
        </View>

        {/* 退出登录 / 登录 */}
        {isLoggedIn ? (
          <TVFocusable
            style={styles.logoutBtn}
            onPress={handleLogout}
            scaleFactor={1}
            borderColor="#ff4757"
          >
            <Text style={styles.logoutText}>退出登录</Text>
          </TVFocusable>
        ) : (
          <TVFocusable
            style={styles.loginBtn}
            onPress={() => setShowLogin(true)}
            scaleFactor={1}
          >
            <Text style={styles.loginText}>登录账号</Text>
          </TVFocusable>
        )}

        {/* 下载管理 */}
        <TVFocusable
          style={styles.downloadsBtn}
          onPress={() => router.push('/downloads' as any)}
          scaleFactor={1}
        >
          <Ionicons name="cloud-download-outline" size={18} color="#ccc" />
          <Text style={styles.downloadsBtnText}>下载管理</Text>
        </TVFocusable>
      </View>

      <TVLoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  content: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 15, color: '#e0e0e0' },
  value: { fontSize: 15, color: '#888' },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  optionBtnText: { fontSize: 15, color: '#00AEEC', fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: 12 },
  option: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#2a2a2a',
  },
  optionActive: { borderColor: '#00AEEC', backgroundColor: '#1a3040' },
  optionText: { fontSize: 14, color: '#aaa' },
  optionTextActive: { color: '#00AEEC', fontWeight: '600' },
  optionFiltered: { borderColor: '#ff4757', backgroundColor: 'rgba(255,71,87,0.1)' },
  optionFilteredText: { color: '#ff4757' },
  sublabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    borderColor: '#ff4757',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, color: '#ff4757', fontWeight: '600' },
  loginBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#00AEEC',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  loginText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  downloadsBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  downloadsBtnText: { fontSize: 15, color: '#ccc' },
});
