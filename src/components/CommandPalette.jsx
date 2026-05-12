import React from 'react'
import { FileTile, IconSearch, IconPlus, IconCommand, IconEye } from './icons'
import { useTheme } from '../contexts/ThemeContext'

export default function CommandPalette({ onClose, cascade, setCascade, setShowShortcuts, setStackMode, accent, loadedDirs, showHidden, onToggleShowHidden }) {
  const { T } = useTheme()
  const [q, setQ] = React.useState('')
  const inputRef = React.useRef(null)
  const [kbIdx, setKbIdx] = React.useState(0)

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

  const cachedFiles = React.useMemo(() => {
    const result = []
    for (const [dir, entries] of Object.entries(loadedDirs)) {
      for (const entry of entries) result.push({ ...entry, parentDir: dir })
    }
    return result
  }, [loadedDirs])

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

  const allRows = [...cmdMatched.map(c => ({ type: 'cmd', ...c })), ...matched.map(e => ({ type: 'file', ...e }))]

  const jumpTo = (entry) => {
    const newCascade = [...cascade.slice(0, 1), entry.parentDir, entry.path].filter((v, i, a) => a.indexOf(v) === i)
    setCascade(newCascade)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setKbIdx(i => Math.min(i + 1, allRows.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setKbIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      const row = allRows[kbIdx]
      if (row?.type === 'cmd') row.run()
      else if (row?.type === 'file') jumpTo(row)
    }
  }

  React.useEffect(() => setKbIdx(0), [q])

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,15,30,0.25)',
      backdropFilter: 'blur(3px)', zIndex: 100,
      display: 'flex', justifyContent: 'center', paddingTop: 80,
    }}>
      <div onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown} style={{
        width: 540, height: 'fit-content', maxHeight: 'calc(100% - 100px)',
        background: T.modalBg, backdropFilter: 'blur(28px) saturate(160%)',
        border: `1px solid ${T.borderMid}`, borderRadius: 12,
        boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <IconSearch size={16} color={T.textDim} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search files, run commands…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: T.text }} />
          <kbd style={{ fontSize: 10, padding: '3px 7px', background: T.hoverBg, borderRadius: 4, color: T.textSub }}>ESC</kbd>
        </div>

        <div style={{ overflow: 'auto', padding: 6, maxHeight: 420 }}>
          {cmdMatched.length > 0 && (
            <PaletteSection title="Commands" T={T}>
              {cmdMatched.map((c, i) => (
                <PaletteRow key={c.id} icon={c.icon} title={c.name} accent={accent} T={T}
                  isKb={allRows.indexOf(allRows.find(r => r.id === c.id)) === kbIdx}
                  onClick={c.run}>
                  {c.kbd && <kbd style={{ fontSize: 10, padding: '2px 6px', background: T.hoverBg, borderRadius: 3, color: T.textSub }}>{c.kbd}</kbd>}
                </PaletteRow>
              ))}
            </PaletteSection>
          )}

          {matched.length > 0 && (
            <PaletteSection title={ql ? (searching ? 'Files (searching…)' : 'Files') : 'Recent files'} T={T}>
              {matched.map((entry, fi) => (
                <PaletteRow key={entry.path}
                  icon={<FileTile kind={entry.kind} name={entry.name} size={18} />}
                  title={entry.name} subtitle={entry.parentDir} accent={accent} T={T}
                  isKb={cmdMatched.length + fi === kbIdx}
                  onClick={() => jumpTo(entry)} />
              ))}
            </PaletteSection>
          )}

          {ql && matched.length === 0 && cmdMatched.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
              No matches for "{q}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PaletteSection({ title, children, T }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: 0.5, padding: '6px 12px', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

function PaletteRow({ icon, title, subtitle, children, onClick, accent, T, isKb }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 12px', border: 'none',
      background: (hov || isKb) ? accent.soft : 'transparent',
      borderRadius: 6, cursor: 'pointer', textAlign: 'left',
    }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{subtitle}</div>}
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
