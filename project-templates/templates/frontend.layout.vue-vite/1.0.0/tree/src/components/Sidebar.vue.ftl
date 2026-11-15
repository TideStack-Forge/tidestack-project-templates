<template>
  <aside class="ouroboros-layout-sidebar">
    <strong><#noparse>{{</#noparse> title }}</strong>
    <nav>
      <a v-for="item in menuItems" :key="item.id || item.path" :href="item.path || '#'">
        <#noparse>{{</#noparse> item.label || item.name }}
      </a>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'OuroborosSidebar',
  props: {
    hostProps: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    title() {
      return this.hostProps.sidebarTitle || ${esc.json(sidebarTitle)}
    },
    menuItems() {
      return this.hostProps.menu || []
    },
  },
}
</script>
