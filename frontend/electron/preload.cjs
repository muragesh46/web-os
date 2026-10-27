const { contextBridge } = require('electron');

// Expose safe, isolated desktop APIs to renderer process if needed
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
});
