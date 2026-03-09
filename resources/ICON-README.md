# Windows 图标生成说明

## 当前状态
- ✅ `icon.png` (256x256) - 已创建
- ⚠️ `icon.ico` - 需要生成

## 生成 ICO 文件的方法

### 方法 1: 使用在线工具 (推荐)
1. 访问 https://www.icoconverter.com/ 或 https://iconverticons.com/online/
2. 上传 `icon.png`
3. 下载生成的 `icon.ico`
4. 将文件放到以下位置:
   - `./icon.ico` (根目录)
   - `./resources/icon.ico` (resources 目录)

### 方法 2: 使用 ImageMagick
```bash
# 安装 ImageMagick
# Windows: choco install imagemagick
# macOS: brew install imagemagick

# 转换
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### 方法 3: 使用 GIMP
1. 用 GIMP 打开 `icon.png`
2. 文件 → 导出为
3. 选择 `.ico` 格式
4. 在导出选项中勾选所有尺寸

## 为什么需要 ICO 格式？

- Windows 安装程序 (NSIS) 需要 ICO 格式的图标
- 支持多分辨率嵌入 (16x16 到 256x256)
- Windows 资源管理器显示需要

## CI/CD 注意事项

在 Drone CI 构建时，如果缺少 `icon.ico`:
- 构建会使用默认图标
- 不影响功能，只是界面不够美观
- 建议手动生成后提交到仓库
