# React 自定义布局模板约束

本项目由 Ouroboros 项目生成器生成，用作 React qiankun 布局扩展。

- 保留 `src/createLayoutParcel.jsx` 中基于 `initLayoutComponent` 的 lifecycle 初始化。
- 顶栏只在 `src/components/Topbar.jsx` 定制，侧栏只在 `src/components/Sidebar.jsx` 定制。
- 使用宿主传入的 `menu`、`breadcrumb`、`theme`、`userInfo`、`sidebarStatus` 等参数，不要自行创建主壳级状态源。
- 不要接管主壳路由，不要直接修改主壳 DOM。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
