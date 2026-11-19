---
name: tidestack-metadata-definition
description: 定义、检查或校验 TideStack（Ouroboros）元数据资源时使用，按文件名/后缀选择 32 类资源契约。统一维护模块、菜单、权限、UI Model、配置等字段及校验工具；完整模型、页面和流程开发使用对应任务 Skill。
---

# TideStack Metadata Definition

## Overview

本 Skill 提供 32 类资源与统一校验器。Schema 统一从平台公共 `metadata-schema/` 分发，来源与摘要见 `references/schema-sources.json`，维护和加载边界见[来源与加载](references/contracts.md)。手册、IDE 与项目模板使用同源契约。

源码放 `src/main/metadata/`，打包到 `META-INF/ouroboros/metadata/`。有对应 Schema 不等于目标应用装配了 runtime、provider 或 handler；结构、加载、引用和实际行为分别检查。新增普通业务资源沿现有加载路径交付，不自行实现 provider 或 loader。

Keep this skill as the one place for file-type routing. Do not split new metadata types into one skill per suffix unless the type needs a large dedicated workflow or executable tool.

## Route By File Type

| File Pattern | Metadata Type | Purpose | Group | Schema |
| --- | --- | --- | --- | --- |
| `*.business.json` | `business` | 业务模型 | 后端开发 | `references/business.schema.json` |
| `*.logicflow.json` | `logicflow` | 逻辑流模型 | 后端开发 | `references/logicflow.schema.json` |
| `*.workflow.json` | `approval-workflow` | 审批流资源元数据 | 后端开发 | `references/approval-workflow.schema.json` |
| `*.approval-form.json` | `approval-form` | 自定义审批表单描述 | 后端开发 | `references/approval-form.schema.json` |
| `app-modules.json` | `app-module` | 应用模块集合 | 后端开发 | `references/app-module.schema.json` |
| `*.menu.json` | `menu` | 运行态菜单 | 后端开发 | `references/menu.schema.json` |
| `*.dev-menu.json` | `dev-menu` | 开发态菜单 | 平台扩展开发 | `references/dev-menu.schema.json` |
| `*.authority.json` | `authority` | 权限项 | 后端开发 | `references/authority.schema.json` |
| `*.ui-model.json` | `ui-model` | UI 模型 | 后端开发 | `references/ui-model.schema.json` |
| `*.ui-schema.json` | `ui-schema` | UI Schema | 后端开发 | `references/ui-schema.schema.json` |
| `configurations.json` | `configuration` | 配置项集合 | 后端开发 | `references/configuration.schema.json` |
| `configuration-groups.json` | `configuration-group` | 配置分组集合 | 后端开发 | `references/configuration-group.schema.json` |
| `*.config.json` | `configuration-item` | 单条配置项 | 后端开发 | `references/configuration-item.schema.json` |
| `*.config-group.json` | `configuration-group-item` | 单条配置分组 | 后端开发 | `references/configuration-group-item.schema.json` |
| `app.metadata.json` | `app-metadata` | 应用元数据 | 后端开发 | `references/app-metadata.schema.json` |
| `modules.diff.json` | `modules-diff` | 模块树 Diff | 后端开发 | `references/modules-diff.schema.json` |
| `*.position.json` | `position` | 岗位定义 | 后端开发 | `references/position.schema.json` |
| `*.dict.json` | `data-dict` | 数据字典 | 后端开发 | `references/data-dict.schema.json` |
| `*.data-init.json` | `data-init` | 数据初始化 | 后端开发 | `references/data-init.schema.json` |
| `*.error.json` | `error-code` | 错误码集合 | 后端开发 | `references/error-code.schema.json` |
| `*.i18n.json` | `i18n` | 国际化语言包 | 后端开发 | `references/i18n.schema.json` |
| `*.field-type.json` | `field-type` | 字段类型扩展 | 后端开发 | `references/field-type.schema.json` |
| `*.flow-node.json` | `flow-node` | 逻辑流节点扩展 | 后端开发 | `references/flow-node.schema.json` |
| `*.webapi.json` | `webapi` | WebAPI 模型 | 后端开发 | `references/webapi.schema.json` |
| `*.rpc.json` | `rpc` | RPC 模型 | 后端开发 | `references/rpc.schema.json` |
| `*.rpc.auth.json` | `rpc-auth` | RPC 认证 | 后端开发 | `references/rpc-auth.schema.json` |
| `*.mq.json` | `mq` | MQ 绑定 | 后端开发 | `references/mq.schema.json` |
| `*.schedule.json` | `schedule` | 定时任务 | 后端开发 | `references/schedule.schema.json` |
| `*.notification.json` | `notification` | 通知模板 | 后端开发 | `references/notification.schema.json` |
| `*.business-log.json` | `business-log` | 业务日志模板 | 后端开发 | `references/business-log.schema.json` |
| `*.widget.json` | `widget` | 仪表盘组件定义 | 前端开发 | `references/widget.schema.json` |
| `*.micro-web.json` | `micro-web` | 微前端注册/资源包 | 前端开发 | `references/micro-web.schema.json` |

## Workflow

1. Identify the metadata type by exact file name or suffix before editing.
2. Choose the owning implementation module; keep metadata with the module that owns the runtime capability.
3. Search existing files for the same stable identity and update in place instead of creating duplicates.
4. Follow the type-specific rules below and preserve TideStack/Ouroboros naming conventions.
5. Validate every changed metadata file against the matching JSON Schema in `references/`.
6. Run broader backend, frontend, or runtime checks only when the changed type affects code paths beyond metadata loading.

## Type Rules

- **Business models (`*.business.json`)**: keep `name` stable; use `namespace` for grouping; align fields with field types before enabling generated APIs.
- **App modules (`app-modules.json`)**: use one entry per real module; avoid synthetic hierarchy; bind menu and authorities to the owning module.
- **Menus (`*.menu.json`)**: use for runtime navigation; align `url` with UI Model paths.
- **Dev menus (`*.dev-menu.json`)**: use only for development-platform surfaces; prefer `/dev/{appName}/...` for app-scoped pages.
- **Authorities (`*.authority.json`)**: align APIs with real/requested routes and UI views with UI Model paths.
- **UI Model (`*.ui-model.json`)**: use `type: amis` for schema pages and `type: micro` for micro frontend pages.
- **UI Schema (`*.ui-schema.json`)**: store wrapped schemas as `{ "name": "...", "schema": { ... } }`; do not create placeholder schemas for ordinary micro routes.
- **Configuration collections/items**: use collection files for packaged arrays and item files for workspace single-object providers; keep keys and group paths stable.
- **Field types (`*.field-type.json`)**: keep `name` stable; align `dataType`, input/display UI, validations, params schema, and default params.
- **Flow nodes (`*.flow-node.json`)**: keep `type` stable; align scaffold, ports, port rules, properties, and runtime implementation.
- **Widgets (`*.widget.json`)**: use for dashboard widgets; keep name, default size, config form items, and schema template consistent.
- **Micro-web (`*.micro-web.json`)**: normalize `publicPath` with one leading and one trailing slash; align `packageName` with the built resource package.
- **Integration resources (`*.webapi.json`, `*.rpc.json`, `*.rpc.auth.json`, `*.mq.json`, `*.schedule.json`)**: cross-check runtime handlers, credentials, permissions, destinations, and flow names.
- **Business templates (`*.notification.json`, `*.business-log.json`)**: align payload schemas and URLs with real runtime code; never embed secrets or log sensitive data by default.
- **Data/support resources (`*.dict.json`, `*.data-init.json`, `*.error.json`, `*.i18n.json`, `*.position.json`)**: keep identities stable after publication and design for idempotent/runtime-safe loading.
- **App metadata and module diffs**: use app metadata for app-level descriptors and module diffs only for intentional add/remove/modify patches.

完整校验使用本 Skill 的 Python Draft202012Validator；在隔离环境安装 `scripts/requirements.txt`。缺依赖退出 2，不静默降级。Python/Node 的 `--subset` 只做显式请求的子集检查，不是完整门禁。审批图语义与部署仍由正式 codec 和引擎验证。

权限/模块/菜单/UI Model 的组合见[业务入口](../tidestack-business-entry-definition/SKILL.md)，字典的维护归属与刷新、初始化的新增语义、配置的实际消费、错误码和 i18n 见[支撑资源](references/supporting-resources.md)。

自定义审批表单：应用元数据放 `approval-form/{name}.approval-form.json`；模块放 `src/main/metadata/approval-form/`，打包到 `META-INF/ouroboros/metadata/approval-form/`。必填 `formatVersion: 1`、稳定的 `name`、展示 `title`、`fields`。字段使用 `name/label/type`，可带 `description/params`；`params` 是现有字段类型参数，不是实例数据。流程使用 `form: {formType: "custom", formId: "<name>"}` 引用，节点权限和条件保存在流程中。Schema 检查结构，平台负责名称判重、类型编译和引用校验，不能只凭 Schema 通过声称可部署。使用例见[审批接入](../tidestack-approval-integration/SKILL.md)。

## Validation

Use the schema that matches the metadata type. For example:

```bash
python3 .agents/skills/tidestack-metadata-definition/scripts/validate_resource_json.py \
  --schema .agents/skills/tidestack-metadata-definition/references/flow-node.schema.json \
  --json <module>/src/main/metadata/<path>/example.flow-node.json
```

If Python is unavailable but Node.js exists:

```bash
node .agents/skills/tidestack-metadata-definition/scripts/validate_resource_json.js \
  --subset \
  --schema .agents/skills/tidestack-metadata-definition/references/flow-node.schema.json \
  --json <module>/src/main/metadata/<path>/example.flow-node.json
```

以上示例为生成项目；monorepo 的前缀为 `skills/`，独立安装按实际 Skill 目录调用，脚本与 Schema 不依赖项目工作目录。
