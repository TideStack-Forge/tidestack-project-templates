---
name: tidestack-business-event-development
description: 为 TideStack（Ouroboros）业务应用定义、发布和订阅事件，配置执行身份、处理重复交付下的业务幂等并验证结果时使用；包括按需开发 Java 监听器。
---

# 业务事件与订阅

1. 明确已经发生的业务事实、生产者、消费责任和最小历史载荷。事件不是命令，载荷是不可变 JSON 对象，不从当前记录补造历史快照。
2. 按[发布与订阅](references/delivery.md)在业务模型 events/eventSubscriptions 或正式 Java 注解中声明，使用[业务 Schema](../tidestack-metadata-definition/references/business.schema.json)校验。
3. 明确发生条件、允许的生产者、Action emits 及实际发布位置。emits 只声明允许发布；默认 CRUD 事实不重复手工发送。
4. 订阅选择已有 Action 或 listener 一种目标，配置输入及真实、启用、已授权的 executionPrincipalRef。后台消费不继承 HTTP 用户或回退管理员。
5. 设计业务幂等，使用平台提供的重试与恢复入口。订阅不选择底层 deliveryMode，也不自行实现投递队列；需要新增 Java listener 时才读取参考中的实现契约。
6. 验证源提交/回滚、重复交付、身份失效、权限拒绝及消费失败后的实际结果。记录 eventId/deliveryId；远端超时不能直接认定未执行。

模型和 Action 见[业务模型](../tidestack-business-model-development/SKILL.md)，通知接入见[通知](../tidestack-notification-development/SKILL.md)。普通 after-commit 加 async 不等于可恢复的业务事件。
