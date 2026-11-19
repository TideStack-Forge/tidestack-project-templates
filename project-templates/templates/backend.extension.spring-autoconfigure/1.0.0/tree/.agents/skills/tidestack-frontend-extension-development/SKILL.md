---
name: tidestack-frontend-extension-development
description: 为 TideStack（Ouroboros）业务应用接入自定义组件、Widget、微前端、布局或登录页，使用官方模板和 SDK，处理路由、挂载卸载及构建交付时使用。
---

# 前端扩展接入与交付

先区分标准 Schema 页面、自定义局部组件、可配置 Widget 和独立微前端。列表、表单、弹窗优先使用[UI Schema](../tidestack-ui-schema-development/SKILL.md)；复杂后端不构成引入微前端的理由。已有工程的局部业务修改沿用其组织。

## 模板选择

| 目标 | 官方模板族 |
| --- | --- |
| 独立业务微前端 | `frontend.micro-app` |
| 应用布局或登录页 | `frontend.layout` / `frontend.login` |
| 普通共享组件库 | `frontend.component-library` |
| 向基座安装可注册组件 | `frontend.platform-component-library` |

使用目标版本实际提供的框架与构建分支，不要求应用持有平台模板仓库。生成项目只安装自身声明的依赖；微前端沿官方 qiankun 与 ouroboros-sdk 契约接入。

## 应用接入

1. 沿生成项目的路由入口登记实际页面、dialog、drawer 或 tab；刷新及直接访问有可复现路径。
2. 保留 `bootstrap/mount/update/unmount` 生命周期；挂载到 `props.container` 或本地根节点，卸载时释放事件、订阅及任务。
3. 通过模板的初始化路径使用 `props.__utils__`、`props.i18n` 和 SDK 上下文，不自行建立全局注册表或绑定宿主 DOM。
4. 开发可安装组件时，对齐模板已有 manifest、管理元数据、导出和 `install(registry)`。Widget 使用[metadata](../tidestack-metadata-definition/SKILL.md)的组件定义，不为普通组件强加微应用外壳。
5. 可见页面通过[业务入口](../tidestack-business-entry-definition/SKILL.md)接入。普通微前端路由不补空 UI Schema；登录页展示不替代认证和授权。

## 验证与交付

按项目实际 package.json 执行 build 和已有 contract 测试，再在目标基座验证挂载、路由刷新、权限拒绝、弹窗/抽屉、SDK 上下文及卸载清理。生成项目若提供以下脚本，可直接运行：

```bash
npm run build
npm run test:contract
```

联调使用[本地联调](../tidestack-local-debugging/SKILL.md)中与当前应用匹配的基座。交付构建产物和注册资源；平台模板资格验证及项目生成器维护不属于业务扩展交付。
