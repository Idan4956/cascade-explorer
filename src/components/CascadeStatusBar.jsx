import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function CascadeStatusBar({ cascade, multiSel, nodeMap, accent, gitInfo }) {
  const { T } = useTheme()
  const lastPath = cascade[cascade.length - 1]
  const lastNode = nodeMap[lastPath]

  const totalSelected = Object.values(multiSel).reduce((acc, arr) => acc + (arr?.length > 1 ? arr.length : 0), 0)

  const totalSelectedSize = React.useMemo(() => {
    const paths = Object.values(multiSel).flat()
    const bytes = paths.reduce((sum, p) => sum + (nodeMap[p]?.sizeBytes || 0), 0)
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }, [multiSel, nodeMap])

  const currentDir = lastNode?.isDirectory ? lastPath : (cascade.length >= 2 ? cascade[cascade.length - 2] : lastPath)

  const openTerminal = () => {
    if (currentDir) window.electronAPI?.openTerminal(currentDir)
  }

  return (
    <div style={{
      height: 26, padding: '0 10px',
      display: 'flex', alignItems: 'center', gap: 12,
      background: T.statusBg,
      borderTop: `1px solid ${T.border}`,
      fontSize: 11, color: T.textSub, flexShrink: 0,
    }}>
      <span>{cascade.length - 1} level{cascade.length !== 2 ? 's' : ''} deep</span>

      {lastNode && (
        <span style={{ color: T.textMid }}>
          · {lastNode.name}{lastNode.size ? ` · ${lastNode.size}` : ''}
        </span>
      )}

      {totalSelected > 0 && (
        <span style={{ color: accent.c, fontWeight: 600 }}>
          · {totalSelected} selected{totalSelectedSize ? ` · ${totalSelectedSize}` : ''}
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Git branch indicator */}
      {gitInfo?.branch && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textDim }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
            <path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          <span style={{ fontSize: 10.5 }}>{gitInfo.branch}</span>
        </div>
      )}

      {/* Open in Terminal */}
      <button
        onClick={openTerminal}
        title="Open in Terminal"
        style={{
          height: 18, padding: '0 7px', border: `1px solid ${T.borderMid}`,
          borderRadius: 3, background: 'transparent', cursor: 'pointer',
          fontSize: 10.5, color: T.textDim, display: 'flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        Terminal
      </button>

      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: 99, background: '#3fa45a' }} />
        Ready
      </span>
    </div>
  )
}
