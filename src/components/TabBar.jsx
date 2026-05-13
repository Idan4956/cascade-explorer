import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function TabBar({ tabs, activeTabId, onSwitch, onCreate, onClose, accent }) {
  const { T } = useTheme()

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: T.headerBg,
      borderBottom: `1px solid ${T.border}`,
      height: 34, flexShrink: 0, overflow: 'hidden',
      WebkitAppRegion: 'drag',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', overflow: 'hidden', flex: 1, WebkitAppRegion: 'no-drag' }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId
          const label = tab.label || 'New Tab'
          return (
            <div
              key={tab.id}
              onClick={() => onSwitch(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 10px',
                maxWidth: 180, minWidth: 80,
                borderRight: `1px solid ${T.border}`,
                background: isActive ? T.columnBg : 'transparent',
                cursor: 'pointer', position: 'relative',
                borderBottom: isActive ? `2px solid ${accent.c}` : '2px solid transparent',
                flexShrink: 0,
              }}>
              <span style={{
                flex: 1, fontSize: 12,
                color: isActive ? T.text : T.textSub,
                fontWeight: isActive ? 600 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onClose(tab.id) }}
                  style={{
                    width: 16, height: 16, border: 'none', background: 'transparent',
                    borderRadius: 3, cursor: 'pointer', color: T.textFaint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textFaint }}>
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}

        {/* New tab button */}
        <button
          onClick={onCreate}
          title="New tab (Ctrl+T)"
          style={{
            width: 30, border: 'none', background: 'transparent',
            cursor: 'pointer', color: T.textFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textFaint }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
