// Screen Streamer - 渲染进程脚本

// 状态管理
let selectedScreen = null;
let isStreaming = false;
let streamStartTime = null;
let durationInterval = null;

// DOM 元素
const elements = {
  screenSelector: document.getElementById('screen-selector'),
  rtmpUrl: document.getElementById('rtmp-url'),
  resolution: document.getElementById('resolution'),
  fps: document.getElementById('fps'),
  bitrate: document.getElementById('bitrate'),
  audioBitrate: document.getElementById('audio-bitrate'),
  videoCodec: document.getElementById('video-codec'),
  audioDevice: document.getElementById('audio-device'),
  startBtn: document.getElementById('start-stream-btn'),
  stopBtn: document.getElementById('stop-stream-btn'),
  saveConfigBtn: document.getElementById('save-config-btn'),
  loadConfigBtn: document.getElementById('load-config-btn'),
  clearLogBtn: document.getElementById('clear-log-btn'),
  logContent: document.getElementById('log-content'),
  streamStatus: document.getElementById('stream-status'),
  currentBitrate: document.getElementById('current-bitrate'),
  streamDuration: document.getElementById('stream-duration'),
  statusText: document.getElementById('status-text'),
  presetBtns: document.querySelectorAll('.preset-btn')
};

// 预设配置
const presets = {
  low: { bitrate: 800, fps: 24, resolution: '640x360' },
  medium: { bitrate: 2500, fps: 30, resolution: '1280x720' },
  high: { bitrate: 5000, fps: 30, resolution: '1920x1080' },
  ultra: { bitrate: 10000, fps: 60, resolution: '1920x1080' }
};

// 初始化
async function init() {
  log('应用初始化...', 'info');
  
  // 加载屏幕列表
  await loadScreens();
  
  // 加载保存的配置
  await loadConfig();
  
  // 绑定事件
  bindEvents();
  
  // 检查 FFmpeg
  await checkFFmpeg();
  
  log('初始化完成', 'success');
}

// 加载屏幕列表
async function loadScreens() {
  try {
    elements.screenSelector.innerHTML = '<div class="loading">正在获取屏幕列表...</div>';
    
    const screens = await window.electronAPI.getScreens();
    
    if (screens.length === 0) {
      elements.screenSelector.innerHTML = `
        <div class="loading">
          未找到可用的屏幕源<br>
          <small>请确保已授予屏幕录制权限</small>
        </div>
      `;
      return;
    }
    
    elements.screenSelector.innerHTML = '';
    
    screens.forEach((screen, index) => {
      const item = document.createElement('div');
      item.className = 'screen-item';
      item.dataset.id = screen.id;
      item.innerHTML = `
        <img src="${screen.thumbnail}" alt="${screen.name}">
        <div class="name">${screen.name}</div>
      `;
      
      item.addEventListener('click', () => selectScreen(item, screen.id));
      
      elements.screenSelector.appendChild(item);
      
      // 默认选择第一个屏幕
      if (index === 0) {
        selectScreen(item, screen.id);
      }
    });
    
    log(`找到 ${screens.length} 个捕获源`, 'success');
  } catch (error) {
    log(`获取屏幕列表失败：${error.message}`, 'error');
    elements.screenSelector.innerHTML = `
      <div class="loading">
        获取屏幕列表失败<br>
        <small>${error.message}</small>
      </div>
    `;
  }
}

// 选择屏幕
function selectScreen(element, screenId) {
  // 移除其他选中状态
  document.querySelectorAll('.screen-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // 选中当前
  element.classList.add('selected');
  selectedScreen = screenId;
  
  log(`选择捕获源：${element.querySelector('.name').textContent}`, 'info');
}

// 加载配置
async function loadConfig() {
  try {
    const config = await window.electronAPI.loadConfig();
    
    if (config.rtmpUrl) elements.rtmpUrl.value = config.rtmpUrl;
    if (config.bitrate) elements.bitrate.value = config.bitrate;
    if (config.fps) elements.fps.value = config.fps;
    if (config.resolution) {
      const resValue = `${config.resolution.width}x${config.resolution.height}`;
      elements.resolution.value = resValue;
    }
    if (config.audioBitrate) elements.audioBitrate.value = config.audioBitrate;
    if (config.videoCodec) elements.videoCodec.value = config.videoCodec;
    if (config.audioDevice) elements.audioDevice.value = config.audioDevice;
    
    log('配置已加载', 'success');
  } catch (error) {
    log(`加载配置失败：${error.message}`, 'warning');
  }
}

// 保存配置
async function saveConfig() {
  try {
    const config = getCurrentConfig();
    await window.electronAPI.saveConfig(config);
    log('配置已保存', 'success');
  } catch (error) {
    log(`保存配置失败：${error.message}`, 'error');
  }
}

// 获取当前配置
function getCurrentConfig() {
  const [width, height] = elements.resolution.value.split('x').map(Number);
  
  return {
    sourceId: selectedScreen,
    rtmpUrl: elements.rtmpUrl.value.trim(),
    bitrate: parseInt(elements.bitrate.value) || 2500,
    fps: parseInt(elements.fps.value) || 30,
    resolution: { width, height },
    audioBitrate: parseInt(elements.audioBitrate.value) || 128,
    videoCodec: elements.videoCodec.value,
    audioDevice: elements.audioDevice.value
  };
}

// 检查 FFmpeg
async function checkFFmpeg() {
  // 通过尝试获取屏幕来间接检查
  try {
    await window.electronAPI.getScreens();
    log('FFmpeg 检查通过', 'success');
  } catch (error) {
    log('警告：FFmpeg 可能未安装或未找到', 'warning');
    log('请安装 FFmpeg 并添加到系统 PATH', 'warning');
  }
}

// 开始推流
async function startStreaming() {
  const config = getCurrentConfig();
  
  // 验证配置
  if (!config.rtmpUrl) {
    log('错误：请填写推流地址', 'error');
    shakeElement(elements.rtmpUrl);
    return;
  }
  
  if (!selectedScreen) {
    log('错误：请选择捕获源', 'error');
    return;
  }
  
  try {
    log('正在启动推流...', 'info');
    elements.startBtn.disabled = true;
    elements.stopBtn.disabled = false;
    elements.startBtn.classList.add('streaming');
    
    await window.electronAPI.startStream(config);
    
    isStreaming = true;
    streamStartTime = new Date();
    startDurationTimer();
    
    document.body.classList.add('streaming');
    elements.streamStatus.textContent = '🔴 推流中';
    elements.statusText.textContent = '推流中';
    
    log('推流已启动', 'success');
  } catch (error) {
    log(`启动推流失败：${error.message}`, 'error');
    resetStreamState();
  }
}

// 停止推流
async function stopStreaming() {
  try {
    log('正在停止推流...', 'info');
    await window.electronAPI.stopStream();
  } catch (error) {
    log(`停止推流失败：${error.message}`, 'error');
  }
}

// 重置推流状态
function resetStreamState() {
  isStreaming = false;
  streamStartTime = null;
  stopDurationTimer();
  
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  elements.startBtn.classList.remove('streaming');
  
  document.body.classList.remove('streaming');
  elements.streamStatus.textContent = '未推流';
  elements.statusText.textContent = '就绪';
  elements.currentBitrate.textContent = '--';
  elements.streamDuration.textContent = '00:00:00';
}

// 启动时长计时器
function startDurationTimer() {
  stopDurationTimer();
  
  durationInterval = setInterval(() => {
    if (!streamStartTime) return;
    
    const elapsed = new Date() - streamStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    elements.streamDuration.textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// 停止时长计时器
function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

// 绑定事件
function bindEvents() {
  // 开始/停止推流
  elements.startBtn.addEventListener('click', startStreaming);
  elements.stopBtn.addEventListener('click', stopStreaming);
  
  // 配置保存/加载
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  elements.loadConfigBtn.addEventListener('click', loadConfig);
  
  // 清空日志
  elements.clearLogBtn.addEventListener('click', () => {
    elements.logContent.innerHTML = '<div class="log-entry info">日志已清空</div>';
  });
  
  // 预设按钮
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = presets[btn.dataset.preset];
      if (preset) {
        applyPreset(preset);
        log(`应用预设：${btn.textContent}`, 'info');
      }
    });
  });
  
  // 编码器变更提示
  elements.videoCodec.addEventListener('change', () => {
    const codec = elements.videoCodec.value;
    const hints = {
      'libx264': '软件编码，兼容性最好，CPU 占用较高',
      'h264_nvenc': 'NVIDIA 显卡硬件编码，需要 NVIDIA GPU',
      'h264_amf': 'AMD 显卡硬件编码，需要 AMD GPU',
      'h264_qsv': 'Intel 核显硬件编码，需要 Intel CPU',
      'h264_videotoolbox': 'macOS 硬件编码，仅 macOS'
    };
    document.getElementById('codec-hint').textContent = hints[codec] || '';
  });
  
  // Electron API 事件监听
  window.electronAPI.onStreamStarted(() => {
    log('推流已开始', 'success');
  });
  
  window.electronAPI.onStreamEnded((code) => {
    log(`推流已结束 (退出码：${code})`, 'info');
    resetStreamState();
  });
  
  window.electronAPI.onStreamStopped(() => {
    log('推流已停止', 'info');
    resetStreamState();
  });
  
  window.electronAPI.onStreamLog((data) => {
    // 只显示重要的日志行
    const lines = data.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.includes('frame=') && !line.includes('fps=') && !line.includes('size=')) {
        // 跳过详细的编码统计
      } else if (line.includes('bitrate=') || line.includes('speed=')) {
        log(line.trim(), 'info');
      }
    });
  });
  
  window.electronAPI.onStreamError((error) => {
    log(`错误：${error}`, 'error');
    resetStreamState();
  });
  
  window.electronAPI.onStreamStats((stats) => {
    if (stats.bitrate) {
      elements.currentBitrate.textContent = `${stats.bitrate.toFixed(1)} Kbps`;
    }
  });
}

// 应用预设
function applyPreset(preset) {
  if (preset.bitrate) elements.bitrate.value = preset.bitrate;
  if (preset.fps) elements.fps.value = preset.fps;
  if (preset.resolution) elements.resolution.value = preset.resolution;
}

// 日志输出
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${timestamp}] ${message}`;
  
  elements.logContent.appendChild(entry);
  elements.logContent.scrollTop = elements.logContent.scrollHeight;
  
  // 限制日志条数
  const entries = elements.logContent.querySelectorAll('.log-entry');
  if (entries.length > 100) {
    entries[0].remove();
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// 元素抖动效果
function shakeElement(element) {
  element.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
}

// 添加抖动动画
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);

// 启动应用
init();
