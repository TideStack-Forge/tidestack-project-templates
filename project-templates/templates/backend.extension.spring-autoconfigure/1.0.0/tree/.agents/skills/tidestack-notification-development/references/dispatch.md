# 通知调用与发送结果

## 接收者与调用入口

| 场景 | 正式入口 | 应用处理 |
| --- | --- | --- |
| Java 发送给员工 | EmployeeNotificationDispatcher | 传员工标识、模板、payload 及已支持的 options；平台解析渠道地址 |
| Java 发送给直接地址 | AddressNotificationDispatcher | 按渠道传地址；复用模板的启用、载荷和渠道检查 |
| 平台脚本 | NotificationDispatcher 绑定的 sendByEmployee/sendByAddress | 使用目标版本已暴露的方法，不把绑定名作为 Java 类型 |
| 可恢复的业务事件通知 | 平台已有事件通知 listener/订阅 | 配置模板、员工接收者与载荷，复用正式执行身份和恢复能力 |

员工标识不等于登录用户身份。站内信、邮箱/短信和企业渠道有各自地址映射；缺地址不等于模板语法错误。EmployeeAggregator 可参与员工集合计算，但业务接收规则仍要明确。

在已有 Java 服务内注入 `com.ouroboros.notification.AddressNotificationDispatcher`，可按下面片段处理直接地址发送：

```java
var result = addressDispatcher.sendWithResult(
    java.util.Map.of("email", java.util.List.of(recipientAddress)),
    templateName, payload, options);
if (!result.success()) {
  throw new com.ouroboros.exception.BusinessException("通知尚未确认发送成功");
}
```

templateName、payload、options 和地址必须来自已验证的业务契约；示例不定义真实收件人。员工结果发送也有 `sendWithResult(employeeIds, templateName, payload, options)`，可检查渠道结果。不能因没有抛异常就宣布收到，也不能 catch 后返回全部成功。

schema 是目标渠道接受的模板内容，options 是渠道选项/跳转；不凭可透传对象猜测字段。联系方式验证码、确认链接等敏感载荷使用已有专用能力，不作为普通消息长期保存或打印。

## 发送时机与可靠需求

提交、调用返回、渠道接受与用户收到是不同阶段。业务事务内直接发送可能在回滚后留下已发消息；after-commit 加 async 仍可能在进程故障时丢失。

需要提交后可恢复发送时优先配置[业务事件](../../tidestack-business-event-development/SKILL.md)与平台已有通知订阅。普通 send、普通 sendWithResult 回执及可靠投递不是相同保证；旧入口不会自动升级为可靠协议。重试也不保证远端恰好执行一次。

## 直接编排可靠发送时才读取

目标版本 EmployeeNotificationDispatcher 支持 `sendWithResult(NotificationDispatchRequest, NotificationDeliveryPolicy)` 时，使用它已有的持久化与结果协议，不另建投递计划或恢复调度。

调用前确定稳定的 sourceFactId、ruleIdentity、ruleRevision 和真实员工集合，重试保持同一责任身份；policy 每次检查当前收件资格、披露权限及冻结地址的归属。它是具体业务授权决定，不能无条件放行所有接收者。该入口要求无外层业务事务，不持有业务锁等待渠道调用。

结果 `isComplete()` 才表示当前责任已完成；PENDING/BLOCKED/UNKNOWN 不能当作全部发送成功。按正式恢复入口和业务对账处理，UNKNOWN 不盲目重发。应用只消费调用契约和结果，不实现内部逐接收人状态机。

来源：平台 ContactVerificationNotificationDelivery 的地址调用、BusinessEventNotificationListener 的可靠消费，以及目标版本通知核心接口。具体模板、敏感证明及内部代理不照抄。
