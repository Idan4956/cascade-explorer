import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { FileTile, kindLabel } from './icons'

export default function QuickLookModal({ item, items = [], onClose, accent, onNavigate }) {
  const { T } = useTheme()

  const currentIdx = items.findIndex(i => i?.path === item?.path)

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); onClose() }
      if (e.key === 'ArrowLeft' && currentIdx > 0) onNavigate(items[currentIdx - 1])
      if (e.key === 'ArrowRight' && currentIdx < items.length - 1) onNavigate(items[currentIdx + 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIdx, items, onClose, onNavigate])

  if (!item) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '70vw', maxWidth: 900, height: '78vh',
          background: T.modalBg,
          borderRadius: 8,
          border: `1px solid ${T.borderMid}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

        {/* Header */}
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          background: T.headerBg,
        }}>
          <FileTile kind={item.kind} size={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            <div style={{ fontSize: 11, color: T.textSub }}>{kindLabel(item.kind)}{item.size ? ` · ${item.size}` : ''}</div>
          </div>

          {/* Navigation arrows */}
          {items.length > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <NavBtn disabled={currentIdx <= 0} onClick={() => currentIdx > 0 && onNavigate(items[currentIdx - 1])} T={T}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </NavBtn>
              <NavBtn disabled={currentIdx >= items.length - 1} onClick={() => currentIdx < items.length - 1 && onNavigate(items[currentIdx + 1])} T={T}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </NavBtn>
              <span style={{ fontSize: 11, color: T.textDim, alignSelf: 'center', marginLeft: 2 }}>
                {currentIdx + 1} / {items.length}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            style={{ width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.columnBg }}>
          <PreviewContent item={item} T={T} accent={accent} />
        </div>

        {/* Footer hint */}
        <div style={{ padding: '6px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, fontSize: 11, color: T.textFaint, flexShrink: 0 }}>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, background: T.hoverBg, border: `1px solid ${T.border}` }}>Space</kbd> / <kbd style={{ padding: '1px 4px', borderRadius: 3, background: T.hoverBg, border: `1px solid ${T.border}` }}>Esc</kbd> Close</span>
          <span><kbd style={{ padding: '1px 4px', borderRadius: 3, background: T.hoverBg, border: `1px solid ${T.border}` }}>←</kbd> <kbd style={{ padding: '1px 4px', borderRadius: 3, background: T.hoverBg, border: `1px solid ${T.border}` }}>→</kbd> Navigate</span>
        </div>
      </div>
    </div>
  )
}

function NavBtn({ children, onClick, disabled, T }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 26, height: 26, border: 'none', background: 'transparent',
      borderRadius: 4, cursor: disabled ? 'default' : 'pointer',
      color: disabled ? T.textFaint : T.textMid,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

function PreviewContent({ item, T, accent }) {
  const [content, setContent] = React.useState(null)

  React.useEffect(() => {
    setContent(null)
    if (item?.kind === 'text' || item?.kind === 'doc') {
      window.electronAPI?.readText(item.path).then(r => {
        if (r?.content) setContent(r.content)
      })
    }
  }, [item?.path, item?.kind])

  if (!item) return null

  if (item.kind === 'image') {
    return (
      <img
        src={`file://${item.path}`}
        alt={item.name}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
      />
    )
  }

  if (item.kind === 'video') {
    return (
      <video
        src={`file://${item.path}`}
        controls
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    )
  }

  if (item.kind === 'audio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
        <FileTile kind="audio" size={80} />
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{item.name}</div>
        <audio src={`file://${item.path}`} controls style={{ width: 360 }} />
      </div>
    )
  }

  if (content !== null) {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 24 }}>
        <pre style={{
          margin: 0, fontSize: 13, lineHeight: 1.6,
          color: T.text, fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{content}</pre>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: T.textDim }}>
      <FileTile kind={item.kind} size={80} />
      <div style={{ fontSize: 14 }}>{item.size || 'No preview available'}</div>
      {item.modified && <div style={{ fontSize: 12 }}>Modified {item.modified}</div>}
    </div>
  )
}
