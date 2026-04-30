import React from 'react'
import { FileTile, kindLabel, IconEye, IconShare, IconStar, IconCopy, IconMore, IconPlus } from './icons'
import { AIActions, TAGS } from './features'

export default function CascadeDeepPreview({ item, accent, tagMap, onToggleTag }) {
  if (!item) return (
    <div style={{
      flex: 1, minWidth: 300, background: 'rgba(255,255,255,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#999', fontSize: 13, flexDirection: 'column', gap: 10,
    }}>
      <FileTile kind="folder" size={48} />
      <span>Select a file to preview</span>
    </div>
  )

  return (
    <div style={{
      flex: 1, minWidth: 300, background: 'rgba(255,255,255,0.85)',
      display: 'flex', flexDirection: 'column', overflow: 'auto',
      scrollSnapAlign: 'start',
    }}>
      <PreviewHero item={item} />

      {/* Name + kind */}
      <div style={{ padding: '14px 18px 6px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', wordBreak: 'break-word', lineHeight: 1.3 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
          {kindLabel(item.kind)}{item.size ? ` · ${item.size}` : ''}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '8px 14px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <PvAction icon={<IconEye size={13} />} label="Open" primary accent={accent}
          onClick={() => window.electronAPI?.openExternal(item.path)} />
        <PvAction icon={<IconShare size={13} />} label="Show" accent={accent}
          onClick={() => window.electronAPI?.showInFolder(item.path)} />
        <PvAction icon={<IconStar size={13} />} accent={accent} />
        <PvAction icon={<IconCopy size={13} />} accent={accent} />
        <PvAction icon={<IconMore size={13} />} accent={accent} />
      </div>

      {/* Metadata */}
      <div style={{ padding: '10px 18px 14px' }}>
        {[
          ['Kind', kindLabel(item.kind)],
          ['Size', item.size],
          ['Modified', item.modified],
          ['Dimensions', item.dim],
          ['Duration', item.duration],
          ['Path', item.path],
        ].filter(r => r[1]).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', fontSize: 12, padding: '5px 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ width: 80, color: '#888', flexShrink: 0 }}>{k}</div>
            <div style={{ flex: 1, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: k === 'Path' ? 'nowrap' : 'normal' }}>{String(v)}</div>
          </div>
        ))}
      </div>

      {/* Inline tag editor */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#888', letterSpacing: 0.5, padding: '6px 0 8px', textTransform: 'uppercase' }}>Tags</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TAGS.map(t => {
            const active = (tagMap?.[item.path] || item.tags || []).includes(t.id)
            return (
              <button key={t.id} onClick={() => onToggleTag?.(item.path, t.id)} style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 99,
                background: active ? `oklch(0.94 0.05 ${t.hue})` : 'transparent',
                color: active ? `oklch(0.35 0.14 ${t.hue})` : '#666',
                border: active ? `1px solid oklch(0.86 0.06 ${t.hue})` : '1px dashed rgba(0,0,0,0.18)',
                cursor: 'pointer', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: `oklch(0.62 0.16 ${t.hue})` }} />
                {t.name}
              </button>
            )
          })}
          <button style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'transparent',
            color: '#888', border: '1px dashed rgba(0,0,0,0.18)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <IconPlus size={9} /> Tag
          </button>
        </div>
      </div>

      <AIActions item={item} accent={accent} />
    </div>
  )
}

function PreviewHero({ item }) {
  const [textPreview, setTextPreview] = React.useState(null)

  React.useEffect(() => {
    if (item.kind === 'text' || item.kind === 'pdf' || item.kind === 'doc') {
      window.electronAPI?.readText(item.path).then(r => {
        if (r?.content) setTextPreview(r.content)
      })
    } else {
      setTextPreview(null)
    }
  }, [item.path, item.kind])

  if (item.kind === 'image') {
    return (
      <div style={{ height: 240, overflow: 'hidden', position: 'relative', background: '#f0ede8' }}>
        <img
          src={`file://${item.path}`}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
    )
  }

  if (item.kind === 'video') {
    return (
      <div style={{ height: 220, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <video
          src={`file://${item.path}`}
          style={{ maxWidth: '100%', maxHeight: '100%', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M7 4l13 8-13 8z" /></svg>
        </div>
      </div>
    )
  }

  if (item.kind === 'audio') {
    return (
      <div style={{ height: 200, background: 'linear-gradient(135deg, #2a2540, #0e0e1c)', display: 'flex', alignItems: 'flex-end', padding: 16, gap: 2, position: 'relative' }}>
        {Array.from({ length: 56 }).map((_, i) => {
          const h = 8 + Math.abs(Math.sin(i * 0.5 + i * 0.13) * 60) + Math.abs(Math.cos(i * 0.3) * 30)
          return <div key={i} style={{ flex: 1, height: Math.min(h, 130), background: i < 18 ? '#fff' : 'rgba(255,255,255,0.32)', borderRadius: 1 }} />
        })}
        <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.name}</div>
      </div>
    )
  }

  if (item.kind === 'text' && textPreview) {
    return (
      <div style={{
        height: 240, padding: 18,
        fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
        fontSize: 11.5, color: '#3a3a3a',
        whiteSpace: 'pre-wrap', overflow: 'hidden',
        position: 'relative', lineHeight: 1.55, background: '#fbfaf6',
      }}>
        {textPreview}
        <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 60, background: 'linear-gradient(transparent, #fbfaf6)' }} />
      </div>
    )
  }

  if (item.kind === 'pdf' || item.kind === 'doc' || item.kind === 'sheet') {
    return (
      <div style={{ height: 240, background: 'linear-gradient(180deg, #f0eee8, #e6e3db)', padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 130, aspectRatio: '8.5/11', background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', borderRadius: 2, padding: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 6, background: '#222', width: '70%' }} />
          <div style={{ height: 3, background: 'rgba(0,0,0,0.4)', width: '50%' }} />
          <div style={{ height: 8 }} />
          {textPreview
            ? <div style={{ fontSize: 5.5, color: '#555', lineHeight: 1.6, overflow: 'hidden' }}>{textPreview.slice(0, 400)}</div>
            : Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: 2.5, background: 'rgba(0,0,0,0.18)', width: `${60 + (i * 13) % 40}%` }} />
            ))}
        </div>
      </div>
    )
  }

  if (item.isDirectory) {
    return (
      <div style={{ height: 180, background: 'linear-gradient(135deg, #fbeec3, #f0d791)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileTile kind="folder" size={88} />
      </div>
    )
  }

  return (
    <div style={{ height: 180, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FileTile kind={item.kind} name={item.name} size={72} />
    </div>
  )
}

function PvAction({ icon, label, primary, accent, onClick }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: label ? 1 : 'none', height: 30,
        padding: label ? '0 12px' : '0 9px',
        border: 'none',
        background: primary ? accent.c : (hov ? 'rgba(0,0,0,0.05)' : 'transparent'),
        color: primary ? '#fff' : '#333', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: 12, fontWeight: primary ? 600 : 500, cursor: 'pointer',
      }}>
      {icon}{label}
    </button>
  )
}
