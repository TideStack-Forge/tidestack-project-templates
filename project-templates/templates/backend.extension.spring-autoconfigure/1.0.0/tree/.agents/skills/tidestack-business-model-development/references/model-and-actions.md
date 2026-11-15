# 模型、Action 与输入映射

定义来自当前 handbook business Schema 和 `docs/guides/business-model-behaviors.md`。资源源码构建到 `META-INF/ouroboros/metadata/`，由既有 loader 和投射链装配。

业务模型描述业务对象、关系与行为；数据模型承担数据操作。不要为同一模型投射的数据模型再写 Java 类。fields 使用平台已注册类型，relations 使用目标完整名、关系类型和真实 referenceKey；共同提交和约束按目标行为核验。2.0 关系检查比旧格式严格，旧版本读取不会自动改写定义。

Action 输入 `BusinessActionInput<P,D>` 只有 params/data 两个根分区；缺失与 null 不同，默认值只补缺失。对象引用通过输入 Schema 的 x-business-object-ref/x-business-relation 表达，没有特殊 target 魔法。服务端重新读取并授权对象状态，不信客户端传入状态。

启用 Action 需要有效 binding：handler 使用 handlerName，logicflow 使用 flowName，两者互斥。输入映射明确 query/pathVariables/body/headers 到 params/data；2.0 自定义动作引用不能沿用旧隐式参数语义。CRUD 归一化已有 Action，不能再定义同名动作。自定义功能是否绑定 Action 按 isBindAction 与目标配置决定；Controller 的 RequestMapping 本身不进入 Action Runtime。

Java 接入方式：实现 `BusinessActionHandler.handle(BusinessActionContext, BusinessActionInput<?,?>)` 并提供 getName；或在已注册 Spring 同步方法使用 BusinessActionBinding（modelFullName/actionName/handlerName），通过 BusinessActionParam、BusinessActionData 取分区/字段。Context 可选。必填、可空与默认值在 Schema 定义，primitive 不能绑定可缺失/可空值；不要混用完整 Input 与分区参数。

调用使用 BusinessActionRuntime 正式入口，不直接调用 Handler。保留权限、Schema、前置条件、只读写入守卫、输出检查、审计与事实。readOnly 动作不得隐含写入或外部副作用。绑定 requiresHttpRequest 时后台执行会拒绝，独立事件恢复不能假装有 HTTP 请求。

可用最小示例见[示例模型](../examples/Order.business.json)：它演示模型加 handler 的契约，submitOrderHandler 必须另行真实注册，不代表安装此 JSON 就有可执行提交功能。平台具体 apis/views 原型扩展配置仍需对照目标模型类型的运行时。
