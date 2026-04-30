import React from 'react'

export default function CascadeStatusBar({ cascade, multiSel, nodeMap, accent }) {
  const lastPath = cascade[cascade.length - 1]
  const lastNode = nodeMap[lastPath]

  const totalSelected = Object.values(multiSel).reduce((acc, arr) => acc + (arr?.length > 1 ? arr.length : 0), 0)

  const totalSelectedSize = React.useMemo(() => {
    const paths = Object.values(multiSel).flat()
    const bytes = paths.reduce((sum, p) => {
      const node = nodeMap[p]
      return sum + (node?.sizeBytes || 0)
    }, 0)
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }, [multiSel, nodeMap])

  return (
    <div style={{
      height: 26, padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(248,245,253,0.85)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      fontSize: 11, color: '#666', flexShrink: 0,
    }}>
      <span>{cascade.length - 1} level{cascade.length !== 2 ? 's' : ''} deep</span>

      {lastNode && (
        <span style={{ color: '#444' }}>
          · {lastNode.name}
          {lastNode.size ? ` · ${lastNode.size}` : ''}
        </span>
      )}

      {totalSelected > 0 && (
        <span style={{ color: accent.c, fontWeight: 600 }}>
          · {totalSelected} selected{totalSelectedSize ? ` · ${totalSelectedSize}` : ''}
        </span>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: 99, background: '#3fa45a' }} />
        Ready
      </span>
    </div>
  )
}
