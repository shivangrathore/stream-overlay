const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFocus: (callback) => ipcRenderer.on('focus', callback),
  onBlur: (callback) => ipcRenderer.on('blur', callback),
  config: (callback) => ipcRenderer.on('config', callback),
  configFile: (callback) => ipcRenderer.on('configFile', callback),
  saved: (callback) => ipcRenderer.on('saved', callback),
  settings: (callback) => ipcRenderer.on('settings', callback),
  windowPosition: (callback) => ipcRenderer.on('windowPosition', callback),
  overlays: (callback) => ipcRenderer.on('overlays', callback),
  restored: (callback) => ipcRenderer.on('restored', callback),
  displays: (callback) => ipcRenderer.on('displays', callback),
  fullscreenApp: (callback) => ipcRenderer.on('fullscreenApp', callback),
  requestFocusEvent: () => ipcRenderer.invoke('requestFocusEvent'),
  requestConfig: () => ipcRenderer.invoke('requestConfig'),
  requestClose: () => ipcRenderer.invoke('requestClose'),
  requestConfigFile: () => ipcRenderer.invoke('requestConfigFile'),
  requestHelp: () => ipcRenderer.invoke('requestHelp'),
  requestSave: (data) => ipcRenderer.invoke('requestSave', data),
  requestSaveAs: (data) => ipcRenderer.invoke('requestSaveAs', data),
  requestLaunch: (data) => ipcRenderer.invoke('requestLaunch', data),
  requestSettings: () => ipcRenderer.invoke('requestSettings'),
  requestCloseAll: () => ipcRenderer.invoke('requestCloseAll'),
  requestRestoreFiles: () => ipcRenderer.invoke('requestRestoreFiles'),
  requestDisplays: () => ipcRenderer.invoke('requestDisplays'),
  requestEditMode: (data) => ipcRenderer.invoke('requestEditMode', data),
  requestSetShortcut: (data) => ipcRenderer.invoke('requestSetShortcut', data),
  requestCloseWindow: (data) => ipcRenderer.invoke('requestCloseWindow', data),
  requestUpdateWindow: (data) =>
    ipcRenderer.invoke('requestUpdateWindow', data),
  requestSetOpenFiles: (data) =>
    ipcRenderer.invoke('requestSetOpenFiles', data),
  requestSetDefaultConfig: (data) =>
    ipcRenderer.invoke('requestSetDefaultConfig', data),
});
