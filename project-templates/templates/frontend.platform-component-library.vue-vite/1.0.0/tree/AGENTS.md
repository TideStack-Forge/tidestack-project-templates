# Vue 平台组件库模板约束

本项目由 Ouroboros 项目生成器生成，用作公共平台组件库。

- 组件注册入口是 `src/index.js` 的 `install(registry)`。
- 新增组件类型时同步维护 `components.manifest.json`、`manage.json`、`components` 导出、`install(registry)` 和 `tests/platform-library-contract.test.cjs`。
- manifest、manage 和源码注册名必须完全一致；类型名发布后视为公开合同。
- 当前模板默认覆盖 `Renderer`、`FormItem`、`registerAction`、`registerValidator`；扩展 `OptionsControl`、`registerFormula`、编辑器插件等类型时先按平台 manifest 合同补齐声明。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
