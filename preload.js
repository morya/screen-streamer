const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 屏幕捕获
  getScreens: () => ipcRenderer.invoke('get-screens'),
  
  // 音频设备
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  
  // 推流控制
  startStream: (config) => ipcRenderer.send('start-stream', config),
  stopStream: () => ipcRenderer.send('stop-stream'),
  
  // 推流状态
  getStreamStatus: () => ipcRenderer.invoke('get-stream-status'),
  
  // 配置管理
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  
  // 事件监听
  onStreamStarted: (callback) => {
    ipcRenderer.on('stream-started', () => callback());
  },
  
  onStreamEnded: (callback) => {
    ipcRenderer.on('stream-ended', (event, code) => callback(code));
  },
  
  onStreamStopped: (callback) => {
    ipcRenderer.on('stream-stopped', () => callback());
  },
  
  onStreamLog: (callback) => {
    ipcRenderer.on('stream-log', (event, data) => callback(data));
  },
  
  onStreamError: (callback) => {
    ipcRenderer.on('stream-error', (event, error) => callback(error));
  },
  
  onStreamStats: (callback) => {
    ipcRenderer.on('stream-stats', (event, stats) => callback(stats));
  },
  
  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
