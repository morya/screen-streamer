const { app, BrowserWindow, desktopCapturer, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let ffmpegProcess = null;
let tray = null;
let isStreaming = false;

// 启用 GPU 硬件加速
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    x: Math.floor((width - Math.min(1200, width)) / 2),
    y: Math.floor((height - Math.min(800, height)) / 2),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    icon: path.join(__dirname, 'icon.png'),
    frame: true,
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('index.html');
  
  // 开发模式打开 DevTools
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopStreaming();
  });

  // 创建系统托盘
  createTray();
}

function createTray() {
  // 托盘图标（暂时用文字，实际项目需要图标文件）
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow.show() },
    { label: '开始推流', click: () => startStreamingFromTray() },
    { label: '停止推流', click: () => stopStreamingFromTray() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Screen Streamer - 桌面推流工具');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 获取可用屏幕源
ipcMain.handle('get-screens', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 }
    });
    
    return sources.map(s => ({
      id: s.id,
      name: s.name,
      display_id: s.display_id,
      thumbnail: s.thumbnail.toDataURL('image/jpeg', 0.8)
    }));
  } catch (error) {
    console.error('获取屏幕源失败:', error);
    return [];
  }
});

// 获取音频设备
ipcMain.handle('get-audio-devices', async () => {
  // 注意：Electron 本身不直接提供音频设备列表
  // 这里返回默认配置，实际需要通过其他方式获取
  return [
    { deviceId: 'default', label: '默认麦克风' },
    { deviceId: 'system', label: '系统音频 (需要额外配置)' }
  ];
});

// 开始推流
ipcMain.on('start-stream', async (event, config) => {
  console.log('开始推流配置:', config);
  await startStreaming(config);
});

// 停止推流
ipcMain.on('stop-stream', () => {
  stopStreaming();
});

// 获取推流状态
ipcMain.handle('get-stream-status', () => {
  return {
    isStreaming,
    pid: ffmpegProcess ? ffmpegProcess.pid : null
  };
});

// 保存配置
ipcMain.on('save-config', (event, config) => {
  store.set('streamConfig', config);
});

// 加载配置
ipcMain.handle('load-config', () => {
  return store.get('streamConfig', {
    rtmpUrl: '',
    bitrate: 2500,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    audioDevice: 'default',
    videoCodec: 'libx264',
    audioBitrate: 128
  });
});

async function startStreaming(config) {
  if (isStreaming) {
    console.log('已经在推流中');
    return;
  }

  const {
    sourceId,
    rtmpUrl,
    bitrate,
    fps,
    resolution,
    audioDevice,
    videoCodec,
    audioBitrate
  } = config;

  if (!rtmpUrl) {
    mainWindow.webContents.send('stream-error', 'RTMP 地址不能为空');
    return;
  }

  // 构建 FFmpeg 命令
  let ffmpegArgs = [];

  // 根据平台选择屏幕捕获方式
  const platform = process.platform;
  
  if (platform === 'win32') {
    // Windows - 使用 gdigrab 或 dshow
    ffmpegArgs = [
      '-f', 'gdigrab',
      '-framerate', String(fps),
      '-video_size', `${resolution.width}x${resolution.height}`,
      '-i', 'desktop',
    ];
  } else if (platform === 'darwin') {
    // macOS - 使用 avfoundation
    ffmpegArgs = [
      '-f', 'avfoundation',
      '-framerate', String(fps),
      '-i', `${sourceId || '0'}:none`,
    ];
  } else {
    // Linux - 使用 x11grab
    ffmpegArgs = [
      '-f', 'x11grab',
      '-framerate', String(fps),
      '-video_size', `${resolution.width}x${resolution.height}`,
      '-i', ':0.0',
    ];
  }

  // 音频输入（如果配置了）
  if (audioDevice && audioDevice !== 'none') {
    if (platform === 'win32') {
      ffmpegArgs.push(
        '-f', 'dshow',
        '-i', `audio=${audioDevice}`
      );
    } else if (platform === 'darwin') {
      ffmpegArgs.push(
        '-f', 'avfoundation',
        '-i', `:${audioDevice}`
      );
    } else {
      ffmpegArgs.push(
        '-f', 'pulse',
        '-i', 'default'
      );
    }
  }

  // 视频编码参数
  ffmpegArgs.push(
    '-c:v', videoCodec || 'libx264',
    '-preset', 'ultrafast',
    '-b:v', `${bitrate}k`,
    '-maxrate', `${Math.floor(bitrate * 1.2)}k`,
    '-bufsize', `${bitrate * 2}k`,
    '-g', String(fps * 2),
    '-keyint_min', String(fps)
  );

  // 音频编码参数
  if (audioDevice && audioDevice !== 'none') {
    ffmpegArgs.push(
      '-c:a', 'aac',
      '-b:a', `${audioBitrate}k`,
      '-ar', '44100',
      '-ac', '2'
    );
  }

  // 输出参数
  ffmpegArgs.push(
    '-pix_fmt', 'yuv420p',
    '-f', 'flv',
    rtmpUrl
  );

  console.log('FFmpeg 参数:', ffmpegArgs.join(' '));

  try {
    // 查找 FFmpeg
    const ffmpegPath = findFFmpeg();
    
    if (!ffmpegPath) {
      mainWindow.webContents.send('stream-error', '未找到 FFmpeg，请安装 FFmpeg 或将其添加到系统 PATH');
      return;
    }

    ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    isStreaming = true;

    // 处理 FFmpeg 输出
    ffmpegProcess.stderr.on('data', (data) => {
      const log = data.toString();
      mainWindow.webContents.send('stream-log', log);
      
      // 解析推流状态
      if (log.includes('bitrate=')) {
        const match = log.match(/bitrate=\s*(\d+\.?\d*)kbits\/s/);
        if (match) {
          mainWindow.webContents.send('stream-stats', {
            bitrate: parseFloat(match[1])
          });
        }
      }
    });

    ffmpegProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('stream-log', data.toString());
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg 进程退出，代码：${code}`);
      isStreaming = false;
      ffmpegProcess = null;
      mainWindow.webContents.send('stream-ended', code);
      
      if (tray) {
        tray.setTitle('');
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg 进程错误:', err);
      isStreaming = false;
      mainWindow.webContents.send('stream-error', `FFmpeg 错误：${err.message}`);
    });

    // 通知前端推流已开始
    mainWindow.webContents.send('stream-started');
    
    // 更新托盘
    if (tray) {
      tray.setTitle('🔴 LIVE');
    }

  } catch (error) {
    console.error('启动推流失败:', error);
    isStreaming = false;
    mainWindow.webContents.send('stream-error', error.message);
  }
}

function stopStreaming() {
  if (ffmpegProcess) {
    // 优雅地停止 FFmpeg
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', ffmpegProcess.pid, '/f', '/t']);
    } else {
      ffmpegProcess.kill('SIGINT');
    }
    ffmpegProcess = null;
  }
  isStreaming = false;
  
  if (tray) {
    tray.setTitle('');
  }
}

function startStreamingFromTray() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

function stopStreamingFromTray() {
  stopStreaming();
  if (mainWindow) {
    mainWindow.webContents.send('stream-stopped');
  }
}

function findFFmpeg() {
  // 尝试在多个位置查找 FFmpeg
  const paths = [
    'ffmpeg',
    path.join(process.cwd(), 'resources', 'ffmpeg'),
    path.join(__dirname, 'resources', 'ffmpeg'),
    path.join(__dirname, 'resources', 'ffmpeg.exe'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg'
  ];

  for (const p of paths) {
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync(p, ['-version'], { timeout: 2000 });
      if (result.status === 0) {
        console.log('找到 FFmpeg:', p);
        return p;
      }
    } catch (e) {
      // 继续尝试下一个路径
    }
  }
  
  return null;
}

// 应用生命周期
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopStreaming();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopStreaming();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});
