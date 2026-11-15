<template>
  <header class="ouroboros-layout-topbar">
    <strong><#noparse>{{</#noparse> title }}</strong>
    <span><#noparse>{{</#noparse> userLabel }}</span>
  </header>
</template>

<script>
export default {
  name: 'OuroborosTopbar',
  props: {
    hostProps: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    title() {
      return this.hostProps.topbarTitle || ${esc.json(topbarTitle)}
    },
    userLabel() {
      return this.hostProps.userInfo?.username || '未登录'
    },
  },
}
</script>
