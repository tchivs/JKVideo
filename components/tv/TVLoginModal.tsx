import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateQRCode, pollQRCode, getUserInfo } from '../../services/bilibili';
import { useAuthStore } from '../../store/authStore';
import { TVFocusable } from './TVFocusable';
import { TV } from '../../constants/tvTheme';
import { useTVTheme } from '../../hooks/useTVTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * TV 版登录弹窗。
 * 大屏显示二维码，用户用手机 B站 APP 扫码登录。
 * 不含保存相册、打开 bilibili 协议等手机专属功能。
 */
export function TVLoginModal({ visible, onClose }: Props) {
  const tv = useTVTheme();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrKey, setQrKey] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'waiting' | 'scanned' | 'done' | 'error'
  >('loading');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const login = useAuthStore(s => s.login);
  const setProfile = useAuthStore(s => s.setProfile);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // 生成二维码
  const fetchQR = useCallback(async () => {
    cleanup();
    setStatus('loading');
    setQrUrl(null);
    setQrKey(null);
    try {
      const data = await generateQRCode();
      setQrUrl(data.url);
      setQrKey(data.qrcode_key);
      setStatus('waiting');
    } catch {
      setStatus('error');
    }
  }, [cleanup]);

  useEffect(() => {
    if (visible) {
      fetchQR();
    } else {
      cleanup();
    }
    return cleanup;
  }, [cleanup, fetchQR, visible]);

  // 轮询扫码状态
  useEffect(() => {
    if (!qrKey || status !== 'waiting') return;
    pollRef.current = setInterval(async () => {
      try {
        const result = await pollQRCode(qrKey);
        if (result.code === 86038) {
          // 过期
          setStatus('error');
          cleanup();
        }
        if (result.code === 86090) {
          setStatus('scanned');
        }
        if (result.code === 0 && result.cookie) {
          cleanup();
          try {
            await login(result.cookie, '', '');
            const info = await getUserInfo();
            setProfile(info.face, info.uname, String(info.mid));
            setStatus('done');
            onClose();
          } catch {
            setStatus('error');
          }
        }
      } catch {
        // 网络错误，继续轮询
      }
    }, 2000);
    return cleanup;
  }, [cleanup, login, onClose, qrKey, setProfile, status]);

  return (
    <Modal
      visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
        <View style={[styles.card, { padding: tv.space.xxl, minWidth: Math.max(280, 340 * (tv.font.base / TV.font.base)) }]}>
          {/* 标题 */}
          <Text style={[styles.title, { fontSize: tv.font.xl, marginBottom: tv.space.xl }]}>扫码登录</Text>

          {/* 二维码区域 */}
          {status === 'loading' && (
              <ActivityIndicator
                size="large"
                color={TV.color.accent}
                style={[styles.loader, { marginVertical: tv.space.xl + tv.space.sm }]}
              />
            )}

          {(status === 'waiting' || status === 'scanned') && qrUrl && (
            <>
              <View style={[styles.qrContainer, { width: Math.max(180, tv.font.heading * 7), height: Math.max(180, tv.font.heading * 7), padding: tv.space.md, marginBottom: tv.space.lg }]}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=400x400`,
                  }}
                  style={styles.qr}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.hint, { fontSize: tv.font.base, marginBottom: tv.space.xl }]}>
                {status === 'scanned'
                  ? '✅ 扫描成功，请在手机上确认'
                  : '使用 哔哩哔哩 APP 扫描二维码'}
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <View style={[styles.errorBox, { marginVertical: tv.space.xl, gap: tv.space.sm }]}>
                <Ionicons name="alert-circle" size={48} color={TV.color.danger} />
                <Text style={[styles.errorText, { fontSize: tv.font.base }]}>二维码已过期</Text>
              </View>
              <TVFocusable
                style={[styles.refreshBtn, { paddingHorizontal: tv.space.xl, paddingVertical: tv.space.md - 2, marginBottom: tv.space.md }]}
                onPress={fetchQR}
                hasTVPreferredFocus
                scaleFactor={1.03}
              >
                <Text style={[styles.refreshBtnText, { fontSize: tv.font.base }]}>刷新二维码</Text>
              </TVFocusable>
            </>
          )}

          {/* 关闭按钮 */}
          <TVFocusable
            style={[styles.closeBtn, { paddingHorizontal: tv.space.lg, paddingVertical: tv.space.sm }]}
            onPress={onClose}
            scaleFactor={1}
            hasTVPreferredFocus={status === 'waiting'}
          >
            <Text style={[styles.closeBtnText, { fontSize: tv.font.base }]}>关闭</Text>
          </TVFocusable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: TV.color.surfaceAlt,
    borderRadius: TV.radius.lg,
    padding: TV.space.xxl,
    alignItems: 'center',
    minWidth: 340,
  },
  title: {
    fontSize: TV.font.xl,
    fontWeight: '700',
    color: TV.color.textPrimary,
    marginBottom: TV.space.xl,
  },
  loader: { marginVertical: 40 },
  qrContainer: {
    width: 220,
    height: 220,
    backgroundColor: TV.color.white,
    borderRadius: TV.radius.md,
    padding: TV.space.md,
    marginBottom: TV.space.lg,
  },
  qr: { width: '100%', height: '100%' },
  hint: {
    fontSize: TV.font.base,
    color: TV.color.textTertiary,
    marginBottom: TV.space.xl,
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    marginVertical: TV.space.xl,
    gap: TV.space.sm,
  },
  errorText: { fontSize: TV.font.base, color: TV.color.danger },
  refreshBtn: {
    paddingHorizontal: TV.space.xl,
    paddingVertical: TV.space.md - 2,
    backgroundColor: TV.color.accent,
    borderRadius: TV.radius.sm,
    marginBottom: TV.space.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  refreshBtnText: { fontSize: TV.font.base, color: TV.color.white, fontWeight: '600' },
  closeBtn: {
    paddingHorizontal: TV.space.lg,
    paddingVertical: TV.space.sm,
    borderRadius: TV.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  closeBtnText: { fontSize: TV.font.base, color: TV.color.textTertiary },
});
