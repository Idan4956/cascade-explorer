import React from 'react'
import { FileTile, IconSearch, IconPlus, IconCommand, IconEye } from './icons'
import { useTheme } from '../contexts/ThemeContext'

// ── Local smart query parser (no API needed) ─────────────────────────────────
function parseSmartQuery(q) {
  const s = q.toLowerCase().trim()

  let kindFilter = null
  if (/\b(photos?|images?|pictures?|screenshots?|\.jpe?g|\.png|\.gif|\.webp)\b/.test(s)) kindFilter = 'image'
  else if (/\b(videos?|movies?|films?|clips?|\.mp4|\.mov|\.mkv|\.avi)\b/.test(s)) kindFilter = 'video'
  else if (/\bpdfs?\b/.test(s)) kindFilter = 'pdf'
  else if (/\b(docs?|documents?|word|excel|spreadsheets?|presentations?|\.docx?|\.xlsx?|\.pptx?)\b/.test(s)) kindFilter = 'doc'
  else if (/\b(audio|music|songs?|tracks?|\.mp3|\.wav|\.flac|\.aac)\b/.test(s)) kindFilter = 'audio'
  else if (/\b(code|scripts?|source|\.jsx?|\.tsx?|\.py|\.go|\.rs)\b/.test(s)) kindFilter = 'code'
  else if (/\b(folders?|director(y|ies))\b/.test(s)) kindFilter = 'folder'

  let dateRange = null
  const now = Date.now()
  const day = 86400000
  if (/\btoday\b/.test(s)) {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    dateRange = { from: d.getTime() }
  } else if (/\byesterday\b/.test(s)) {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    dateRange = { from: d.getTime() - day, to: d.getTime() }
  } else if (/\b(this week|last 7 days?)\b/.test(s)) {
    dateRange = { from: now - 7 * day }
  } else if (/\blast week\b/.test(s)) {
    dateRange = { from: now - 14 * day, to: now - 7 * day }
  } else if (/\b(this month|last 30 days?)\b/.test(s)) {
    dateRange = { from: now - 30 * day }
  } else if (/\blast month\b/.test(s)) {
    dateRange = { from: now - 60 * day, to: now - 30 * day }
  } else if (/\bthis year\b/.test(s)) {
    dateRange = { from: new Date(new Date().getFullYear(), 0, 1).getTime() }
  } else if (/\blast year\b/.test(s)) {
    const y = new Date().getFullYear() - 1
    dateRange = { from: new Date(y, 0, 1).getTime(), to: new Date(y, 11, 31, 23, 59).getTime() }
  } else if (/\brecent(ly)?\b/.test(s)) {
    dateRange = { from: now - 7 * day }
  }

  let sizeMin = null
  const szMatch = s.match(/(?:over|>|larger? than|bigger? than|more than|at least)\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i)
  if (szMatch) {
    const mult = { kb: 1024, mb: 1 << 20, gb: 1 << 30 }[szMatch[2].toLowerCase()]
    sizeMin = parseFloat(szMatch[1]) * mult
  } else if (/\b(large|big|huge|heavy) files?\b/.test(s)) {
    sizeMin = 50 * (1 << 20)
  }

  const text = s
    .replace(/\b(photos?|images?|pictures?|screenshots?|videos?|movies?|films?|clips?|pdfs?|docs?|documents?|word|excel|spreadsheets?|presentations?|audio|music|songs?|tracks?|code|scripts?|source|folders?|director(?:y|ies))\b/g, '')
    .replace(/\b(today|yesterday|this week|last week|this month|last month|this year|last year|recently?|last \d+ days?)\b/g, '')
    .replace(/(?:over|>|larger? than|bigger? than|more than|at least)\s*\d+(?:\.\d+)?\s*(?:kb|mb|gb)/gi, '')
    .replace(/\b(large|big|huge|heavy) files?\b/g, '')
    .replace(/\b(find|search|show|get|look for|where|are|my|me|all|the|for|from|in|with|a|an)\b/g, '')
    .replace(/\s+/g, ' ').trim()

  const label = [
    kindFilter && `${kindFilter}s`,
    dateRange && (
      /today/.test(s) ? 'from today' :
      /yesterday/.test(s) ? 'from yesterday' :
      /this week|last 7/.test(s) ? 'from this week' :
      /last week/.test(s) ? 'from last week' :
      /this month|last 30/.test(s) ? 'from this month' :
      /last month/.test(s) ? 'from last month' :
      /this year/.test(s) ? 'from this year' :
      /last year/.test(s) ? 'from last year' : 'recent'
    ),
    sizeMin && `over ${sizeMin >= (1 << 30) ? (sizeMin >> 30) + 'GB' : sizeMin >= (1 << 20) ? (sizeMin >> 20) + 'MB' : (sizeMin >> 10) + 'KB'}`,
    text && `matching "${text}"`,
  ].filter(Boolean).join(', ')

  return { text: text || null, kindFilter, dateRange, sizeMin, label, hasFilters: !!(kindFilter || dateRange || sizeMin) }
}

export default function CommandPalette({ onClose, cascade, setCascade, setShowShortcuts, setStackMode, accent, loadedDirs, showHidden, onToggleShowHidden }) {
  const { T } = useTheme()
  const [q, setQ] = React.useState('')
  const inputRef = React.useRef(null)
  const [kbIdx, setKbIdx] = React.useState(0)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiResult, setAiResult] = React.useState(null)
  const [hasAiKey, setHasAiKey] = React.useState(false)

  React.useEffect(() => {
    window.electronAPI?.aiHasKey().then(v => setHasAiKey(!!v))
  }, [])

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

  // Smart parse on every keystroke — free, instant
  const smart = React.useMemo(() => parseSmartQuery(q), [q])
  const searchText = smart.hasFilters ? (smart.text || '') : q.toLowerCase()
  const ql = searchText.toLowerCase()

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
    const base = ql.length >= 2
      ? (() => {
          const seen = new Set()
          const merged = []
          for (const e of [...fsResults, ...cachedFiles.filter(e => e.name.toLowerCase().includes(ql))]) {
            if (!seen.has(e.path)) { seen.add(e.path); merged.push(e) }
            if (merged.length >= 40) break
          }
          return merged
        })()
      : cachedFiles.filter(e => e.kind !== 'folder').slice(0, 40)

    if (!smart.hasFilters) return base.slice(0, 12)

    return base.filter(e => {
      if (smart.kindFilter && e.kind !== smart.kindFilter) return false
      if (smart.dateRange) {
        const mod = e.modifiedRaw ? new Date(e.modifiedRaw).getTime() : 0
        if (smart.dateRange.from && mod < smart.dateRange.from) return false
        if (smart.dateRange.to && mod > smart.dateRange.to) return false
      }
      if (smart.sizeMin && (e.isDirectory || (e.sizeBytes || 0) < smart.sizeMin)) return false
      return true
    }).slice(0, 20)
  }, [ql, fsResults, cachedFiles, smart])

  const commands = [
    { id: 'cmd-new-folder', name: 'New folder', kbd: 'Ctrl+N', icon: <IconPlus size={13} />, run: handleNewFolder },
    { id: 'cmd-toggle-stack', name: 'Toggle stack mode', icon: <StackIcon />, run: () => { setStackMode(s => !s); onClose() } },
    { id: 'cmd-shortcuts', name: 'Show keyboard shortcuts', kbd: 'Ctrl+/', icon: <IconCommand size={13} />, run: () => { onClose(); setShowShortcuts(true) } },
    { id: 'cmd-show-hidden', name: showHidden ? 'Hide hidden files' : 'Show hidden files', icon: <IconEye size={13} />, run: () => { onToggleShowHidden(); onClose() } },
  ]

  const cmdMatched = ql ? commands.filter(c => c.name.toLowerCase().includes(ql)) : []
  const allRows = [...cmdMatched.map(c => ({ type: 'cmd', ...c })), ...matched.map(e => ({ type: 'file', ...e }))]

  const jumpTo = (entry) => {
    const newCascade = [...cascade.slice(0, 1), entry.parentDir, entry.path].filter((v, i, a) => a.indexOf(v) === i)
    setCascade(newCascade)
    onClose()
  }

  const isNaturalLanguage = q.trim().split(/\s+/).length >= 3

  const runAiSearch = async () => {
    const api = window.electronAPI
    if (!api) return
    setAiLoading(true)
    setAiResult(null)
    const fileNames = Object.values(loadedDirs).flat().map(e => e.name).slice(0, 80).join(', ')
    const res = await api.aiQuery({
      messages: [{
        role: 'user',
        content: `You are a file search assistant. The user wants to find files matching: "${q}"\n\nFiles available (sample): ${fileNames || 'none loaded yet'}\n\nRespond ONLY with a JSON object (no explanation) with these optional fields:\n- "search": string to match in filenames\n- "kind": one of "image", "video", "doc", "pdf", "audio", "code", "folder"\n- "note": one sentence explaining what you're searching for\n\nExample: {"search": "invoice", "kind": "pdf", "note": "Looking for PDF invoice files"}`,
      }],
      maxTokens: 200,
    })
    setAiLoading(false)
    if (res.error) { setAiResult({ error: res.error }); return }
    try {
      const json = JSON.parse(res.content.match(/\{[\s\S]*\}/)?.[0] || '{}')
      setAiResult(json)
      if (json.search) setQ(json.search)
    } catch {
      setAiResult({ error: 'Could not parse AI response' })
    }
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

  const isSearching = searching && ql.length >= 2

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,15,30,0.25)',
      backdropFilter: 'blur(3px)', zIndex: 100,
      display: 'flex', justifyContent: 'center', paddingTop: 80,
    }}>
      <div onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown} style={{
        width: 560, height: 'fit-content', maxHeight: 'calc(100% - 100px)',
        background: T.modalBg, backdropFilter: 'blur(28px) saturate(160%)',
        border: `1px solid ${T.borderMid}`, borderRadius: 12,
        boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <IconSearch size={16} color={T.textDim} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setAiResult(null) }}
            placeholder='Search files — or try "photos from last week"'
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: T.text }}
          />
          {isSearching && <span style={{ fontSize: 11, color: T.textFaint }}>searching…</span>}
          {hasAiKey && isNaturalLanguage && !smart.hasFilters && (
            <button onClick={runAiSearch} disabled={aiLoading} style={{
              height: 26, padding: '0 10px', border: 'none',
              background: aiLoading ? accent.soft : accent.c,
              color: '#fff', borderRadius: 5, fontSize: 11.5, fontWeight: 600,
              cursor: aiLoading ? 'default' : 'pointer', flexShrink: 0,
            }}>
              {aiLoading ? '…' : '✨ Ask AI'}
            </button>
          )}
          <kbd style={{ fontSize: 10, padding: '3px 7px', background: T.hoverBg, borderRadius: 4, color: T.textSub }}>ESC</kbd>
        </div>

        {/* Smart search banner */}
        {smart.hasFilters && (
          <div style={{
            padding: '7px 18px', background: accent.soft,
            borderBottom: `1px solid ${accent.c}22`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: accent.c,
          }}>
            <span style={{ fontWeight: 700 }}>🔍</span>
            <span style={{ flex: 1 }}>Smart search: <strong>{smart.label}</strong></span>
            <span style={{ fontSize: 11, color: T.textFaint }}>{matched.length} result{matched.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div style={{ overflow: 'auto', padding: 6, maxHeight: 420 }}>
          {cmdMatched.length > 0 && (
            <PaletteSection title="Commands" T={T}>
              {cmdMatched.map((c) => (
                <PaletteRow key={c.id} icon={c.icon} title={c.name} accent={accent} T={T}
                  isKb={allRows.findIndex(r => r.id === c.id) === kbIdx}
                  onClick={c.run}>
                  {c.kbd && <kbd style={{ fontSize: 10, padding: '2px 6px', background: T.hoverBg, borderRadius: 3, color: T.textSub }}>{c.kbd}</kbd>}
                </PaletteRow>
              ))}
            </PaletteSection>
          )}

          {matched.length > 0 && (
            <PaletteSection title={smart.hasFilters ? 'Smart results' : (ql ? (isSearching ? 'Files (searching…)' : 'Files') : 'Recent files')} T={T}>
              {matched.map((entry, fi) => (
                <PaletteRow key={entry.path}
                  icon={<FileTile kind={entry.kind} name={entry.name} size={18} />}
                  title={entry.name}
                  subtitle={entry.parentDir}
                  accent={accent} T={T}
                  isKb={cmdMatched.length + fi === kbIdx}
                  onClick={() => jumpTo(entry)}>
                  {entry.size && <span style={{ fontSize: 10.5, color: T.textFaint, flexShrink: 0 }}>{entry.size}</span>}
                </PaletteRow>
              ))}
            </PaletteSection>
          )}

          {aiResult && !aiResult.error && (
            <div style={{ margin: '4px 6px', padding: '10px 14px', background: accent.soft, borderRadius: 8, border: `1px solid ${accent.c}33` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: accent.c, marginBottom: 4 }}>✨ AI interpreted your search</div>
              {aiResult.note && <div style={{ fontSize: 12, color: T.text }}>{aiResult.note}</div>}
              {aiResult.search && <div style={{ fontSize: 11.5, color: T.textSub, marginTop: 3 }}>Searching for: <strong>"{aiResult.search}"</strong></div>}
            </div>
          )}
          {aiResult?.error && (
            <div style={{ margin: '4px 6px', padding: '10px 14px', background: '#c83a2e22', borderRadius: 8, border: '1px solid #c83a2e44', fontSize: 12, color: '#c83a2e' }}>
              {aiResult.error}
            </div>
          )}

          {q && matched.length === 0 && cmdMatched.length === 0 && !aiResult && (
            <div style={{ padding: '24px 32px', textAlign: 'center', color: T.textDim, fontSize: 13 }}>
              {smart.hasFilters
                ? <span>No {smart.label} found</span>
                : <span>No matches for "{q}"</span>
              }
              {hasAiKey && isNaturalLanguage && !smart.hasFilters && (
                <button onClick={runAiSearch} style={{
                  display: 'block', margin: '10px auto 0', padding: '6px 16px',
                  background: accent.c, color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                }}>
                  ✨ Search with AI
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hint bar */}
        {!q && (
          <div style={{ padding: '7px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 14, fontSize: 10.5, color: T.textFaint }}>
            {['photos from last week', 'pdfs from this year', 'large files', 'videos from yesterday'].map(hint => (
              <button key={hint} onClick={() => setQ(hint)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.textFaint, fontSize: 10.5, padding: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.color = accent.c}
                onMouseLeave={e => e.currentTarget.style.color = T.textFaint}>
                {hint}
              </button>
            ))}
          </div>
        )}
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
