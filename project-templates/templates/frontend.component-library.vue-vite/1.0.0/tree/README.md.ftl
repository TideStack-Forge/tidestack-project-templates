# ${project.name}

这是一个 Vue 组件库模板，可作为微前端组件库接入平台。

- 交付类型：微前端组件库
- npm 包名：`${packageName}`
- 内置示例：渲染器和表单项
- 生命周期函数：`bootstrap`、`mount`、`update`、`unmount`
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

- 当前模板示例使用 `registry.Renderer` 注册渲染器。
- 当前模板示例使用 `registry.FormItem` 注册表单项。
- `components.renderers` 和 `components.formItems` 会导出同一组组件，便于测试和宿主读取。

平台 SDK 和组件库文档中已确认的注册类型包括：渲染器 `Renderer`、表单项 `FormItem`、选项控制器 `OptionsControl`、事件动作 `registerAction`、校验规则 `addRule` 或 `registerValidator`、公式函数 `registerFormula`、图标 `registerIcon`、编辑器插件 `registerEditorPlugin`、动作面板 `registerActionPanel`。

普通微前端组件库没有 `components.manifest.json`；扩展这些类型前，先确认宿主传入的 `registry` 提供对应方法，并让注册名、导出对象和契约测试保持一致。

## 修改原则

组件库只做注册，不直接依赖主壳页面状态。组件类型名要稳定，避免发布后随意改名导致已有页面 schema 无法渲染。
