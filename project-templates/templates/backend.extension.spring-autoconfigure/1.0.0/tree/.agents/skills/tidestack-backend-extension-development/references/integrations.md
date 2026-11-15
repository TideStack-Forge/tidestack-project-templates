# 认证、后台任务与实时集成

认证先用已具备的 LDAP/CAS/OIDC 配置。新增协议时核对 ExternalAuthProviderBuilder，通过 Spring `List<ExternalAuthProviderBuilder>` 装配；不要添加不存在的 SPI 文件。自定义登录页只是展示，外部账号绑定不自动授予角色，主体、Claims 和访问控制分别接入正式接口。

定时任务使用平台 Scheduler，消息桥接复用 MQBridge、正式 provider/integrator 和消费者链路，避免为了接一项任务另起第二套调度或重复 MQ 客户端。明确后台执行身份、输入、幂等、超时、失败与停止条件；没有 HTTP 用户时不能回退管理员。

WebSocket/STOMP 的订阅授权、服务端事实和重连恢复单独验证；浏览器收到推送不等于业务已提交，断线重连不能靠前端猜测状态。RPC 调用使用[RPC 任务](../../tidestack-rpc-integration/SKILL.md)，可靠业务事实使用[事件任务](../../tidestack-business-event-development/SKILL.md)。

定位：手册 `fusion-development/plugin-extensions/backend/authentication.md`、`fusion-development/integration-automation-and-realtime.md`、`backend-development/scheduled-tasks.md`。按目标应用依赖确认可用能力，不把文档存在当作已装配。
