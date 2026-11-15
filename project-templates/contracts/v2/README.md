# Project Templates Contract v2

v2 是项目生成器模板源码合同。它只约束模板作者如何维护模板族、配置字段和模板文件；qualification descriptor / attestation / catalog publication 仍沿用 `contracts/v1`。

## 用户可见模板族

运行时 catalog 会把官方组合 artifact 投影为 6 个模板族：

| scope | familyId | 用户可见名称 | 稳定 branch |
|---|---|---|---|
| `MICRO_FRONTEND` | `frontend.micro-app` | 前端应用 | React/Webpack、Vue/Vite |
| `MICRO_FRONTEND` | `frontend.layout` | 自定义布局 | React/Webpack、Vue/Vite |
| `MICRO_FRONTEND` | `frontend.component-library` | 组件库 | React/Webpack、Vue/Vite |
| `MICRO_FRONTEND` | `frontend.login` | 自定义登录页 | React/Webpack、Vue/Vite |
| `PLATFORM_COMPONENT_LIBRARY` | `frontend.platform-component-library` | 平台组件库 | React/Webpack、Vue/Vite |
| `BACKEND_EXTENSION` | `backend.extension.spring-autoconfigure` | 后端 Maven 扩展包 | Maven/Spring Boot |

`scope` 只决定入口过滤；React/Vue、Webpack/Vite 由模板族 AMIS 参数 `framework` 和 `buildTool` 决定。

## 用户输入矩阵

| familyId | 用户输入 |
|---|---|
| `frontend.micro-app` | `framework`、`buildTool`、`packageName`、`includeExampleRoute` |
| `frontend.layout` | `framework`、`buildTool`、`packageName`、`topbarTitle`、`sidebarTitle` |
| `frontend.component-library` | `framework`、`buildTool`、`packageName` |
| `frontend.login` | `framework`、`buildTool`、`packageName`、`brandName` |
| `frontend.platform-component-library` | `framework`、`buildTool`、`packageName` |
| `backend.extension.spring-autoconfigure` | `groupId`、`artifactId`、`version`、`packageName`、`autoConfigurationClassName` |

模板参数必须保持最小且无冲突：前端 ZIP 根目录取 npm `packageName` 的最后一段；后端 ZIP 根目录取 `artifactId`；Java 包路径固定为 `packageName.replace('.', '/')`；自动配置类文件名取 `autoConfigurationClassName`；Webpack/Vite bundle 名称、库名、源码标识和示例组件类型均由 npm 包名派生。不得再声明这些派生值供用户重复输入。

## AMIS 控件

- 模板族使用 `list-select`，并展示模板名称和说明。
- React/Vue、Webpack/Vite 等少量互斥枚举使用 `button-group-select`。
- 只有选项较多、不适合平铺的枚举才使用 `select`。
- 布尔配置使用 `switch`，文本配置使用 `input-text`。
- 级联选项使用 AMIS 原生 `visibleOn`、选项级显隐或受控 `source`，不得新增项目生成专用 renderer。

## 模板源码规则

- 模板 manifest 使用 `contractVersion: "2"`。
- 模板内容和 `target` 统一使用 FreeMarker 兼容语法。
- 不允许使用历史项目生成器专用 token。
- 生成内容如果需要保留字面 `${...}`，使用 `<#noparse>...</#noparse>`。
- 前端 family branch 必须引入 `qiankun` 和平台 SDK，不得引入 AMIS。
- 后端 family 首版只保留 Maven 扩展包模板，并包含 Maven 插件、打包配置、`AGENTS.md` 上下文和 `.agents/skills/`。

## 验证入口

按模板族跑完整 branch matrix：

```bash
bash project-templates/scripts/verify-frontend-templates.sh --family frontend.micro-app --qualification --clean
bash project-templates/scripts/verify-frontend-templates.sh --family frontend.platform-component-library --qualification --clean
bash project-templates/scripts/verify-backend-templates.sh --family backend.extension.spring-autoconfigure --qualification --clean --platform-smoke
```

不传 `--family` 时，脚本会跑当前全部官方 branch。`--template` 只用于维护者定位单个 artifact，不是用户可见模板 ID。
