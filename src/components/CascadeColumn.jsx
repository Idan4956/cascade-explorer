import React from 'react'
import { useDirectory } from '../hooks/useDirectory'
import { FileTile, IconFilter, IconChevronUp, IconChevronDown, IconChevronRight, IconPin, IconTrash, IconRename, IconCopy } from './icons'

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
}) {
  const { entries, loading, error, refresh } = useDirectory(dirPath)
  const [showFilter, setShowFilter] = React.useState(false)
  const [sortDir, setSortDir] = React.useState('asc')
  const [creating, setCreating] = React.useState(null) // 'file' | 'folder'
  const [newName, setNewName] = React.useState('')
  const [showNewMenu, setShowNewMenu] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState(null)
  const [renamingPath, setRenamingPath] = React.useState(null)
  const [renameValue, setRenameValue] = React.useState('')
  const [dragOverPath, setDragOverPath] = React.useState(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const newInputRef = React.useRef(null)
  const renameInputRef = React.useRef(null)

  React.useEffect(() => {
    if (creating && newInputRef.current) newInputRef.current.focus()
  }, [creating])

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
    if (name && name !== entries.find(e => e.path === renamingPath)?.name) {
      onRename?.(entries.find(e => e.path === renamingPath), name)
    }
    setRenamingPath(null)
  }

  const cancelRename = () => setRenamingPath(null)

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
        <div style={{ position: 'relative' }}>
          <HeaderBtn onClick={() => setShowNewMenu(v => !v)} title="New file or folder" active={showNewMenu}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>+</span>
          </HeaderBtn>
          {showNewMenu && (
            <div style={{
              position: 'absolute', top: 22, right: 0, zIndex: 100,
              background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflow: 'hidden', minWidth: 130,
            }}>
              {[['folder','📁','New Folder'],['file','📄','New File']].map(([type, icon, label]) => (
                <button key={type} onClick={() => startCreating(type)} style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', textAlign: 'left',
                  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#222',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div
        style={{
          flex: 1, overflow: 'auto', padding: 4,
          background: isDragOver ? 'rgba(111,76,179,0.04)' : undefined,
          transition: 'background 0.1s',
        }}
        onClick={() => setShowNewMenu(false)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('text/cascade-path')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setIsDragOver(true)
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false)
        }}
        onDrop={(e) => {
          const srcPath = e.dataTransfer.getData('text/cascade-path')
          setIsDragOver(false)
          if (srcPath && onMove) {
            e.preventDefault()
            onMove(srcPath, dirPath)
          }
        }}>

        {/* Inline creation row */}
        {creating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', marginBottom: 2 }}>
            <FileTile kind={creating === 'folder' ? 'folder' : 'file'} size={18} />
            <input
              ref={newInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') cancelCreate() }}
              onBlur={confirmCreate}
              style={{
                flex: 1, height: 24, padding: '0 7px',
                border: '1px solid rgba(111,76,179,0.5)', borderRadius: 4,
                fontSize: 12, outline: 'none', background: '#fff',
              }}
            />
          </div>
        )}

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
          const isHovered = hoveredItem === item.path
          const isRenaming = renamingPath === item.path
          const isDragTarget = dragOverPath === item.path && item.isDirectory

          return (
            <div
              key={item.path}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}>
            <button
              onClick={(e) => !isRenaming && onSelect(item, e)}
              onContextMenu={(e) => onContextMenu(e, item)}
              draggable={!isRenaming}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/cascade-path', item.path)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (item.isDirectory && e.dataTransfer.types.includes('text/cascade-path')) {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverPath(item.path)
                  setIsDragOver(false)
                }
              }}
              onDragLeave={() => setDragOverPath(null)}
              onDrop={(e) => {
                if (item.isDirectory) {
                  const srcPath = e.dataTransfer.getData('text/cascade-path')
                  setDragOverPath(null)
                  if (srcPath && srcPath !== item.path && onMove) {
                    e.preventDefault()
                    e.stopPropagation()
                    onMove(srcPath, item.path)
                  }
                }
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 10px', paddingRight: isHovered ? 72 : 10,
                borderRadius: 5, border: 'none',
                background: isDragTarget
                  ? accent.soft
                  : isSel ? (isMulti ? accent.soft : accent.c) : (isHovered ? 'rgba(0,0,0,0.04)' : 'transparent'),
                color: isSel && !isMulti ? '#fff' : '#222',
                cursor: 'pointer', fontSize: 12, textAlign: 'left', flex: 1,
                outline: isDragTarget ? `2px solid ${accent.c}` : 'none',
              }}>
              <FileTile kind={item.kind} name={item.name} size={18} />
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmRename() }
                    if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
                  }}
                  onBlur={confirmRename}
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, height: 22, padding: '0 6px',
                    border: `1px solid ${accent.c}`, borderRadius: 4,
                    fontSize: 12, outline: 'none', background: '#fff', color: '#222',
                  }}
                />
              ) : (
                <span style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: isSel ? 500 : 400,
                }}>
                  {item.name}
                </span>
              )}
              {!isRenaming && hasTags && itemTags.map(t => {
                const tag = tagDefs.find(x => x.id === t)
                return tag && (
                  <div key={t} style={{ width: 6, height: 6, borderRadius: 99, background: `oklch(0.62 0.16 ${tag.hue})`, flex: 'none' }} />
                )
              })}
              {!isRenaming && item.isDirectory && (
                <IconChevronRight size={11} color={isSel && !isMulti ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.35)'} />
              )}
            </button>

            {/* Hover action buttons */}
            {isHovered && !isRenaming && (
              <>
                {onRename && (
                  <HoverBtn
                    right={52}
                    title="Rename"
                    onClick={(e) => startRename(item, e)}
                    hoverColor="rgba(111,76,179,0.12)"
                    hoverIconColor="#6f4cb3">
                    <IconRename size={11} />
                  </HoverBtn>
                )}
                {onCopy && (
                  <HoverBtn
                    right={30}
                    title="Duplicate"
                    onClick={(e) => { e.stopPropagation(); onCopy(item) }}
                    hoverColor="rgba(0,131,143,0.1)"
                    hoverIconColor="#00838f">
                    <IconCopy size={11} />
                  </HoverBtn>
                )}
                {onDelete && (
                  <HoverBtn
                    right={6}
                    title="Move to Trash"
                    onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                    hoverColor="rgba(220,50,50,0.1)"
                    hoverIconColor="#e53e3e">
                    <IconTrash size={12} />
                  </HoverBtn>
                )}
              </>
            )}
            </div>
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

function HoverBtn({ children, right, title, onClick, hoverColor, hoverIconColor }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute', right,
        width: 20, height: 20, border: 'none', borderRadius: 4,
        background: hov ? hoverColor : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? hoverIconColor : '#999',
        transition: 'background 0.1s, color 0.1s',
      }}>
      {children}
    </button>
  )
}
