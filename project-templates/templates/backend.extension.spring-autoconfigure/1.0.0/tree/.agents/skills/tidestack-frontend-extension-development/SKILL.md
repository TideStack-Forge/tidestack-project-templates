---
name: tidestack-frontend-extension-development
description: 创建或调整 TideStack（Ouroboros）自定义前端扩展工程、组件库、微前端、布局或登录页，接入 SDK、路由、安装与卸载生命周期及构建交付时使用。标准 AMIS 页面使用 UI Schema 开发 Skill。
---

# 前端扩展接入与交付

## Overview

Build frontend extensions through the official TideStack/Ouroboros project templates and micro-frontend contracts. Generated projects are qiankun-compatible and use `ouroboros-sdk`; do not introduce AMIS into template branches unless the template contract changes.

先区分标准页面、自定义局部组件、可配置 Widget 与独立微前端。列表、表单、弹窗优先按 [UI Schema](../tidestack-ui-schema-development/SKILL.md) 实现；已有前端工程内普通业务修改不必重新生成工程。复杂后端不构成引入微前端的理由。

## Template Families

- `frontend.micro-app`: business micro frontend application.
- `frontend.layout`: custom shell layout.
- `frontend.login`: custom login page.
- `frontend.component-library`: ordinary reusable component library.
- `frontend.platform-component-library`: platform component library with `components.manifest.json` and `manage.json`.

Each frontend family has React/Webpack and Vue/Vite branches where the template exists. User-facing options come from `framework`, `buildTool`, `packageName`, and family-specific fields such as `topbarTitle`, `sidebarTitle`, `brandName`, or `includeExampleRoute`.

## Workflow

1. Choose the template family before writing code; use `project-templates/contracts/v2/README.md` for the official matrix.
2. In generated micro apps, preserve qiankun `bootstrap`, `mount`, `update`, and `unmount` lifecycle exports.
3. Mount only into `props.container` or the local `#root`; never hardcode the host shell DOM.
4. Register page, dialog, drawer, and tab routes in the template's route definition surface so each view has a reproducible path.
5. Prefer `props.__utils__` and `props.i18n` for platform-provided utilities; use `ouroboros-sdk` active bindings only through the established initialization path.
6. For platform component libraries, keep manifest names, manage metadata, source exports, `install(registry)`, and contract tests in lockstep.
7. Wire visible pages back to metadata through `tidestack-metadata-definition`; use UI Model for route registration and UI Schema only for AMIS/schema-backed pages, not ordinary micro routes.

## Validation

- Generated frontend project:

```bash
npm run build
npm run test:contract
```

- Platform template maintainer only, when the monorepo and qualification toolchain are available:

```bash
bash project-templates/scripts/verify-frontend-templates.sh --family frontend.micro-app --qualification --clean
bash project-templates/scripts/verify-frontend-templates.sh --family frontend.platform-component-library --qualification --clean
```

- Local shell debugging: use `tidestack-local-debugging` for `frontends/web/main-app` or the Docker web base.

## Guardrails

- Keep `qiankun` and `ouroboros-sdk` dependencies in official frontend templates.
- Do not add a project-generation-only renderer for form options; use AMIS native controls in template parameter schemas.
- Do not create a parallel frontend registry when the template already has a manifest, route definition, or install hook.

生成项目按其实际 package.json 执行 build 和 contract 测试，不要求具有平台模板资格脚本。验证宿主挂载、路由刷新、dialog/drawer/tab、权限拒绝、SDK 上下文与 unmount 清理。登录展示不替代认证/授权。Widget 元数据、微应用及 UI Model 的资源契约见 [metadata](../tidestack-metadata-definition/SKILL.md)。
