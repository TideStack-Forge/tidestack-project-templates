# Schema 来源与加载边界

平台公共 `metadata-schema/` 是唯一维护源，向手册、IDE Schema 包、本 Skill 和两份后端模板分发。`schema-sources.json` 记录每个文件的源路径和 SHA-256，源文件与分发文件的摘要应相同。在平台仓库运行 `python3 scripts/skills/sync_distribution.py` 更新副本，添加 `--check` 检查漂移。

索引覆盖 32 类资源，另有被引用的辅助 Schema。Schema 是版本化结构契约，表达结构与约束；它不替代运行时引用解析、表达式编译或执行验证。

typed `.ui-schema.json` 在 `JarUISchemaProvider` 走资源包装解析，要求非空 `name` 与 `schema`。公共 `ui-schema.schema.json` 描述该资源；通过本地 `$ref` 引用 `ui-schema-content.schema.json` 描述组件内容。旧 `ui-schema/` classpath 目录中的直接组件和内嵌内容使用后者，不添加资源包装。

完整 Python 校验器只解析同目录 Schema 与其声明的 `$id`，不联网获取引用；缺文件或未知引用会失败，不跳过约束。

校验后检查：

1. 实际依赖是否包含对应 runtime/provider/协议或插件。
2. 构建产物中是否存在正确资源路径；继承的 Maven 执行是否生效。
3. 同名来源的优先级、重复诊断、刷新与工作区覆盖是否符合该类型正式机制。
4. 模型、权限、菜单、UI、handler、流程和凭据引用是否存在且可用。
5. 正向操作、非法输入、禁用、无权限与实际副作用是否符合需求。

不要把整个资源目录一律当作同一种刷新/覆盖策略，也不复制聚合项目部署路径。资源内部的 description 与最终界面文案都按使用者任务填写，开发实现备注留在文档。

自定义审批表单描述以 `metadata-schema/approval-form.schema.json` 为维护源，分发索引包含此类型。结构校验不枚举字段类型，也不复制其参数规则；平台按应用上下文编译字段类型并检查部署引用。
