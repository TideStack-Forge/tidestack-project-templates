# ${project.name}

这是一个 React 自定义布局模板，提供平台顶栏和侧栏扩展。

- npm 包名：`${packageName}`
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

- 交付类型：布局扩展
- 顶栏入口：`${packageName}-topbar`
- 侧栏入口：`${packageName}-sidebar`
- 访问路径：`/${project.slug}/`
- 生命周期函数：`bootstrap`、`mount`、`update`、`unmount`
- 生命周期初始化：`src/createLayoutParcel.jsx` 使用 `ouroboros-sdk` 的 `initLayoutComponent`

## 可定制布局

顶栏在 `src/components/Topbar.jsx` 中定制，当前接收并展示 `appName`、`currentPath`、`theme`、`userInfo`、`sourceName`。适合放品牌标识、当前路径、主题入口、用户信息和全局动作。

侧栏在 `src/components/Sidebar.jsx` 中定制，当前接收并展示 `menu`、`breadcrumb`、`sidebarStatus`、`sourceName`。适合定制菜单树、面包屑、折叠状态和导航分组。

SDK 类型中已确认布局宿主参数包括：`container`、`appName`、`logo`、`menu`、`theme`、`userInfo`、`breadcrumb`、`currentPath`、`sidebarStatus`、`onThemeChanged`、`onSidebarWidthChange`、`themeList`、`showXsNavbar`。使用新增字段前先在主壳注入合同中确认。

## 修改原则

布局扩展只负责渲染顶栏和侧栏，不接管主壳路由、不持久化主壳状态。需要响应主题或侧栏宽度时，通过宿主传入的回调处理。
