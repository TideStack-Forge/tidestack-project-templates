---
name: tidestack-howto
description: 判断需求在 TideStack（Ouroboros）中应该如何实现，按需检索能力地图，推荐能力组合、开发路线、资源清单和后续 Skill。用于开发方式咨询、能力查询、需求可行性和实施范围分析；只分析和指导，不执行开发。
---

# TideStack 开发指导

读取需求、已有代码、资源、实际依赖和目标版本的文档，给出可以评审的开发建议。只判断：不修改文件、不生成代码或 Schema、不安装依赖、不启动服务或容器、不执行改变环境的验证、不提交或推送，也不自动调用实施型 Skill。

## 判断过程

1. 明确业务对象、数据归属、规则、状态、事务、并发、幂等、外部副作用、身份与 UI 交互。查已有模型、Action、服务、权限和页面，确认应用实际装配的能力。优先参考目标版本平台内同类应用模块的调用与资源组织；参考应用的业务边界，不把其底层实现或管理功能当作每个消费项目的必选项。
2. 需求涉及能力发现、跨能力组合或尚不清楚是否已有实现时，按[能力地图与检索](references/capability-map.md)先查精简索引，再读取候选 ID 的完整条目；无需预读整份目录。核对前提、限制及目标版本指南，不能把目录收录当作实例已启用。
3. 用[路线与案例](references/decision-guide.md)判断契约是否能承载需求。基础资料和标准增删改查优先评估业务模型；字段数、关联数和是否出现 Java 不能单独决定路线，复杂行为先评估模型加 Handler。
4. 分别判断后端实现与前端交互。复杂后端也可使用标准 Schema 页面；专门前端也可复用模型 API。
5. 列出复用、投射生成、手写新增、修改和不需要的资源。区分 Maven/Java 模块、导航用应用模块、业务模型；不为每个按钮或接口建立应用模块。
6. 给出验证建议和影响选型的待确认项。没有运行证据时明确缺口，不自行启动环境来补证据。

## 输出

- 推荐路线、理由、目标版本和关键依据；重要备选路线不适用的原因。
- 可复用的资产、所选能力的稳定 ID、各自职责及应用需要使用的公开入口、已有扩展点。目录未收录或证据不足时明确说明，不编造 ID。
- 开发范围、代码归属及资源引用清单。API-only 可不需要菜单与 UI；模型投射资源不重复手写；微前端不机械补空 UI Schema。
- 授权、行列范围、后台身份、事务和外部失败边界。
- 最小验证计划、未确认事实，以及建议后续使用的 Skill。

## 后续任务索引

只推荐相关任务，不在本 Skill 中实施。公共套件以同级目录安装；缺少某项时说明缺少的能力包。

| 工作 | 后续 Skill |
| --- | --- |
| 对象、关联、视图和 Action | [业务模型](../tidestack-business-model-development/SKILL.md) |
| Java 模型、QueryDSL、主键、插件 | [数据模型](../tidestack-data-model-development/SKILL.md) |
| 方法授权、数据范围 | [Web 授权](../tidestack-web-authorization/SKILL.md)、[访问控制](../tidestack-access-control-development/SKILL.md) |
| 手写业务导航与页面 | [业务入口](../tidestack-business-entry-definition/SKILL.md)、[UI Schema](../tidestack-ui-schema-development/SKILL.md) |
| Java/前端工程接入与交付 | [后端扩展](../tidestack-backend-extension-development/SKILL.md)、[前端扩展](../tidestack-frontend-extension-development/SKILL.md) |
| 事件、自动流程、人工审批 | [事件](../tidestack-business-event-development/SKILL.md)、[逻辑流](../tidestack-logicflow-development/SKILL.md)、[审批](../tidestack-approval-integration/SKILL.md) |
| 外部调用、消息通知 | [RPC](../tidestack-rpc-integration/SKILL.md)、[通知](../tidestack-notification-development/SKILL.md) |
| 资源契约、旧目录、环境问题 | [元数据](../tidestack-metadata-definition/SKILL.md)、[迁移](../tidestack-metadata-migration/SKILL.md)、[本地调试](../tidestack-local-debugging/SKILL.md) |
