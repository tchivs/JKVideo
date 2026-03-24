# Changelog

所有重要更新都记录在此文件中。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

## [1.0.8] — 2026-03-24

### ✨ 极乐大屏体验 (Hero & Swimlane Leanback UI)
- **史诗级架构跃迁**：彻底放弃了原本粗放枯燥的平板瀑布流布局，将首页 (`app-tv/index.tsx`) 重制为专供 Android TV 使用的十字轮播操作轨 (Leanback UI)。
- **全景视差海报墙 (Hero Backdrop)**：引入随焦点追踪反馈的底层变焦巨幕。如今当您使用实体遥控器横向游走于《热门》、《动态》和《直播》泳道时，背景墙的海报与毛玻璃级深邃遮罩将实机平滑无感切场。
- **纯粹级侧栏精简**：砍去原本生硬且独占空间宽频的侧面导航列表，以一套具有悬停态抽屉能力的半透明图标组取而代之，大幅扩容观影空间视野。
- **全域次界面暗房降噪**：重度清洗了《我的收藏》、《历史记录》、搜索及分区详情页遗存的边界白底线，扫除一切非 TV 环境下的视觉垃圾，确保纯享质感。
## [1.0.7] — 2026-03-24

### TV 版专属大系升级
本次更新史诗级重构与优化了 Android TV 端的使用体验，填补了大量内容与控制空白。

#### 系统架构与 UI 重塑
- **自研响应引擎**：移除所有 Web 混用的 `TouchableOpacity`，全量换装带 Focus 生命周期的 `<TVFocusable>`。
- **设计语言统一**：重塑 TV 独占设计系统，采用高对比黑、极光蓝 Accent，并应用全局 Skeleton 骨架屏加载，彻底告别渲染闪黑。
- **全新焦点交互**：新增“无感预演”悬停系统 (Hover Trailer Overlay)，在卡片停留超 600ms 支持浮现叠层弹幕数。

#### 核心播放体验增强
- **内置选集抽屉**：完全整合至播放器内右侧面板的倒序选集机制。
- **沉浸时间组件**：播放器顶部常驻系统时间及隐形续播进度条。
- **全栈连播流**：在底层注入 `playlistStore`。系统现已支持在分区、关注及搜索等所有原生页面继承播放顺序，完播 5 秒后自动连播下集！
- **SponsorBlock 空降**：集成开源空降联盟，精准且无感地自动跳过视频植入赞助与首尾废话。

#### 极致扩展与功能重映射
- **UP 主空间游历**：新增个人页面！从视频或播放界面即可一键切入该视频 UP主的专属视频瀑布流！并享有无限连播支持。
- **高级遥控器映射**：基于底层时序算法，**短按方向键换集**，**长按大于 600ms 直接执行点赞/取消点赞**（结合 CSRF Token 鉴权）。
- **屏蔽过滤台**：在设置中心注入违禁词及 UP主封锁系统，保护家庭观影墙。
- **满血功能版图**：加入“动态”、“收藏”、“追番（关注）”等三大原生栏目区。

---

### TV 版支持

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
