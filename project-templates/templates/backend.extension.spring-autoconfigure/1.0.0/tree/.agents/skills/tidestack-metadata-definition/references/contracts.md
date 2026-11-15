# Schema 来源与加载边界

本套件已整合到 dev-next@c3ff6111937767f373392c24fda9f698bc48c068。`schema-sources.json` 记录每个文件的实际源路径和 SHA-256，及作者覆盖来源/摘要。维护时在平台仓库运行 `python3 scripts/skills/sync_distribution.py`，`--check` 检测漂移。

除下述显式来源例外，公共 `metadata-schema/` 和本 Skill 的普通 Schema 由 `docs/handbook/docs/reference/jsonschema/metadata/` 生成；业务模型的关系、Action、事件和订阅不再使用仅允许任意附加字段的浅快照。Schema 是版本化结构契约，不是执行语义的替代。

三个显式来源例外为 `metadata-schema/{logicflow,rpc,rpc-auth}.schema.json`：dev-next 已在产品契约中新增输入/输出提示 Schema 和 RPC 配置引用，手册尚未同步。它们以公共产品契约为维护源，保留完整字段约束后分发到技能与模板；清单中的 sourceOverrides 和逐项 source 记录这一点。手册冻结期间不生成或修改手册，不能用旧快照覆盖这些增量。

UI Schema 是显式例外：手册描述直接渲染的 SchemaNode；typed `.ui-schema.json` 在 JarUISchemaProvider 走 parseWrappedSchema，要求非空 name 与 schema。本 Skill 的 `authoring/ui-schema.schema.json` 用于这个资源信封，生成到 references 同名 Schema。旧 classpath 组件和内嵌内容不用该信封。不要为了文件完全一致而抹去 loader 的真实要求。

资源信封通过本地 `$ref` 引用同源的 `ui-schema-content.schema.json`，保留内层组件字段约束。完整 Python 校验器只解析同目录 Schema 与其声明的 `$id`，不联网获取引用；缺文件或未知引用会失败，不跳过约束。

校验后检查：

1. 实际依赖是否包含对应 runtime/provider/协议或插件。
2. 构建产物中是否存在正确资源路径；继承的 Maven 执行是否生效。
3. 同名来源的优先级、重复诊断、刷新与工作区覆盖是否符合该类型正式机制。
4. 模型、权限、菜单、UI、handler、流程和凭据引用是否存在且可用。
5. 正向操作、非法输入、禁用、无权限与实际副作用是否符合需求。

不要把整个资源目录一律当作同一种刷新/覆盖策略，也不复制聚合项目部署路径。资源内部的 description 与最终界面文案都按使用者任务填写，开发实现备注留在文档。
