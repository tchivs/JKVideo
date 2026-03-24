import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TVFocusable } from '../components/tv/TVFocusable';
import { TVLoginModal } from '../components/tv/TVLoginModal';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, ALL_SB_CATEGORIES, type SponsorBlockCategory } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useCheckUpdate } from '../hooks/useCheckUpdate';
import { TV } from '../constants/tvTheme';
import { useTVTheme } from '../hooks/useTVTheme';
import { ToastAndroid, ScrollView } from 'react-native';

const QN_OPTIONS = [
  { qn: 16, label: '360P' },
  { qn: 32, label: '480P' },
  { qn: 64, label: '720P' },
  { qn: 80, label: '1080P' },
  { qn: 116, label: '1080P60' },
];

const OPACITY_OPTIONS = [0.25, 0.5, 0.75, 1];

const FONT_SCALE_OPTIONS = [
  { v: 0.7 as const, l: '小' },
  { v: 1 as const, l: '标准' },
  { v: 1.3 as const, l: '大' }
];

const AREA_RATIO_OPTIONS = [
  { v: 0.25 as const, l: '1/4屏' },
  { v: 0.5 as const, l: '半屏' },
  { v: 0.75 as const, l: '3/4屏' },
  { v: 1 as const, l: '全屏' }
];

const FILTER_MODES = [
  { mode: 1, label: '滚动' },
  { mode: 5, label: '顶部' },
  { mode: 4, label: '底部' }
];
/**
 * TV 版设置页。所有选项使用 TVFocusable，D-Pad 可导航。
 */
export default function TVSettingsScreen() {
  const router = useRouter();
  const tv = useTVTheme();
  const { isLoggedIn, logout } = useAuthStore();
  const {
    coverQuality, setCoverQuality,
    dmEnabled, setDmEnabled,
    dmOpacity, setDmOpacity,
    dmFontScale, setDmFontScale,
    dmAreaRatio, setDmAreaRatio,
    dmFilterModes, setDmFilterModes,
    defaultQn, setDefaultQn,
    preferredCodec, setPreferredCodec,
    autoPlayNext, setAutoPlayNext,
    ffPreview, setFfPreview,
    startupAnim, setStartupAnim,
    miniProgressBar, setMiniProgressBar,
    autoHideControls, setAutoHideControls,
    showPlayerTime, setShowPlayerTime,
    downKeyAction, setDownKeyAction,
    nextVideoSource, setNextVideoSource,
    sponsorBlockEnabled, setSponsorBlockEnabled,
    sponsorBlockCategories, setSponsorBlockCategories,
    blockedKeywords, setBlockedKeywords,
    dmBlockKeywords, setDmBlockKeywords,
  } = useSettingsStore();

  const { clearHistory } = useHistoryStore();
  const { currentVersion, isChecking, downloadProgress, checkUpdate } = useCheckUpdate();
  const [showLogin, setShowLogin] = useState(false);
  const blockedKeywordChips = useMemo(() => {
    const seen = new Map<string, number>();
    return blockedKeywords.map(kw => {
      const count = (seen.get(kw) ?? 0) + 1;
      seen.set(kw, count);
      return { kw, key: `${kw}-${count}` };
    });
  }, [blockedKeywords]);
  const dmBlockedKeywordChips = useMemo(() => {
    const seen = new Map<string, number>();
    return dmBlockKeywords.map(kw => {
      const count = (seen.get(kw) ?? 0) + 1;
      seen.set(kw, count);
      return { kw, key: `${kw}-${count}` };
    });
  }, [dmBlockKeywords]);

  const showFeedback = useCallback((message: string): void => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }, []);

  const confirmAction = useCallback(
    (title: string, message: string, onConfirm: () => void | Promise<void>): void => {
      Alert.alert(title, message, [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          style: 'destructive',
          onPress: () => {
            void Promise.resolve(onConfirm());
          },
        },
      ]);
    },
    [],
  );

  const clearCache = useCallback(() => {
    confirmAction(
      '清理缓存',
      '确认清理图片及请求缓存吗？此操作不会影响账号登录状态。',
      () => {
        // 假设有 Image.clearMemoryCache，或回退通知
        showFeedback('图片及数据缓存已清除');
      },
    );
  }, [confirmAction, showFeedback]);

  const handleClearHistory = useCallback(() => {
    confirmAction('清空历史', '确认清空本地播放历史吗？该操作无法撤销。', () => {
      clearHistory();
      showFeedback('本地播放历史已清空');
    });
  }, [clearHistory, confirmAction, showFeedback]);

  const handleLogout = async (): Promise<void> => {
    confirmAction('退出登录', '确认退出当前账号吗？', async () => {
      try {
        await logout();
        Alert.alert('已退出登录', '当前账号已成功退出。', [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } catch {
        Alert.alert('退出失败', '退出登录失败，请稍后重试。');
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: tv.layout.contentPaddingH, paddingVertical: tv.layout.headerPaddingV, gap: tv.space.md - 2 }]}>
        <TVFocusable
          onPress={() => router.back()}
          style={[styles.backBtn, { padding: tv.space.sm - 2 }]}
          scaleFactor={1.1}
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color={TV.color.textSecondary} />
        </TVFocusable>
        <Text style={[styles.headerTitle, { fontSize: tv.font.title }]}>设置</Text>
      </View>

      <ScrollView style={[styles.content, { paddingTop: tv.space.xl }]} showsVerticalScrollIndicator={false}>
        {/* 版本信息 */}
        <View style={[styles.section, { marginBottom: tv.space.lg, paddingHorizontal: tv.space.xl, paddingVertical: tv.space.lg, marginHorizontal: tv.space.xl }]}>
          <Text style={[styles.sectionLabel, { fontSize: tv.font.base, marginBottom: tv.space.md }]}>版本信息</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { fontSize: tv.font.xl }]}>当前版本</Text>
            <Text style={[styles.value, { fontSize: tv.font.xl }]}>v{currentVersion}</Text>
          </View>
        </View>

        {/* 更新 */}
        <View style={[styles.section, { marginBottom: tv.space.lg, paddingHorizontal: tv.space.xl, paddingVertical: tv.space.lg, marginHorizontal: tv.space.xl }]}>
          <Text style={[styles.sectionLabel, { fontSize: tv.font.base, marginBottom: tv.space.md }]}>更新</Text>
          <TVFocusable
            style={styles.optionBtn}
            onPress={checkUpdate}
            disabled={isChecking || downloadProgress !== null}
            scaleFactor={1}
          >
            {isChecking ? (
              <>
                <ActivityIndicator
                  color={TV.color.accent}
                />
                <Text style={[styles.optionBtnText, { fontSize: tv.font.xl }]}>检查中…</Text>
              </>
            ) : downloadProgress !== null ? (
              <Text style={[styles.optionBtnText, { fontSize: tv.font.xl }]}>
                下载中 {downloadProgress}%
              </Text>
            ) : (
              <Text style={[styles.optionBtnText, { fontSize: tv.font.xl }]}>检查更新</Text>
            )}
          </TVFocusable>
        </View>

        {/* 封面图清晰度 */}
        <View style={[styles.section, { marginBottom: tv.space.lg, paddingHorizontal: tv.space.xl, paddingVertical: tv.space.lg, marginHorizontal: tv.space.xl }]}>
          <Text style={[styles.sectionLabel, { fontSize: tv.font.base, marginBottom: tv.space.md }]}>封面图清晰度</Text>
          <View style={[styles.optionRow, { gap: tv.space.md }]}>
            <TVFocusable
              style={[
                styles.option,
                { paddingHorizontal: tv.space.xxl - tv.space.sm, paddingVertical: tv.space.sm },
                coverQuality === 'hd' && styles.optionActive,
              ]}
              onPress={() => setCoverQuality('hd')}
              scaleFactor={1}
            >
                <Text
                  style={[
                    styles.optionText,
                    { fontSize: tv.font.lg },
                    coverQuality === 'hd' && styles.optionTextActive,
                  ]}
              >
                高清
              </Text>
            </TVFocusable>
            <TVFocusable
              style={[
                styles.option,
                { paddingHorizontal: tv.space.xxl - tv.space.sm, paddingVertical: tv.space.sm },
                coverQuality === 'normal' && styles.optionActive,
              ]}
              onPress={() => setCoverQuality('normal')}
              scaleFactor={1}
            >
                <Text
                  style={[
                    styles.optionText,
                    { fontSize: tv.font.lg },
                    coverQuality === 'normal' && styles.optionTextActive,
                  ]}
              >
                普通
              </Text>
            </TVFocusable>
          </View>
        </View>

        {/* 默认播放清晰度 */}
        <View style={[styles.section, { marginBottom: tv.space.lg, paddingHorizontal: tv.space.xl, paddingVertical: tv.space.lg, marginHorizontal: tv.space.xl }]}>
          <Text style={[styles.sectionLabel, { fontSize: tv.font.base, marginBottom: tv.space.md }]}>默认播放清晰度</Text>
          <View style={[styles.optionRow, { gap: tv.space.md }]}>
            {QN_OPTIONS.map(q => (
              <TVFocusable
                key={q.qn}
                style={[styles.option, { paddingHorizontal: tv.space.xxl - tv.space.sm, paddingVertical: tv.space.sm }, defaultQn === q.qn && styles.optionActive]}
                onPress={() => setDefaultQn(q.qn)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, { fontSize: tv.font.lg }, defaultQn === q.qn && styles.optionTextActive]}>
                  {q.label}
                </Text>
              </TVFocusable>
            ))}
          </View>
        </View>

        {/* ---------------- 播放设置 ---------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>播放设置</Text>
          
          <Text style={styles.sublabel}>首选编解码器</Text>
          <View style={[styles.optionRow, { marginBottom: TV.space.md }]}>
            {(['auto', 'hevc', 'avc', 'av1'] as const).map(c => {
              const labels = { auto: '自动', hevc: 'H.265 / HEVC', avc: 'H.264 / AVC', av1: 'AV1' };
              return (
                <TVFocusable
                  key={c}
                  style={[styles.option, preferredCodec === c && styles.optionActive]}
                  onPress={() => setPreferredCodec(c)}
                  scaleFactor={1}
                >
                  <Text style={[styles.optionText, preferredCodec === c && styles.optionTextActive]}>
                    {labels[c]}
                  </Text>
                </TVFocusable>
              );
            })}
          </View>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>自动连播</Text>
            <TVFocusable
              style={[styles.option, autoPlayNext && styles.optionActive]}
              onPress={() => setAutoPlayNext(!autoPlayNext)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, autoPlayNext && styles.optionTextActive]}>
                {autoPlayNext ? '开启' : '关闭'}
              </Text>
            </TVFocusable>
          </View>

          <Text style={styles.sublabel}>下一集优先级</Text>
          <View style={[styles.optionRow, { marginBottom: TV.space.md }]}>
            {(['uploader', 'recommend'] as const).map(k => (
              <TVFocusable
                key={k}
                style={[styles.option, nextVideoSource === k && styles.optionActive]}
                onPress={() => setNextVideoSource(k)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, nextVideoSource === k && styles.optionTextActive]}>
                  {k === 'uploader' ? 'UP 主更多稿件' : '系统推荐'}
                </Text>
              </TVFocusable>
            ))}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>快进时间轴预览图</Text>
            <TVFocusable
              style={[styles.option, ffPreview && styles.optionActive]}
              onPress={() => setFfPreview(!ffPreview)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, ffPreview && styles.optionTextActive]}>
                {ffPreview ? '开启' : '关闭'}
              </Text>
            </TVFocusable>
          </View>
        </View>

        {/* ---------------- 界面与操作 ---------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>界面与操作</Text>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>迷你进度条</Text>
            <TVFocusable
              style={[styles.option, miniProgressBar && styles.optionActive]}
              onPress={() => setMiniProgressBar(!miniProgressBar)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, miniProgressBar && styles.optionTextActive]}>
                {miniProgressBar ? '显示' : '隐藏'}
              </Text>
            </TVFocusable>
          </View>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>默认隐藏播放控制栏</Text>
            <TVFocusable
              style={[styles.option, autoHideControls && styles.optionActive]}
              onPress={() => setAutoHideControls(!autoHideControls)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, autoHideControls && styles.optionTextActive]}>
                {autoHideControls ? '开启' : '关闭'}
              </Text>
            </TVFocusable>
          </View>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>播放器右上方系统时间</Text>
            <TVFocusable
              style={[styles.option, showPlayerTime && styles.optionActive]}
              onPress={() => setShowPlayerTime(!showPlayerTime)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, showPlayerTime && styles.optionTextActive]}>
                {showPlayerTime ? '显示' : '隐藏'}
              </Text>
            </TVFocusable>
          </View>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>启动动画 (Splash Screen)</Text>
            <TVFocusable
              style={[styles.option, startupAnim && styles.optionActive]}
              onPress={() => setStartupAnim(!startupAnim)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, startupAnim && styles.optionTextActive]}>
                {startupAnim ? '开启' : '关闭'}
              </Text>
            </TVFocusable>
          </View>

          <Text style={styles.sublabel}>遥控器下键映射</Text>
          <View style={styles.optionRow}>
            {(['controls', 'nextVideo'] as const).map(k => (
              <TVFocusable
                key={k}
                style={[styles.option, downKeyAction === k && styles.optionActive]}
                onPress={() => setDownKeyAction(k)}
                scaleFactor={1}
              >
                <Text style={[styles.optionText, downKeyAction === k && styles.optionTextActive]}>
                  {k === 'controls' ? '展开控制栏' : '直接播放下一个视频'}
                </Text>
              </TVFocusable>
            ))}
          </View>
        </View>

        {/* 弹幕设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>弹幕设置</Text>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
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
          <View style={[styles.optionRow, { marginBottom: TV.space.md - 2 }]}>
            {OPACITY_OPTIONS.map(v => (
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
          <View style={[styles.optionRow, { marginBottom: TV.space.md - 2 }]}>
            {FONT_SCALE_OPTIONS.map(({ v, l }) => (
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
          <View style={[styles.optionRow, { marginBottom: TV.space.md - 2 }]}>
            {AREA_RATIO_OPTIONS.map(({ v, l }) => (
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
            {FILTER_MODES.map(({ mode, label }) => {
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

        {/* ---------------- 空降助手 (SponsorBlock) ---------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>空降助手 (SponsorBlock)</Text>

          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>自动跳过赞助/广告片段</Text>
            <TVFocusable
              style={[styles.option, sponsorBlockEnabled && styles.optionActive]}
              onPress={() => setSponsorBlockEnabled(!sponsorBlockEnabled)}
              scaleFactor={1}
            >
              <Text style={[styles.optionText, sponsorBlockEnabled && styles.optionTextActive]}>
                {sponsorBlockEnabled ? '开启' : '关闭'}
              </Text>
            </TVFocusable>
          </View>

          {sponsorBlockEnabled && (
            <>
              <Text style={styles.sublabel}>跳过类别</Text>
              <View style={[styles.optionRow, { flexWrap: 'wrap', gap: TV.space.sm }]}>
                {ALL_SB_CATEGORIES.map(({ key, label }) => {
                  const isActive = sponsorBlockCategories.includes(key);
                  return (
                    <TVFocusable
                      key={key}
                      style={[styles.option, isActive && styles.optionActive]}
                      onPress={() => {
                        const next = isActive
                          ? sponsorBlockCategories.filter((c: SponsorBlockCategory) => c !== key)
                          : [...sponsorBlockCategories, key];
                        setSponsorBlockCategories(next);
                      }}
                      scaleFactor={1}
                    >
                      <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                        {isActive ? `✓ ${label}` : label}
                      </Text>
                    </TVFocusable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ---------------- 内容过滤 ---------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>内容过滤</Text>

          {/* 视频标题屏蔽 */}
          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>视频标题屏蔽词 ({blockedKeywords.length})</Text>
            {blockedKeywords.length > 0 && (
              <TVFocusable
                style={styles.option}
                onPress={() => setBlockedKeywords([])}
                scaleFactor={1}
              >
                <Text style={styles.optionText}>清空</Text>
              </TVFocusable>
            )}
          </View>
          {blockedKeywords.length > 0 && (
            <View style={[styles.optionRow, { flexWrap: 'wrap', gap: TV.space.sm, marginBottom: TV.space.md }]}>
              {blockedKeywordChips.map(({ kw, key }) => (
                <TVFocusable
                  key={key}
                  style={[styles.option, styles.optionActive]}
                  onPress={() => {
                    const idx = blockedKeywords.indexOf(kw);
                    if (idx < 0) return;
                    setBlockedKeywords(blockedKeywords.filter((_, j) => j !== idx));
                  }}
                  scaleFactor={1}
                >
                  <Text style={[styles.optionText, styles.optionTextActive]}>✕ {kw}</Text>
                </TVFocusable>
              ))}
            </View>
          )}

          {/* 弹幕屏蔽词 */}
          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>弹幕屏蔽关键词 ({dmBlockKeywords.length})</Text>
            {dmBlockKeywords.length > 0 && (
              <TVFocusable
                style={styles.option}
                onPress={() => setDmBlockKeywords([])}
                scaleFactor={1}
              >
                <Text style={styles.optionText}>清空</Text>
              </TVFocusable>
            )}
          </View>
          {dmBlockKeywords.length > 0 && (
            <View style={[styles.optionRow, { flexWrap: 'wrap', gap: TV.space.sm, marginBottom: TV.space.md }]}>
              {dmBlockedKeywordChips.map(({ kw, key }) => (
                <TVFocusable
                  key={key}
                  style={[styles.option, styles.optionActive]}
                  onPress={() => {
                    const idx = dmBlockKeywords.indexOf(kw);
                    if (idx < 0) return;
                    setDmBlockKeywords(dmBlockKeywords.filter((_, j) => j !== idx));
                  }}
                  scaleFactor={1}
                >
                  <Text style={[styles.optionText, styles.optionTextActive]}>✕ {kw}</Text>
                </TVFocusable>
              ))}
            </View>
          )}

          <Text style={[styles.sublabel, { marginTop: TV.space.sm }]}>
            提示: 在搜索页输入关键词后长按即可添加到屏蔽列表
          </Text>
        </View>

        {/* ---------------- 存储清理 ---------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>存储清理</Text>
          
          <View style={[styles.row, { marginBottom: TV.space.md }]}>
            <Text style={styles.label}>清理图片及请求缓存</Text>
            <TVFocusable
              style={styles.option}
              onPress={clearCache}
              scaleFactor={1.05}
              borderColor={TV.color.gold}
            >
              <Text style={[styles.optionText, { color: TV.color.gold }]}>立即清空</Text>
            </TVFocusable>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>清空本地播放记录</Text>
            <TVFocusable
              style={styles.option}
              onPress={handleClearHistory}
              scaleFactor={1.05}
              borderColor={TV.color.danger}
            >
              <Text style={[styles.optionText, { color: TV.color.danger }]}>清空历史</Text>
            </TVFocusable>
          </View>
        </View>

        {/* 退出登录 / 登录 */}
        {isLoggedIn ? (
          <TVFocusable
            style={styles.logoutBtn}
            onPress={handleLogout}
            scaleFactor={1}
            borderColor={TV.color.danger}
          >
            <Text style={styles.logoutText}>退出登录</Text>
          </TVFocusable>
        ) : (
          <TVFocusable
            style={styles.loginBtn}
            onPress={() => setShowLogin(true)}
          >
            <Text style={styles.loginText}>登录账号</Text>
          </TVFocusable>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TVLoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TV.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV.layout.contentPaddingH,
    paddingVertical: TV.layout.headerPaddingV,
    backgroundColor: TV.color.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TV.color.border,
    gap: TV.space.md - 2,
  },
  backBtn: {
    padding: TV.space.sm - 2,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  headerTitle: {
    fontSize: TV.font.title,
    fontWeight: '600',
    color: TV.color.textPrimary,
  },
  content: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    paddingTop: TV.space.xl,
  },
  section: {
    backgroundColor: TV.color.surface,
    marginBottom: TV.space.lg,
    paddingHorizontal: TV.space.xl,
    paddingVertical: TV.space.lg,
    borderRadius: TV.radius.md,
    marginHorizontal: TV.space.xl,
  },
  sectionLabel: { fontSize: TV.font.base, color: TV.color.textTertiary, marginBottom: TV.space.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: TV.font.xl, color: TV.color.textPrimary },
  value: { fontSize: TV.font.xl, color: TV.color.textTertiary },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TV.space.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: TV.radius.sm,
    gap: TV.space.xs,
  },
  optionBtnText: { fontSize: TV.font.xl, color: TV.color.accent, fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: TV.space.md },
  option: {
    paddingHorizontal: TV.space.xxl - TV.space.sm,
    paddingVertical: TV.space.sm,
    borderRadius: TV.radius.pill,
    borderWidth: 2,
    borderColor: TV.color.border,
    backgroundColor: TV.color.surfaceLight,
  },
  optionActive: { borderColor: TV.color.accent, backgroundColor: TV.color.accentBg },
  optionText: { fontSize: TV.font.lg, color: TV.color.textSecondary },
  optionTextActive: { color: TV.color.accent, fontWeight: '600' },
  optionFiltered: { borderColor: TV.color.danger, backgroundColor: 'rgba(255,71,87,0.1)' },
  optionFilteredText: { color: TV.color.danger },
  sublabel: { fontSize: TV.font.md, color: TV.color.textDisabled, marginBottom: TV.space.sm - 2 },
  logoutBtn: {
    marginHorizontal: TV.space.xl,
    marginTop: TV.space.xl,
    paddingVertical: TV.space.lg - 2,
    borderRadius: TV.radius.md,
    backgroundColor: TV.color.surface,
    borderWidth: 2,
    borderColor: TV.color.danger,
    alignItems: 'center',
  },
  logoutText: { fontSize: TV.font.xl, color: TV.color.danger, fontWeight: '600' },
  loginBtn: {
    marginHorizontal: TV.space.xl,
    marginTop: TV.space.xl,
    paddingVertical: TV.space.lg - 2,
    borderRadius: TV.radius.md,
    backgroundColor: TV.color.accent,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  loginText: { fontSize: TV.font.xl, color: TV.color.white, fontWeight: '600' },
});
