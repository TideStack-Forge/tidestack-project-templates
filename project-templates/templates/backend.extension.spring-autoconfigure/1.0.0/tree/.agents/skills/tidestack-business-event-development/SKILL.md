---
name: tidestack-business-event-development
description: 在 TideStack（Ouroboros）中定义、发布或消费业务事件与订阅，处理源事务、Outbox、执行身份、幂等、重试和回放时使用。普通临时异步调用不自动具备可靠事件语义。
---

# 业务事件与订阅

1. 明确已经发生的业务事实、生产者、消费责任、主体和最小历史载荷。事件不是命令，载荷是不可变 JSON 对象，不从当前记录补造历史快照。
2. 阅读[发布与消费契约](references/delivery.md)，在业务模型 events/eventSubscriptions 或正式 Java 注解中声明。结构校验使用[业务 Schema](../tidestack-metadata-definition/references/business.schema.json)。
3. 明确发生条件、allowedProducerKinds、Action emits 和实际发布位置。emits 只声明允许发布，不自动产生自定义事实；默认 CRUD 事实按正式数据写集产生，不重复手工 emit。
4. 消费者选择 Action 或 listener 一种，显式 executionPrincipalRef 指向启用的现有 User，并授予源事件读取、目标动作和所需模型/字段权限。不能继承 HTTP 用户或回退管理员。
5. 按实际事务能力选择交付方式，设计业务幂等、外部副作用和失败恢复；执行必须通过正式 Runtime/事件端口。
6. 验证提交与回滚、入队与重试、身份禁用/缺权限、重复交付、实现版本变化、失败恢复。记录 eventId/deliveryId，不在生产链路做未授权的真实发送演练。

模型与 Action 的基础定义见[业务模型](../tidestack-business-model-development/SKILL.md)，通知接入见[通知](../tidestack-notification-development/SKILL.md)。
