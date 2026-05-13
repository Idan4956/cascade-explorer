import React from 'react'
import { IconBack, IconForward, IconSearch, IconSettings, FileTile, IconClock } from './icons'
import { useTheme } from '../contexts/ThemeContext'

export default function CascadeHeader({ cascade, nodeMap, setCascade, openPalette, history, canGoBack, canGoForward, onGoBack, onGoForward, stackMode, setStackMode, accent, onOpenSettings }) {
  const { T } = useTheme()
  const [dragOverIdx, setDragOverIdx] = React.useState(null)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: T.headerBg,
      borderBottom: `1px solid ${T.border}`,
      WebkitAppRegion: 'drag',
      flexShrink: 0,
    }}>
      {/* Main toolbar row */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: 40 }}>

        {/* Left: nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px', WebkitAppRegion: 'no-drag' }}>
          <NavBtn onClick={onGoBack} disabled={!canGoBack}><IconBack size={13} /></NavBtn>
          <NavBtn onClick={onGoForward} disabled={!canGoForward}><IconForward size={13} /></NavBtn>
        </div>

        {/* Breadcrumb pills */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', WebkitAppRegion: 'no-drag', padding: '0 4px' }}>
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
                    height: 26, padding: '0 8px',
                    border: isDropTarget ? `1px dashed ${accent.c}` : 'none',
                    background: isDropTarget ? accent.tint : (isLast ? accent.soft : 'transparent'),
                    color: isLast ? accent.c : T.textMid,
                    fontWeight: isLast ? 600 : 400,
                    borderRadius: 4, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    whiteSpace: 'nowrap', flexShrink: i < cascade.length - 3 ? 1 : 0,
                    overflow: 'hidden', maxWidth: 160,
                  }}>
                  <FileTile kind={node?.kind || 'folder'} size={13} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </button>
                {!isLast && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}>
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', WebkitAppRegion: 'no-drag' }}>
          {/* Stack toggle */}
          <button
            onClick={() => setStackMode(!stackMode)}
            title="Stack mode"
            style={{
              height: 28, padding: '0 10px',
              background: stackMode ? accent.soft : 'transparent',
              color: stackMode ? accent.c : T.textMid,
              border: `1px solid ${stackMode ? accent.c + '44' : T.borderMid}`,
              borderRadius: 4,
              fontSize: 11.5, fontWeight: stackMode ? 600 : 400, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="6" rx="1" />
              <rect x="3" y="11" width="18" height="6" rx="1" />
              <rect x="3" y="19" width="18" height="2" rx="1" />
            </svg>
            Stack
          </button>

          {/* Command palette trigger */}
          <button
            onClick={openPalette}
            style={{
              height: 28, padding: '0 10px',
              background: T.inputBg,
              border: `1px solid ${T.borderMid}`,
              borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 12, color: T.textSub, minWidth: 180,
              flexShrink: 0,
            }}>
            <IconSearch size={12} color={T.textSub} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search files, commands…</span>
            <kbd style={{ fontSize: 10, padding: '1px 5px', background: T.hoverBg, borderRadius: 3, color: T.textDim, border: `1px solid ${T.border}` }}>Ctrl+K</kbd>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Settings (Ctrl+,)"
            style={{
              width: 28, height: 28, border: 'none',
              background: 'transparent', borderRadius: 4,
              color: T.textDim, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim }}>
            <IconSettings size={15} />
          </button>
        </div>

        {/* Windows title bar controls — right edge */}
        <WindowControls />
      </div>

      {/* History trail */}
      {history.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 12px 6px', fontSize: 10.5, color: T.textDim,
          WebkitAppRegion: 'no-drag', overflow: 'hidden',
          borderTop: `1px solid ${T.border}`,
          paddingTop: 5,
        }}>
          <IconClock size={11} color={T.textDim} />
          <span style={{ flexShrink: 0 }}>Trail:</span>
          {history.slice(-8).map((p, i) => {
            const label = p[p.length - 1].split('/').pop() || p[p.length - 1].split('\\').pop() || p[p.length - 1]
            return (
              <button key={i} onClick={() => setCascade(p)} style={{
                height: 18, padding: '0 7px', borderRadius: 3,
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
        width: 28, height: 28, border: 'none',
        background: hov && !disabled ? T.hoverBg : 'transparent',
        borderRadius: 4, color: disabled ? T.textFaint : T.textMid,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {children}
    </button>
  )
}

function WindowControls() {
  const api = window.electronAPI
  const { T } = useTheme()
  if (!api) return null
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
      <WinBtn onClick={() => api.minimize()} title="Minimize" T={T}>
        <svg width="11" height="1" viewBox="0 0 11 1" fill={T.textMid}><rect width="11" height="1" /></svg>
      </WinBtn>
      <WinBtn onClick={() => api.maximize()} title="Maximize / Restore" T={T}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T.textMid} strokeWidth="1">
          <rect x="0.5" y="0.5" width="9" height="9" />
        </svg>
      </WinBtn>
      <WinBtn onClick={() => api.close()} title="Close" isClose T={T}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="1" y1="1" x2="10" y2="10" />
          <line x1="10" y1="1" x2="1" y2="10" />
        </svg>
      </WinBtn>
    </div>
  )
}

function WinBtn({ children, onClick, title, isClose, T }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      style={{
        width: 46, height: '100%',
        border: 'none', borderRadius: 0,
        background: hov ? (isClose ? '#c42b1c' : T.hoverBg) : 'transparent',
        color: hov && isClose ? '#ffffff' : T.textMid,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.08s',
      }}>
      {children}
    </button>
  )
}
