#!/bin/bash
# FFmpeg 安装脚本

echo "🎬 FFmpeg 安装脚本"
echo "=================="

PLATFORM=$(uname -s)

case "$PLATFORM" in
  Darwin)
    echo "检测到 macOS 系统"
    if command -v brew &> /dev/null; then
      echo "正在通过 Homebrew 安装 FFmpeg..."
      brew install ffmpeg
    else
      echo "❌ 未找到 Homebrew，请先安装 Homebrew:"
      echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
    ;;
    
  Linux)
    echo "检测到 Linux 系统"
    if command -v apt &> /dev/null; then
      echo "正在通过 apt 安装 FFmpeg..."
      sudo apt update && sudo apt install -y ffmpeg
    elif command -v yum &> /dev/null; then
      echo "正在通过 yum 安装 FFmpeg..."
      sudo yum install -y ffmpeg
    elif command -v pacman &> /dev/null; then
      echo "正在通过 pacman 安装 FFmpeg..."
      sudo pacman -S --noconfirm ffmpeg
    else
      echo "❌ 未知的包管理器，请手动安装 FFmpeg"
    fi
    ;;
    
  MINGW*|MSYS*|CYGWIN*)
    echo "检测到 Windows 系统"
    echo "请手动安装 FFmpeg:"
    echo "1. 访问：https://ffmpeg.org/download.html"
    echo "2. 下载 Windows 版本"
    echo "3. 解压后将 ffmpeg.exe 添加到系统 PATH"
    ;;
    
  *)
    echo "❌ 未知系统：$PLATFORM"
    ;;
esac

echo ""
echo "安装完成后，运行以下命令验证："
echo "  ffmpeg -version"
