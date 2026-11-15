---
name: tidestack-business-model-development
description: 为 TideStack（Ouroboros）创建或扩展业务模型、关系、视图、CRUD、Action 和 Java Handler，并核对投射资源时使用。既适用于基础资料，也适用于模型契约加代码实现的复杂业务操作。
---

# 业务模型开发

1. 先查已有对象、模型和投射结果。简单资料与标准维护优先模型；普通关联不构成放弃模型的理由。复杂事务或算法先评估 Action 加 Java Handler，只为真实缺口写代码。
2. 在所属实现模块 `src/main/metadata/` 定义 `.business.json`；直接存模型对象。读取[模型与行为契约](references/model-and-actions.md)和[完整 Schema](../tidestack-metadata-definition/references/business.schema.json)。
3. 新 default 模型显式使用 formatVersion 2.0，填写实际 namespace/name/title、字段与关系。维护旧定义时不顺带升级版本；fullName/source 等运行时派生值不手填。
4. 按需求启用模型、API 和视图，避免模板无条件开放全部操作。字段类型和关系引用必须在目标环境存在，Schema 通过不代表关联可解析。
5. 自定义行为定义 Action 输入/输出和绑定，通过 BusinessActionRuntime 执行。按参考选择 Java Handler、注解绑定或逻辑流；普通 Controller 不自动成为 Action。
6. 事件与订阅交给[事件 Skill](../tidestack-business-event-development/SKILL.md)，人工审批用[审批 Skill](../tidestack-approval-integration/SKILL.md)。可复用功能插件见[功能插件](references/feature-plugins.md)。
7. 检查投射的数据模型、API、权限、菜单与页面，只补必要手写资源；使用[业务入口](../tidestack-business-entry-definition/SKILL.md)和[UI Schema](../tidestack-ui-schema-development/SKILL.md)，避免同名双实现。

验证结构、打包、加载、发布/刷新和真实行为，覆盖非法输入、禁用、授权拒绝、数据范围、失败回滚和自定义动作。生成类型或 DTO 不能代替动态 Schema 校验。记录目标版本和未验证链路。
