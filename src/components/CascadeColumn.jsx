import React from 'react'
import { useDirectory } from '../hooks/useDirectory'
import { FileTile, IconFilter, IconChevronUp, IconChevronDown, IconChevronRight, IconPin, IconTrash, IconRename, IconCopy, IconGrid, IconList } from './icons'
import { useTheme } from '../contexts/ThemeContext'

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
  tagDefs = [],
  onDelete,
  onRename,
  onCopy,
  onMove,
  cutPaths,
  starredPaths,
  onToggleStar,
  gitStatuses,
}) {
  const { T } = useTheme()
  const { entries, loading, error, refresh } = useDirectory(dirPath)
  const [showFilter, setShowFilter] = React.useState(false)
  const [sortField, setSortField] = React.useState('name') // 'name' | 'modified' | 'size'
  const [sortDir, setSortDir] = React.useState('asc')
  const [creating, setCreating] = React.useState(null)
  const [newName, setNewName] = React.useState('')
  const [showNewMenu, setShowNewMenu] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState(null)
  const [renamingPath, setRenamingPath] = React.useState(null)
  const [renameValue, setRenameValue] = React.useState('')
  const [dragOverPath, setDragOverPath] = React.useState(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [kbIdx, setKbIdx] = React.useState(-1)
  const [viewMode, setViewMode] = React.useState('list') // 'list' | 'grid'
  const newInputRef = React.useRef(null)
  const renameInputRef = React.useRef(null)

  React.useEffect(() => { if (creating && newInputRef.current) newInputRef.current.focus() }, [creating])
  React.useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingPath])

  const startCreating = (type) => {
    setShowNewMenu(false)
    setCreating(type)
    setNewName(type === 'folder' ? 'New Folder' : 'New File.txt')
  }

  const confirmCreate = async () => {
    const name = newName.trim()
    if (!name) { setCreating(null); return }
    const sep = dirPath.includes('\\') ? '\\' : '/'
    const fullPath = dirPath.replace(/[\\/]$/, '') + sep + name
    const api = window.electronAPI
    if (creating === 'folder') await api?.mkdir(fullPath)
    else await api?.createFile(fullPath)
    setCreating(null)
    setNewName('')
    refresh()
  }

  const cancelCreate = () => { setCreating(null); setNewName('') }

  const startRename = (item, e) => {
    e.stopPropagation()
    setRenamingPath(item.path)
    setRenameValue(item.name)
  }

  const confirmRename = () => {
    const name = renameValue.trim()
    const orig = entries.find(e => e.path === renamingPath)
    if (name && orig && name !== orig.name) onRename?.(orig, name)
    setRenamingPath(null)
  }

  const cancelRename = () => setRenamingPath(null)

  const sortFieldLabel = { name: 'A–Z', modified: 'Date', size: 'Size' }
  const nextSortField = { name: 'modified', modified: 'size', size: 'name' }

  const filtered = React.useMemo(() => {
    return entries
      .filter(e => !filterText || e.name.toLowerCase().includes(filterText.toLowerCase()))
      .filter(e => !extraFilter || extraFilter(e))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        let cmp = 0
        if (sortField === 'name') cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        else if (sortField === 'modified') cmp = (a.modifiedRaw || '') < (b.modifiedRaw || '') ? -1 : 1
        else if (sortField === 'size') cmp = (a.sizeBytes || 0) - (b.sizeBytes || 0)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [entries, filterText, sortDir, sortField, extraFilter])

  const handleKeyDown = (e) => {
    if (filtered.length === 0 || renamingPath || creating) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setKbIdx(i => Math.min(i < 0 ? 0 : i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setKbIdx(i => Math.max(i < 0 ? filtered.length - 1 : i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault()
      const idx = kbIdx >= 0 ? kbIdx : 0
      if (filtered[idx]) onSelect(filtered[idx], {})
    } else if (e.key === 'Escape') {
      setKbIdx(-1)
    }
  }

  const inputStyle = {
    flex: 1, height: 24, padding: '0 8px',
    border: `1px solid ${T.inputBorder}`, borderRadius: 4,
    fontSize: 11.5, outline: 'none',
    background: T.inputBg, color: T.text,
  }

  const pinnedBg = T.dark
    ? `linear-gradient(180deg, ${accent.tint}, ${T.columnBg})`
    : `linear-gradient(180deg, ${accent.tint}, rgba(255,255,255,0.55))`

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setKbIdx(-1)}
      style={{
        width: 240, minWidth: 240, maxWidth: 240,
        borderRight: `1px solid ${T.border}`,
        background: isPinned ? pinnedBg : T.columnBg,
        display: 'flex', flexDirection: 'column', minHeight: 0,
        scrollSnapAlign: 'start', flexShrink: 0,
        outline: 'none',
      }}>

      {/* Column header */}
      <div style={{
        padding: '0 8px 0 12px', height: 28,
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 10.5, color: T.textDim, borderBottom: `1px solid ${T.border}`,
        fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 0,
      }}>
        <span style={{ flex: 1 }}>
          {loading ? '…' : error ? '!' : `${filtered.length} of ${entries.length}`}
        </span>
        <div style={{ position: 'relative' }}>
          <HeaderBtn onClick={() => setShowNewMenu(v => !v)} title="New file or folder" active={showNewMenu} T={T}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>+</span>
          </HeaderBtn>
          {showNewMenu && (
            <div style={{
              position: 'absolute', top: 22, right: 0, zIndex: 100,
              background: T.modalBg, border: `1px solid ${T.borderMid}`,
              borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              overflow: 'hidden', minWidth: 130,
            }}>
              {[['folder','📁','New Folder'],['file','📄','New File']].map(([type, icon, label]) => (
                <button key={type} onClick={() => startCreating(type)} style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', textAlign: 'left',
                  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: T.text,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>
          )}
        </div>
        <HeaderBtn active={showFilter} onClick={() => setShowFilter(v => !v)} title="Filter column" T={T}>
          <IconFilter size={10} />
        </HeaderBtn>
        {/* Sort field cycle */}
        <HeaderBtn onClick={() => setSortField(f => nextSortField[f])} title={`Sort by: ${sortFieldLabel[sortField]}`} T={T}>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0 }}>{sortFieldLabel[sortField]}</span>
        </HeaderBtn>
        <HeaderBtn onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} title={sortDir === 'asc' ? 'Ascending' : 'Descending'} T={T}>
          {sortDir === 'asc' ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}
        </HeaderBtn>
        <HeaderBtn active={viewMode === 'grid'} onClick={() => setViewMode(m => m === 'list' ? 'grid' : 'list')} title={viewMode === 'list' ? 'Grid view' : 'List view'} T={T}>
          {viewMode === 'list' ? <IconGrid size={10} /> : <IconList size={10} />}
        </HeaderBtn>
        <HeaderBtn active={isPinned} onClick={onTogglePin} title={isPinned ? 'Unpin column' : 'Pin column'} T={T}>
          <IconPin size={10} />
        </HeaderBtn>
      </div>

      {/* Column filter input */}
      {showFilter && (
        <div style={{ padding: '6px 8px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <input value={filterText} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" autoFocus
            style={{ width: '100%', height: 24, padding: '0 8px', border: `1px solid ${T.inputBorder}`, borderRadius: 4, fontSize: 11.5, outline: 'none', background: T.inputBg, color: T.text }} />
        </div>
      )}

      {/* Items list */}
      <div
        style={{
          flex: 1, overflow: 'auto', padding: 4,
          background: isDragOver ? (T.dark ? 'rgba(111,76,179,0.08)' : 'rgba(111,76,179,0.04)') : undefined,
          transition: 'background 0.1s',
        }}
        onClick={() => setShowNewMenu(false)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('text/cascade-path')) {
            e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true)
          }
        }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={(e) => {
          const srcPath = e.dataTransfer.getData('text/cascade-path')
          setIsDragOver(false)
          if (srcPath && onMove) { e.preventDefault(); onMove(srcPath, dirPath) }
        }}>

        {/* Inline creation row */}
        {creating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', marginBottom: 2 }}>
            <FileTile kind={creating === 'folder' ? 'folder' : 'file'} size={18} />
            <input ref={newInputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') cancelCreate() }}
              onBlur={confirmCreate}
              style={{ ...inputStyle, border: `1px solid ${accent.c}55` }} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 10px', fontSize: 11.5, color: '#c83a2e', textAlign: 'center' }}>
            {error.includes('EACCES') ? 'Permission denied' : error.includes('ENOENT') ? 'Folder not found' : 'Cannot read folder'}
          </div>
        )}

        {!error && viewMode === 'grid' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 4 }}>
            {filtered.map(item => {
              const isSel = selectedPath === item.path || multiSel.includes(item.path)
              const isCut = cutPaths?.has(item.path)
              const isStarred = starredPaths?.has(item.path)
              const selBg = isSel ? accent.c : 'transparent'
              return (
                <button
                  key={item.path}
                  onClick={(e) => onSelect(item, e)}
                  onContextMenu={(e) => onContextMenu(e, item)}
                  title={item.name}
                  style={{
                    width: 72, minHeight: 74, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'flex-start', gap: 4, padding: '8px 4px 6px',
                    borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'center',
                    background: selBg, color: isSel ? '#fff' : T.text,
                    opacity: isCut ? 0.4 : 1,
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = T.hoverBg }}
                  onMouseLeave={e => { e.currentTarget.style.background = selBg }}>
                  <div style={{ position: 'relative' }}>
                    <FileTile kind={item.kind} name={item.name} size={26} />
                    {isStarred && (
                      <div style={{ position: 'absolute', top: -3, right: -4, width: 8, height: 8 }}>
                        <svg viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10.5, lineHeight: 1.3, width: '100%',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-all',
                  }}>
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!error && viewMode === 'list' && filtered.map((item, idx) => {
          const isSel = selectedPath === item.path || multiSel.includes(item.path)
          const isMulti = multiSel.includes(item.path) && multiSel.length > 1
          const itemTags = tagMap?.[item.path] || item.tags || []
          const hasTags = itemTags.length > 0
          const isHovered = hoveredItem === item.path
          const isRenaming = renamingPath === item.path
          const isDragTarget = dragOverPath === item.path && item.isDirectory
          const isCut = cutPaths?.has(item.path)
          const isStarred = starredPaths?.has(item.path)
          const gitStatus = gitStatuses?.[item.path]
          const isKb = kbIdx === idx
          const showCheck = isHovered || isMulti

          const rowBg = isDragTarget
            ? accent.soft
            : isSel ? (isMulti ? accent.soft : accent.c) : (isKb ? T.hoverBg : (isHovered ? T.hoverBg : 'transparent'))

          return (
            <div
              key={item.path}
              ref={isKb ? el => el?.scrollIntoView({ block: 'nearest' }) : null}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', opacity: isCut ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}>

              {/* Multi-select checkbox */}
              {showCheck && (
                <div
                  onClick={(e) => { e.stopPropagation(); onSelect(item, { ctrlKey: true }) }}
                  style={{
                    position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
                    width: 14, height: 14, borderRadius: 3, zIndex: 5,
                    border: isMulti ? 'none' : `1.5px solid ${T.borderMid}`,
                    background: isMulti ? accent.c : (T.dark ? 'rgba(30,25,50,0.9)' : 'rgba(255,255,255,0.92)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}>
                  {isMulti && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              )}

              <button
                onClick={(e) => !isRenaming && onSelect(item, e)}
                onContextMenu={(e) => onContextMenu(e, item)}
                draggable={!isRenaming}
                onDragStart={(e) => { e.dataTransfer.setData('text/cascade-path', item.path); e.dataTransfer.effectAllowed = 'move' }}
                onDragOver={(e) => {
                  if (item.isDirectory && e.dataTransfer.types.includes('text/cascade-path')) {
                    e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragOverPath(item.path); setIsDragOver(false)
                  }
                }}
                onDragLeave={() => setDragOverPath(null)}
                onDrop={(e) => {
                  if (item.isDirectory) {
                    const srcPath = e.dataTransfer.getData('text/cascade-path')
                    setDragOverPath(null)
                    if (srcPath && srcPath !== item.path && onMove) { e.preventDefault(); e.stopPropagation(); onMove(srcPath, item.path) }
                  }
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '6px 10px', paddingRight: isHovered ? 96 : 10,
                  borderRadius: 4, border: 'none',
                  background: rowBg,
                  color: isSel && !isMulti ? '#fff' : T.text,
                  cursor: 'pointer', fontSize: 12, textAlign: 'left', flex: 1,
                  outline: (isDragTarget || isKb) ? `1px solid ${accent.c}44` : 'none',
                }}>
                <FileTile kind={item.kind} name={item.name} size={18} />
                {isRenaming ? (
                  <input ref={renameInputRef} value={renameValue} onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmRename() } if (e.key === 'Escape') { e.preventDefault(); cancelRename() } }}
                    onBlur={confirmRename}
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, height: 22, padding: '0 6px', border: `1px solid ${accent.c}`, borderRadius: 4, fontSize: 12, outline: 'none', background: T.inputBg, color: T.text }} />
                ) : (
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSel ? 500 : 400 }}>
                    {item.name}
                  </span>
                )}
                {!isRenaming && hasTags && itemTags.map(t => {
                  const tag = tagDefs.find(x => x.id === t)
                  return tag && <div key={t} style={{ width: 6, height: 6, borderRadius: 99, background: `oklch(0.62 0.16 ${tag.hue})`, flex: 'none' }} />
                })}
                {!isRenaming && isStarred && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1" style={{ flex: 'none' }}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                )}
                {!isRenaming && gitStatus && (
                  <div title={gitStatus} style={{
                    width: 6, height: 6, borderRadius: 99, flex: 'none',
                    background: gitStatus === 'staged' ? '#3fa45a' : gitStatus === 'untracked' ? '#0067c0' : '#e8a020',
                  }} />
                )}
                {!isRenaming && item.isDirectory && (
                  <IconChevronRight size={11} color={isSel && !isMulti ? 'rgba(255,255,255,0.85)' : T.textFaint} />
                )}
              </button>

              {isHovered && !isRenaming && (
                <>
                  {onToggleStar && (
                    <HoverBtn right={74} title={isStarred ? 'Unstar' : 'Star'} onClick={(e) => { e.stopPropagation(); onToggleStar(item.path) }} hoverColor="rgba(245,166,35,0.15)" hoverIconColor="#f5a623">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill={isStarred ? '#f5a623' : 'none'} stroke={isStarred ? '#f5a623' : 'currentColor'} strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    </HoverBtn>
                  )}
                  {onRename && <HoverBtn right={52} title="Rename" onClick={(e) => startRename(item, e)} hoverColor="rgba(111,76,179,0.15)" hoverIconColor="#9d7ce0"><IconRename size={11} /></HoverBtn>}
                  {onCopy && <HoverBtn right={30} title="Duplicate" onClick={(e) => { e.stopPropagation(); onCopy(item) }} hoverColor="rgba(0,131,143,0.12)" hoverIconColor="#00838f"><IconCopy size={11} /></HoverBtn>}
                  {onDelete && <HoverBtn right={6} title="Move to Trash" onClick={(e) => { e.stopPropagation(); onDelete(item) }} hoverColor="rgba(220,50,50,0.12)" hoverIconColor="#e53e3e"><IconTrash size={12} /></HoverBtn>}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeaderBtn({ children, onClick, active, title, T }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 18, height: 18, border: 'none',
      background: active ? 'rgba(111,76,179,0.14)' : 'transparent',
      borderRadius: 3,
      color: active ? '#6f4cb3' : T.textDim,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

function HoverBtn({ children, right, title, onClick, hoverColor, hoverIconColor }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute', right,
        width: 20, height: 20, border: 'none', borderRadius: 4,
        background: hov ? hoverColor : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? hoverIconColor : '#999',
        transition: 'background 0.1s, color 0.1s',
      }}>
      {children}
    </button>
  )
}
