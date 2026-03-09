# Screen Streamer 📺

基于 Electron 的桌面屏幕捕获和直播推流工具。

## ✨ 功能特性

- 🖥️ **多屏幕捕获** - 支持选择任意显示器或窗口作为捕获源
- 🎬 **实时推流** - 支持 RTMP/RTMPS 协议推流到各大直播平台
- 🎨 **现代 UI** - 深色主题，直观易用的界面设计
- ⚙️ **灵活配置** - 分辨率、帧率、码率、编码器均可自定义
- 💾 **配置保存** - 支持保存和加载推流配置
- 🔴 **系统托盘** - 最小化到托盘，快速控制推流
- 📊 **实时统计** - 显示推流码率、时长等信息
- 📝 **详细日志** - 完整的推流日志便于问题排查

## 🛠️ 技术栈

- **框架**: Electron 28+
- **前端**: 原生 HTML/CSS/JavaScript
- **屏幕捕获**: Electron Desktop Capturer API
- **编码推流**: FFmpeg
- **配置存储**: electron-store

## 📦 安装

### 1. 克隆项目

```bash
cd screen-streamer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 安装 FFmpeg

推流功能需要 FFmpeg，请选择以下方式之一：

#### macOS
```bash
brew install ffmpeg
```

#### Windows
- 下载：https://ffmpeg.org/download.html
- 解压后将 `ffmpeg.exe` 添加到系统 PATH

#### Linux
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# Arch
sudo pacman -S ffmpeg
```

## 🚀 使用

### 开发模式运行

```bash
npm start
```

### 打包应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 或根据当前系统自动选择
npm run build
```

打包后的文件在 `dist/` 目录。

## 📖 使用指南

### 1. 选择捕获源
- 在左侧面板选择要捕获的屏幕或窗口
- 支持多显示器，每个显示器会显示缩略图

### 2. 配置推流参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| 推流地址 | RTMP 服务器地址 | 从直播平台获取 |
| 分辨率 | 输出视频分辨率 | 1280x720 (720p) |
| 帧率 | 每秒帧数 | 30 FPS |
| 视频码率 | 视频流码率 | 2500 Kbps |
| 音频码率 | 音频流码率 | 128 Kbps |
| 编码器 | 视频编码器 | libx264 或硬件编码 |

### 3. 快速预设

- **低带宽**: 800 Kbps, 24 FPS, 360p - 适合移动网络
- **中等**: 2500 Kbps, 30 FPS, 720p - 适合大多数场景
- **高质量**: 5000 Kbps, 30 FPS, 1080p - 适合有线网络
- **超清**: 10000 Kbps, 60 FPS, 1080p - 适合游戏直播

### 4. 开始推流

1. 填写推流地址（从直播平台获取）
2. 选择捕获源
3. 配置参数或使用预设
4. 点击"开始推流"

### 5. 常用直播平台推流地址

| 平台 | 服务器地址 | 获取方式 |
|------|-----------|---------|
| Twitch | `rtmp://live.twitch.tv/app/` | 创作者后台 |
| YouTube | `rtmp://a.rtmp.youtube.com/live2/` | YouTube Studio |
| Bilibili | `rtmp://live-rts.bilibili.com/live/` | 直播中心 |
| 抖音 | `rtmp://push.liveshows.tv/live/` | 直播伴侣 |
| 自定义 | 根据服务器配置 | - |

推流密钥从各平台获取，拼接到服务器地址后。

## 🔧 高级配置

### 硬件编码

如果电脑有独立显卡，建议使用硬件编码以降低 CPU 占用：

- **NVIDIA**: 选择 `h264_nvenc`
- **AMD**: 选择 `h264_amf`
- **Intel**: 选择 `h264_qsv`
- **macOS**: 选择 `h264_videotoolbox`

### 音频捕获

当前版本支持：
- 麦克风输入（所有平台）
- 系统音频（需要额外配置，如虚拟音频设备）

如需捕获系统音频，推荐安装：
- Windows: VB-Cable 或 VoiceMeeter
- macOS: BlackHole 或 Loopback
- Linux: PulseAudio 虚拟设备

## 📁 项目结构

```
screen-streamer/
├── package.json      # 项目配置和依赖
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本
├── index.html       # 主界面 HTML
├── styles.css       # 样式文件
├── renderer.js      # 渲染进程脚本
├── .gitignore       # Git 忽略文件
└── README.md        # 项目文档
```

## ⚠️ 注意事项

1. **权限问题**
   - macOS 需要授予屏幕录制权限（系统偏好设置 → 安全性与隐私）
   - Windows 可能需要管理员权限捕获某些窗口

2. **性能优化**
   - 高分辨率和高帧率会增加 CPU/GPU 占用
   - 建议使用硬件编码
   - 网络不稳定时降低码率

3. **推流稳定性**
   - 确保网络连接稳定
   - 使用有线网络优于 WiFi
   - 推流前测试网络上传速度

## 🐛 故障排查

### 推流失败
1. 检查 FFmpeg 是否正确安装：`ffmpeg -version`
2. 检查推流地址是否正确
3. 查看日志面板的错误信息
4. 检查网络连接

### 画面卡顿
1. 降低分辨率或帧率
2. 使用硬件编码
3. 关闭其他占用资源的程序

### 没有声音
1. 检查音频设备选择
2. 确认系统音频权限
3. 检查麦克风是否被其他程序占用

## 📝 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🖥️ 支持多屏幕捕获
- 🎬 RTMP 推流功能
- ⚙️ 可配置的编码参数
- 💾 配置保存/加载
- 🔴 系统托盘支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [FFmpeg](https://ffmpeg.org/)
- [electron-builder](https://www.electron.build/)
