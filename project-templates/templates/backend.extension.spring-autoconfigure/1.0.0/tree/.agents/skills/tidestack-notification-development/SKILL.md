---
name: tidestack-notification-development
description: 为 TideStack（Ouroboros）业务定义通知模板和载荷，选择员工或地址接收者，使用平台发送能力并验证结果、跳转及可靠性边界时使用。
---

# 通知开发

1. 确定发生什么业务事实、何时发送、发给谁、用哪个主渠道及跳转到哪里。先查既有通知责任，避免审批、事件和手工调用重复发送。
2. 用 `.notification.json` 定义模板，按[metadata Schema](../tidestack-metadata-definition/references/notification.schema.json)校验载荷、变量和名称；只填目标渠道接受的 schema/options。
3. 确认模板启用、渠道可用、员工地址映射和环境凭据。使用测试接收者跑通一个主渠道；模板存在不代表能够发送。
4. 按[调用与发送结果](references/dispatch.md)选择 Java 的 EmployeeNotificationDispatcher 或 AddressNotificationDispatcher。脚本的 NotificationDispatcher 是绑定名；不要将它写成 Java 接口。
5. 需要业务提交后可恢复的通知时，优先复用正式[业务事件](../tidestack-business-event-development/SKILL.md)通知能力；只有直接编排可靠发送时才读取参考中的可靠调用契约。
6. 验证载荷错误、禁用、缺地址、渠道拒绝、部分失败、重复触发和目标页面授权。未完成或不确定的发送结果不能当成全部成功；日志保留业务关联，隐藏地址、token 和敏感载荷。

跳转必须指向真实业务页面。description 只写接收者需要的信息；界面打开或刷新不是重新发送的时机。
