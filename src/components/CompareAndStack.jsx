import React from 'react'
import { FileTile } from './icons'

// ── Compare view — shown when 2+ items are multi-selected ──
export function CompareView({ items, accent }) {
  return (
    <div style={{
      flex: 1, minWidth: 300, background: 'rgba(255,255,255,0.85)',
      overflow: 'auto', padding: 18,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent.c, letterSpacing: 0.5,
        textTransform: 'uppercase', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: accent.c, display: 'inline-block' }} />
        Compare · {items.length} items
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: items.length === 2 ? '1fr 1fr' : 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {items.slice(0, 6).map(it => (
          <CompareCard key={it.path} item={it} />
        ))}
      </div>
    </div>
  )
}

function CompareCard({ item }) {
  return (
    <div style={{
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8,
      overflow: 'hidden', background: '#fff',
    }}>
      <div style={{
        aspectRatio: '4/3', background: 'rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {item.kind === 'image'
          ? <img src={`file://${item.path}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          : <FileTile kind={item.kind} name={item.name} size={42} />
        }
      </div>
      <div style={{ padding: 8, fontSize: 11.5 }}>
        <div style={{ fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ color: '#888', marginTop: 2, fontSize: 10.5 }}>{item.size || '—'}</div>
        <div style={{ color: '#888', marginTop: 1, fontSize: 10.5 }}>{item.modified || ''}</div>
      </div>
    </div>
  )
}

// ── Stack preview — vertically stacked carousel for siblings ──
export function StackPreview({ items, selectedPath, onSelect }) {
  const idx = items.findIndex(x => x.path === selectedPath)

  return (
    <div style={{
      flex: 1, minWidth: 360, background: 'rgba(255,255,255,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative', padding: 28,
    }}>
      <div style={{ width: '100%', maxWidth: 460, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {items.map((it, i) => {
          const off = i - idx
          const abs = Math.abs(off)
          if (abs > 3) return null
          return (
            <div
              key={it.path}
              onClick={() => onSelect(it)}
              style={{
                position: 'absolute', width: 320, aspectRatio: '4/3',
                borderRadius: 12, overflow: 'hidden',
                background: '#eee',
                transform: `translateY(${off * 22}px) scale(${1 - abs * 0.08}) translateX(${off * 8}px)`,
                opacity: abs === 0 ? 1 : 0.6 - abs * 0.15,
                zIndex: 10 - abs,
                boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)',
                transition: 'transform .25s cubic-bezier(.2,.7,.3,1), opacity .25s',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {it.kind === 'image'
                ? <img src={`file://${it.path}`} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                : <FileTile kind={it.kind} name={it.name} size={70} />
              }
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: '#666' }}>
        {idx + 1} / {items.length} · ↑ ↓ to flick
      </div>
    </div>
  )
}
