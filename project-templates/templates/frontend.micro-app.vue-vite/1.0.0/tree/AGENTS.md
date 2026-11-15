# Vue 前端应用模板约束

本项目由 Ouroboros 项目生成器生成，用作 Vue qiankun 微前端应用。

- 保留 `bootstrap`、`mount`、`update`、`unmount` 四个生命周期导出。
- 挂载和卸载只操作 qiankun 传入的 `props.container` 或本地 `#app`，不要写死主壳 DOM。
- 页面和弹窗页面统一登记在 `src/App.vue` 的 `routeDefinitions`，弹窗、抽屉、页签都必须有可复现的路径。
- 使用平台能力时优先读取 `hostProps.__utils__`、`hostProps.i18n`；如改用 `ouroboros-sdk` 活绑定导出，先切换到 `initMicroApp` 初始化方式。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
