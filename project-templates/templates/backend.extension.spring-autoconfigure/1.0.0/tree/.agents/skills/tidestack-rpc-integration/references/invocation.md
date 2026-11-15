# Java 与流程执行契约

执行器包为 `com.ouroboros.rpc.execution`。使用 `executor.invoke(new RpcInvocationRequest("external.echo", Map.of("text", "hello")))`，检查结果 isFailure/getError，成功读取 getPayload。失败沿平台异常边界传播，不返回伪成功。

HTTP 调用器当前识别请求 options 的 timeoutOverrideMs、retryOverride；以实际构造器和目标调用器为准。internalCall、purpose 描述场景，不能伪装用户授权。认证使用模型 authCredential 引用已加载资源，出站认证与平台入站用户认证不是一回事。

连接失败、响应超时和业务拒绝不同。远端已执行而本地超时是可能结果；写请求重试依赖对端幂等键、状态查询或对账。不要宣称本地事务会撤销远端效果。

环境切换保持 RPC 名称和业务参数，调整正式外部地址配置和凭据。验证 Java 和节点调用同一目标时请求一致，日志仅保留脱敏关联信息。

当前 dev-next 的执行配置支持 `#{key}` 配置引用；authCredential 解析后查找凭据，timeout/retry 解析结果须为整数。URL 与参数值的 `${...}`、旧式 `$path` 等语义按 RpcFieldSemantics 核对，不把任意字段都当模板。inputSchema/outputSchema 用于静态代码提示，不自动增加运行时参数校验。

定位：手册 `fusion-development/backend-development/rpc-model.md`，源码 RPC execution 包和协议调用器。
