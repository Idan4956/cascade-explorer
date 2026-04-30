import { useState, useEffect, useCallback, useRef } from 'react'

const getApi = () => window.electronAPI

// Format file size from bytes to human-readable
function formatSize(bytes) {
  if (!bytes || bytes === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

// Format date
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Convert a raw filesystem entry to a UI-compatible node
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
    palette: undefined,
  }
}

// Cache for directory listings to avoid redundant reads
const dirCache = new Map()

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
      const result = await api.readDir(dirPath)
      if (result?.error) {
        setError(result.error)
        setEntries([])
        return
      }
      const nodes = result.map(entryToNode)
      dirCache.set(dirPath, nodes)
      if (pathRef.current === dirPath) {
        setEntries(nodes)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [dirPath])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(() => {
    dirCache.delete(dirPath)
    load(true)
  }, [dirPath, load])

  return { entries, loading, error, refresh }
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

// Build sidebar quick-access sections from the home directory
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

    // Filter to only existing paths
    const api = getApi()
    if (!api) return
    Promise.all(
      places.map(async (p) => {
        try {
          const stat = await api.stat(p.path)
          return stat?.error ? null : { ...p, id: p.path }
        } catch {
          return null
        }
      })
    ).then((results) => {
      setSections(results.filter(Boolean))
    })
  }, [homedir])

  return sections
}

export { formatSize, formatDate }
