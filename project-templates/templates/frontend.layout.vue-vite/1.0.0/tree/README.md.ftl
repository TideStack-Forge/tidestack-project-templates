# ${project.name}

这是一个 Vue 自定义布局模板，提供平台顶栏和侧栏扩展。

- 交付类型：布局扩展
- npm 包名：`${packageName}`
- 顶栏标题：`${topbarTitle}`
- 侧栏标题：`${sidebarTitle}`
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

## 主壳接入

- 顶栏入口：`topbar`
- 侧栏入口：`sidebar`
- 生命周期函数：`bootstrap`、`mount`、`update`、`unmount`
- 生命周期实现：`src/layout-entry.js` 导出顶栏和侧栏 parcel，并把默认 lifecycle 指向顶栏

## 可定制布局

顶栏在 `src/components/Topbar.vue` 中定制，当前通过 `hostProps.topbarTitle` 和 `hostProps.userInfo.username` 展示标题与用户信息。适合放品牌标识、主题入口、用户信息和全局动作。

侧栏在 `src/components/Sidebar.vue` 中定制，当前通过 `hostProps.sidebarTitle` 和 `hostProps.menu` 展示标题与菜单。适合定制菜单树、导航分组和折叠态表现。

SDK 类型中已确认布局宿主参数包括：`container`、`appName`、`logo`、`menu`、`theme`、`userInfo`、`breadcrumb`、`currentPath`、`sidebarStatus`、`onThemeChanged`、`onSidebarWidthChange`、`themeList`、`showXsNavbar`。Vue 模板当前通过 `hostProps` 读取宿主参数；使用新增字段前先在主壳注入合同中确认。

## 修改原则

布局扩展只负责渲染顶栏和侧栏，不接管主壳路由、不持久化主壳状态。需要响应主题或侧栏宽度时，通过宿主传入的回调处理。
