# 🚀 Drone CI 配置完成

## ✅ 已完成

| 项目 | 状态 |
|------|------|
| `.drone.yml` 配置文件 | ✅ 已创建 |
| Windows NSIS 安装程序配置 | ✅ 已配置 |
| FFmpeg 自动下载 | ✅ 已配置 |
| SHA256 校验和生成 | ✅ 已配置 |
| 多分支构建策略 | ✅ 已配置 |
| CI/CD 文档 | ✅ 已创建 |
| 代码已推送到仓库 | ✅ 完成 |

## 📋 下一步：Drone 授权

### 1️⃣ 登录 Gitea
```
URL: https://git.gouboyun.tv
仓库：live/screen-streamer
```

### 2️⃣ 启用 Drone CI

**方式 A: 通过 Gitea 界面**
1. 进入仓库 `live/screen-streamer`
2. 点击 **Settings** → **Webhooks**
3. 确认 Drone webhook 已添加（通常自动添加）

**方式 B: 通过 Drone 界面**
1. 登录 Drone CI: `https://drone.git.gouboyun.tv` (或你的 Drone 地址)
2. 点击右上角 **Repositories**
3. 找到 `live/screen-streamer`
4. 点击 **Activate** 启用

### 3️⃣ 配置 Drone Runner

确保你的 Drone Runner 配置：

```yaml
# .drone.yml 中的配置
kind: pipeline
type: exec  # 使用 exec runner
name: build-windows-installer

platform:
  os: windows  # Windows 系统
  arch: amd64
```

**Runner 要求：**
- ✅ Windows 10/11 或 Windows Server
- ✅ Node.js 20+ 已安装
- ✅ Git 已安装
- ✅ 足够的磁盘空间 (~500MB)

### 4️⃣ 验证配置

推送后，Drone 应该自动触发构建：

```bash
# 触发构建
git commit --allow-empty -m "ci: 测试构建"
git push
```

访问 Drone 界面查看构建状态。

## 📦 构建产物

构建成功后，产物位置：

```
dist/
└── Screen Streamer-1.0.0-win-x64.exe    # Windows 安装程序
└── Screen Streamer-1.0.0-win-x64.exe.sha256  # 校验和
```

## 🔧 可选配置

### 环境变量（在 Drone 仓库设置中配置）

| 变量 | 说明 | 示例 |
|------|------|------|
| `CSC_LINK` | 代码签名证书路径 | `C:\certs\sign.p12` |
| `CSC_KEY_PASSWORD` | 证书密码 | `your-password` |

### 构建触发

| 事件 | 分支 | 动作 |
|------|------|------|
| Push | `master` / `main` | 完整构建 + 安装程序 |
| Push | `develop` | 便携版构建 |
| Tag | 任意 | 完整构建（发布版本） |
| PR | 任意 | 测试 + 验证 |

## 📖 文档

- `CI-README.md` - 详细 CI/CD 配置文档
- `.drone.yml` - Drone 配置文件
- `resources/ICON-README.md` - 图标生成说明

## ⚠️ 注意事项

1. **图标文件**: 当前使用 PNG，建议生成 ICO 格式用于 Windows 安装程序
2. **FFmpeg**: CI 会自动下载，如需自定义版本可手动上传到 `resources/`
3. **代码签名**: 如需签名，在 Drone 仓库设置中添加加密变量

## 🎯 快速测试

```bash
# 1. 创建测试标签
git tag v1.0.0-test
git push origin v1.0.0-test

# 2. 查看 Drone 构建
# 访问 Drone UI 查看构建进度

# 3. 下载产物
# 构建完成后在 Drone UI 下载或使用 SCP
```

---

**配置完成后，请告诉我，我可以帮你验证配置或进行其他调整！** 🚀
