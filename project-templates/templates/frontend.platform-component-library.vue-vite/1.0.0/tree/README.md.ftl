# ${project.name}

这是一个 Vue 平台组件库模板，可上传到公共菜单的“平台组件库”入口。

- 交付类型：平台组件库
- npm 包名：`${packageName}`
- 组件库名称：`${project.libraryName}`
- 内置示例：渲染器、表单项、事件动作、校验器
- 安装包包含：`components.manifest.json`、`manage.json`、`dist/`
- SDK 使用说明：https://www.npmjs.com/package/ouroboros-sdk
- 平台依赖：`qiankun`、`ouroboros-sdk`；不要额外引入 `amis`

## 开发工具

推荐安装 **TideStack Develop** 插件以获得更好的开发体验：使用 IntelliJ IDEA 时，可在 JetBrains Marketplace 搜索并安装 `TideStack Develop`；使用 Visual Studio Code 时，可在 VS Code Marketplace 搜索并安装同名插件。插件提供模型元数据的可视化编辑、项目开发配置和本地调试相关能力，适合与本模板生成的项目配合使用。

构建：

```bash
npm install
npm run build
npm run test:contract
```

## 注册入口

组件注册入口在 `src/index.js` 的 `install(registry)`：

- `registry.Renderer`：注册渲染器
- `registry.FormItem`：注册表单项
- `registry.registerAction`：注册事件动作，当前示例为 `sample-platform-action`
- `registry.registerValidator`：注册校验器，当前示例为 `samplePlatformRule`

`components` 导出、`install(registry)` 注册名和 `components.manifest.json` 声明必须保持一致。

## manifest 和管理配置

平台组件库安装包必须包含 `components.manifest.json`。平台文档确认的 manifest 类型包括：

- `renderers`：自定义渲染器
- `formItems`：表单项组件
- `optionsControls`：选项控制器
- `actions`：事件动作
- `rules`：校验规则
- `formulas`：公式函数
- `rendererEditorPlugins`、`actionEditorPlugins`、`validatorEditorPlugins`：编辑器插件

当前模板已生成 `renderers`、`formItems`、`actions`、`rules` 四类示例。新增 `optionsControls`、`formulas` 或编辑器插件时，同步修改 `components.manifest.json`、`manage.json`、`src/index.js` 和契约测试。

`manage.json` 用于声明禁用项。启用 `loadManage` 时，平台会读取各类型下的 `disabled` 数组。

## 修改原则

上传到平台组件库后，组件类型名就是公开合同。不要只改源码注册名而不改 manifest，也不要只改 manifest 而不改 `install(registry)`。
