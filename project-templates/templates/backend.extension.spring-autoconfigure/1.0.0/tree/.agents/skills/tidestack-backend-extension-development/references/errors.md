# 异常与稳定错误契约

业务层复用 `com.ouroboros.exception` 的 BusinessException、ValidationException、InternalException、PlatformException 分类。按调用方可处理的业务语义选择；平台异常出口保留原始 cause，未知错误不泄露内部细节。引擎内核有自身失败类型时在对外边界映射，不到处包一层无信息的 RuntimeException。

为需要稳定识别、携带业务数据或差异处理的异常定义明确类型，例如库存不足。相同语义复用同一类型；不要为每条提示建立没有行为和数据的空类，也不要用一大串 instanceof 代替已有映射机制。catch 应恢复、转换或传播，不把失败变成空结果和成功响应。

错误码定义与异常类型不同：稳定 code 是客户端契约，参数是结构化业务信息，默认消息/i18n key 决定展示。`ouroboros-error-code` 的 ErrorCodeDefinitionProvider/Registry 聚合定义，不替代异常层级。libs 异常依赖 libs 的 common-error-code；应用 ErrorResponseResolver 将异常描述与 core Registry 桥接，不给 libs 反向添加 core 依赖。

用 `.error.json` 集合维护定义并验证加载，按目标版本的异常构造器或 ErrorCodeReference 接口携带 code/参数，不猜构造器。国际化交给正式本地化出口，UI 不显示堆栈、SQL、凭据或开发备注。

验证正常业务拒绝、参数校验、外部失败和未知异常；核对 HTTP 出口的 code、参数、消息、日志关联及语言。不要在测试中把所有业务拒绝都强制归为同一个 HTTP 状态。

源码定位：`libs/common/common-exception`、`libs/common/common-error-code`、`core/ouroboros-error-code`、应用运行时 ErrorResponseResolver；设计说明 `docs/design/modules/core/ouroboros-error-code.md`。
