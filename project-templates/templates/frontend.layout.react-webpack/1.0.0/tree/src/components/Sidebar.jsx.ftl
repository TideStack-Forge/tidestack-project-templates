import React from 'react'

const sidebarTitle = ${esc.json(sidebarTitle)}

export default function Sidebar({ menu = [], breadcrumb = [], sidebarStatus, sourceName }) {
  const collapsed = sidebarStatus?.sidebarExpanded === false

  return (
    <aside className="ouroboros-layout-sidebar" data-collapsed={collapsed ? 'true' : 'false'}>
      <h2>{sidebarTitle || sourceName}</h2>
      <ol aria-label="面包屑">
        {breadcrumb.map((item) => (
          <li key={item.path || item.label || item.name}>{item.label || item.name}</li>
        ))}
      </ol>
      <ul aria-label="菜单">
        {menu.slice(0, 8).map((item) => (
          <li key={item.id || item.path || item.name}>{item.label || item.name || item.path}</li>
        ))}
      </ul>
    </aside>
  )
}
