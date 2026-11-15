---
name: tidestack-approval-integration
description: 在 TideStack（Ouroboros）应用中接入人工审批，配置业务绑定、流程部署、参与人、待办、表单、状态回写与通知时使用。新增审批引擎或编辑器节点类型属于平台维护。
---

# 审批业务接入

1. 明确业务对象、主键、状态、发起人/候选人、可编辑字段、查看范围和通过/驳回/撤回等实际路径。自动校验与计算使用[逻辑流](../tidestack-logicflow-development/SKILL.md)，人工决策使用审批。
2. 查平台审批 runtime、目标引擎和已存在流程，优先配置业务模型的正式 workflow 绑定。不要复制一套待办表和审批状态机。
3. 定义节点、连线、分支和参与者；资源交付使用 `.workflow.json` 和[对应 Schema](../tidestack-metadata-definition/references/approval-workflow.schema.json)。保存不等于部署，部署成功也不保证目标用户有发起权限。
4. 通过平台既有部署、发起与审批入口执行。表单复用[UI Schema](../tidestack-ui-schema-development/SKILL.md)，核对 dialog/drawer 动作与宿主；后端限制审批期间的字段与操作。
5. 明确业务状态回写、失败回滚、重复请求和通知责任。先证明待办产生，再查通知模板、地址与渠道；待办成功不等于消息送达。使用[通知](../tidestack-notification-development/SKILL.md)，避免重复触发。
6. 发起人、审批人、无权限用户分别验证：正常通过、驳回/退回、空候选人、重复处理、定义更新后既有实例、业务写入失败、字段权限及处理记录。

交付流程/业务绑定、身份权限、表单、部署与实例证据。未配置实际引擎或缺部署版本时列出缺口。

用户任务路径见手册 `guide/module/approval-workflow/index.md`。新增节点类型可能涉及 codec、规范图、Flowable/Activiti6 适配、编辑器翻译和 engine-testkit，不应作为应用接入的普通 SPI 示例。
