# CI/CD 配置文档

## 📋 概述

本项目使用 **Gitea + Drone CI** 进行自动化构建，生成 Windows 安装程序。

## 🏗️ 架构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Gitea     │ ──→ │   Drone CI   │ ──→ │  Windows Build  │
│  代码仓库    │     │  触发构建     │     │  生成 installer  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

## 📁 配置文件

| 文件 | 说明 |
|------|------|
| `.drone.yml` | Drone CI 配置 |
| `package.json` | 构建脚本和 electron-builder 配置 |
| `resources/` | 构建资源 (图标、FFmpeg 等) |

## 🚀 构建流程

### 1. 触发条件

| 事件 | 分支 | 触发的 Pipeline |
|------|------|----------------|
| Push | `master` / `main` | `build-windows-installer` |
| Push | `develop` | `build-windows-portable` |
| Tag | 任意 | `build-windows-installer` |
| Pull Request | 任意 | `test-and-lint` |

### 2. 构建步骤

```
1. 检查环境 (Node.js, npm, git)
       ↓
2. 安装依赖 (npm ci)
       ↓
3. 下载 FFmpeg (Windows 版本)
       ↓
4. 构建安装程序 (electron-builder)
       ↓
5. 验证输出 (检查 .exe 文件)
       ↓
6. 生成校验和 (SHA256)
       ↓
7. 发布产物
```

### 3. 构建产物

位置：`dist/` 目录

| 文件 | 说明 |
|------|------|
| `Screen Streamer-1.0.0-win-x64.exe` | NSIS 安装程序 |
| `Screen Streamer-1.0.0-win-x64.exe.sha256` | SHA256 校验和 |

## ⚙️ Drone 配置

### 在 Gitea 中启用 Drone

1. 登录 Gitea 管理后台
2. 进入 `live/screen-streamer` 仓库
3. 点击 **Settings** → **Webhooks**
4. 添加 Drone webhook (如果未自动配置)

### 在 Drone 中启用仓库

1. 登录 Drone CI 管理界面
2. 点击 **Activate Repository**
3. 找到 `live/screen-streamer`
4. 点击启用

### 配置 Drone Runner

确保 Drone Runner 配置支持 Windows 构建：

```yaml
# drone-runner-exec 配置示例
platform:
  os: windows
  arch: amd64

capabilities:
  - exec
```

## 🔧 自定义配置

### 修改版本号

编辑 `package.json`:
```json
{
  "version": "1.0.1"  // 修改这里
}
```

### 添加代码签名

在 `.drone.yml` 中添加:
```yaml
environment:
  CSC_LINK: "path/to/certificate.p12"
  CSC_KEY_PASSWORD: "${CERTIFICATE_PASSWORD}"
```

在 Drone 仓库设置中添加 `CERTIFICATE_PASSWORD` 加密变量。

### 更改构建目标

编辑 `package.json` 的 `build.win.target`:
```json
"win": {
  "target": [
    {"target": "nsis", "arch": ["x64"]},
    {"target": "portable", "arch": ["x64"]}
  ]
}
```

## 📊 构建产物下载

### 方式 1: Drone UI
1. 访问 Drone CI 界面
2. 找到对应的构建
3. 下载 `dist/` 目录产物

### 方式 2: Gitea Releases
配置自动创建 Release (需要额外脚本):
```yaml
steps:
  - name: create-release
    image: plugins/github-release
    settings:
      api_key: ${GITEA_TOKEN}
      files: dist/*.exe
```

### 方式 3: SSH/SCP
如果 Runner 是远程服务器:
```bash
scp user@runner:/path/to/screen-streamer/dist/*.exe ./downloads/
```

## 🐛 故障排查

### 构建失败

1. **检查日志**: Drone UI → Build → Log
2. **常见问题**:
   - 依赖安装失败 → 检查网络连接
   - FFmpeg 下载失败 → 检查 URL 或手动上传
   - 构建超时 → 增加 Drone 超时设置

### 安装程序无法运行

1. 检查 FFmpeg 是否正确打包
2. 验证图标文件是否存在
3. 查看 NSIS 日志

### 签名问题

如果启用了代码签名但失败:
- 检查证书是否有效
- 验证 `CSC_LINK` 和 `CSC_KEY_PASSWORD`
- 确认证书受信任

## 📈 优化建议

1. **缓存依赖**: 配置 Drone 缓存 `node_modules/`
2. **并行构建**: 同时构建多个平台
3. **增量构建**: 只构建变更的文件
4. **产物清理**: 定期清理旧的构建产物

## 🔐 安全建议

1. **不要提交敏感信息**: 证书、密码等使用 Drone 加密变量
2. **限制访问**: 只有授权人员能触发构建
3. **验证产物**: 使用 SHA256 校验和验证完整性
4. **定期更新**: 保持 Node.js 和依赖更新

## 📞 联系

如有问题，请联系开发团队或查看:
- [Drone CI 文档](https://docs.drone.io/)
- [electron-builder 文档](https://www.electron.build/)
- [Gitea 文档](https://docs.gitea.io/)
