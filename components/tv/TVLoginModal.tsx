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
  }, [visible]);

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
  }, [qrKey, status]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* 标题 */}
          <Text style={styles.title}>扫码登录</Text>

          {/* 二维码区域 */}
          {status === 'loading' && (
            <ActivityIndicator
              size="large"
              color="#00AEEC"
              style={styles.loader}
            />
          )}

          {(status === 'waiting' || status === 'scanned') && qrUrl && (
            <>
              <View style={styles.qrContainer}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=400x400`,
                  }}
                  style={styles.qr}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.hint}>
                {status === 'scanned'
                  ? '✅ 扫描成功，请在手机上确认'
                  : '使用 哔哩哔哩 APP 扫描二维码'}
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={48} color="#ff4757" />
                <Text style={styles.errorText}>二维码已过期</Text>
              </View>
              <TVFocusable
                style={styles.refreshBtn}
                onPress={fetchQR}
                hasTVPreferredFocus
                scaleFactor={1.03}
              >
                <Text style={styles.refreshBtnText}>刷新二维码</Text>
              </TVFocusable>
            </>
          )}

          {/* 关闭按钮 */}
          <TVFocusable
            style={styles.closeBtn}
            onPress={onClose}
            scaleFactor={1}
            hasTVPreferredFocus={status === 'waiting'}
          >
            <Text style={styles.closeBtnText}>关闭</Text>
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
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: 24,
  },
  loader: { marginVertical: 40 },
  qrContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  qr: { width: '100%', height: '100%' },
  hint: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    marginVertical: 24,
    gap: 8,
  },
  errorText: { fontSize: 15, color: '#ff4757' },
  refreshBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#00AEEC',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  refreshBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  closeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  closeBtnText: { fontSize: 14, color: '#888' },
});
