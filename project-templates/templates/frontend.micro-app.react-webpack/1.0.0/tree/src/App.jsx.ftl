import React from 'react'

const sourceName = ${esc.json(project.sourceName)}
const includeExampleRoute = ${esc.json(includeExampleRoute)}

export const routeDefinitions = [
  {
    path: '/',
    title: '工作台',
  },
  ...(includeExampleRoute
    ? [
        {
          path: '/example',
          title: '示例页面',
        },
      ]
    : []),
]

function normalizePathname() {
  if (typeof window === 'undefined' || !window.location) {
    return '/'
  }
  return window.location.pathname || '/'
}

export default function App(props) {
  const pathname = normalizePathname()
  const activeRoute = routeDefinitions.find((route) => pathname.endsWith(route.path)) || routeDefinitions[0]

  return (
    <main className="ouroboros-micro-app">
      <section className="ouroboros-micro-app__hero">
        <p className="ouroboros-micro-app__eyebrow">Ouroboros Micro Frontend</p>
        <h1>{sourceName}</h1>
        <p>
          当前路由：<strong>{activeRoute.title}</strong>
        </p>
      </section>
      <section className="ouroboros-micro-app__panel">
        <h2>宿主传入参数</h2>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </section>
    </main>
  )
}
