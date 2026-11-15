# ${project.name}

这是一个 React 前端应用模板，可作为 qiankun 微前端挂载到 Ouroboros 主壳。

- npm 包名：`${packageName}`
- 默认访问路径：`/${project.slug}/`
- SDK 使用说明：https://www.npmjs.com/package/ouroboros-sdk
- 平台依赖：`qiankun`、`ouroboros-sdk`；不要额外引入 `amis`

## 开发工具

推荐安装 **TideStack Develop** 插件以获得更好的开发体验：使用 IntelliJ IDEA 时，可在 JetBrains Marketplace 搜索并安装 `TideStack Develop`；使用 Visual Studio Code 时，可在 VS Code Marketplace 搜索并安装同名插件。插件提供模型元数据的可视化编辑、项目开发配置和本地调试相关能力，适合与本模板生成的项目配合使用。

## 运行

```bash
npm install
npm run start
```

## 构建

```bash
npm run build
```

## 主壳接入

- 交付类型：前端应用
- 生命周期函数：`bootstrap`、`mount`、`update`、`unmount`
- 挂载容器：`src/main.jsx` 优先使用 qiankun 传入的 `props.container`
- 独立运行：不在 qiankun 中时会挂载到本地 `#root`

主壳注册时保持访问路径和构建产物入口一致。Webpack 已使用微前端友好的资源路径配置。

## 页面和弹窗

页面路由定义在 `src/App.jsx` 的 `routeDefinitions` 中。新增页面时添加一个 `{ path, title }` 项，并在 `App` 中按 `activeRoute` 渲染对应页面。

弹窗和抽屉也按页面处理：先在 `routeDefinitions` 中增加专用路径，例如 `/dialogs/user-picker` 或 `/drawers/detail`，再由平台用该路径打开弹窗、抽屉或页签。不要把弹窗内容写成只能被按钮内部状态打开的临时 DOM，否则主壳无法通过路由复现。

当前模板用 `window.location.pathname` 做轻量匹配；如果后续接入路由库，要保留 qiankun 子应用的基准路径和 unmount 清理逻辑。

## SDK 和宿主参数

`mount(props)` 会收到平台注入的参数。已确认的公共字段包括 `token`、`apiHost`、`mainWindow`、`appInfo`、`config`、`__utils__`、`i18n`。

常用能力优先从 `props.__utils__` 或 `props.i18n` 读取，例如打开页签/弹窗、请求接口、读取当前语言。若要改成从 `ouroboros-sdk` 直接导入活绑定能力，需要使用 SDK 的 `initMicroApp` 初始化生命周期，不要在当前手写 lifecycle 下假设这些导出已经注入。
