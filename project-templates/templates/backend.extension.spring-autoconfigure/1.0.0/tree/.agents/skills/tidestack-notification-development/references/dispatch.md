# 发送链路与可靠性

员工接收者需先确定员工集合，再解析其渠道地址。站内信通常可按员工直接送达，邮箱/短信取档案，钉钉/微信/推送需账号映射；缺地址不等于模板语法错误。直接地址发送应使用目标渠道和正式 Dispatcher，不能绕过模板的载荷与启用判断。

schema 包含标题、内容或第三方模板 ID；options 放渠道选项和跳转。仅使用目标插件接受的字段，不因为可透传对象就填猜测参数。EmployeeAggregator 可参与员工集合计算，但授权与业务接收规则仍需明确。

通知提交、调用器返回、渠道接受和用户实际收到是不同阶段。事务中直接发送可能产生“业务回滚但消息已发”；after-commit 加 async 仍可能在进程故障时丢失。需要持久化恢复时使用[业务事件与 Outbox](../../tidestack-business-event-development/SKILL.md)，并处理远端发送幂等和无法原子确认的窗口。

外部效果使用 INDEPENDENT 之类的正式实现契约时，必须自行确认重试与去重，不能仅改一个开关就承诺恰好一次。发生失败应记录可排查结果，不能 catch 后返回全部成功；也不能在每次打开详情页时重新发送。

定位：手册 `guide/tutorial/notification/index.md`，源码 `ability/ouroboros-notification`。aggregate 的称重/签到通知可参考接收者→模板→payload→渠道→地址→跳转的任务组织，旧版 API 和敏感日志不照搬。
