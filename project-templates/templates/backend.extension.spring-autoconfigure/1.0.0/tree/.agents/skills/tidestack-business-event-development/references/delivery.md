# 发布、身份与恢复

Action 中用 BusinessEventPort 或模型正式 emitEvent 方法，沿当前 Action 的 emits 和权限检查；流程使用 emitBusinessEvent 节点。非 Action 生产者注册 BusinessEventProducer，声明 kind 并获 Event emit 权限，通过 port.inTransaction 包住正式 DataModel 写入与 emit。任一失败应回滚源事务，不吞异常后返回成功。

事件事实、逐订阅 Outbox 责任和源写入同事务提交，消费者在提交后执行。`@TransactionalEventListener(AFTER_COMMIT)` 加 `@Async` 本身没有持久化投递保证。普通 Controller 或直接 Handler 调用不等价于 Runtime 业务执行。

订阅使用 sourceEventModelFullName/sourceEventName，目标 Action 使用 targetActionModelFullName/targetActionName/inputMapping；listener 使用 listenerName 及其配置，不能同时填两种目标。受限 filter 在入队时评估，修改过滤器不撤销已经入队的责任。

Java 监听可实现 BusinessEventListener 或使用 BusinessEventSubscription 绑定；注解监听同步完成，不能加异步代理后宣称交付确认成功。执行身份须为真实、启用、已授权用户，恢复时重新核对权限；请求、ThreadLocal 和 body 不会自动跟随 Outbox。

| 交付方式 | 边界 |
| --- | --- |
| ATOMIC | 当前数据站内事务写入可与交付结果按正式事务链处理；不包括任意远程副作用 |
| INDEPENDENT | 外部系统等独立效果必须自行处理幂等和恢复；本地成功标记不能原子提交远端写入 |

deliveryMode 来自 listener/实现契约，不在订阅 JSON 发明未支持字段。重试或回放可能重复；消费者以业务幂等键结合 eventId/deliveryId 处理，不宣称 exactly-once。超时后远端可能已成功，需要查询或对账；不能简单将超时当成未执行。

定位：`docs/guides/business-model-behaviors.md`、`docs/runbooks/business-model-behaviors.md`、`core/ouroboros-business-model` 的事件端口、订阅 Runtime 与 store/BusinessEventOutbox。
