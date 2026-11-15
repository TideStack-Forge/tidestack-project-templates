<template>
  <main class="ouroboros-micro-app">
    <section class="ouroboros-micro-app__hero">
      <p class="ouroboros-micro-app__eyebrow">Ouroboros Vue Micro Frontend</p>
      <h1><#noparse>{{</#noparse> sourceName }}</h1>
      <p>
        当前路由：<strong><#noparse>{{</#noparse> activeRoute.title }}</strong>
      </p>
    </section>
    <section class="ouroboros-micro-app__panel">
      <h2>宿主传入参数</h2>
      <pre><#noparse>{{</#noparse> formattedProps }}</pre>
    </section>
  </main>
</template>

<script>
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

export default {
  name: `${project.sourceName}App`,
  props: {
    hostProps: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    sourceName() {
      return sourceName
    },
    activeRoute() {
      const pathname = normalizePathname()
      return routeDefinitions.find((route) => pathname.endsWith(route.path)) || routeDefinitions[0]
    },
    formattedProps() {
      return JSON.stringify(this.hostProps, null, 2)
    },
  },
}
</script>
