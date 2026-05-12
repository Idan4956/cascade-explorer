import React from 'react'
import { IconBack, IconForward, IconSearch, IconClose, IconMinus, FileTile, IconClock, IconMoon, IconSun } from './icons'
import { useTheme } from '../contexts/ThemeContext'

export default function CascadeHeader({ cascade, nodeMap, setCascade, openPalette, history, canGoBack, canGoForward, onGoBack, onGoForward, stackMode, setStackMode, accent }) {
  const { T, dark, toggleDark } = useTheme()
  const [dragOverIdx, setDragOverIdx] = React.useState(null)

  return (
    <div style={{
      padding: '8px 14px 0',
      display: 'flex', flexDirection: 'column', gap: 6,
      background: T.headerBg, backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${T.border}`,
      WebkitAppRegion: 'drag',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <WindowControls />

        <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
          <NavBtn onClick={onGoBack} disabled={!canGoBack}><IconBack size={13} /></NavBtn>
          <NavBtn onClick={onGoForward} disabled={!canGoForward}><IconForward size={13} /></NavBtn>
        </div>

        {/* Breadcrumb pills */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', WebkitAppRegion: 'no-drag' }}>
          {cascade.map((p, i) => {
            const node = nodeMap[p]
            const label = node ? node.name : p.split('/').pop() || p.split('\\').pop() || p
            const isLast = i === cascade.length - 1
            const isDropTarget = dragOverIdx === i
            const isDir = !node || node.isDirectory !== false
            return (
              <React.Fragment key={p}>
                <button
                  onClick={() => setCascade(cascade.slice(0, i + 1))}
                  onDragOver={(e) => { if (isDir) { e.preventDefault(); setDragOverIdx(i) } }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOverIdx(null) }}
                  style={{
                    height: 28, padding: '0 10px',
                    border: isDropTarget ? `1px dashed ${accent.c}` : 'none',
                    background: isDropTarget ? accent.tint : (isLast ? accent.soft : T.hoverBg),
                    color: isLast ? accent.c : T.textMid,
                    fontWeight: isLast ? 600 : 500,
                    borderRadius: 99, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    whiteSpace: 'nowrap', flexShrink: i < cascade.length - 3 ? 1 : 0,
                    overflow: 'hidden', maxWidth: 160,
                  }}>
                  <FileTile kind={node?.kind || 'folder'} size={13} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </button>
                {!isLast && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}>
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Stack toggle */}
        <button
          onClick={() => setStackMode(!stackMode)}
          title="Stack mode"
          style={{
            height: 30, padding: '0 10px',
            background: stackMode ? accent.soft : 'transparent',
            color: stackMode ? accent.c : T.textMid,
            border: `1px solid ${T.borderMid}`, borderRadius: 6,
            fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            WebkitAppRegion: 'no-drag', flexShrink: 0,
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="6" rx="1.5" />
            <rect x="3" y="11" width="18" height="6" rx="1.5" />
            <rect x="3" y="19" width="18" height="2" rx="1" />
          </svg>
          Stack
        </button>

        {/* Command palette trigger */}
        <button
          onClick={openPalette}
          style={{
            height: 30, padding: '0 12px',
            background: T.inputBg, border: `1px solid ${T.borderMid}`,
            borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 12, color: T.textSub, minWidth: 200,
            WebkitAppRegion: 'no-drag', flexShrink: 0,
          }}>
          <IconSearch size={12} color={T.textSub} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search files, run commands…</span>
          <kbd style={{ fontSize: 10, padding: '2px 6px', background: T.hoverBg, borderRadius: 3, color: T.textDim }}>⌘K</kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 30, height: 30, border: 'none',
            background: 'transparent', borderRadius: 6,
            color: T.textDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitAppRegion: 'no-drag', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim }}>
          {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>
      </div>

      {/* History trail */}
      {history.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, fontSize: 10.5, color: T.textDim, WebkitAppRegion: 'no-drag', overflow: 'hidden' }}>
          <IconClock size={11} color={T.textDim} />
          <span style={{ flexShrink: 0 }}>Trail:</span>
          {history.slice(-8).map((p, i) => {
            const label = p[p.length - 1].split('/').pop() || p[p.length - 1].split('\\').pop() || p[p.length - 1]
            return (
              <button key={i} onClick={() => setCascade(p)} style={{
                height: 18, padding: '0 7px', borderRadius: 99,
                border: `1px solid ${T.borderMid}`, background: 'transparent',
                color: T.textSub, fontSize: 10.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = accent.tint; e.currentTarget.style.color = accent.c }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSub }}>
                <div style={{ width: 4, height: 4, borderRadius: 99, background: T.textFaint }} />
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NavBtn({ children, onClick, disabled }) {
  const { T } = useTheme()
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, border: 'none',
        background: hov && !disabled ? T.hoverBg : 'transparent',
        borderRadius: 6, color: disabled ? T.textFaint : T.textMid,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {children}
    </button>
  )
}

function WindowControls() {
  const api = window.electronAPI
  if (!api) return <div style={{ width: 12 }} />
  return (
    <div style={{ display: 'flex', gap: 6, marginRight: 4, WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
      <WinDot color="#ff5f57" onClick={() => api.close()} title="Close" />
      <WinDot color="#febc2e" onClick={() => api.minimize()} title="Minimize" />
      <WinDot color="#28c840" onClick={() => api.maximize()} title="Maximize" />
    </div>
  )
}

function WinDot({ color, onClick, title }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      style={{
        width: 12, height: 12, borderRadius: 99,
        background: hov ? color : `${color}cc`,
        border: 'none', cursor: 'pointer', padding: 0,
        transition: 'background 0.12s',
      }}
    />
  )
}
