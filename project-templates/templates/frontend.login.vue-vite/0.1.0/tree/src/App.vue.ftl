<template>
  <main class="ouroboros-login-page">
    <section class="ouroboros-login-card">
      <p class="ouroboros-login-eyebrow">Custom Login</p>
      <h1><#noparse>{{</#noparse> brandName }}</h1>
      <p data-login-state="loading"><#noparse>{{</#noparse> loadingMessage }}</p>
      <form @submit.prevent>
        <input placeholder="用户名" autocomplete="username" />
        <input placeholder="密码" type="password" autocomplete="current-password" />
        <button type="submit">登录</button>
      </form>
      <p data-login-state="fallback"><#noparse>{{</#noparse> fallbackMessage }}</p>
      <small>Redirect providers: <#noparse>{{</#noparse> redirectProviderTypes }}</small>
    </section>
  </main>
</template>

<script>
import { buildLoginModel, resolveLoginMessage } from './authFlow.js'

const brandName = ${esc.json(brandName)}

export default {
  name: ${esc.json(project.sourceName)},
  props: {
    hostProps: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    brandName() {
      return brandName
    },
    loginModel() {
      return buildLoginModel({
        providers: this.hostProps.providers || [],
        locale: this.hostProps.locale || 'zh-CN',
      })
    },
    loadingMessage() {
      return resolveLoginMessage('loading', this.loginModel.locale)
    },
    fallbackMessage() {
      return resolveLoginMessage('failed', this.loginModel.locale)
    },
    redirectProviderTypes() {
      return this.loginModel.redirectProviders.map((provider) => provider.type).join(', ') || '-'
    },
  },
}
</script>
