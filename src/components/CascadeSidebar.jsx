import React from 'react'
import { IconHome, IconClock, IconStar, IconCommand, FileTile, kindLabel } from './icons'
import { StorageTreemap, TAGS } from './features'

const SMART_FOLDERS = [
  { id: 'sf-recent', name: 'Recent', icon: '🕐' },
  { id: 'sf-images', name: 'All images', icon: '🖼' },
  { id: 'sf-large', name: 'Large files', icon: '📦' },
  { id: 'sf-screenshots', name: 'Screenshots', icon: '📸' },
  { id: 'sf-untagged', name: 'Untagged', icon: '🏷' },
]

export default function CascadeSidebar({ cascade, homedir, places, onJump, accent, setShowShortcuts }) {
  const activePath = cascade[cascade.length - 1]

  const sections = [
    {
      title: 'Quick',
      items: [
        { id: 'home', name: 'Home', icon: <IconHome size={13} />, path: homedir ? [homedir] : null },
        { id: 'recent', name: 'Recent', icon: <IconClock size={13} />, path: null },
        { id: 'starred', name: 'Starred', icon: <IconStar size={13} />, path: null },
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
      })),
    },
    {
      title: 'Tags',
      items: TAGS.map(t => ({
        id: 'tag-' + t.id,
        name: t.name,
        hue: t.hue,
        path: null,
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
      {sections.map(sec => (
        <div key={sec.title} style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 0.5, padding: '8px 10px 4px', textTransform: 'uppercase' }}>
            {sec.title}
          </div>
          {sec.items.map(it => {
            const active = activePath === it.id || activePath === it.path?.[0]
            return (
              <button key={it.id} onClick={() => it.path && onJump(it.path)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                border: 'none', background: active ? accent.soft : 'transparent',
                fontSize: 12, cursor: it.path ? 'pointer' : 'default',
                color: active ? accent.c : '#333',
                fontWeight: active ? 600 : 400,
                width: '100%', textAlign: 'left',
                opacity: it.path ? 1 : 0.55,
              }}
                onMouseEnter={(e) => it.path && !active && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}>
                {it.icon || (
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: `oklch(0.62 0.16 ${it.hue})`, marginLeft: 2, marginRight: 2 }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
              </button>
            )
          })}
        </div>
      ))}

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
