import React from 'react'
import CascadeExplorer from './components/CascadeExplorer'
import { useHomedir } from './hooks/useDirectory'

const WALLPAPERS = {
  ink: 'radial-gradient(ellipse at 30% 20%, rgba(70,80,100,0.6), transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(40,50,70,0.6), transparent 60%), linear-gradient(135deg, #1a1e2a, #232a3c 60%, #2e3548)',
  twilight: 'radial-gradient(ellipse at 30% 20%, rgba(140,170,220,0.55), transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(190,160,220,0.45), transparent 60%), linear-gradient(135deg, #5e7aa8, #7a5e9e 60%, #9a6aa8)',
  meadow: 'radial-gradient(ellipse at 25% 30%, rgba(180,210,160,0.6), transparent 55%), radial-gradient(ellipse at 80% 75%, rgba(220,200,140,0.45), transparent 60%), linear-gradient(135deg, #6a8e6a, #98a868 60%, #c4a66a)',
  ember: 'radial-gradient(ellipse at 30% 25%, rgba(230,150,100,0.55), transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(180,80,80,0.5), transparent 60%), linear-gradient(135deg, #6a3e2e, #a85e3e 60%, #d68a4a)',
}

export default function App() {
  const homedir = useHomedir()
  const [accent, setAccent] = React.useState('purple')
  const [wallpaper, setWallpaper] = React.useState('ink')

  if (!homedir) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: WALLPAPERS.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.6)', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: WALLPAPERS[wallpaper],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}>
        <CascadeExplorer homedir={homedir} accent={accent} />
      </div>
    </div>
  )
}
