import React from 'react'
import CascadeHeader from './CascadeHeader'
import CascadeSidebar from './CascadeSidebar'
import CascadeColumn from './CascadeColumn'
import CascadeDeepPreview from './CascadeDeepPreview'
import CascadeStatusBar from './CascadeStatusBar'
import CommandPalette from './CommandPalette'
import { CompareView, StackPreview as StackPreviewPanel } from './CompareAndStack'
import { QuickFilters, SelectionBar, BatchRenameModal, ShortcutsModal, ContextMenu } from './features'
import { FileTile, IconEye, IconCopy, IconShare, IconRename, IconTag, IconTrash, IconInfo, IconStar, IconPin, IconWindow } from './icons'
import { useSidebarSections, useDirectory } from '../hooks/useDirectory'
import { TAGS } from './features'

const ACCENTS = {
  purple: { c: '#6f4cb3', soft: 'rgba(111,76,179,.14)', tint: 'rgba(111,76,179,.06)' },
  teal:   { c: '#00838f', soft: 'rgba(0,131,143,.14)',  tint: 'rgba(0,131,143,.06)'  },
  blue:   { c: '#0067c0', soft: 'rgba(0,103,192,.14)',  tint: 'rgba(0,103,192,.06)'  },
  sun:    { c: '#b8651f', soft: 'rgba(184,101,31,.16)', tint: 'rgba(184,101,31,.08)' },
}

export default function CascadeExplorer({ homedir, accent = 'purple' }) {
  const A = ACCENTS[accent] || ACCENTS.purple

  // ── Core cascade state ──────────────────────────────────────
  const [cascade, setCascade] = React.useState(homedir ? [homedir] : [])

  // When homedir resolves, initialise cascade
  React.useEffect(() => {
    if (homedir && cascade.length === 0) setCascade([homedir])
  }, [homedir])

  // ── Per-depth multi-selection: { [depth]: path[] } ──────────
  const [multiSel, setMultiSel] = React.useState({})

  // ── Pinned column IDs (paths) ────────────────────────────────
  const [pinnedCols, setPinnedCols] = React.useState(new Set())

  // ── Per-column filter text: { [dirPath]: string } ────────────
  const [colFilters, setColFilters] = React.useState({})

  // ── Quick filters ────────────────────────────────────────────
  const [quickFilters, setQuickFilters] = React.useState({})

  // ── Show hidden files toggle ─────────────────────────────────
  const [showHidden, setShowHidden] = React.useState(false)

  // ── UI state ─────────────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)
  const [showRename, setShowRename] = React.useState(false)
  const [ctxMenu, setCtxMenu] = React.useState(null)
  const [stackMode, setStackMode] = React.useState(false)

  // ── History trail: back stack and forward stack ─────────────
  const [history, setHistory] = React.useState([])
  const [forwardHistory, setForwardHistory] = React.useState([])

  // ── nodeMap: cache path → entry metadata ────────────────────
  const [nodeMap, setNodeMap] = React.useState({})
  const [loadedDirs, setLoadedDirs] = React.useState({})

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

  // ── Sidebar places ───────────────────────────────────────────
  const places = useSidebarSections(homedir)

  // ── Navigation ──────────────────────────────────────────────
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
      setCascade(cur => {
        setForwardHistory(f => [...f.slice(-9), cur])
        return prev
      })
      return h.slice(0, -1)
    })
  }, [])

  const goForward = React.useCallback(() => {
    setForwardHistory(f => {
      if (f.length === 0) return f
      const next = f[f.length - 1]
      setCascade(cur => {
        setHistory(h => [...h.slice(-9), cur])
        return next
      })
      return f.slice(0, -1)
    })
  }, [])

  const selectAt = React.useCallback((depth, entry, e) => {
    if (e?.metaKey || e?.ctrlKey) {
      const cur = multiSel[depth] || []
      const next = cur.includes(entry.path)
        ? cur.filter(x => x !== entry.path)
        : [...cur, entry.path]
      setMultiSel({ ...multiSel, [depth]: next })
      return
    }
    if (e?.shiftKey) {
      // Range select within the column (simplified — just extend from last)
      const cur = multiSel[depth] || []
      setMultiSel({ ...multiSel, [depth]: [...cur, entry.path] })
      return
    }
    const next = [...cascade.slice(0, depth), entry.path]
    navigateTo(next)
    setMultiSel({ ...multiSel, [depth]: [entry.path] })
  }, [cascade, multiSel, navigateTo])

  const togglePin = React.useCallback((path) => {
    setPinnedCols(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true) }
      else if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setShowShortcuts(true) }
      else if (e.key === 'F2') { e.preventDefault(); setShowRename(true) }
      else if (e.key === 'Backspace' && (e.metaKey || e.altKey)) {
        goBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cascade, navigateTo, goBack])

  // ── Build columns from cascade ───────────────────────────────
  // Each element in cascade that is (or might be) a directory spawns a column.
  // We always show columns for all paths except the last if the last is a file.
  const lastPath = cascade[cascade.length - 1]
  const lastNode = nodeMap[lastPath]
  const lastIsFile = lastNode && !lastNode.isDirectory

  const columnPaths = lastIsFile ? cascade.slice(0, -1) : cascade

  // ── Selected items for preview / compare ────────────────────
  const lastDepth = cascade.length - 1
  const lastSelPaths = multiSel[lastDepth]?.length ? multiSel[lastDepth] : (lastPath ? [lastPath] : [])
  const lastSelItems = lastSelPaths.map(p => nodeMap[p]).filter(Boolean)

  // Total multi-select count (only depths with 2+ selections)
  const totalMulti = Object.values(multiSel).reduce((acc, arr) => acc + (arr?.length > 1 ? arr.length : 0), 0)
  const flatMulti = Object.values(multiSel).flat().map(p => nodeMap[p]).filter(Boolean)

  const onCtx = React.useCallback((e, item, depth) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, item, depth })
  }, [])

  const handleRename = React.useCallback(async (renames) => {
    const api = window.electronAPI
    if (!api) return
    for (const { item, newName } of renames) {
      const dir = item.path.substring(0, Math.max(item.path.lastIndexOf('/'), item.path.lastIndexOf('\\')))
      const newPath = dir + (item.path.includes('/') ? '/' : '\\') + newName
      await api.rename(item.path, newPath)
    }
  }, [])

  const handleDelete = React.useCallback(async () => {
    const api = window.electronAPI
    if (!api) return
    for (const item of flatMulti.length ? flatMulti : lastSelItems) {
      await api.trash(item.path)
    }
    setMultiSel({})
  }, [flatMulti, lastSelItems])

  // Preview target
  const previewItem = lastIsFile ? lastNode : (lastSelItems.length === 1 ? lastSelItems[0] : null)

  // Siblings for stack mode (parent dir's contents)
  const parentPath = cascade.length >= 2 ? cascade[cascade.length - 2] : null

  return (
    <div style={{
      width: '100%', height: '100%',
      fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: '#1a1a1a', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', borderRadius: 10,
      background: 'linear-gradient(180deg, rgba(250,248,253,0.96), rgba(244,242,250,0.92))',
      position: 'relative',
    }}>
      <CascadeHeader
        cascade={cascade}
        nodeMap={nodeMap}
        setCascade={navigateTo}
        openPalette={() => setPaletteOpen(true)}
        history={history}
        canGoBack={history.length > 0}
        canGoForward={forwardHistory.length > 0}
        onGoBack={goBack}
        onGoForward={goForward}
        stackMode={stackMode}
        setStackMode={setStackMode}
        accent={A}
      />

      <QuickFilters filters={quickFilters} setFilters={setQuickFilters} accent={A} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <CascadeSidebar
          cascade={cascade}
          homedir={homedir}
          places={places}
          onJump={navigateTo}
          accent={A}
          setShowShortcuts={setShowShortcuts}
        />

        {/* Column scroll area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'auto', minWidth: 0, scrollSnapType: 'x mandatory', position: 'relative' }}>
          {columnPaths.map((dirPath, depth) => (
            <ColumnWithLoader
              key={dirPath}
              dirPath={dirPath}
              selectedPath={cascade[depth + 1] || null}
              multiSel={multiSel[depth + 1] || []}
              filterText={colFilters[dirPath] || ''}
              setFilter={(v) => setColFilters({ ...colFilters, [dirPath]: v })}
              onSelect={(entry, e) => selectAt(depth + 1, entry, e)}
              onContextMenu={(e, item) => onCtx(e, item, depth + 1)}
              isPinned={pinnedCols.has(dirPath)}
              onTogglePin={() => togglePin(dirPath)}
              accent={A}
              onEntries={registerEntries}
              quickFilters={quickFilters}
              showHidden={showHidden}
            />
          ))}

          {/* Preview / compare / stack */}
          {stackMode && parentPath ? (
            <StackPreviewLoader
              parentPath={parentPath}
              selectedPath={lastPath}
              onSelect={(entry) => {
                navigateTo([...cascade.slice(0, -1), entry.path])
              }}
              onEntries={registerEntries}
            />
          ) : lastSelItems.length > 1 ? (
            <CompareView items={lastSelItems} accent={A} />
          ) : (
            <CascadeDeepPreview item={previewItem} accent={A} />
          )}

          <SelectionBar
            count={totalMulti}
            accent={A}
            onClear={() => setMultiSel({})}
            onAction={(a) => {
              if (a === 'rename') setShowRename(true)
              else if (a === 'delete') handleDelete()
            }}
          />
        </div>
      </div>

      <CascadeStatusBar cascade={cascade} multiSel={multiSel} nodeMap={nodeMap} accent={A} />

      {/* Overlays */}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          cascade={cascade}
          setCascade={navigateTo}
          setShowShortcuts={setShowShortcuts}
          setStackMode={setStackMode}
          accent={A}
          loadedDirs={loadedDirs}
          showHidden={showHidden}
          onToggleShowHidden={() => setShowHidden(v => !v)}
        />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} accent={A} />}
      {showRename && (
        <BatchRenameModal
          items={flatMulti.length ? flatMulti : lastSelItems}
          onClose={() => setShowRename(false)}
          onRename={handleRename}
          accent={A}
        />
      )}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y} accent={A}
          onClose={() => setCtxMenu(null)}
          items={buildContextItems(ctxMenu, {
            togglePin, setShowRename, setCtxMenu, handleDelete
          })}
        />
      )}
    </div>
  )
}

// ── ColumnWithLoader — bridges useDirectory into CascadeColumn ──────────────
function ColumnWithLoader({ dirPath, onEntries, quickFilters, showHidden, ...colProps }) {
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

    if (!hasKind && !hasSizeBig && !hasToday && !hasWeek && !hideHidden) return null

    return (e) => {
      if (hideHidden && e.name.startsWith('.')) return false
      // Folders always pass kind/size/date filters so navigation stays intact
      if (!e.isDirectory) {
        if (hasKind && !activeKinds.includes(e.kind)) return false
        if (hasSizeBig && e.sizeBytes < 100 * 1024 * 1024) return false
        if (hasToday) {
          const mod = e.modifiedRaw ? new Date(e.modifiedRaw).toDateString() : null
          if (mod !== new Date().toDateString()) return false
        }
        if (hasWeek) {
          const mod = e.modifiedRaw ? new Date(e.modifiedRaw).getTime() : 0
          if (mod < Date.now() - 7 * 24 * 60 * 60 * 1000) return false
        }
      }
      return true
    }
  }, [quickFilters, showHidden])

  return <CascadeColumn {...colProps} dirPath={dirPath} extraFilter={extraFilter} />
}

// ── StackPreviewLoader — loads parent dir, passes siblings to StackPreview ──
function StackPreviewLoader({ parentPath, selectedPath, onSelect, onEntries }) {
  const { entries } = useDirectory(parentPath)

  React.useEffect(() => {
    if (entries.length > 0) onEntries(entries)
  }, [entries, onEntries])

  return <StackPreviewPanel items={entries} selectedPath={selectedPath} onSelect={onSelect} />
}

// ── Context menu items builder ───────────────────────────────────────────────
function buildContextItems(ctxMenu, { togglePin, setShowRename, setCtxMenu, handleDelete }) {
  const item = ctxMenu?.item
  return [
    { icon: <IconEye size={12} />, label: 'Open', kbd: '↵', onClick: () => { window.electronAPI?.openExternal(item?.path); setCtxMenu(null) } },
    { icon: <IconWindow size={12} />, label: 'Show in Finder / Explorer', onClick: () => { window.electronAPI?.showInFolder(item?.path); setCtxMenu(null) } },
    { divider: true },
    { icon: <IconPin size={12} />, label: 'Pin column', onClick: () => { if (item) togglePin(item.path); setCtxMenu(null) } },
    { icon: <IconCopy size={12} />, label: 'Copy', kbd: '⌘C' },
    { icon: <IconShare size={12} />, label: 'Move to…', sub: [
      { icon: <FileTile kind="folder" size={12} />, label: 'Documents' },
      { icon: <FileTile kind="folder" size={12} />, label: 'Downloads' },
    ]},
    { icon: <IconRename size={12} />, label: 'Rename', kbd: 'F2', onClick: () => { setCtxMenu(null); setShowRename(true) } },
    { icon: <IconTag size={12} />, label: 'Tag', sub: TAGS.map(t => ({
      icon: <div style={{ width: 8, height: 8, borderRadius: 99, background: `oklch(0.62 0.16 ${t.hue})` }} />,
      label: t.name,
    }))},
    { divider: true },
    { icon: <IconStar size={12} />, label: 'Add to Starred' },
    { icon: <IconInfo size={12} />, label: 'Properties', kbd: '⌘I' },
    { divider: true },
    { icon: <IconTrash size={12} />, label: 'Move to Trash', kbd: '⌫', danger: true, onClick: () => { handleDelete(); setCtxMenu(null) } },
  ]
}
