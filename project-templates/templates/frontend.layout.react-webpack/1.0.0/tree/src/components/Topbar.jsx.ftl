import React from 'react'

const topbarTitle = ${esc.json(topbarTitle)}

export default function Topbar({ appName, currentPath, theme, userInfo, sourceName }) {
  return (
    <header className="ouroboros-layout-topbar">
      <div>
        <strong>{topbarTitle}</strong>
        <span>{appName || sourceName}</span>
      </div>
      <nav aria-label="当前上下文">
        <span>{currentPath || '/'}</span>
        <span>{theme?.name || theme || 'default'}</span>
        <span>{userInfo?.nickname || userInfo?.username || 'anonymous'}</span>
      </nav>
    </header>
  )
}
