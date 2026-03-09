# AGENTS.md - Screen Streamer Development Guide

This document provides guidelines for AI agents working on the Screen Streamer project - an Electron-based desktop screen capture and live streaming tool.

## Project Overview

Screen Streamer is a desktop application built with Electron that captures screen content and streams it via RTMP/RTMPS to various streaming platforms. The project uses native HTML/CSS/JavaScript with FFmpeg for video encoding.

## Build Commands

### Development
```bash
npm start          # Start the Electron app in development mode
```

### Build Commands
```bash
npm run build      # Build for current platform
npm run build:win  # Build Windows installer
npm run build:mac  # Build macOS app
npm run build:linux # Build Linux app
```

### CI/CD Commands
The project uses GitHub Actions and Drone CI. Key validation commands:
```bash
# Verify project structure (used in CI)
# Checks for required files: main.js, preload.js, index.html, package.json, .drone.yml

# Validate package.json
node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).name)"

# Verify FFmpeg availability
ffmpeg -version
```

## Code Style Guidelines

### File Structure
```
screen-streamer/
├── main.js          # Electron main process (Node.js)
├── preload.js       # Preload script (context bridge)
├── renderer.js      # Renderer process (browser JavaScript)
├── index.html       # Main window HTML
├── styles.css       # CSS styles
└── package.json     # Project configuration
```

### JavaScript Conventions

#### Main Process (main.js)
- Use CommonJS `require()` for imports
- Follow Electron's IPC pattern: `ipcMain.handle()` for async operations, `ipcMain.on()` for events
- Error handling: Always wrap FFmpeg/spawn operations in try-catch
- Use `console.log()` for debugging, but remove before production builds
- Store configuration using `electron-store`

Example pattern:
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();

ipcMain.handle('get-screens', async () => {
  try {
    // Implementation
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
});
```

#### Preload Script (preload.js)
- Use `contextBridge.exposeInMainWorld()` to expose safe APIs
- Follow naming convention: `electronAPI` as the exposed object
- Include both sync and async methods with clear naming
- Provide event listeners with cleanup methods

Example:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Async operations
  getScreens: () => ipcRenderer.invoke('get-screens'),
  
  // Event-based operations
  onStreamStarted: (callback) => {
    ipcRenderer.on('stream-started', () => callback());
  },
  
  // Cleanup
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
```

#### Renderer Process (renderer.js)
- Use ES6+ features (async/await, arrow functions, template literals)
- Organize code with clear sections: state, DOM elements, functions
- Use descriptive variable names in Chinese/English mix (as seen in codebase)
- Handle errors with user-friendly messages

Example structure:
```javascript
// State management
let selectedScreen = null;
let isStreaming = false;

// DOM elements
const elements = {
  screenSelector: document.getElementById('screen-selector'),
  startBtn: document.getElementById('start-stream-btn')
};

// Functions
async function init() {
  try {
    await loadScreens();
    await loadConfig();
    bindEvents();
  } catch (error) {
    log(`初始化失败：${error.message}`, 'error');
  }
}

// Event binding
function bindEvents() {
  elements.startBtn.addEventListener('click', startStreaming);
}
```

### Naming Conventions
- **Variables**: camelCase, descriptive names (e.g., `selectedScreen`, `isStreaming`)
- **Functions**: camelCase, verb-noun pattern (e.g., `startStreaming`, `loadConfig`)
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for configuration objects
- **DOM IDs**: kebab-case (e.g., `start-stream-btn`, `rtmp-url`)
- **CSS Classes**: kebab-case (e.g., `streaming`, `log-entry`)

### Error Handling
1. **Main Process**: Use try-catch for all async operations, send errors to renderer via IPC
2. **Renderer**: Catch errors from main process, display user-friendly messages
3. **FFmpeg**: Monitor stderr output, parse error messages, provide actionable feedback
4. **Logging**: Use the `log()` function with severity levels ('info', 'success', 'error', 'warning')

### Import/Export Patterns
- **Main Process**: CommonJS `require()` only
- **Preload**: CommonJS `require()` only  
- **Renderer**: No imports (all code in single file)
- **No ES6 modules** - this is a simple Electron app without bundlers

### FFmpeg Integration
- FFmpeg commands are constructed as arrays of arguments
- Platform-specific audio capture:
  - Windows: `dshow`
  - macOS: `avfoundation` 
  - Linux: `pulse`
- Hardware encoding support: `h264_nvenc`, `h264_amf`, `h264_qsv`, `h264_videotoolbox`
- Error parsing from stderr output for bitrate monitoring

### UI/UX Patterns
- Dark theme with blue accent color (#3a86ff)
- Real-time status indicators (streaming duration, bitrate)
- Preset configurations for common streaming scenarios
- Comprehensive logging panel
- System tray integration for background operation

## Testing Guidelines

### Current State
- No formal test framework configured
- CI validates project structure and package.json
- Manual testing required for streaming functionality

### Recommended Testing Approach
1. **Structure Validation**: Ensure all required files exist
2. **Build Verification**: Test installer builds on target platforms
3. **FFmpeg Integration**: Verify FFmpeg detection and command generation
4. **IPC Communication**: Test main-renderer communication paths

### Future Test Improvements
Consider adding:
- Unit tests for configuration parsing
- Integration tests for FFmpeg command generation
- E2E tests for basic UI interactions

## Development Workflow

### Adding New Features
1. Update `main.js` for backend logic
2. Update `preload.js` to expose new APIs  
3. Update `renderer.js` for frontend integration
4. Update `index.html` for UI elements if needed
5. Update `styles.css` for styling

### Modifying Streaming Configuration
1. Update preset configurations in `renderer.js:33-38`
2. Update FFmpeg argument generation in `main.js:170-239`
3. Add new UI controls in `index.html`
4. Update configuration loading/saving logic

### Debugging
1. Enable DevTools in development: Uncomment `mainWindow.webContents.openDevTools()` in `main.js:39`
2. Check console logs in both main and renderer processes
3. Monitor FFmpeg stderr output in the log panel
4. Use IPC event listeners to trace communication

## Platform-Specific Considerations

### Windows
- FFmpeg bundled as `resources/ffmpeg.exe`
- Audio capture via DirectShow (`dshow`)
- NSIS installer with desktop shortcuts

### macOS
- FFmpeg should be installed via Homebrew or system PATH
- Audio capture via AVFoundation (`avfoundation`)
- Screen recording permissions required

### Linux
- FFmpeg via system package manager
- Audio capture via PulseAudio (`pulse`)
- AppImage packaging

## Performance Considerations

1. **Hardware Encoding**: Always prefer hardware encoders when available
2. **Resolution/FPS**: Balance quality with CPU/GPU load
3. **Network**: Monitor bitrate and adjust for network conditions
4. **Memory**: Clean up event listeners and intervals when not needed

## Security Best Practices

1. **Context Isolation**: Enabled in `preload.js` to separate main/renderer processes
2. **Node Integration**: Disabled in renderer for security
3. **API Exposure**: Only expose necessary APIs via context bridge
4. **Input Validation**: Validate all user inputs before processing

## CI/CD Pipeline

The project uses:
- **GitHub Actions**: For Windows builds and releases
- **Drone CI**: Alternative CI with similar workflows
- **Automated Testing**: Structure validation in PRs
- **Release Automation**: Tag-based releases with checksums

Key files:
- `.github/workflows/build.yml` - GitHub Actions workflow
- `.drone.yml` - Drone CI configuration

## Common Issues & Solutions

### FFmpeg Not Found
- Windows: Ensure `resources/ffmpeg.exe` exists
- macOS/Linux: Install FFmpeg via package manager
- Development: Add FFmpeg to system PATH

### Permission Errors
- macOS: Grant screen recording permissions
- Windows: Run as administrator if needed
- Linux: Check PulseAudio permissions

### Streaming Issues
- Verify RTMP URL format
- Check network connectivity
- Monitor FFmpeg logs for specific errors
- Adjust bitrate/resolution for network conditions

## Contributing Guidelines

1. Follow existing code patterns and conventions
2. Test changes on target platform(s)
3. Update documentation if adding new features
4. Ensure backward compatibility for configuration
5. Consider performance implications of changes

This document will be updated as the project evolves. Refer to the actual code for the most current patterns and practices.