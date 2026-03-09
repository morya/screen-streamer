# 🚀 GitHub Actions 快速开始指南

## ✅ 配置完成

| 项目 | 状态 |
|------|------|
| GitHub Actions 配置 | ✅ 已创建 |
| Windows 安装程序构建 | ✅ 已配置 |
| 自动 Release | ✅ 已配置 |
| 代码已推送 | ✅ 完成 |

## 📍 仓库信息

- **GitHub**: https://github.com/morya/screen-streamer
- **Actions**: https://github.com/morya/screen-streamer/actions

## 🎯 立即使用

### 方式 1: 推送触发构建

```bash
# 推送到 master 分支，自动触发构建
git commit --allow-empty -m "ci: 测试构建"
git push

# 查看构建进度
# 访问：https://github.com/morya/screen-streamer/actions
```

### 方式 2: 创建 Release

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 推送标签
git push origin --tags

# 3. 自动创建 Release
# Actions 会构建并上传安装程序到 Release
```

### 方式 3: Pull Request

```bash
# 创建 PR 会自动触发代码检查
# 验证项目结构和配置
```

## 📦 构建产物

### Artifacts (保留 30 天)

1. 访问 https://github.com/morya/screen-streamer/actions
2. 点击对应的构建
3. 在页面底部下载 Artifacts

### Releases (永久)

1. 访问 https://github.com/morya/screen-streamer/releases
2. 下载最新版本
3. 验证 SHA256 校验和

## 🔧 触发条件

| 操作 | 触发 | 产物 |
|------|------|------|
| Push to `master` | ✅ 完整构建 | Artifacts |
| Push to `develop` | ✅ 便携版 | Artifacts |
| Push tag `v*` | ✅ 完整构建 + Release | Release |
| Pull Request | ✅ 代码检查 | 无 |

## 📊 构建配置

### Runner

- **系统**: Windows Server 2022 (windows-latest)
- **Node.js**: 20.x
- **磁盘**: 14GB 可用

### 预计时间

| 步骤 | 时间 |
|------|------|
| 安装依赖 | 1-2 分钟 |
| 下载 FFmpeg | 1-2 分钟 |
| 构建安装程序 | 3-5 分钟 |
| **总计** | **5-10 分钟** |

## 🔐 Secrets 配置（可选）

如需代码签名，在 GitHub 配置 Secrets：

1. 访问 https://github.com/morya/screen-streamer/settings/secrets/actions
2. 添加以下 Secrets:

| Name | Value |
|------|-------|
| `CSC_LINK` | 证书文件 (base64) |
| `CSC_KEY_PASSWORD` | 证书密码 |

## 📝 常用命令

```bash
# 查看构建状态
gh run list --repo morya/screen-streamer

# 查看特定构建日志
gh run view <run-id> --repo morya/screen-streamer

# 下载最新 Release
gh release download --repo morya/screen-streamer

# 创建新版本
gh release create v1.0.0 --repo morya/screen-streamer
```

## 🐛 故障排查

### 构建失败

1. 访问 Actions 查看日志
2. 检查错误信息
3. 常见问题:
   - 依赖安装失败 → 检查 package.json
   - FFmpeg 下载失败 → 网络问题
   - 构建超时 → 联系 GitHub Support

### 无法下载产物

- Artifacts 过期 → 查看 Releases
- 权限不足 → 需要仓库访问权限

## 📖 详细文档

- `.github/workflows/build.yml` - Actions 配置文件
- `.github/GITHUB-ACTIONS.md` - 完整 CI/CD 文档
- `README.md` - 项目说明

## 🎉 下一步

1. ✅ 访问 Actions 查看构建状态
2. ✅ 测试推送触发构建
3. ✅ 创建第一个 Release
4. ✅ 下载并测试安装程序

---

**有任何问题，随时询问！** 🚀
