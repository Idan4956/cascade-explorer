import React from 'react'
import {
  IconChevronRight, IconCopy, IconShare, IconRename, IconTag, IconTrash,
  IconClose, IconGallery, IconPlay, IconClock, IconPlus, IconCommand,
  IconEye, IconInfo, IconStar, FileTile
} from './icons'

const TAGS = [
  { id: 'important', name: 'Important', hue: 12 },
  { id: 'finance', name: 'Finance', hue: 142 },
  { id: 'writing', name: 'Writing', hue: 268 },
]

// ─────────── Context menu ───────────
export function ContextMenu({ x, y, onClose, items, accent }) {
  React.useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
    }
  }, [onClose])

  const [openSub, setOpenSub] = React.useState(null)

  // Ensure menu stays within viewport
  const [pos, setPos] = React.useState({ x, y })
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: x + rect.width > vw ? vw - rect.width - 8 : x,
      y: y + rect.height > vh ? vh - rect.height - 8 : y,
    })
  }, [x, y])

  return (
    <div ref={ref} onClick={(e) => e.stopPropagation()} style={{
      position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, width: 240,
      background: 'rgba(252,251,253,0.98)', backdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
      boxShadow: '0 18px 44px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)',
      padding: 6, fontSize: 12.5,
      fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
    }}>
      {items.map((it, i) => {
        if (it.divider) return <div key={i} style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '4px 8px' }} />
        return <CtxItem key={i} item={it} accent={accent} openSub={openSub} setOpenSub={setOpenSub} index={i} />
      })}
    </div>
  )
}

function CtxItem({ item, accent, openSub, setOpenSub, index }) {
  const [hov, setHov] = React.useState(false)
  const showSub = item.sub && openSub === index
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => { setHov(true); if (item.sub) setOpenSub(index) }}
      onMouseLeave={() => setHov(false)}>
      <button onClick={item.onClick} disabled={item.disabled} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
        border: 'none', background: hov && !item.disabled ? accent.soft : 'transparent', borderRadius: 5,
        color: item.disabled ? '#aaa' : (item.danger ? '#c83a2e' : '#222'),
        cursor: item.disabled ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit',
      }}>
        <span style={{ width: 14, display: 'flex', justifyContent: 'center', color: '#666' }}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.kbd && <kbd style={{ fontSize: 10, color: '#888', fontFamily: 'inherit' }}>{item.kbd}</kbd>}
        {item.sub && <IconChevronRight size={11} color="#888" />}
      </button>
      {showSub && (
        <div style={{
          position: 'absolute', left: '100%', top: -6, marginLeft: 4, width: 200,
          background: 'rgba(252,251,253,0.98)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
          boxShadow: '0 18px 44px rgba(0,0,0,0.22)', padding: 6,
        }}>
          {item.sub.map((s, j) => (
            <button key={j} onClick={s.onClick} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
              border: 'none', background: 'transparent', borderRadius: 5, color: '#222',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12.5,
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = accent.soft}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 14, color: '#666' }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────── Floating selection bar ───────────
export function SelectionBar({ count, accent, onClear, onAction }) {
  if (count === 0) return null
  return (
    <div style={{
      position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      background: 'rgba(34,32,40,0.94)', backdropFilter: 'blur(20px)', color: '#fff',
      borderRadius: 99, padding: '6px 8px 6px 16px', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 12px 36px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.16)',
      fontSize: 12.5,
    }}>
      <span style={{ fontWeight: 600 }}>{count}</span>
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>selected</span>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.18)', margin: '0 4px' }} />
      <SbBtn icon={<IconCopy size={13} />} label="Copy" onClick={() => onAction('copy')} />
      <SbBtn icon={<IconShare size={13} />} label="Move" onClick={() => onAction('move')} />
      <SbBtn icon={<IconRename size={13} />} label="Rename" onClick={() => onAction('rename')} />
      <SbBtn icon={<IconTag size={13} />} label="Tag" onClick={() => onAction('tag')} />
      <SbBtn icon={<IconTrash size={13} />} label="Delete" danger onClick={() => onAction('delete')} />
      <button onClick={onClear} style={{
        width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 99,
        color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2,
      }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <IconClose size={11} />
      </button>
    </div>
  )
}

function SbBtn({ icon, label, danger, onClick }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      height: 28, padding: '0 11px', border: 'none', borderRadius: 99,
      background: hov ? (danger ? 'rgba(232,80,72,0.85)' : 'rgba(255,255,255,0.14)') : 'transparent',
      color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>{icon}{label}</button>
  )
}

// ─────────── Batch rename modal ───────────
export function BatchRenameModal({ items, onClose, onRename, accent }) {
  const [find, setFind] = React.useState('')
  const [replace, setReplace] = React.useState('')
  const [prefix, setPrefix] = React.useState('')
  const [suffix, setSuffix] = React.useState('')
  const [numFrom, setNumFrom] = React.useState(1)
  const [useNum, setUseNum] = React.useState(false)
  const [pad, setPad] = React.useState(3)

  const apply = (name, idx) => {
    const dot = name.lastIndexOf('.')
    let base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    if (find) base = base.split(find).join(replace)
    if (prefix) base = prefix + base
    if (suffix) base = base + suffix
    if (useNum) base = base + ' ' + String(idx + parseInt(numFrom || 1)).padStart(parseInt(pad || 3), '0')
    return base + ext
  }

  const handleRename = async () => {
    if (onRename) {
      const renames = items.map((it, i) => ({ item: it, newName: apply(it.name, i) }))
      await onRename(renames)
    }
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 150, background: 'rgba(20,15,30,0.18)', backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, maxHeight: '80%', background: 'rgba(252,251,253,0.98)', backdropFilter: 'blur(28px)',
        borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconRename size={16} color={accent.c} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Batch rename · {items.length} items</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={12} />
          </button>
        </div>
        <div style={{ padding: 18, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <BrField label="Find"><input value={find} onChange={(e) => setFind(e.target.value)} style={brInputStyle} placeholder="text to find" /></BrField>
            <BrField label="Replace with"><input value={replace} onChange={(e) => setReplace(e.target.value)} style={brInputStyle} placeholder="replacement" /></BrField>
            <BrField label="Prefix"><input value={prefix} onChange={(e) => setPrefix(e.target.value)} style={brInputStyle} placeholder="add to start" /></BrField>
            <BrField label="Suffix"><input value={suffix} onChange={(e) => setSuffix(e.target.value)} style={brInputStyle} placeholder="add to end (before ext)" /></BrField>
          </div>
          <div style={{ marginTop: 12, padding: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, background: 'rgba(0,0,0,0.02)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={useNum} onChange={(e) => setUseNum(e.target.checked)} style={{ accentColor: accent.c }} />
              Append sequence number
            </label>
            {useNum && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <BrField label="Start at"><input type="number" value={numFrom} onChange={(e) => setNumFrom(e.target.value)} style={brInputStyle} /></BrField>
                <BrField label="Padding"><input type="number" value={pad} onChange={(e) => setPad(e.target.value)} style={brInputStyle} /></BrField>
              </div>
            )}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 600, color: '#666', letterSpacing: 0.4, textTransform: 'uppercase' }}>Preview</div>
          <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 6 }}>
            {items.slice(0, 30).map((it, i) => (
              <div key={it.id || i} style={{ display: 'flex', gap: 12, padding: '7px 10px', borderTop: i ? '1px solid rgba(0,0,0,0.04)' : 'none', fontSize: 12 }}>
                <FileTile kind={it.kind} name={it.name} size={16} />
                <div style={{ flex: 1, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                <IconChevronRight size={11} color="#aaa" />
                <div style={{ flex: 1, color: accent.c, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apply(it.name, i)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 12.5, cursor: 'pointer', color: '#222' }}>Cancel</button>
          <button onClick={handleRename} style={{ height: 32, padding: '0 16px', background: accent.c, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>Rename {items.length} items</button>
        </div>
      </div>
    </div>
  )
}

const brInputStyle = { width: '100%', height: 30, padding: '0 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 12.5, outline: 'none', background: '#fff', color: '#222' }

function BrField({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#666' }}>
      <span>{label}</span>
      {children}
    </label>
  )
}

// ─────────── Quick-filter chip row ───────────
export function QuickFilters({ filters, setFilters, accent }) {
  const chips = [
    { id: 'kind:image', label: 'Images', icon: <IconGallery size={11} /> },
    { id: 'kind:video', label: 'Videos', icon: <IconPlay size={10} /> },
    { id: 'kind:doc', label: 'Documents' },
    { id: 'kind:pdf', label: 'PDFs' },
    { id: 'date:today', label: 'Today', icon: <IconClock size={11} /> },
    { id: 'date:week', label: 'This week' },
    { id: 'size:big', label: '> 100 MB' },
  ]
  const anyActive = Object.values(filters).some(Boolean)
  const activeLabels = chips.filter(c => filters[c.id]).map(c => c.label).join(', ')

  return (
    <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      {anyActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: accent.tint, fontSize: 11.5 }}>
          <span style={{ color: accent.c, fontWeight: 600 }}>Filtering: {activeLabels}</span>
          <button onClick={() => setFilters({})} style={{
            marginLeft: 'auto', height: 20, padding: '0 8px', borderRadius: 99,
            border: `1px solid ${accent.c}`, background: 'transparent',
            color: accent.c, fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>✕ Clear</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, padding: '6px 14px', overflow: 'auto', background: 'rgba(252,251,253,0.5)' }}>
        {chips.map(c => {
          const active = filters[c.id]
          return (
            <button key={c.id} onClick={() => setFilters({ ...filters, [c.id]: !active })} style={{
              height: 24, padding: '0 11px', borderRadius: 99,
              border: active ? `1px solid ${accent.c}` : '1px solid rgba(0,0,0,0.1)',
              background: active ? accent.soft : 'transparent',
              color: active ? accent.c : '#444', fontSize: 11.5, fontWeight: active ? 600 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>
              {c.icon}
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────── Shortcuts cheat sheet ───────────
export function ShortcutsModal({ onClose, accent }) {
  const groups = [
    { title: 'Navigation', items: [
      ['Back / Forward', 'Alt + ← / →'],
      ['Up one level', 'Alt + ↑'],
      ['Address bar', '⌘ + L'],
      ['Search', '⌘ + F'],
      ['Command palette', '⌘ + K'],
    ]},
    { title: 'View', items: [
      ['Column view', '⌘ + 2'],
      ['Toggle stack', '⌘ + .'],
      ['Toggle preview', '⌘ + P'],
      ['Toggle sidebar', '⌘ + B'],
      ['Pin column', '⌘ + P'],
    ]},
    { title: 'Files', items: [
      ['New folder', '⌘ + N'],
      ['Rename', 'F2'],
      ['Batch rename', 'F2 (multi)'],
      ['Copy / Cut / Paste', '⌘ + C / X / V'],
      ['Delete', 'Delete'],
    ]},
    { title: 'Select', items: [
      ['Multi-select', '⌘ + click'],
      ['Range select', '⇧ + click'],
      ['Clear selection', 'Esc'],
      ['Select all', '⌘ + A'],
      ['Compare mode', 'select 2+'],
    ]},
  ]
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 150, background: 'rgba(20,15,30,0.18)', backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 620, background: 'rgba(252,251,253,0.98)', backdropFilter: 'blur(28px)',
        borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)', overflow: 'hidden',
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center' }}>
          <IconCommand size={16} color={accent.c} />
          <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600 }}>Keyboard shortcuts</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={12} />
          </button>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {groups.map(g => (
            <div key={g.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{g.title}</div>
              {g.items.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 12.5, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ color: '#222' }}>{k}</span>
                  <kbd style={{ fontSize: 11, padding: '2px 7px', background: 'rgba(0,0,0,0.05)', borderRadius: 4, color: '#444' }}>{v}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────── AI quick actions strip ───────────
export function AIActions({ item, accent }) {
  if (!item) return null
  const actions = (() => {
    if (item.kind === 'image') return [
      { icon: '✨', label: 'Find similar photos' },
      { icon: '🎨', label: 'Extract palette' },
      { icon: '📍', label: 'Where was this taken?' },
    ]
    if (item.kind === 'pdf' || item.kind === 'doc') return [
      { icon: '✨', label: 'Summarize document' },
      { icon: '🔎', label: 'Pull key facts' },
      { icon: '🌐', label: 'Translate to…' },
    ]
    if (item.kind === 'video') return [
      { icon: '✨', label: 'Generate chapters' },
      { icon: '📝', label: 'Transcribe audio' },
      { icon: '🖼', label: 'Pick a thumbnail' },
    ]
    if (item.kind === 'audio') return [
      { icon: '📝', label: 'Transcribe' },
      { icon: '🏷', label: 'Auto-tag genre' },
    ]
    if (item.kind === 'folder') return [
      { icon: '✨', label: 'Tidy up duplicates' },
      { icon: '📊', label: 'Folder report' },
    ]
    return [{ icon: '✨', label: 'Open with AI' }]
  })()
  return (
    <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#888', letterSpacing: 0.5, padding: '4px 0 8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: `linear-gradient(135deg, ${accent.c}, oklch(0.65 0.18 280))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>✨ Smart actions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {actions.map((a, i) => (
          <button key={i}
            onClick={() => alert(`"${a.label}" requires an AI backend.\n\nTo enable Smart Actions, connect an API key in settings.`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', border: '1px solid rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.5)', borderRadius: 6, cursor: 'pointer', fontSize: 12,
              color: '#222', textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = accent.soft; e.currentTarget.style.borderColor = `${accent.c}33` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}>
            <span style={{ width: 16, textAlign: 'center' }}>{a.icon}</span>
            <span style={{ flex: 1 }}>{a.label}</span>
            <IconChevronRight size={11} color="#aaa" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────── Storage treemap ───────────
export function StorageTreemap() {
  const [disk, setDisk] = React.useState(null)

  React.useEffect(() => {
    const api = window.electronAPI
    if (api) api.diskUsage().then(setDisk)
  }, [])

  if (!disk) return <div style={{ fontSize: 10.5, color: '#aaa' }}>Loading storage…</div>

  const fmt = (bytes) => {
    const gb = bytes / (1024 ** 3)
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(0)} MB`
  }

  const usedPct = disk.total > 0 ? disk.used / disk.total : 0
  const freePct = 1 - usedPct

  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div title={`Used · ${fmt(disk.used)}`} style={{ flex: usedPct, background: usedPct > 0.9 ? '#c83a2e' : '#6f4cb3', minWidth: usedPct > 0 ? 4 : 0 }} />
        <div title={`Free · ${fmt(disk.free)}`} style={{ flex: freePct, background: 'rgba(0,0,0,0.08)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#666' }}>
        <span><span style={{ color: '#6f4cb3', fontWeight: 600 }}>●</span> Used {fmt(disk.used)}</span>
        <span><span style={{ color: '#bbb' }}>●</span> Free {fmt(disk.free)}</span>
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{disk.drive} · {fmt(disk.total)} total</div>
    </div>
  )
}

export { TAGS }
