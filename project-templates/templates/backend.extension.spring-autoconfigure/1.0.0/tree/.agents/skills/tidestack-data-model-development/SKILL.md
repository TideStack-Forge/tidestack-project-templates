---
name: tidestack-data-model-development
description: 创建或修改 TideStack（Ouroboros）Java 数据模型、类型化查询、主键生成器、字段/联合约束、插件或注解装饰器时使用。业务模型投射的数据模型优先复用，不重复定义同名 Java 模型。
---

# Java 数据模型开发

1. 确认对象、完整模型名、存储名、数据站、迁移权限和所有权。模型若已由业务模型投射就复用；外部只读或复合主键读模型不能直接套用新表 CRUD 模板。
2. 按[注解与主键](references/annotations.md)声明字段、主键、关联、规则和唯一性。只使用正式 typed 注解，不混入 JPA/MyBatis 或旧版同名注解。
3. 显式确认主键策略：默认 disabled 不生成 ID；snowflake 返回 String；autoIncrement、coding 和多节点唯一性各有依赖。联合唯一不等于给两个字段各加 Unique。
4. 审计、逻辑删除、归档与历史优先复用内置能力。自定义时按[插件与装饰器](references/extensions.md)选择注解解析、元数据装饰或操作插件，注册真实 SPI。
5. 需要生成类型化查询字段时按[类型化模型编译](references/typed-data-models.md)配置 annotation processor，保留已有 Lombok 等处理器。生成 Meta 类不代替模型注册；在已加载配置上 DataModelScan 精确业务包，确认 typed runtime。单主键类型匹配时注入 TypedDataModel；复合/无主键不提供同样的自动注入 Bean。刷新前的延迟代理不可在构造器或过早初始化阶段查询。
6. 按[查询与事务](references/query-and-transactions.md)通过平台数据 API 访问，保留 Try 失败，不另建平行 DAO。自定义高代码落实[访问控制](../tidestack-access-control-development/SKILL.md)。

验证模型发现、实际主键及回填、空值与边界、唯一冲突和更新排除自身、关联、事务回滚。逻辑删除核对删除后唯一范围、恢复、count 和导出。运行期先查后写不等于数据库原子唯一；有竞争风险时验证并发保证。

本参考由应用原型泛化，重新比对 dev-next@7f9b5b381f9ba1632623299d5ce6172364c5578c：typed 注解、装饰器、主键和安全契约与原型基线之间无实现变更。实际 Maven SNAPSHOT 仍需按消费者依赖验证，不从版本名推断。
