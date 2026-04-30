import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  stat: (filePath) => ipcRenderer.invoke('fs:stat', filePath),
  readText: (filePath) => ipcRenderer.invoke('fs:readText', filePath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  trash: (filePath) => ipcRenderer.invoke('fs:trash', filePath),
  mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
  openExternal: (filePath) => ipcRenderer.invoke('fs:openExternal', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('fs:showInFolder', filePath),
  openDialog: (opts) => ipcRenderer.invoke('fs:openDialog', opts),
  homedir: () => ipcRenderer.invoke('fs:homedir'),
  roots: () => ipcRenderer.invoke('fs:roots'),
  diskUsage: () => ipcRenderer.invoke('fs:diskUsage'),
  search: (query, rootDir, maxDepth) => ipcRenderer.invoke('fs:search', query, rootDir, maxDepth),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  onMaximized: (cb) => {
    ipcRenderer.on('window:maximized', (_, val) => cb(val))
    return () => ipcRenderer.removeAllListeners('window:maximized')
  },
})
