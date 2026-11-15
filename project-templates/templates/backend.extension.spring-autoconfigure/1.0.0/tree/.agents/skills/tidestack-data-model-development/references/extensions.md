# 数据模型插件与装饰器

源码范围为 `core/ouroboros-data/`，基线见 [Skill](../SKILL.md)。优先阅读上游 `design/typed-plugin-annotations.md` 及手册 `fusion-development/plugin-extensions/backend/{data-model-plugins,metadata-decorators}.md`。

## 选择正式扩展点

| 任务 | 接口（均在 `com.ouroboros.data.model`） | SPI 文件名 |
| --- | --- | --- |
| 将自定义类注解解析成模型元数据 | `TypedModelAnnotationDecorator<A>` | `META-INF/services/com.ouroboros.data.model.TypedModelAnnotationDecorator` |
| 将自定义字段注解解析成字段元数据 | `TypedFieldAnnotationDecorator<A>` | `META-INF/services/com.ouroboros.data.model.TypedFieldAnnotationDecorator` |
| 为各来源模型补充字段、约束或插件描述符 | `DataModelMetaDecorator` | `META-INF/services/com.ouroboros.data.model.DataModelMetaDecorator` |
| 在数据操作链执行行为 | `DataModelPlugin` 及 `DataModelPluginBuilder` | `META-INF/services/com.ouroboros.data.model.DataModelPluginBuilder` |

SPI 文件内容为可实例化实现类的完整名，一行一个。只加 `@Component` 不能替代 SPI 注册；依赖 Spring 服务时复用平台已有桥接方式，核验实例就绪和生命周期，不创建隐藏静态注册表。

## Typed 注解装饰

类装饰器契约：`Class<A> annotationType()`、`DataModelMeta decorate(Class<?> modelClass, A annotation, DataModelMeta modelMeta, TypedAnnotationDecoratorContext context)`、`getOrder()`（默认 0）。字段装饰器的 `decorate` 依次接收 `Class<?>`、`java.lang.reflect.Field`、`A`、`DataModelFieldMeta`、`DataModelMeta`、`TypedAnnotationDecoratorContext`，返回字段元数据。

- 自定义注解须 `RetentionPolicy.RUNTIME`，`@Target` 与装饰器层级一致；需要可重复时同时定义容器。
- 字段装饰先执行，再执行模型装饰；各自按 `getOrder()` 升序，同序按类名排序。声明关系应有明确顺序，不依赖 classpath 偶然顺序。
- 从传入结果 `deepCopy()` 后返回，不丢弃已有字段/约束/描述符，不返回 null。
- `context.resolveModelName(Class<?>)` 解析扫描内模型；产生运行期插件描述符前用 `claimPluginDescriptor(name, owner)` 声明所有权；配置错误用 `context.metadataException(...)`。Context 不会替你收集模型修改。
- `@TypedModelPluginAnnotation` 不会自动注册装饰器或生成描述符。不要只添加标记便宣称能力已接入。

内置链路各有唯一责任：Audit/LogicalDelete/Scd2History typed 装饰器写入配置，由对应元数据装饰器生成字段和描述符；ArchiveDelete/DataPlugin 直接生成描述符；Unique/UniqueConstraint 写入约束元数据，由 DuplicateDataChecker 消费。不要同时手写这些内部开关和相同描述符。

## 元数据装饰

实现 `boolean supports(DataModelMeta originalMeta)` 与 `DataModelMeta decorate(DataModelMeta meta)`。正式入口是 `DataModelMetaDecorator.applyDecorators`；**supports 均针对原始元数据求值**，decorate 才依次接收前一步结果，链按平台优先级反向执行。不能依赖前一个装饰器新增的标志来决定自己是否 supports。

补字段和描述符前检查存在性及兼容性，重复应用结果应稳定，已有同名不兼容定义应明确失败。给存量模型新增非空字段必须考虑旧数据回填及迁移，不能只证明新表可创建。

## 操作插件

`DataModelPluginBuilder` 实现 `boolean support(String name)` 与 `Optional<DataModelPlugin> build(DataModel dataModel, Map<String,Object> config)`；描述符为 `new PluginDescriptor("插件名", config)`。名称应稳定、精确匹配，配置按实际类型校验；注解提供的配置值是字符串。

操作插件保留平台 `Try` 和事务边界。下面是委派表达式，不能把两个 context 混用：

```java
return context.getNextPlugin().insert(data, context.getNextPluginContext());
```

- 插件可覆盖 `insert`、`batchInsert`、`update`、`delete`、`count`、`query`、`queryForUpdate`。覆盖单条 insert 不代表覆盖批量写；查询范围限制要同时覆盖 count 和锁查询，写限制还要覆盖 update/delete。
- 从当前插件调用顶层数据模型执行同一操作可能再次进入当前插件造成递归；沿 next 链委派。不要吞失败或调用 `.getOrElse(...)` 把失败变成成功。
- 审计、逻辑删除、唯一和引用检查等先复用已装配 builder，不复制实现。数据权限不因插件存在自动覆盖高代码调用，仍须在正式权限边界消费访问控制结果。
- 扩展测试验证配置无效时失败、链中操作只执行一次、失败原因保留、事务回滚、批量行为及真实业务分支。验证打包后的 ServiceLoader 可发现实现，而非对源码字符串做断言。
