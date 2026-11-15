---
name: tidestack-notification-development
description: 为 TideStack（Ouroboros）定义通知模板和载荷，选择员工/地址接收者、渠道、发送时机、跳转并验证投递时使用。包括 Java、审批与事件消费中的通知接入。
---

# 通知开发

1. 明确事实与发送时机、接收人、主渠道、载荷和跳转。先区分员工通知与直接地址发送，查已有模板和 Dispatcher。
2. `.notification.json` 定义模板，使用[metadata Schema](../tidestack-metadata-definition/references/notification.schema.json)。载荷是实际约束，不只是说明；变量与名称保持一致。
3. 核对启用、渠道插件、schema/options、员工渠道地址映射和环境凭据。优先跑通一个主渠道再扩展，模板存在不保证渠道可发送。
4. 用正式 EmployeeNotificationDispatcher 或 NotificationDispatcher 和目标版本的请求/选项类型调用，不手写第二套渠道分发。具体选择与可靠性见[发送链路](references/dispatch.md)。
5. 让消息跳转到真实、受授权保护的业务页面，目标不存在或权限不足时有可理解的处理；description 只含接收者需要的信息。
6. 使用测试接收者验证载荷错误、禁用模板、无地址、渠道拒绝、部分失败、重复触发和跳转。记录业务/模板/投递关联及结果，不打印完整手机号、地址和 token。

审批和待办先核对既有通知责任，防止流程、事件和手工调用重复发送。普通 after-commit/async 不是可靠队列。
