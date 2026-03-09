# GitHub Actions CI/CD 配置文档

## 📋 概述

本项目使用 **GitHub Actions** 进行自动化构建，生成 Windows 安装程序。

## 🏗️ 架构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   GitHub    │ ──→ │   Actions    │ ──→ │  Windows Build  │
│  代码推送    │     │  触发构建     │     │  生成 installer  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           ↓
                    ┌──────────────┐
                    │  Upload to   │
                    │  Release     │
                    └──────────────┘
```

## 📁 配置文件

| 文件 | 说明 |
|------|------|
| `.github/workflows/build.yml` | GitHub Actions 配置 |
| `package.json` | 构建脚本和 electron-builder 配置 |
| `resources/` | 构建资源 (图标、FFmpeg 等) |

## 🚀 触发条件

| 事件 | 分支/标签 | 触发的 Job | 产物 |
|------|-----------|-----------|------|
| Push | `master` / `main` | `build-windows` | 安装程序 + 校验和 |
| Push | `develop` | `build-portable` | 便携版 |
| Tag | `v*` (如 v1.0.0) | `build-windows` + Release | GitHub Release |
| Pull Request | `master` / `main` | `lint-and-test` | 代码检查 |

## 📦 构建产物

### 安装程序 (master/main 分支)

位置：`dist/` 目录

| 文件 | 说明 |
|------|------|
| `Screen Streamer-1.0.0-win-x64.exe` | NSIS 安装程序 (~50-80MB) |
| `Screen Streamer-1.0.0-win-x64.exe.sha256` | SHA256 校验和 |

### 便携版 (develop 分支)

| 文件 | 说明 |
|------|------|
| `dist/` 目录 | 未打包的应用程序 |

### GitHub Release (Tag 推送)

推送 `v*` 标签时自动创建 Release，包含：
- 安装程序 (.exe)
- 校验和文件 (.sha256)
- 自动生成发布说明

## 🔧 配置选项

### 环境变量

在 `.github/workflows/build.yml` 中配置：

```yaml
env:
  NODE_VERSION: '20'        # Node.js 版本
  APP_NAME: Screen Streamer # 应用名称
```

### 代码签名（可选）

如需代码签名，在 GitHub Secrets 中添加：

| Secret | 说明 | 示例 |
|--------|------|------|
| `CSC_LINK` | 证书文件（base64） | `MII...` |
| `CSC_KEY_PASSWORD` | 证书密码 | `your-password` |

然后在 `build.yml` 中添加：

```yaml
- name: Build Windows Installer
  run: npm run build:win
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
```

### 自定义 FFmpeg 版本

默认下载最新版，如需指定版本：

```yaml
- name: Download FFmpeg
  run: |
    Invoke-WebRequest -Uri "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-4.4.zip" -OutFile "ffmpeg.zip"
    # ...
```

## 📊 构建流程

### 1. 安装程序构建流程

```
Checkout code
    ↓
Setup Node.js 20
    ↓
Cache node_modules (加速构建)
    ↓
Install dependencies (npm ci)
    ↓
Download FFmpeg (Windows 版)
    ↓
Verify FFmpeg
    ↓
Build with electron-builder
    ↓
Generate SHA256 checksums
    ↓
Upload to Artifacts
    ↓
(如果是 Tag) → Create GitHub Release
```

### 2. 便携版构建流程

```
Checkout code
    ↓
Setup Node.js
    ↓
Install dependencies
    ↓
Download FFmpeg
    ↓
Build with --dir flag
    ↓
Upload portable artifact
```

### 3. 代码检查流程 (PR)

```
Checkout code
    ↓
Setup Node.js
    ↓
Install dependencies
    ↓
Verify project structure
    ↓
Validate package.json
```

## 📥 下载构建产物

### 方式 1: GitHub Actions Artifacts

1. 访问 https://github.com/morya/screen-streamer/actions
2. 点击对应的构建
3. 在 "Artifacts" 部分下载

**注意**: Artifacts 保留 30 天

### 方式 2: GitHub Releases (推荐)

1. 访问 https://github.com/morya/screen-streamer/releases
2. 下载最新版本的安装程序
3. 验证 SHA256 校验和

### 方式 3: 命令行下载

```bash
# 使用 gh CLI
gh release download v1.0.0 --repo morya/screen-streamer

# 验证校验和
certutil -hashfile "Screen Streamer-1.0.0-win-x64.exe" SHA256
```

## 🏷️ 发布流程

### 创建新版本

```bash
# 1. 更新版本号 (package.json)
npm version patch  # 1.0.0 → 1.0.1
# 或
npm version minor  # 1.0.0 → 1.1.0
# 或
npm version major  # 1.0.0 → 2.0.0

# 2. 推送标签
git push origin --tags

# 3. 等待构建完成
# 访问 Actions 查看进度
```

### 自动 Release

推送 `v*` 标签后，Actions 会：
1. ✅ 构建安装程序
2. ✅ 生成校验和
3. ✅ 创建 GitHub Release
4. ✅ 上传所有文件

## 🐛 故障排查

### 构建失败

1. **检查日志**: Actions → 构建 → 查看日志
2. **常见问题**:
   - Node.js 版本不匹配 → 检查 `NODE_VERSION`
   - FFmpeg 下载失败 → 检查网络或手动上传
   - 磁盘空间不足 → Windows Runner 有 14GB 可用

### 产物下载失败

- Artifacts 过期 (30 天) → 使用 Releases
- 文件损坏 → 验证 SHA256 校验和

### 构建时间过长

优化建议：
1. 启用 `actions/cache` 缓存 node_modules
2. 使用 `npm ci` 代替 `npm install`
3. 减少 FFmpeg 下载频率（缓存）

## 📈 构建统计

| 指标 | 预期值 |
|------|--------|
| 构建时间 | 5-10 分钟 |
| 安装程序大小 | 50-80 MB |
| Artifacts 保留 | 30 天 |
| Runner | GitHub-hosted (windows-latest) |

## 🔐 安全建议

1. **不要提交敏感信息**: 证书、密码等使用 GitHub Secrets
2. **限制 Actions 权限**: 在仓库设置中配置 Actions 权限
3. **依赖审计**: 定期运行 `npm audit`
4. **验证下载**: 始终验证 SHA256 校验和

## 📞 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [electron-builder 文档](https://www.electron.build/)
- [FFmpeg 下载](https://www.gyan.dev/ffmpeg/builds/)
- [NSIS 文档](https://nsis.sourceforge.io/)
