import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import https from 'https'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import AdmZip from 'adm-zip'
import Anthropic from '@anthropic-ai/sdk'

const execAsync = promisify(exec)
let mainWin = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ── Recent folders ────────────────────────────────────────────────────────────
let recentFolders = []
const recentFoldersPath = () => path.join(app.getPath('userData'), 'recent-folders.json')

function loadRecentFolders() {
  try { recentFolders = JSON.parse(fs.readFileSync(recentFoldersPath(), 'utf-8')) } catch { recentFolders = [] }
}

function addRecentFolder(folderPath) {
  if (!folderPath || typeof folderPath !== 'string') return
  recentFolders = [folderPath, ...recentFolders.filter(p => p !== folderPath)].slice(0, 12)
  try { fs.writeFileSync(recentFoldersPath(), JSON.stringify(recentFolders)) } catch {}
  updateJumpList()
}

function updateJumpList() {
  if (process.platform !== 'win32') return
  try {
    app.setJumpList([
      {
        type: 'custom',
        name: 'Recent Folders',
        items: recentFolders.slice(0, 8).map(p => ({
          type: 'task',
          title: path.basename(p) || p,
          description: p,
          program: process.execPath,
          args: `"${p}"`,
          iconPath: process.execPath,
          iconIndex: 0,
        })),
      },
      { type: 'recent' },
    ])
  } catch {}
}

ipcMain.handle('recent:getFolders', () => recentFolders)
ipcMain.handle('recent:addFolder', (_, folderPath) => { addRecentFolder(folderPath); return recentFolders })

// ── AI key persistence ────────────────────────────────────────────────────────
let aiApiKey = null
const aiKeyPath = () => path.join(app.getPath('userData'), 'ai-key.txt')

function loadAiKey() {
  try { aiApiKey = fs.readFileSync(aiKeyPath(), 'utf-8').trim() } catch { aiApiKey = null }
}

// ── Tag persistence ───────────────────────────────────────────────────────────
let tagsCache = {}
let tagDefsCache = null
const tagsPath = () => path.join(app.getPath('userData'), 'tags.json')
const tagDefsPath = () => path.join(app.getPath('userData'), 'tag-defs.json')

function loadTags() {
  try { tagsCache = JSON.parse(fs.readFileSync(tagsPath(), 'utf-8')) } catch { tagsCache = {} }
  try { tagDefsCache = JSON.parse(fs.readFileSync(tagDefsPath(), 'utf-8')) } catch { tagDefsCache = null }
}
function saveTags() {
  try { fs.writeFileSync(tagsPath(), JSON.stringify(tagsCache, null, 2)) } catch {}
}

ipcMain.handle('tags:getAll', () => tagsCache)
ipcMain.handle('tags:set', (_, filePath, tagIds) => {
  if (!tagIds || tagIds.length === 0) delete tagsCache[filePath]
  else tagsCache[filePath] = tagIds
  saveTags()
  return { ok: true }
})
ipcMain.handle('tags:getDefs', () => tagDefsCache)
ipcMain.handle('tags:setDefs', (_, defs) => {
  tagDefsCache = defs
  try { fs.writeFileSync(tagDefsPath(), JSON.stringify(defs, null, 2)) } catch {}
  return { ok: true }
})

// ── Starred persistence ───────────────────────────────────────────────────────
let starredCache = new Set()
const starredPath = () => path.join(app.getPath('userData'), 'starred.json')

function loadStarred() {
  try { starredCache = new Set(JSON.parse(fs.readFileSync(starredPath(), 'utf-8'))) } catch { starredCache = new Set() }
}
function saveStarred() {
  try { fs.writeFileSync(starredPath(), JSON.stringify([...starredCache])) } catch {}
}

ipcMain.handle('starred:getAll', () => [...starredCache])
ipcMain.handle('starred:toggle', (_, filePath) => {
  if (starredCache.has(filePath)) starredCache.delete(filePath)
  else starredCache.add(filePath)
  saveStarred()
  return [...starredCache]
})

// ── App version & update check ───────────────────────────────────────────────
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:checkUpdate', () => new Promise((resolve) => {
  const req = https.request({
    hostname: 'api.github.com',
    path: '/repos/Idan4956/cascade-explorer/releases/latest',
    headers: { 'User-Agent': 'Cascade-App' },
  }, (res) => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        resolve({ version: json.tag_name, url: json.html_url })
      } catch { resolve({ error: 'Parse error' }) }
    })
  })
  req.on('error', (e) => resolve({ error: e.message }))
  req.end()
}))

function getLaunchPath() {
  const args = process.argv.slice(app.isPackaged ? 1 : 2)
  for (const arg of args) {
    if (arg.startsWith('-')) continue
    try { if (fs.existsSync(arg)) return arg } catch {}
    // AutoPlay passes %L which may be a bare drive letter like "E:\"
    const cleaned = arg.replace(/["']/g, '')
    try { if (cleaned && fs.existsSync(cleaned)) return cleaned } catch {}
  }
  return null
}

function createWindow() {
  const launchPath = getLaunchPath()
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

  if (launchPath) {
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('app:openPath', launchPath)
    })
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
  mainWin = win
}

app.whenReady().then(() => {
  loadTags()
  loadStarred()
  loadAiKey()
  loadRecentFolders()
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

ipcMain.handle('fs:createFile', async (_, filePath) => {
  try {
    await fs.promises.writeFile(filePath, '', { flag: 'wx' })
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs:copy', async (_, srcPath, destPath) => {
  try {
    await copyRecursive(srcPath, destPath)
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

async function copyRecursive(src, dest) {
  const stat = await fs.promises.stat(src)
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true })
    const entries = await fs.promises.readdir(src)
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    await fs.promises.copyFile(src, dest)
  }
}

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

// ── Live folder watching ──────────────────────────────────────────────────────
const watchers = new Map()

ipcMain.handle('fs:watch', (_, dirPath) => {
  if (watchers.has(dirPath)) return { ok: true }
  try {
    let timer = null
    const watcher = fs.watch(dirPath, { persistent: false }, () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('fs:changed', dirPath)
      }, 200)
    })
    watcher.on('error', () => watchers.delete(dirPath))
    watchers.set(dirPath, { watcher, get timer() { return timer }, set timer(v) { timer = v } })
  } catch {}
  return { ok: true }
})

ipcMain.handle('fs:unwatch', (_, dirPath) => {
  const entry = watchers.get(dirPath)
  if (entry) { clearTimeout(entry.timer); entry.watcher.close(); watchers.delete(dirPath) }
  return { ok: true }
})

// ── Git integration ───────────────────────────────────────────────────────────
ipcMain.handle('git:status', async (_, dirPath) => {
  try {
    const { stdout: rootRaw } = await execAsync('git rev-parse --show-toplevel', { cwd: dirPath })
    const gitRoot = rootRaw.trim().replace(/\//g, path.sep)
    const [{ stdout: branchRaw }, { stdout: statusRaw }] = await Promise.all([
      execAsync('git rev-parse --abbrev-ref HEAD', { cwd: dirPath }),
      execAsync('git status --porcelain -u', { cwd: dirPath }),
    ])
    const branch = branchRaw.trim()
    const fileStatuses = {}
    for (const line of statusRaw.split('\n')) {
      if (!line.trim()) continue
      const x = line[0], y = line[1]
      const file = line.slice(3).trim().replace(/"/g, '').split(' -> ').pop()
      const full = path.join(gitRoot, file)
      if (x === '?' && y === '?') fileStatuses[full] = 'untracked'
      else if (x !== ' ' && x !== '?') fileStatuses[full] = 'staged'
      else fileStatuses[full] = 'modified'
    }
    return { gitRoot, branch, fileStatuses }
  } catch { return null }
})

// ── Archive browsing (ZIP) ────────────────────────────────────────────────────
ipcMain.handle('fs:readArchive', (_, archivePath, innerDir = '') => {
  try {
    const zip = new AdmZip(archivePath)
    const entries = zip.getEntries()
    const prefix = innerDir ? innerDir.replace(/\\/g, '/').replace(/\/?$/, '/') : ''
    const seen = new Set()
    const results = []
    for (const entry of entries) {
      const name = entry.entryName.replace(/\\/g, '/')
      if (!name.startsWith(prefix)) continue
      const rest = name.slice(prefix.length)
      if (!rest || rest === '/') continue
      const parts = rest.split('/')
      const topName = parts[0]
      if (!topName || seen.has(topName)) continue
      seen.add(topName)
      const isDir = parts.length > 1 || entry.isDirectory
      const virtualPath = archivePath + '::' + (prefix + topName)
      results.push({
        name: topName,
        path: virtualPath,
        isDirectory: isDir,
        size: isDir ? 0 : entry.header.size,
        modified: entry.header.time?.toISOString() || null,
        kind: isDir ? 'folder' : getKind(topName, false),
        isArchiveEntry: true,
        archivePath,
        innerPath: prefix + topName,
      })
    }
    return results.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
  } catch (err) { return { error: err.message } }
})

// ── Open in Terminal ──────────────────────────────────────────────────────────
ipcMain.handle('app:openTerminal', (_, dirPath) => {
  const p = process.platform
  if (p === 'win32') {
    exec(`start wt.exe -d "${dirPath}"`, { shell: true }, (err) => {
      if (err) exec(`start cmd /K "cd /d \\"${dirPath}\\""`, { shell: true })
    })
  } else if (p === 'darwin') {
    exec(`open -a Terminal "${dirPath}"`)
  } else {
    const terms = ['gnome-terminal --working-directory', 'xterm -e "cd', 'konsole --workdir']
    exec(`${terms[0]} "${dirPath}"`, (err) => {
      if (err) exec(`xterm -e "cd '${dirPath}' && $SHELL"`)
    })
  }
  return { ok: true }
})

// ── AI / Claude API ────────────────────────────────────────────────────────
ipcMain.handle('ai:setKey', async (_, key) => {
  aiApiKey = key.trim()
  if (aiApiKey) {
    await fs.promises.writeFile(aiKeyPath(), aiApiKey, 'utf-8')
  } else {
    try { await fs.promises.unlink(aiKeyPath()) } catch {}
  }
  return { ok: true }
})

ipcMain.handle('ai:hasKey', () => !!aiApiKey)

ipcMain.handle('ai:query', async (_, { messages, maxTokens = 1024 }) => {
  if (!aiApiKey) return { error: 'No API key configured. Add one in Settings → AI Features.' }
  try {
    const client = new Anthropic({ apiKey: aiApiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages,
    })
    return { content: response.content[0].text }
  } catch (e) {
    return { error: e.message }
  }
})

ipcMain.handle('ai:readFileSnippet', async (_, filePath) => {
  try {
    const stat = await fs.promises.stat(filePath)
    if (stat.size > 200 * 1024) return null
    const text = await fs.promises.readFile(filePath, 'utf-8')
    return text.slice(0, 4000)
  } catch { return null }
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
