# React 组件库模板约束

本项目由 Ouroboros 项目生成器生成，用作 React 微前端组件库。

- 组件注册入口是 `src/index.jsx` 的 `install(registry)`。
- 新增组件时同步维护 `components` 导出、`install(registry)` 注册和 `tests/component-library-contract.test.cjs`。
- 当前模板默认注册 `Renderer` 和 `FormItem`；扩展 `registerAction`、`registerValidator`、`registerFormula` 等类型前先确认宿主 registry 合同。
- 组件类型名发布后视为公开合同，不要无迁移直接改名。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
