import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  stat: (filePath) => ipcRenderer.invoke('fs:stat', filePath),
  readText: (filePath) => ipcRenderer.invoke('fs:readText', filePath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  trash: (filePath) => ipcRenderer.invoke('fs:trash', filePath),
  mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
  createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
  copy: (srcPath, destPath) => ipcRenderer.invoke('fs:copy', srcPath, destPath),
  openExternal: (filePath) => ipcRenderer.invoke('fs:openExternal', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('fs:showInFolder', filePath),
  openDialog: (opts) => ipcRenderer.invoke('fs:openDialog', opts),
  getAllTags: () => ipcRenderer.invoke('tags:getAll'),
  setTags: (filePath, tagIds) => ipcRenderer.invoke('tags:set', filePath, tagIds),
  getTagDefs: () => ipcRenderer.invoke('tags:getDefs'),
  setTagDefs: (defs) => ipcRenderer.invoke('tags:setDefs', defs),
  getStarred: () => ipcRenderer.invoke('starred:getAll'),
  toggleStar: (filePath) => ipcRenderer.invoke('starred:toggle', filePath),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkUpdate: () => ipcRenderer.invoke('app:checkUpdate'),
  watchDir: (dirPath) => ipcRenderer.invoke('fs:watch', dirPath),
  unwatchDir: (dirPath) => ipcRenderer.invoke('fs:unwatch', dirPath),
  onDirChanged: (cb) => {
    ipcRenderer.on('fs:changed', (_, dirPath) => cb(dirPath))
    return () => ipcRenderer.removeAllListeners('fs:changed')
  },
  gitStatus: (dirPath) => ipcRenderer.invoke('git:status', dirPath),
  readArchive: (archivePath, innerDir) => ipcRenderer.invoke('fs:readArchive', archivePath, innerDir),
  openTerminal: (dirPath) => ipcRenderer.invoke('app:openTerminal', dirPath),
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
