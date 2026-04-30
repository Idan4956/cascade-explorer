import React from 'react'
import { useDirectory } from '../hooks/useDirectory'
import { FileTile, kindLabel, IconFilter, IconChevronUp, IconChevronDown, IconChevronRight, IconPin } from './icons'
import { TAGS } from './features'

export default function CascadeColumn({
  dirPath,
  selectedPath,
  multiSel,
  filterText,
  setFilter,
  onSelect,
  onContextMenu,
  isPinned,
  onTogglePin,
  accent,
  extraFilter,
  tagMap,
}) {
  const { entries, loading, error, refresh } = useDirectory(dirPath)
  const [showFilter, setShowFilter] = React.useState(false)
  const [sortDir, setSortDir] = React.useState('asc')

  const filtered = React.useMemo(() => {
    return entries
      .filter(e => !filterText || e.name.toLowerCase().includes(filterText.toLowerCase()))
      .filter(e => !extraFilter || extraFilter(e))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [entries, filterText, sortDir, extraFilter])

  return (
    <div style={{
      width: 240, minWidth: 240, maxWidth: 240,
      borderRight: '1px solid rgba(0,0,0,0.06)',
      background: isPinned
        ? `linear-gradient(180deg, ${accent.tint}, rgba(255,255,255,0.55))`
        : 'rgba(255,255,255,0.55)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      scrollSnapAlign: 'start', flexShrink: 0,
    }}>
      {/* Column header */}
      <div style={{
        padding: '0 8px 0 12px', height: 28,
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 10.5, color: '#888', borderBottom: '1px solid rgba(0,0,0,0.05)',
        fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 0,
      }}>
        <span style={{ flex: 1 }}>
          {loading ? '…' : error ? '!' : `${filtered.length} of ${entries.length}`}
        </span>
        <HeaderBtn active={showFilter} onClick={() => setShowFilter(v => !v)} title="Filter column">
          <IconFilter size={10} />
        </HeaderBtn>
        <HeaderBtn onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} title="Sort">
          {sortDir === 'asc' ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}
        </HeaderBtn>
        <HeaderBtn active={isPinned} onClick={onTogglePin} title={isPinned ? 'Unpin column' : 'Pin column'}>
          <IconPin size={10} />
        </HeaderBtn>
      </div>

      {/* Column filter input */}
      {showFilter && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <input
            value={filterText}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            autoFocus
            style={{
              width: '100%', height: 24, padding: '0 8px',
              border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4,
              fontSize: 11.5, outline: 'none', background: '#fff',
            }}
          />
        </div>
      )}

      {/* Items list */}
      <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
        {error && (
          <div style={{ padding: '12px 10px', fontSize: 11.5, color: '#c83a2e', textAlign: 'center' }}>
            {error.includes('EACCES') ? 'Permission denied' : error.includes('ENOENT') ? 'Folder not found' : 'Cannot read folder'}
          </div>
        )}
        {!error && filtered.map(item => {
          const isSel = selectedPath === item.path || multiSel.includes(item.path)
          const isMulti = multiSel.includes(item.path) && multiSel.length > 1
          const itemTags = tagMap?.[item.path] || item.tags || []
          const hasTags = itemTags.length > 0

          return (
            <button
              key={item.path}
              onClick={(e) => onSelect(item, e)}
              onContextMenu={(e) => onContextMenu(e, item)}
              draggable
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 10px', borderRadius: 5, border: 'none',
                background: isSel ? (isMulti ? accent.soft : accent.c) : 'transparent',
                color: isSel && !isMulti ? '#fff' : '#222',
                cursor: 'pointer', fontSize: 12, textAlign: 'left',
              }}
              onMouseEnter={(e) => !isSel && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
              onMouseLeave={(e) => !isSel && (e.currentTarget.style.background = 'transparent')}>
              <FileTile kind={item.kind} name={item.name} size={18} />
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: isSel ? 500 : 400,
              }}>
                {item.name}
              </span>
              {hasTags && itemTags.map(t => {
                const tag = TAGS.find(x => x.id === t)
                return tag && (
                  <div key={t} style={{ width: 6, height: 6, borderRadius: 99, background: `oklch(0.62 0.16 ${tag.hue})`, flex: 'none' }} />
                )
              })}
              {item.isDirectory && (
                <IconChevronRight size={11} color={isSel && !isMulti ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.35)'} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HeaderBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 18, height: 18, border: 'none',
        background: active ? 'rgba(111,76,179,0.14)' : 'transparent',
        borderRadius: 3,
        color: active ? '#6f4cb3' : '#888',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {children}
    </button>
  )
}
