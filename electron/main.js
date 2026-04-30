import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import os from 'os'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 14 },
    backgroundColor: '#1a1e2a',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Forward window control IPC calls
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window:close', () => win.close())

  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Filesystem IPC handlers ─────────────────────────────────────────────────

ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    const results = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        try {
          const stat = await fs.promises.stat(fullPath)
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            modified: stat.mtime.toISOString(),
            kind: getKind(entry.name, entry.isDirectory()),
          }
        } catch {
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: 0,
            modified: null,
            kind: getKind(entry.name, entry.isDirectory()),
          }
        }
      })
    )
    // Folders first, then alphabetical
    return results.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:stat', async (_, filePath) => {
  try {
    const stat = await fs.promises.stat(filePath)
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stat.size,
      modified: stat.mtime.toISOString(),
      created: stat.birthtime.toISOString(),
      isDirectory: stat.isDirectory(),
      kind: getKind(path.basename(filePath), stat.isDirectory()),
    }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:readText', async (_, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return { content: content.slice(0, 4000) } // limit preview size
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:rename', async (_, oldPath, newPath) => {
  try {
    await fs.promises.rename(oldPath, newPath)
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:trash', async (_, filePath) => {
  try {
    await shell.trashItem(filePath)
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:mkdir', async (_, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true })
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:openExternal', async (_, filePath) => {
  try {
    await shell.openPath(filePath)
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:showInFolder', async (_, filePath) => {
  shell.showItemInFolder(filePath)
  return { ok: true }
})

ipcMain.handle('fs:openDialog', async (_, opts = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    ...opts,
  })
  return result
})

ipcMain.handle('fs:homedir', () => os.homedir())

ipcMain.handle('fs:diskUsage', async () => {
  const homedir = os.homedir()
  try {
    const stats = await fs.promises.statfs(homedir)
    const total = stats.blocks * stats.bsize
    const free = stats.bavail * stats.bsize
    const used = total - free
    const drive = process.platform === 'win32' ? homedir.slice(0, 3) : '/'
    return { free, total, used, drive }
  } catch {
    return null
  }
})

ipcMain.handle('fs:search', async (_, query, rootDir, maxDepth = 4) => {
  const results = []
  const q = query.toLowerCase()

  async function scan(dir, depth) {
    if (depth > maxDepth || results.length >= 50) return
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (results.length >= 50) return
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(dir, entry.name)
        if (entry.name.toLowerCase().includes(q)) {
          try {
            const stat = await fs.promises.stat(fullPath)
            results.push({
              name: entry.name, path: fullPath,
              isDirectory: entry.isDirectory(),
              size: stat.size, modified: stat.mtime.toISOString(),
              kind: getKind(entry.name, entry.isDirectory()),
              parentDir: dir,
            })
          } catch {}
        }
        if (entry.isDirectory() && depth < maxDepth) {
          await scan(fullPath, depth + 1)
        }
      }
    } catch {}
  }

  await scan(rootDir, 0)
  return results
})

ipcMain.handle('fs:roots', () => {
  if (process.platform === 'win32') {
    // Return drive letters
    const drives = []
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ':\\'
      try {
        fs.accessSync(drive)
        drives.push(drive)
      } catch {}
    }
    return drives
  }
  return ['/']
})

// ── Helpers ────────────────────────────────────────────────────────────────

function getKind(name, isDir) {
  if (isDir) return 'folder'
  const ext = path.extname(name).toLowerCase()
  const map = {
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
    '.webp': 'image', '.svg': 'image', '.heic': 'image', '.avif': 'image',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.mkv': 'video',
    '.webm': 'video', '.m4v': 'video',
    '.mp3': 'audio', '.flac': 'audio', '.wav': 'audio', '.aac': 'audio',
    '.m4a': 'audio', '.ogg': 'audio',
    '.pdf': 'pdf',
    '.docx': 'doc', '.doc': 'doc', '.pages': 'doc', '.rtf': 'doc',
    '.xlsx': 'sheet', '.xls': 'sheet', '.numbers': 'sheet', '.csv': 'sheet',
    '.md': 'text', '.txt': 'text', '.log': 'text', '.json': 'text',
    '.js': 'text', '.ts': 'text', '.jsx': 'text', '.tsx': 'text',
    '.py': 'text', '.rs': 'text', '.go': 'text', '.css': 'text',
    '.html': 'text', '.xml': 'text', '.yaml': 'text', '.yml': 'text',
    '.zip': 'archive', '.tar': 'archive', '.gz': 'archive', '.rar': 'archive',
    '.7z': 'archive',
    '.exe': 'app', '.msi': 'app', '.dmg': 'app', '.app': 'app', '.deb': 'app',
    '.appimage': 'app',
  }
  return map[ext] || 'file'
}
