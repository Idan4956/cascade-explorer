import React from 'react'
import CascadeHeader from './CascadeHeader'
import CascadeSidebar from './CascadeSidebar'
import CascadeColumn from './CascadeColumn'
import CascadeDeepPreview from './CascadeDeepPreview'
import CascadeStatusBar from './CascadeStatusBar'
import CommandPalette from './CommandPalette'
import QuickLookModal from './QuickLookModal'
import TabBar from './TabBar'
import { CompareView, StackPreview as StackPreviewPanel } from './CompareAndStack'
import { QuickFilters, SelectionBar, BatchRenameModal, ShortcutsModal, ContextMenu, TAGS as DEFAULT_TAGS } from './features'
import { FileTile, IconEye, IconCopy, IconRename, IconTag, IconTrash, IconInfo, IconPin, IconWindow } from './icons'
import { useSidebarSections, useDirectory, useRoots, useGitStatus, clearDirCache } from '../hooks/useDirectory'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import SettingsModal from './SettingsModal'

const ACCENTS = {
  purple: { c: '#6f4cb3', soft: 'rgba(111,76,179,.14)', tint: 'rgba(111,76,179,.06)' },
  teal:   { c: '#00838f', soft: 'rgba(0,131,143,.14)',  tint: 'rgba(0,131,143,.06)'  },
  blue:   { c: '#0067c0', soft: 'rgba(0,103,192,.14)',  tint: 'rgba(0,103,192,.06)'  },
  sun:    { c: '#b8651f', soft: 'rgba(184,101,31,.16)', tint: 'rgba(184,101,31,.08)' },
}

export default function CascadeExplorer(props) {
  return (
    <ThemeProvider>
      <CascadeExplorerInner {...props} />
    </ThemeProvider>
  )
}

const loadSetting = (key, def) => {
  try { return JSON.parse(localStorage.getItem(`cascade-${key}`) ?? JSON.stringify(def)) } catch { return def }
}
const saveSetting = (key, val) => {
  try { localStorage.setItem(`cascade-${key}`, JSON.stringify(val)) } catch {}
}

function CascadeExplorerInner({ homedir, accent: accentProp = 'blue' }) {
  const { T } = useTheme()

  // ── Persisted settings ────────────────────────────────────────
  const [accentKey, setAccentKey] = React.useState(() => loadSetting('accent', accentProp))
  const [confirmDelete, setConfirmDelete] = React.useState(() => loadSetting('confirmDelete', false))
  const [startDir, setStartDir] = React.useState(() => loadSetting('startDir', 'home'))
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const changeAccent = (key) => { setAccentKey(key); saveSetting('accent', key) }
  const changeConfirmDelete = (v) => { setConfirmDelete(v); saveSetting('confirmDelete', v) }
  const changeStartDir = (v) => { setStartDir(v); saveSetting('startDir', v) }

  const A = ACCENTS[accentKey] || ACCENTS.purple

  // ── Tabs ─────────────────────────────────────────────────────────
  const makeTab = (cascade) => ({ id: Date.now() + Math.random(), cascade, history: [], forwardHistory: [] })
  const [tabs, setTabs] = React.useState(() => [makeTab(homedir ? [homedir] : [])])
  const [activeTabId, setActiveTabId] = React.useState(() => tabs[0].id)
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  const [cascade, _setCascade] = React.useState(homedir ? [homedir] : [])
  const [history, setHistory] = React.useState([])
  const [forwardHistory, setForwardHistory] = React.useState([])

  React.useEffect(() => {
    if (homedir && cascade.length === 0) _setCascade([homedir])
  }, [homedir])

  // Sync cascade <-> active tab
  const switchTab = React.useCallback((id) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, cascade, history, forwardHistory } : t))
    const tab = tabs.find(t => t.id === id)
    if (tab) { _setCascade(tab.cascade); setHistory(tab.history); setForwardHistory(tab.forwardHistory) }
    setActiveTabId(id)
    setMultiSel({})
  }, [activeTabId, cascade, history, forwardHistory, tabs])

  const newTab = React.useCallback(() => {
    setTabs(prev => { const t = makeTab(homedir ? [homedir] : []); return [...prev, t] })
    setTabs(prev => {
      const last = prev[prev.length - 1]
      setActiveTabId(last.id)
      _setCascade(last.cascade)
      setHistory([])
      setForwardHistory([])
      setMultiSel({})
      return prev
    })
  }, [homedir])

  const closeTab = React.useCallback((id) => {
    setTabs(prev => {
      if (prev.length === 1) return prev
      const idx = prev.findIndex(t => t.id === id)
      const next = prev.filter(t => t.id !== id)
      if (id === activeTabId) {
        const fallback = next[Math.min(idx, next.length - 1)]
        setActiveTabId(fallback.id)
        _setCascade(fallback.cascade)
        setHistory(fallback.history)
        setForwardHistory(fallback.forwardHistory)
        setMultiSel({})
      }
      return next
    })
  }, [activeTabId])

  const tabsWithLabels = tabs.map(t => ({
    ...t,
    label: (t.id === activeTabId ? cascade : t.cascade).slice(-1)[0]?.split(/[\\/]/).pop() || 'Home',
  }))

  // ── Dual pane ─────────────────────────────────────────────────────
  const [dualPane, setDualPane] = React.useState(false)
  const [rightCascade, setRightCascade] = React.useState(homedir ? [homedir] : [])
  const [rightMultiSel, setRightMultiSel] = React.useState({})
  const [rightHistory, setRightHistory] = React.useState([])
  const [rightForwardHistory, setRightForwardHistory] = React.useState([])
  const [activePane, setActivePane] = React.useState('left')

  const setCascade = React.useCallback((c) => {
    if (activePane === 'right') setRightCascade(c)
    else _setCascade(c)
  }, [activePane])

  // ── Quick Look ────────────────────────────────────────────────────
  const [quickLookItem, setQuickLookItem] = React.useState(null)

  const [multiSel, setMultiSel] = React.useState({})
  const [pinnedCols, setPinnedCols] = React.useState(new Set())
  const [colFilters, setColFilters] = React.useState({})
  const [quickFilters, setQuickFilters] = React.useState({})
  const [showHidden, setShowHidden] = React.useState(() => loadSetting('showHidden', false))
  const changeShowHidden = (v) => { setShowHidden(v); saveSetting('showHidden', v) }
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)
  const [showRename, setShowRename] = React.useState(false)
  const [ctxMenu, setCtxMenu] = React.useState(null)
  const [stackMode, setStackMode] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [nodeMap, setNodeMap] = React.useState({})
  const [loadedDirs, setLoadedDirs] = React.useState({})
  const [tagMap, setTagMap] = React.useState({})
  const [tagDefs, setTagDefs] = React.useState(DEFAULT_TAGS)
  const [activeTagFilter, setActiveTagFilter] = React.useState(null)
  const [starredPaths, setStarredPaths] = React.useState(new Set())
  const [starFilter, setStarFilter] = React.useState(false)

  // ── Clipboard: { paths: string[], mode: 'copy'|'cut' } ───────
  const [clipboard, setClipboard] = React.useState(null)
  const cutPaths = React.useMemo(
    () => clipboard?.mode === 'cut' ? new Set(clipboard.paths) : new Set(),
    [clipboard]
  )

  // ── Toasts ────────────────────────────────────────────────────
  const [toasts, setToasts] = React.useState([])
  const addToast = React.useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  React.useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api.getAllTags().then(t => setTagMap(t || {}))
    api.getTagDefs().then(d => { if (d) setTagDefs(d) })
    api.getStarred().then(paths => { if (paths) setStarredPaths(new Set(paths)) })
  }, [])

  const toggleStar = React.useCallback(async (filePath) => {
    const api = window.electronAPI
    if (api) {
      const result = await api.toggleStar(filePath)
      if (result) setStarredPaths(new Set(result))
    } else {
      setStarredPaths(prev => {
        const next = new Set(prev)
        next.has(filePath) ? next.delete(filePath) : next.add(filePath)
        return next
      })
    }
  }, [])

  // ── Git status ────────────────────────────────────────────────────
  const currentDir = cascade[cascade.length - 1]
  const gitInfo = useGitStatus(currentDir)

  const saveTagDefs = React.useCallback((defs) => {
    setTagDefs(defs)
    window.electronAPI?.setTagDefs(defs)
  }, [])

  const addTag = React.useCallback((name, hue) => {
    setTagDefs(prev => {
      const defs = [...prev, { id: `tag-${Date.now()}`, name, hue }]
      window.electronAPI?.setTagDefs(defs)
      return defs
    })
  }, [])

  const deleteTag = React.useCallback((tagId) => {
    setTagDefs(prev => {
      const defs = prev.filter(t => t.id !== tagId)
      window.electronAPI?.setTagDefs(defs)
      return defs
    })
    setTagMap(prev => {
      const next = {}
      for (const [path, tags] of Object.entries(prev)) {
        const filtered = tags.filter(t => t !== tagId)
        if (filtered.length > 0) next[path] = filtered
      }
      window.electronAPI?.setTags && Object.entries(next).forEach(([p, t]) => window.electronAPI.setTags(p, t))
      return next
    })
    if (activeTagFilter === tagId) setActiveTagFilter(null)
  }, [activeTagFilter])

  const toggleTag = React.useCallback((filePath, tagId) => {
    setTagMap(prev => {
      const current = prev[filePath] || []
      const next = current.includes(tagId) ? current.filter(t => t !== tagId) : [...current, tagId]
      const api = window.electronAPI
      if (api) api.setTags(filePath, next)
      return { ...prev, [filePath]: next }
    })
  }, [])

  const registerEntries = React.useCallback((entries) => {
    setNodeMap(prev => {
      const next = { ...prev }
      for (const e of entries) next[e.path] = e
      return next
    })
    if (entries.length > 0) {
      const dir = entries[0].path.substring(0, entries[0].path.lastIndexOf('/') || entries[0].path.lastIndexOf('\\'))
      setLoadedDirs(prev => ({ ...prev, [dir]: entries }))
    }
  }, [])

  const places = useSidebarSections(homedir)
  const drives = useRoots()

  const navigateTo = React.useCallback((newCascade) => {
    setCascade(prev => {
      setHistory(h => {
        const last = h[h.length - 1]
        if (last && last.join('|') === newCascade.join('|')) return h
        return [...h.slice(-9), prev]
      })
      return newCascade
    })
    setForwardHistory([])
  }, [])

  const goBack = React.useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setCascade(cur => { setForwardHistory(f => [...f.slice(-9), cur]); return prev })
      return h.slice(0, -1)
    })
  }, [])

  const goForward = React.useCallback(() => {
    setForwardHistory(f => {
      if (f.length === 0) return f
      const next = f[f.length - 1]
      setCascade(cur => { setHistory(h => [...h.slice(-9), cur]); return next })
      return f.slice(0, -1)
    })
  }, [])

  const selectAt = React.useCallback((depth, entry, e) => {
    if (e?.metaKey || e?.ctrlKey) {
      const cur = multiSel[depth] || []
      const next = cur.includes(entry.path) ? cur.filter(x => x !== entry.path) : [...cur, entry.path]
      setMultiSel({ ...multiSel, [depth]: next })
      return
    }
    if (e?.shiftKey) {
      const cur = multiSel[depth] || []
      setMultiSel({ ...multiSel, [depth]: [...cur, entry.path] })
      return
    }
    const next = [...cascade.slice(0, depth), entry.path]
    navigateTo(next)
    setMultiSel({ ...multiSel, [depth]: [entry.path] })
  }, [cascade, multiSel, navigateTo])

  const togglePin = React.useCallback((path) => {
    setPinnedCols(prev => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next })
  }, [])

  // ── Mutation callbacks ────────────────────────────────────────
  const handleRename = React.useCallback(async (renames) => {
    const api = window.electronAPI
    if (!api) return
    for (const { item, newName } of renames) {
      const dir = item.path.substring(0, Math.max(item.path.lastIndexOf('/'), item.path.lastIndexOf('\\')))
      const newPath = dir + (item.path.includes('/') ? '/' : '\\') + newName
      await api.rename(item.path, newPath)
    }
    addToast(`Renamed ${renames.length} item${renames.length > 1 ? 's' : ''}`)
    setRefreshKey(k => k + 1)
  }, [addToast])

  const renameItem = React.useCallback(async (item, newName) => {
    const api = window.electronAPI
    if (!api) return
    const sep = item.path.includes('\\') ? '\\' : '/'
    const dir = item.path.substring(0, item.path.lastIndexOf(sep))
    const newPath = dir + sep + newName
    const result = await api.rename(item.path, newPath)
    if (!result?.error) {
      clearDirCache(dir)
      setCascade(prev => prev.map(p => p === item.path ? newPath : p))
      setRefreshKey(k => k + 1)
      addToast(`Renamed to "${newName}"`)
    } else {
      addToast(`Rename failed: ${result.error}`, 'error')
    }
  }, [addToast])

  const copyItem = React.useCallback(async (item) => {
    const api = window.electronAPI
    if (!api) return
    const sep = item.path.includes('\\') ? '\\' : '/'
    const dir = item.path.substring(0, item.path.lastIndexOf(sep))
    const dotIdx = item.name.lastIndexOf('.')
    const hasExt = !item.isDirectory && dotIdx > 0
    const base = hasExt ? item.name.slice(0, dotIdx) : item.name
    const ext = hasExt ? item.name.slice(dotIdx) : ''
    const destPath = dir + sep + base + ' copy' + ext
    await api.copy(item.path, destPath)
    clearDirCache(dir)
    setRefreshKey(k => k + 1)
    addToast(`Duplicated "${item.name}"`)
  }, [addToast])

  const moveItem = React.useCallback(async (srcPath, destDirPath) => {
    const api = window.electronAPI
    if (!api) return
    const sep = srcPath.includes('\\') ? '\\' : '/'
    const name = srcPath.substring(srcPath.lastIndexOf(sep) + 1)
    const srcDir = srcPath.substring(0, srcPath.lastIndexOf(sep))
    if (srcDir === destDirPath) return
    const destPath = destDirPath + sep + name
    const result = await api.rename(srcPath, destPath)
    if (!result?.error) {
      clearDirCache(srcDir)
      clearDirCache(destDirPath)
      setCascade(prev => prev.map(p => p === srcPath ? destPath : p))
      setRefreshKey(k => k + 1)
      addToast(`Moved "${name}"`)
    } else {
      addToast(`Move failed: ${result.error}`, 'error')
    }
  }, [addToast])

  const deleteItems = React.useCallback(async (targets) => {
    const api = window.electronAPI
    if (!api || !targets.length) return
    if (confirmDelete) {
      const names = targets.map(t => t.name).join(', ')
      const ok = window.confirm(`Move ${targets.length === 1 ? `"${names}"` : `${targets.length} items`} to Trash?`)
      if (!ok) return
    }
    const parentDirs = new Set()
    for (const item of targets) {
      await api.trash(item.path)
      const sep = item.path.includes('\\') ? '\\' : '/'
      parentDirs.add(item.path.substring(0, item.path.lastIndexOf(sep)))
    }
    parentDirs.forEach(d => clearDirCache(d))
    setMultiSel({})
    setCascade(prev => {
      const deletedPaths = new Set(targets.map(t => t.path))
      const cut = prev.findIndex(p => deletedPaths.has(p))
      return cut !== -1 ? prev.slice(0, cut) : prev
    })
    setRefreshKey(k => k + 1)
    addToast(`Moved ${targets.length} item${targets.length > 1 ? 's' : ''} to Trash`)
  }, [addToast, confirmDelete])

  const handleDelete = React.useCallback(() => {
    deleteItems(flatMultiRef.current.length ? flatMultiRef.current : lastSelItemsRef.current)
  }, [deleteItems])

  // ── Paste clipboard items into current directory ──────────────
  const pasteItems = React.useCallback(async (clip) => {
    const api = window.electronAPI
    if (!api) return
    const lastPath = cascade[cascade.length - 1]
    const lastNode = nodeMap[lastPath]
    const destDir = lastNode?.isDirectory ? lastPath : (cascade.length >= 2 ? cascade[cascade.length - 2] : lastPath)
    if (!destDir) return
    for (const srcPath of clip.paths) {
      const sep = srcPath.includes('\\') ? '\\' : '/'
      const name = srcPath.substring(srcPath.lastIndexOf(sep) + 1)
      const destPath = destDir + sep + name
      if (clip.mode === 'copy') {
        await api.copy(srcPath, destPath)
      } else {
        await api.rename(srcPath, destPath)
        const srcDir = srcPath.substring(0, srcPath.lastIndexOf(sep))
        clearDirCache(srcDir)
      }
    }
    clearDirCache(destDir)
    setRefreshKey(k => k + 1)
    if (clip.mode === 'cut') setClipboard(null)
    addToast(`Pasted ${clip.paths.length} item${clip.paths.length > 1 ? 's' : ''}`)
  }, [cascade, nodeMap, addToast])

  // ── Keyboard shortcuts ────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      const meta = e.metaKey || e.ctrlKey
      if (e.key === ' ' && !meta) {
        const target = flatMultiRef.current.length ? flatMultiRef.current[0] : lastSelItemsRef.current[0]
        if (target && !target.isDirectory) { e.preventDefault(); setQuickLookItem(prev => prev?.path === target.path ? null : target) }
        return
      }
      if (meta && e.key === 'k') { e.preventDefault(); setPaletteOpen(true) }
      else if (meta && e.key === ',') { e.preventDefault(); setSettingsOpen(true) }
      else if (meta && e.key === '/') { e.preventDefault(); setShowShortcuts(true) }
      else if (meta && e.key === 't') { e.preventDefault(); newTab() }
      else if (meta && e.key === 'w') { e.preventDefault(); closeTab(activeTabId) }
      else if (e.key === 'F2') { e.preventDefault(); setShowRename(true) }
      else if (e.key === 'Backspace' && (e.metaKey || e.altKey)) { goBack() }
      else if (meta && e.key === 'c') {
        const paths = (flatMultiRef.current.length ? flatMultiRef.current : lastSelItemsRef.current).map(i => i.path)
        if (paths.length) { setClipboard({ paths, mode: 'copy' }); addToast(`${paths.length} item${paths.length > 1 ? 's' : ''} copied`) }
      }
      else if (meta && e.key === 'x') {
        const paths = (flatMultiRef.current.length ? flatMultiRef.current : lastSelItemsRef.current).map(i => i.path)
        if (paths.length) { setClipboard({ paths, mode: 'cut' }); addToast(`${paths.length} item${paths.length > 1 ? 's' : ''} cut`) }
      }
      else if (meta && e.key === 'v') {
        if (clipboardRef.current) pasteItems(clipboardRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, addToast, pasteItems, newTab, closeTab, activeTabId])

  // Refs for stable keyboard handler access
  const flatMultiRef = React.useRef([])
  const lastSelItemsRef = React.useRef([])
  const clipboardRef = React.useRef(null)

  // ── Build columns ─────────────────────────────────────────────
  const lastPath = cascade[cascade.length - 1]
  const lastNode = nodeMap[lastPath]
  const lastIsFile = lastNode && !lastNode.isDirectory
  const columnPaths = lastIsFile ? cascade.slice(0, -1) : cascade
  const lastDepth = cascade.length - 1
  const lastSelPaths = multiSel[lastDepth]?.length ? multiSel[lastDepth] : (lastPath ? [lastPath] : [])
  const lastSelItems = lastSelPaths.map(p => nodeMap[p]).filter(Boolean)
  const totalMulti = Object.values(multiSel).reduce((acc, arr) => acc + (arr?.length > 1 ? arr.length : 0), 0)
  const flatMulti = Object.values(multiSel).flat().map(p => nodeMap[p]).filter(Boolean)

  // Update refs each render
  flatMultiRef.current = flatMulti
  lastSelItemsRef.current = lastSelItems
  clipboardRef.current = clipboard

  const onCtx = React.useCallback((e, item, depth) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, item, depth })
  }, [])

  const previewItem = lastIsFile ? lastNode : (lastSelItems.length === 1 ? lastSelItems[0] : null)
  const parentPath = cascade.length >= 2 ? cascade[cascade.length - 2] : null

  // Right-pane navigation
  const rightNavigateTo = React.useCallback((c) => {
    setRightCascade(c); setRightHistory(h => [...h.slice(-9), rightCascade]); setRightForwardHistory([])
  }, [rightCascade])
  const rightGoBack = React.useCallback(() => {
    if (!rightHistory.length) return
    setRightForwardHistory(f => [...f.slice(-9), rightCascade])
    setRightCascade(rightHistory[rightHistory.length - 1])
    setRightHistory(h => h.slice(0, -1))
  }, [rightHistory, rightCascade])
  const rightGoForward = React.useCallback(() => {
    if (!rightForwardHistory.length) return
    setRightHistory(h => [...h.slice(-9), rightCascade])
    setRightCascade(rightForwardHistory[rightForwardHistory.length - 1])
    setRightForwardHistory(f => f.slice(0, -1))
  }, [rightForwardHistory, rightCascade])

  const colProps = { refreshKey, multiSel, colFilters, setColFilters, pinnedCols, quickFilters, showHidden, tagMap, tagDefs, activeTagFilter, cutPaths, starredPaths, starFilter, gitInfo, onEntries: registerEntries, accent: A, onDelete: (item) => deleteItems([item]), onRename: renameItem, onCopy: copyItem, onMove: moveItem, onToggleStar: toggleStar }

  return (
    <div style={{
      width: '100%', height: '100%',
      fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: T.text, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', borderRadius: 8,
      background: T.bg, position: 'relative',
    }}>
      <CascadeHeader
        cascade={activePane === 'right' ? rightCascade : cascade}
        nodeMap={nodeMap} setCascade={activePane === 'right' ? rightNavigateTo : navigateTo}
        openPalette={() => setPaletteOpen(true)}
        history={activePane === 'right' ? rightHistory : history}
        canGoBack={activePane === 'right' ? rightHistory.length > 0 : history.length > 0}
        canGoForward={activePane === 'right' ? rightForwardHistory.length > 0 : forwardHistory.length > 0}
        onGoBack={activePane === 'right' ? rightGoBack : goBack}
        onGoForward={activePane === 'right' ? rightGoForward : goForward}
        stackMode={stackMode} setStackMode={setStackMode} accent={A}
        onOpenSettings={() => setSettingsOpen(true)}
        dualPane={dualPane} onToggleDualPane={() => setDualPane(v => !v)}
      />

      {tabs.length > 1 && (
        <TabBar tabs={tabsWithLabels} activeTabId={activeTabId} onSwitch={switchTab} onCreate={newTab} onClose={closeTab} accent={A} />
      )}

      <QuickFilters filters={quickFilters} setFilters={setQuickFilters} accent={A} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <CascadeSidebar
          cascade={cascade} homedir={homedir} places={places} drives={drives}
          onJump={navigateTo} accent={A} setShowShortcuts={setShowShortcuts}
          onSmartFolder={(sf) => setQuickFilters(sf.filter || {})}
          tagDefs={tagDefs} activeTagFilter={activeTagFilter}
          onTagFilter={(id) => setActiveTagFilter(prev => prev === id ? null : id)}
          onAddTag={addTag} onDeleteTag={deleteTag}
          starFilter={starFilter} onToggleStarFilter={() => setStarFilter(v => !v)}
          starredCount={starredPaths.size}
        />

        <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          {/* Left pane */}
          <div
            onClick={() => setActivePane('left')}
            style={{
              flex: 1, display: 'flex', overflow: 'auto', minWidth: 0,
              scrollSnapType: 'x mandatory', position: 'relative',
              outline: dualPane && activePane === 'left' ? `2px solid ${A.c}44` : 'none',
              outlineOffset: -2,
            }}>
            <PaneColumns cascade={cascade} selectAt={selectAt} onCtx={onCtx} {...colProps} />
            {!dualPane && (
              stackMode && parentPath ? (
                <StackPreviewLoader parentPath={parentPath} selectedPath={lastPath}
                  onSelect={(e) => navigateTo([...cascade.slice(0, -1), e.path])} onEntries={registerEntries} />
              ) : lastSelItems.length > 1 ? (
                <CompareView items={lastSelItems} accent={A} />
              ) : (
                <CascadeDeepPreview item={previewItem} accent={A} tagMap={tagMap} onToggleTag={toggleTag} tagDefs={tagDefs} onAddTag={addTag} />
              )
            )}
          </div>

          {/* Right pane (dual pane mode) */}
          {dualPane && (
            <>
              <div style={{ width: 1, background: T.border, flexShrink: 0 }} />
              <div
                onClick={() => setActivePane('right')}
                style={{
                  flex: 1, display: 'flex', overflow: 'auto', minWidth: 0,
                  scrollSnapType: 'x mandatory', position: 'relative',
                  outline: activePane === 'right' ? `2px solid ${A.c}44` : 'none',
                  outlineOffset: -2,
                }}>
                <RightPaneColumns
                  cascade={rightCascade} onNavigate={rightNavigateTo}
                  nodeMap={nodeMap} registerEntries={registerEntries} {...colProps} />
              </div>
            </>
          )}
        </div>

        <SelectionBar count={totalMulti} accent={A} onClear={() => setMultiSel({})}
          onAction={(a) => {
            if (a === 'rename') setShowRename(true)
            else if (a === 'delete') handleDelete()
            else if (a === 'copy') {
              const paths = flatMulti.map(i => i.path)
              if (paths.length) { setClipboard({ paths, mode: 'copy' }); addToast(`${paths.length} items copied`) }
            }
          }}
        />
      </div>

      <CascadeStatusBar cascade={cascade} multiSel={multiSel} nodeMap={nodeMap} accent={A} gitInfo={gitInfo} />

      {/* Clipboard indicator */}
      {clipboard && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: T.dark ? 'rgba(50,45,70,0.95)' : 'rgba(240,235,255,0.97)',
          border: `1px solid ${A.c}44`, borderRadius: 99, padding: '4px 14px 4px 10px',
          fontSize: 11.5, color: T.textMid, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 40, pointerEvents: 'none',
        }}>
          <span style={{ color: A.c, fontWeight: 600 }}>{clipboard.mode === 'cut' ? '✂️' : '📋'}</span>
          {clipboard.paths.length} item{clipboard.paths.length > 1 ? 's' : ''} ready to {clipboard.mode === 'cut' ? 'move' : 'paste'}
          <kbd style={{ fontSize: 9.5, padding: '1px 5px', background: `${A.c}22`, borderRadius: 3, color: A.c }}>Ctrl+V</kbd>
        </div>
      )}

      {/* Toasts */}
      <div style={{ position: 'absolute', bottom: 42, right: 14, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '8px 14px', borderRadius: 8,
            background: t.type === 'error' ? '#c83a2e' : (T.dark ? 'rgba(50,45,72,0.97)' : 'rgba(34,30,50,0.92)'),
            color: '#fff', fontSize: 12.5, fontWeight: 500,
            boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
            backdropFilter: 'blur(12px)',
            border: t.type === 'error' ? 'none' : `1px solid ${T.border}`,
          }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Overlays */}
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} cascade={cascade} setCascade={navigateTo}
          setShowShortcuts={setShowShortcuts} setStackMode={setStackMode} accent={A}
          loadedDirs={loadedDirs} showHidden={showHidden} onToggleShowHidden={() => changeShowHidden(!showHidden)} />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} accent={A} />}
      {showRename && (
        <BatchRenameModal items={flatMulti.length ? flatMulti : lastSelItems}
          onClose={() => setShowRename(false)} onRename={handleRename} accent={A} />
      )}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} accent={A} onClose={() => setCtxMenu(null)}
          items={buildContextItems(ctxMenu, { togglePin, setShowRename, setCtxMenu, handleDelete, tagMap, toggleTag, tagDefs })}
        />
      )}
      {quickLookItem && (
        <QuickLookModal
          item={quickLookItem}
          items={lastSelItems.filter(i => !i?.isDirectory)}
          accent={A}
          onClose={() => setQuickLookItem(null)}
          onNavigate={setQuickLookItem}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          accentKey={accentKey}
          onAccentChange={changeAccent}
          showHidden={showHidden}
          onShowHiddenChange={changeShowHidden}
          confirmDelete={confirmDelete}
          onConfirmDeleteChange={changeConfirmDelete}
          startDir={startDir}
          onStartDirChange={changeStartDir}
        />
      )}
    </div>
  )
}

function PaneColumns({ cascade, selectAt, onCtx, refreshKey, multiSel, colFilters, setColFilters, pinnedCols, onEntries, accent, tagMap, tagDefs, activeTagFilter, cutPaths, starredPaths, starFilter, gitInfo, onDelete, onRename, onCopy, onMove, onToggleStar, quickFilters, showHidden }) {
  const lastPath = cascade[cascade.length - 1]
  const columnPaths = cascade
  return columnPaths.map((dirPath, depth) => (
    <ColumnWithLoader
      key={dirPath + refreshKey}
      dirPath={dirPath}
      selectedPath={cascade[depth + 1] || null}
      multiSel={multiSel[depth + 1] || []}
      filterText={colFilters[dirPath] || ''}
      setFilter={(v) => setColFilters(prev => ({ ...prev, [dirPath]: v }))}
      onSelect={(entry, e) => selectAt(depth + 1, entry, e)}
      onContextMenu={(e, item) => onCtx(e, item, depth + 1)}
      isPinned={pinnedCols.has(dirPath)}
      onTogglePin={() => {}}
      accent={accent}
      onEntries={onEntries}
      quickFilters={quickFilters}
      showHidden={showHidden}
      tagMap={tagMap}
      tagDefs={tagDefs}
      activeTagFilter={activeTagFilter}
      onDelete={onDelete}
      onRename={onRename}
      onCopy={onCopy}
      onMove={onMove}
      cutPaths={cutPaths}
      starredPaths={starredPaths}
      onToggleStar={onToggleStar}
      starFilter={starFilter}
      gitStatuses={gitInfo?.fileStatuses}
    />
  ))
}

function RightPaneColumns({ cascade, onNavigate, nodeMap, registerEntries, refreshKey, multiSel, colFilters, setColFilters, pinnedCols, accent, tagMap, tagDefs, activeTagFilter, cutPaths, starredPaths, starFilter, gitInfo, onDelete, onRename, onCopy, onMove, onToggleStar, quickFilters, showHidden }) {
  const [rightMultiSel, setRightMultiSel] = React.useState({})

  const rightSelectAt = React.useCallback((depth, entry) => {
    const newCascade = [...cascade.slice(0, depth), entry.path]
    onNavigate(newCascade)
    setRightMultiSel({ [depth]: [entry.path] })
  }, [cascade, onNavigate])

  return cascade.map((dirPath, depth) => (
    <ColumnWithLoader
      key={dirPath + refreshKey}
      dirPath={dirPath}
      selectedPath={cascade[depth + 1] || null}
      multiSel={rightMultiSel[depth + 1] || []}
      filterText={colFilters[dirPath] || ''}
      setFilter={(v) => setColFilters(prev => ({ ...prev, [dirPath]: v }))}
      onSelect={(entry) => rightSelectAt(depth + 1, entry)}
      onContextMenu={() => {}}
      isPinned={false}
      onTogglePin={() => {}}
      accent={accent}
      onEntries={registerEntries}
      quickFilters={quickFilters}
      showHidden={showHidden}
      tagMap={tagMap}
      tagDefs={tagDefs}
      activeTagFilter={activeTagFilter}
      onDelete={onDelete}
      onRename={onRename}
      onCopy={onCopy}
      onMove={onMove}
      cutPaths={cutPaths}
      starredPaths={starredPaths}
      onToggleStar={onToggleStar}
      starFilter={starFilter}
      gitStatuses={gitInfo?.fileStatuses}
    />
  ))
}

function ColumnWithLoader({ dirPath, onEntries, quickFilters, showHidden, tagMap, tagDefs, activeTagFilter, onRename, onCopy, onMove, cutPaths, starredPaths, onToggleStar, gitStatuses, ...colProps }) {
  const { entries } = useDirectory(dirPath)

  React.useEffect(() => {
    if (entries.length > 0) onEntries(entries)
  }, [entries, onEntries])

  const extraFilter = React.useMemo(() => {
    const activeKinds = ['image', 'video', 'doc', 'pdf'].filter(k => quickFilters[`kind:${k}`])
    const hasKind = activeKinds.length > 0
    const hasSizeBig = !!quickFilters['size:big']
    const hasToday = !!quickFilters['date:today']
    const hasWeek = !!quickFilters['date:week']
    const hideHidden = !showHidden

    const hasStarFilter = !!colProps.starFilter

    if (!hasKind && !hasSizeBig && !hasToday && !hasWeek && !hideHidden && !activeTagFilter && !hasStarFilter) return null

    return (e) => {
      if (hideHidden && e.name.startsWith('.')) return false
      if (hasKind && !activeKinds.includes(e.kind)) return false
      if (hasSizeBig && (e.isDirectory || e.sizeBytes < 100 * 1024 * 1024)) return false
      if (hasToday) {
        const mod = e.modifiedRaw ? new Date(e.modifiedRaw).toDateString() : null
        if (mod !== new Date().toDateString()) return false
      }
      if (hasWeek) {
        const mod = e.modifiedRaw ? new Date(e.modifiedRaw).getTime() : 0
        if (mod < Date.now() - 7 * 24 * 60 * 60 * 1000) return false
      }
      if (activeTagFilter && !(tagMap?.[e.path] || []).includes(activeTagFilter)) return false
      if (hasStarFilter && !starredPaths?.has(e.path)) return false
      return true
    }
  }, [quickFilters, showHidden, activeTagFilter, tagMap, colProps.starFilter, starredPaths])

  return <CascadeColumn {...colProps} dirPath={dirPath} extraFilter={extraFilter} tagMap={tagMap} tagDefs={tagDefs}
    onRename={onRename} onCopy={onCopy} onMove={onMove} cutPaths={cutPaths}
    starredPaths={starredPaths} onToggleStar={onToggleStar} gitStatuses={gitStatuses} />
}

function StackPreviewLoader({ parentPath, selectedPath, onSelect, onEntries }) {
  const { entries } = useDirectory(parentPath)
  React.useEffect(() => { if (entries.length > 0) onEntries(entries) }, [entries, onEntries])
  return <StackPreviewPanel items={entries} selectedPath={selectedPath} onSelect={onSelect} />
}

function buildContextItems(ctxMenu, { togglePin, setShowRename, setCtxMenu, handleDelete, tagMap, toggleTag, tagDefs }) {
  const item = ctxMenu?.item
  const currentTags = item ? (tagMap[item.path] || []) : []
  return [
    { icon: <IconEye size={12} />, label: 'Open', kbd: '↵', onClick: () => { window.electronAPI?.openExternal(item?.path); setCtxMenu(null) } },
    { icon: <IconWindow size={12} />, label: 'Show in Finder / Explorer', onClick: () => { window.electronAPI?.showInFolder(item?.path); setCtxMenu(null) } },
    { divider: true },
    { icon: <IconPin size={12} />, label: 'Pin column', onClick: () => { if (item) togglePin(item.path); setCtxMenu(null) } },
    { icon: <IconRename size={12} />, label: 'Rename', kbd: 'F2', onClick: () => { setCtxMenu(null); setShowRename(true) } },
    { icon: <IconTag size={12} />, label: 'Tag', sub: (tagDefs || []).map(t => {
      const active = currentTags.includes(t.id)
      return {
        icon: <div style={{ width: 8, height: 8, borderRadius: 99, background: `oklch(${active ? '0.55' : '0.82'} 0.16 ${t.hue})` }} />,
        label: t.name, active,
        onClick: () => { if (item) toggleTag(item.path, t.id) },
      }
    })},
    { divider: true },
    { icon: <IconInfo size={12} />, label: 'Properties', kbd: 'Alt+Enter' },
    { divider: true },
    { icon: <IconTrash size={12} />, label: 'Move to Trash', kbd: '⌫', danger: true, onClick: () => { handleDelete(); setCtxMenu(null) } },
  ]
}
