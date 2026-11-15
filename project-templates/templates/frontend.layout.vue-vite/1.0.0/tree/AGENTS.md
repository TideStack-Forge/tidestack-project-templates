# Vue 自定义布局模板约束

本项目由 Ouroboros 项目生成器生成，用作 Vue qiankun 布局扩展。

- 保留 `src/layout-entry.js` 中的 `topbar`、`sidebar` parcel 导出和默认 lifecycle 导出。
- 顶栏只在 `src/components/Topbar.vue` 定制，侧栏只在 `src/components/Sidebar.vue` 定制。
- 使用宿主传入的 `hostProps.menu`、`hostProps.userInfo`、`hostProps.sidebarTitle`、`hostProps.topbarTitle` 等参数，不要自行创建主壳级状态源。
- 不要接管主壳路由，不要直接修改主壳 DOM。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
