import { useState, useEffect, useCallback, useRef } from 'react'

const getApi = () => window.electronAPI

function formatSize(bytes) {
  if (!bytes || bytes === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function entryToNode(entry) {
  return {
    id: entry.path,
    name: entry.name,
    path: entry.path,
    kind: entry.kind,
    isDirectory: entry.isDirectory,
    size: formatSize(entry.size),
    sizeBytes: entry.size,
    modified: formatDate(entry.modified),
    modifiedRaw: entry.modified,
    tags: [],
    isArchiveEntry: entry.isArchiveEntry || false,
    archivePath: entry.archivePath,
    innerPath: entry.innerPath,
  }
}

const dirCache = new Map()

export function clearDirCache(dirPath) {
  if (dirPath) dirCache.delete(dirPath)
  else dirCache.clear()
}

// Returns true if a path is a virtual archive path (e.g. "/foo/bar.zip::subdir")
export function isArchivePath(p) {
  return p && p.includes('::')
}

export function useDirectory(dirPath) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pathRef = useRef(dirPath)
  pathRef.current = dirPath

  const load = useCallback(async (force = false) => {
    if (!dirPath) return
    const api = getApi()
    if (!api) { setError('Electron API not available'); return }
    if (!force && dirCache.has(dirPath)) {
      setEntries(dirCache.get(dirPath))
      return
    }
    setLoading(true)
    setError(null)
    try {
      let result
      if (isArchivePath(dirPath)) {
        // Virtual archive path: "/path/to/file.zip::inner/dir"
        const [archivePath, innerDir] = dirPath.split('::')
        result = await api.readArchive(archivePath, innerDir || '')
      } else {
        result = await api.readDir(dirPath)
      }
      if (result?.error) { setError(result.error); setEntries([]); return }
      const nodes = result.map(entryToNode)
      dirCache.set(dirPath, nodes)
      if (pathRef.current === dirPath) setEntries(nodes)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [dirPath])

  useEffect(() => { load() }, [load])

  // Live folder watching — only for real directories (not archives)
  useEffect(() => {
    const api = getApi()
    if (!api || !dirPath || isArchivePath(dirPath)) return
    api.watchDir(dirPath)
    const unsubscribe = api.onDirChanged((changedPath) => {
      if (changedPath === dirPath) {
        dirCache.delete(dirPath)
        if (pathRef.current === dirPath) load(true)
      }
    })
    return () => { api.unwatchDir(dirPath); unsubscribe?.() }
  }, [dirPath, load])

  const refresh = useCallback(() => { dirCache.delete(dirPath); load(true) }, [dirPath, load])

  return { entries, loading, error, refresh }
}

export function useGitStatus(dirPath) {
  const [gitInfo, setGitInfo] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!dirPath || isArchivePath(dirPath)) { setGitInfo(null); return }
    const api = getApi()
    if (!api?.gitStatus) return
    // Debounce to avoid spamming on rapid navigation
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      api.gitStatus(dirPath).then(info => setGitInfo(info || null))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [dirPath])

  return gitInfo
}

export function useHomedir() {
  const [homedir, setHomedir] = useState(null)
  useEffect(() => {
    const api = getApi()
    if (api) api.homedir().then(setHomedir)
  }, [])
  return homedir
}

export function useRoots() {
  const [roots, setRoots] = useState([])
  useEffect(() => {
    const api = getApi()
    if (api) api.roots().then(setRoots)
  }, [])
  return roots
}

export function useSidebarSections(homedir) {
  const [sections, setSections] = useState([])

  useEffect(() => {
    if (!homedir) return
    const places = [
      { name: 'Home', path: homedir, kind: 'folder' },
      { name: 'Desktop', path: `${homedir}/Desktop`, kind: 'folder' },
      { name: 'Documents', path: `${homedir}/Documents`, kind: 'folder' },
      { name: 'Downloads', path: `${homedir}/Downloads`, kind: 'folder' },
      { name: 'Pictures', path: `${homedir}/Pictures`, kind: 'folder' },
      { name: 'Music', path: `${homedir}/Music`, kind: 'folder' },
      { name: 'Videos', path: `${homedir}/Videos`, kind: 'folder' },
    ]
    const api = getApi()
    if (!api) return
    Promise.all(places.map(async (p) => {
      try {
        const stat = await api.stat(p.path)
        return stat?.error ? null : { ...p, id: p.path }
      } catch { return null }
    })).then(results => setSections(results.filter(Boolean)))
  }, [homedir])

  return sections
}

export { formatSize, formatDate }
