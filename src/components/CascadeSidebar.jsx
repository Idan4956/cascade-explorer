import React from 'react'
import { IconHome, IconClock, IconStar, IconCommand, FileTile } from './icons'
import { StorageTreemap } from './features'

const SMART_FOLDERS = [
  { id: 'sf-recent',      name: 'Recent',      icon: '🕐', filter: { 'date:week': true } },
  { id: 'sf-images',      name: 'All images',  icon: '🖼', filter: { 'kind:image': true } },
  { id: 'sf-large',       name: 'Large files', icon: '📦', filter: { 'size:big': true } },
  { id: 'sf-screenshots', name: 'Screenshots', icon: '📸', filter: { 'date:week': true }, nameFilter: 'screenshot' },
  { id: 'sf-docs',        name: 'Documents',   icon: '📄', filter: { 'kind:doc': true, 'kind:pdf': true } },
]

const HUE_PRESETS = [15, 45, 80, 145, 185, 235, 290, 330]

export default function CascadeSidebar({
  cascade, homedir, places, onJump, accent, setShowShortcuts, onSmartFolder,
  tagDefs = [], activeTagFilter, onTagFilter, onAddTag, onDeleteTag,
}) {
  const activePath = cascade[cascade.length - 1]
  const [addingTag, setAddingTag] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')
  const [newTagHue, setNewTagHue] = React.useState(235)
  const [hoveredTag, setHoveredTag] = React.useState(null)

  const handleAddTag = () => {
    const name = newTagName.trim()
    if (!name) return
    onAddTag?.(name, newTagHue)
    setNewTagName('')
    setNewTagHue(235)
    setAddingTag(false)
  }

  const navSections = [
    {
      title: 'Quick',
      items: [
        { id: 'home', name: 'Home', icon: <IconHome size={13} />, path: homedir ? [homedir] : null },
        { id: 'recent', name: 'Recent', icon: <IconClock size={13} />, path: null, smartFolder: SMART_FOLDERS[0] },
        { id: 'starred', name: 'Starred (coming soon)', icon: <IconStar size={13} />, path: null },
      ],
    },
    {
      title: 'Places',
      items: places.map(p => ({
        id: p.path,
        name: p.name,
        icon: <FileTile kind="folder" size={14} />,
        path: [p.path],
      })),
    },
    {
      title: 'Smart folders',
      items: SMART_FOLDERS.map(s => ({
        id: s.id,
        name: s.name,
        icon: <span style={{ fontSize: 12 }}>{s.icon}</span>,
        path: null,
        smartFolder: s,
      })),
    },
  ]

  return (
    <div style={{
      width: 188,
      padding: '12px 6px 0',
      display: 'flex', flexDirection: 'column', gap: 2,
      background: 'rgba(248,245,253,0.5)',
      borderRight: '1px solid rgba(0,0,0,0.05)',
      overflow: 'auto',
      flexShrink: 0,
    }}>
      {navSections.map(sec => (
        <div key={sec.title} style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 0.5, padding: '8px 10px 4px', textTransform: 'uppercase' }}>
            {sec.title}
          </div>
          {sec.items.map(it => {
            const active = activePath === it.id || activePath === it.path?.[0]
            const clickable = it.path || it.smartFolder
            const handleClick = () => {
              if (it.smartFolder) { onSmartFolder(it.smartFolder); if (homedir) onJump([homedir]) }
              else if (it.path) onJump(it.path)
            }
            return (
              <button key={it.id} onClick={handleClick} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                border: 'none', background: active ? accent.soft : 'transparent',
                fontSize: 12, cursor: clickable ? 'pointer' : 'default',
                color: active ? accent.c : '#333',
                fontWeight: active ? 600 : 400,
                width: '100%', textAlign: 'left',
                opacity: clickable ? 1 : 0.45,
              }}
                onMouseEnter={(e) => clickable && !active && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}>
                {it.icon}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
              </button>
            )
          })}
        </div>
      ))}

      {/* Tags section */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 0.5, padding: '8px 10px 4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1 }}>Tags</span>
          <button
            onClick={() => { setAddingTag(v => !v); setNewTagName(''); setNewTagHue(235) }}
            title="Add tag"
            style={{
              width: 16, height: 16, border: 'none', borderRadius: 3,
              background: addingTag ? accent.soft : 'transparent',
              color: addingTag ? accent.c : '#aaa',
              cursor: 'pointer', fontSize: 14, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, marginRight: 2,
            }}>
            +
          </button>
        </div>

        {/* Add tag inline form */}
        {addingTag && (
          <div style={{ padding: '4px 10px 8px' }}>
            <input
              autoFocus
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setAddingTag(false) }}
              placeholder="Tag name…"
              style={{
                width: '100%', height: 24, padding: '0 7px',
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4,
                fontSize: 11.5, outline: 'none', background: '#fff',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {HUE_PRESETS.map(hue => (
                <button
                  key={hue}
                  onClick={() => setNewTagHue(hue)}
                  style={{
                    width: 16, height: 16, borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: `oklch(0.62 0.16 ${hue})`,
                    outline: newTagHue === hue ? `2px solid oklch(0.35 0.14 ${hue})` : 'none',
                    outlineOffset: 1,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <button
                onClick={handleAddTag}
                style={{
                  flex: 1, height: 22, border: 'none', borderRadius: 4,
                  background: accent.c, color: '#fff',
                  fontSize: 11, cursor: 'pointer', fontWeight: 600,
                }}>
                Add
              </button>
              <button
                onClick={() => setAddingTag(false)}
                style={{
                  flex: 1, height: 22, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4,
                  background: 'transparent', color: '#555',
                  fontSize: 11, cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tag list */}
        {tagDefs.length === 0 && !addingTag && (
          <div style={{ padding: '4px 10px 6px', fontSize: 11, color: '#aaa' }}>No tags yet</div>
        )}
        {tagDefs.map(t => {
          const isActive = activeTagFilter === t.id
          const isHovered = hoveredTag === t.id
          return (
            <div
              key={t.id}
              onMouseEnter={() => setHoveredTag(t.id)}
              onMouseLeave={() => setHoveredTag(null)}
              style={{ display: 'flex', alignItems: 'center', borderRadius: 6 }}>
              <button
                onClick={() => onTagFilter?.(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 6,
                  border: 'none',
                  background: isActive ? `oklch(0.94 0.05 ${t.hue})` : (isHovered ? 'rgba(0,0,0,0.04)' : 'transparent'),
                  color: isActive ? `oklch(0.32 0.14 ${t.hue})` : '#333',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 12, cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 99,
                  background: `oklch(0.62 0.16 ${t.hue})`,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              </button>
              {isHovered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTag?.(t.id) }}
                  title="Delete tag"
                  style={{
                    width: 18, height: 18, border: 'none', borderRadius: 3,
                    background: 'transparent', color: '#bbb',
                    cursor: 'pointer', fontSize: 13, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 4, flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e53e3e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}>
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 6, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Storage</div>
        <StorageTreemap />
        <button
          onClick={() => setShowShortcuts(true)}
          style={{
            marginTop: 10, width: '100%', height: 26,
            border: '1px solid rgba(0,0,0,0.08)', background: 'transparent',
            borderRadius: 6, fontSize: 11, color: '#555', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <IconCommand size={11} /> Shortcuts
          <kbd style={{ fontSize: 9, padding: '1px 4px', background: 'rgba(0,0,0,0.06)', borderRadius: 3, color: '#888' }}>⌘/</kbd>
        </button>
      </div>
    </div>
  )
}
