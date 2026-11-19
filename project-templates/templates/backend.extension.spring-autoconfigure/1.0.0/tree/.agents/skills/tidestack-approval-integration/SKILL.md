---
name: tidestack-approval-integration
description: 在 TideStack（Ouroboros）业务应用中绑定审批、发起申请、处理结果和状态回写，配置业务表单及权限并验证实际行为时使用。
---

# 审批业务接入

1. 确认业务对象、记录主键、状态、发起人、参与人、可编辑字段及查看范围，优先复用业务模型已有 workflow 绑定。
2. 按[业务接入与结果处理](references/business-integration.md)使用目标版本提供的正式绑定、发起和结果契约。引擎类型和集成模式由平台接入配置负责，应用不自行维护模式分支或复制待办表。
3. 复用已发布且可用的流程。只有任务要求新流程或修改流程时，才定义节点、分支、参与者，并按[审批 Schema](../tidestack-metadata-definition/references/approval-workflow.schema.json)交付 `.workflow.json`；保存不等于发布生效。
4. 低代码表单复用[UI Schema](../tidestack-ui-schema-development/SKILL.md)；高代码页面按下节使用独立字段描述。由业务后端约束审批期间允许的修改和操作。人工决策使用审批，自动计算或校验用[逻辑流](../tidestack-logicflow-development/SKILL.md)。
5. 明确结果回写、重复提交、失败恢复和通知责任。平台已发送的通知不再手工重复；需要额外消息时使用[通知](../tidestack-notification-development/SKILL.md)。
6. 按实际支持的操作验证通过、驳回、撤回、重复处理、无权限访问和业务写入失败，核对业务状态与记录归属。交付绑定/表单资源及实际验证结果。

目标环境缺正式入口或所需操作时说明缺口；不在业务应用补引擎适配，也不把尚未统一的能力写成已透明可用。

## 自定义表单的高代码场景

高代码业务页面使用自定义表单（`formType: custom`）：在独立 `.approval-form.json` 中声明可配置的字段，标准 `.workflow.json` 用 `form.formId` 引用其 `name`。无需为声明字段创建 DTO、注解、UI Schema、逐表单 Provider 或业务模型 Action。字段类型及 `params` 复用平台字段目录；节点权限与分支条件留在流程定义，实际实例值由业务代码提供。

| 场景 | 表单类型 | 字段来源 |
| --- | --- | --- |
| 平台管理表单及数据 | `default`（动态表单） | 动态表单定义 |
| 已有业务模型页面 | `business-model`（业务模型） | 业务模型字段 |
| 应用自行实现业务页面 | `custom`（自定义表单） | 独立字段描述 |

文件放在应用元数据仓库 `approval-form/`，或模块的 `src/main/metadata/approval-form/`（打包到 `META-INF/ouroboros/metadata/approval-form/`）。运行目录是应用 `homePath/approval-form/`。文件基名等于 `name`，版本为整数 `1`；字段名使用 `[A-Za-z_][A-Za-z0-9_]*` 且不能以 `__` 开头。同一描述可供多条流程使用，权限规则分别保存在各自流程中。

完整描述与流程例见 `examples/purchase.approval-form.json`、`examples/purchase.workflow.json`。示例审批人采用发起人，实际业务应按要求配置参与人。按元数据 Skill 的完整 Schema 校验器校验两份文件，再验证目标环境能加载字段、保存规则和部署。部署后可在线编辑节点、权限与条件，显式重新部署用于新实例；在途实例保留原部署定义。描述更新不冻结在接管流程中，失效引用需修复后再部署。设计时字段目录不替代高代码页面、数据读写与权限执行；通用审批页面没有运行时表单服务时应引导到业务页面。
