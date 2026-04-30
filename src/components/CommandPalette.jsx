import React from 'react'
import { useDirectory } from '../hooks/useDirectory'
import { FileTile, IconSearch, IconPlus, IconCommand, IconEye } from './icons'

export default function CommandPalette({ onClose, cascade, setCascade, setShowShortcuts, setStackMode, accent, loadedDirs, showHidden, onToggleShowHidden }) {
  const [q, setQ] = React.useState('')
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleNewFolder = async () => {
    const currentDir = cascade[cascade.length - 1]
    if (!currentDir || !window.electronAPI) return
    const name = window.prompt('New folder name:')
    if (!name?.trim()) return
    const sep = currentDir.includes('/') ? '/' : '\\'
    await window.electronAPI.mkdir(currentDir + sep + name.trim())
    onClose()
  }

  const ql = q.toLowerCase()
  const [fsResults, setFsResults] = React.useState([])
  const [searching, setSearching] = React.useState(false)

  // Cached results from already-visited folders (instant)
  const cachedFiles = React.useMemo(() => {
    const result = []
    for (const [dir, entries] of Object.entries(loadedDirs)) {
      for (const entry of entries) result.push({ ...entry, parentDir: dir })
    }
    return result
  }, [loadedDirs])

  // Live filesystem search for queries 2+ chars
  React.useEffect(() => {
    if (ql.length < 2) { setFsResults([]); return }
    const api = window.electronAPI
    if (!api) return
    const rootDir = cascade[0]
    if (!rootDir) return
    setSearching(true)
    let cancelled = false
    api.search(ql, rootDir, 4).then(results => {
      if (!cancelled) { setFsResults(results || []); setSearching(false) }
    })
    return () => { cancelled = true }
  }, [ql, cascade])

  // Merge: filesystem results first, then fill from cache, dedupe by path
  const matched = React.useMemo(() => {
    if (!ql) return cachedFiles.filter(e => e.kind !== 'folder').slice(0, 8)
    const seen = new Set()
    const merged = []
    for (const e of [...fsResults, ...cachedFiles.filter(e => e.name.toLowerCase().includes(ql))]) {
      if (!seen.has(e.path)) { seen.add(e.path); merged.push(e) }
      if (merged.length >= 12) break
    }
    return merged
  }, [ql, fsResults, cachedFiles])

  const commands = [
    { id: 'cmd-new-folder', name: 'New folder', kbd: '⌘N', icon: <IconPlus size={13} />, run: handleNewFolder },
    { id: 'cmd-toggle-stack', name: 'Toggle stack mode', kbd: '⌘.', icon: <StackIcon />, run: () => { setStackMode(s => !s); onClose() } },
    { id: 'cmd-shortcuts', name: 'Show keyboard shortcuts', kbd: '⌘/', icon: <IconCommand size={13} />, run: () => { onClose(); setShowShortcuts(true) } },
    { id: 'cmd-show-hidden', name: showHidden ? 'Hide hidden files' : 'Show hidden files', icon: <IconEye size={13} />, run: () => { onToggleShowHidden(); onClose() } },
  ]

  const cmdMatched = ql ? commands.filter(c => c.name.toLowerCase().includes(ql)) : []

  const jumpTo = (entry) => {
    const newCascade = [...cascade.slice(0, 1), entry.parentDir, entry.path].filter((v, i, a) => a.indexOf(v) === i)
    setCascade(newCascade)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, background: 'rgba(20,15,30,0.18)',
        backdropFilter: 'blur(2px)', zIndex: 100,
        display: 'flex', justifyContent: 'center', paddingTop: 80,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540, height: 'fit-content', maxHeight: 'calc(100% - 100px)',
          background: 'rgba(252,250,255,0.98)', backdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
          boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <IconSearch size={16} color="#888" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files, run commands…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: '#1a1a1a' }}
          />
          <kbd style={{ fontSize: 10, padding: '3px 7px', background: 'rgba(0,0,0,0.06)', borderRadius: 4, color: '#666' }}>ESC</kbd>
        </div>

        <div style={{ overflow: 'auto', padding: 6, maxHeight: 420 }}>
          {cmdMatched.length > 0 && (
            <PaletteSection title="Commands">
              {cmdMatched.map(c => (
                <PaletteRow key={c.id} icon={c.icon} title={c.name} accent={accent} onClick={c.run}>
                  <kbd style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: 3, color: '#666' }}>{c.kbd}</kbd>
                </PaletteRow>
              ))}
            </PaletteSection>
          )}

          {matched.length > 0 && (
            <PaletteSection title={ql ? (searching ? 'Files (searching…)' : 'Files') : 'Recent files'}>
              {matched.map(entry => (
                <PaletteRow
                  key={entry.path}
                  icon={<FileTile kind={entry.kind} name={entry.name} size={18} />}
                  title={entry.name}
                  subtitle={entry.parentDir}
                  accent={accent}
                  onClick={() => jumpTo(entry)}
                />
              ))}
            </PaletteSection>
          )}

          {ql && matched.length === 0 && cmdMatched.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 13 }}>
              No matches for "{q}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PaletteSection({ title, children }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 0.5, padding: '6px 12px', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

function PaletteRow({ icon, title, subtitle, children, onClick, accent }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 12px', border: 'none',
        background: hov ? accent.soft : 'transparent',
        borderRadius: 6, cursor: 'pointer', textAlign: 'left',
      }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </button>
  )
}

function StackIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="6" rx="1.5" />
      <rect x="3" y="11" width="18" height="6" rx="1.5" />
    </svg>
  )
}
