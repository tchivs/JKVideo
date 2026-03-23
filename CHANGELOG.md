# Changelog

所有重要更新都记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [1.1.0] — 2026-03-24

### TV 版 UX 大版本升级

#### 弹幕系统增强
- 弹幕高级配置面板：透明度 / 字号 / 显示区域 / 屏蔽类型（滚动/顶部/底部）
- 弹幕开关现全屏 & 非全屏均可用
- DanmakuOverlay 新增 `opacity` / `fontScale` / `areaRatio` / `filterModes` props

#### 全局设置持久化
- 弹幕配置全局持久化（settingsStore → AsyncStorage `TV_SETTINGS`）
- 默认播放清晰度全局设置（360P ~ 1080P60）
- 播放器内修改 ↔ 设置页双向同步

#### 无障碍 & 可访问性
- TVFocusable 默认 `accessibilityRole="button"` + `accessibilityLabel` prop
- 所有返回/搜索/清空/播放/删除按钮添加 accessibilityLabel
- 聚焦状态改用 Animated.timing 平滑 150ms 过渡

#### 性能优化
- 所有 FlatList 添加 `windowSize` / `maxToRenderPerBatch` / `removeClippedSubviews`
- 图片添加 `fadeDuration` 平滑加载
- TVVideoCard / TVLiveCard 统一使用 tvTheme 设计令牌

#### 健壮性
- 排行榜加载失败显示错误状态 + "重试"按钮
- historyStore 所有 AsyncStorage 写入/删除 try/catch 防崩溃
- 搜索按钮加载中禁用防双击
- 清空历史/搜索历史增加 Alert 确认
- BackHandler 双击退出仅在首页生效

#### 设计规范
- 新增 `constants/tvTheme.ts` 集中管理设计令牌（颜色/间距/圆角/字号）
- TVVideoCard / TVLiveCard 全面迁移至 tvTheme tokens

---

## [1.0.0] — 2026-03-20

### 首个正式版本

#### 视频播放
- DASH 完整播放：Bilibili DASH 接口 → `buildDashMpdUri()` 生成本地 MPD → ExoPlayer 原生解码
- 支持多清晰度切换（360P / 480P / 720P / 1080P / 1080P+ / 4K）
- BigVideoCard 首页内联 DASH 静音自动播放，支持水平手势快进、进度条/缓冲条
- 全局迷你播放器（MiniPlayer），切换页面后底部浮层续播
- WebView 降级方案（NativeVideoPlayer），兼容 Expo Go 环境

#### 直播
- 直播 Tab 顶部显示关注主播在线状态
- 双列直播卡片网格 + 横向分区筛选
- 热门列表中穿插直播推荐卡片
- LivePlayer 支持 HLS 多画质切换
- 直播弹幕 WebSocket 实时接收，舰长标记 + 礼物计数

#### 弹幕系统
- 视频弹幕：XML 全量拉取 + 时间轴同步 drip 渲染
- DanmakuOverlay 飘屏覆盖层（5 车道滚动）
- DanmakuList 支持实时直播模式（保留最近 500 条）

#### 搜索 & 内容
- 视频关键词搜索 + 分页加载
- 视频详情：简介 / 评论 / 弹幕 三 Tab
- 推荐视频流（无限滚动）
- 评论列表（热评 / 最新排序切换）

#### 账号 & 设置
- 扫码登录（二维码 + 2s 轮询 + SESSDATA 自动提取）
- 登录态持久化（AsyncStorage）
- 封面图清晰度设置（高清 / 普通，节省流量）

#### 下载 & 分享
- 多清晰度视频后台下载
- 下载管理页（播放、删除已下载视频）
- 局域网 HTTP 服务器，生成 QR 码分享，同 Wi-Fi 设备扫码直接播放

#### 跨平台
- Android、iOS、Web 三端支持
- Expo Go 扫码快速运行（UI 预览模式）
- Dev Build 完整功能（DASH 原生播放）
