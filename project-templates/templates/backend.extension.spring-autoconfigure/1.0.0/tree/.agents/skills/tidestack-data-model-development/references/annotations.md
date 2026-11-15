# 数据模型注解与主键

内容导航：[基础定义](#基础定义) · [主键生成器](#主键生成器) · [约束](#约束) · [插件注解](#插件注解) · [建模示例](#最小建模示例)

## 阅读范围

所有下表注解均来自 `com.ouroboros.data.annotation`。源码基线见 [Skill](../SKILL.md)。主要来源为 `core/ouroboros-data/` 下的 `ouroboros-data-typed-core/.../annotation/`、`ouroboros-data-typed-runtime/.../TypedModelMetaHelper.java` 和 `ouroboros-data-plugins/.../decorators/`。

## 基础定义

| 注解与位置 | 契约与注意事项 |
| --- | --- |
| `@Model`，类 | `fullName` 默认类名，应用应显式使用稳定命名空间；`label` 为展示名，`rawName` 为存储名；`dataStation="default"`；`migrationStrategy=AUTO`。存量存储变更先核对迁移策略，不因默认 AUTO 就假定生产迁移安全。 |
| `@Field`，字段 | 只有带此注解的当前类声明字段进入模型；解析器使用 `getDeclaredFields()`，不自动收集父类字段，也不识别 getter 注解。不要依赖继承基类注入审计字段，使用正式插件。 |
| `@Field` 属性 | `type` 覆盖平台字段类型，`rawName`/`rawType` 控制存储映射，`label` 控制展示；**`nullable=false` 默认非空**。`size=-1`、`decimalDigits=-1` 表示未指定，`unsigned=false`；`defaultValueExpression` 是平台表达式，不是 Java 初始值。 |
| `@PrimaryKey`，字段 | 必须同时有 `@Field`；`generator="disabled"` 默认不分配主键。typed 注入要求单主键及泛型匹配，不以多个注解拼出可注入的复合主键模型。 |
| `@AutoIncrement`，字段 | 标记存储自增，不等于声明主键。单主键自增优先明确写 `@PrimaryKey(generator="autoIncrement")`，见下文。 |
| `@Rule`，字段 | `value` 是规则字符串数组，逐项使用已注册的 `RuleBuilder` 解析。不会识别任意 Bean Validation 注解或凭空生成规则。 |
| `@Related`，字段 | 同时写 `@Field`；`model` 必填，使用目标完整名；`key` 为当前模型关联键、`referenceKey` 为目标键。`type` 可显式指定目标运行时的关联类型，如 `Model`/`Collection`。省略时解析器对 List 推断 Collection，否则 Model；不要据旧注释写成 Map。 |
| `@DataModelScan`，配置类 | `value` 为精确扫描包；只声明扫描范围，不导入 typed runtime，也不使任意配置类自动生效。 |

普通字段可推断的 Java 类型包括 `String`、包装类型 `Boolean/Integer/Long/Short/Float/Double`、`BigDecimal`、`LocalDate/LocalTime/LocalDateTime`、`Date`、`Map`、`List`、`JsonBag`。基本类型、枚举、自定义对象等不在当前推断表中，须核对序列化契约及显式 `type`，不能假定自动映射。

省略 `rawName` 会经过平台命名转换；更改 `fullName`、`rawName` 或字段名可能改变存储身份，不能当成纯重命名。`@Model.extraProps`、`@Field.extraProps` 是交替的字符串键值数组，如 `{"key", "value"}`，不是 `key=value` 或 JSON 数组，值也不是自动解析的布尔/数字。优先使用专用注解，不手写已存在注解的内部开关。

## 主键生成器

| 策略 | 使用条件 |
| --- | --- |
| `disabled` | 调用方显式提供主键；遗漏应失败，不在 Service 私自补另一套生成逻辑。 |
| `snowflake` | `ouroboros-data-runtime` 的 `SnowflakePrimaryKeyGeneratorFactory` 提供，**结果为 String**，Java 字段、typed 泛型与存储长度保持一致。多实例须通过正式 `SnowflakeNodeIdProvider` 保证节点组合唯一；默认节点回退值不能作为多实例唯一性保证。 |
| `autoIncrement` | 主键装饰器将字段标记为存储自增，使用匹配的整数字段及 SQL 数据站，验证真实生成值与回填。它不是一个需要自己注册的 Java 生成器。当前 `@PrimaryKey` 默认的 `disabled` 优先于 `@AutoIncrement` 的回退推导，避免仅将两个默认注解叠加来表达自增。 |
| `coding:...` | `ouroboros-data-pkgen-coding` 的编码生成器，需要实际装配的 `CodingSequencer`；表达式还需 `DataExpressionEvaluator`。需装配该模块并验证序列器就绪、并发和回填。 |

编码语法示例：`coding:WH{yyyyMMdd}<0001>`；固定序列名为 `<warehouse:0001>`，动态序列名为 `<${companyId}:0001>`，步长为 `<0001,2>`。日期、`${表达式}` 与序列片段各有含义；日期用 `yyyyMMdd`，不把 `DD` 当作日。当前实现只支持一个序列占位。`peek` 不是占号承诺，不用于保存时确保唯一。

需要新的主键机制时实现 `com.ouroboros.data.model.PrimaryKeyGeneratorFactory` 的 `Optional<PrimaryKeyGenerator<?>> get(String generatorName)`；生成器实现 `T next(Map<String,Object> record)`。在 `META-INF/services/com.ouroboros.data.model.PrimaryKeyGeneratorFactory` 登记实现全名，名称不匹配返回 `Optional.empty()`，支持的名称遇到无效配置应明确失败。保证返回类型、分布式唯一性和事务语义；不要在 Controller 手工生成 ID 旁路该机制。

## 约束

- `@Unique(scope=...)` 是**当前字段单独唯一**。两个字段分别标 `@Unique`，表示两项独立约束，不是二者组合唯一。
- 联合唯一用类上的可重复 `@UniqueConstraint(name="...", fields={"companyId", "code"}, scope=..., nullsDistinct=false)`，字段名为逻辑字段名，所有引用须存在。`nullsDistinct=true` 时，包含空值的完整键不参与唯一冲突。
- `UniquenessScope.DEFAULT` 沿用模型策略：逻辑删除模型默认活动记录范围；`ACTIVE_RECORDS` 仅检查活动记录；`ALL_RECORDS` 包括已逻辑删除记录。业务先确定是否允许删除后复用编码。
- 当前单字段 `ALL_RECORDS` 可形成普通数据库唯一 DDL；活动记录唯一及模型级联合唯一主要由 `DuplicateDataChecker` 运行期检查，不能保证竞争写入时的数据库原子唯一。不要在 Service 另加一次“先查后写”并称已解决并发。
- 默认规则：`notNull` 拒绝 null；`notEmpty`（别名 `isRequired`/`required`）拒绝 null 和空字符串，**不拒绝空白字符串，也不检查空集合**；`regex:<Java正则>` 对 null 放行，需要时配合非空。Java 字符串中的反斜线须正确转义。
- 新规则实现 `com.ouroboros.data.validation.RuleBuilder.build(String): Optional<Rule>`，注册同名 SPI；规则实现 `Rule.validate(Object)` 与 `getFailMessage(String)`。不要编造 `min/max/length` DSL，先核对依赖中的构建器。
- `nullable`、尺寸/精度、字段规则、关联完整性与业务跨字段规则各有职责，不能互相替代。DTO 的 Bean Validation 也不能代替数据模型完整性验证；失败沿用平台校验异常与统一出口。

## 插件注解

| 注解 | 配置与效果 |
| --- | --- |
| `@AuditFields` | 可指定 `createdByRawName/createdAtRawName/updatedByRawName/updatedAtRawName`；通过元数据装饰加入审计能力与 BasicAudit 插件，用户上下文必须真实可用。 |
| `@LogicalDelete` | 可指定 `isDeletedRawName/deletedByRawName/deletedAtRawName`，`deletedByDisabled/deletedAtDisabled` 默认 false；改变删除和查询语义，须验证恢复、唯一性及统计。 |
| `@Scd2History` | `historyModel=目标类.class` 或 `historyModelName="目标完整名"`，**二选一且必须提供**。 |
| `@ArchiveDelete` | `archiveModel=目标类.class` 或 `archiveModelName="目标完整名"`，**二选一且必须提供**。 |
| `@DataPlugin` | `name` 必填且对应已注册的 builder；`config` 是交替的字符串键值。当前注解不可重复；需要多个自定义描述符时用正式装饰器，不重复堆同一不可重复注解。 |
| `@TypedModelPluginAnnotation` | 标在自定义注解类型上，`value` 表达插件语义；**仅是标记**，没有注册对应 typed 装饰器就不会执行。 |

历史/归档目标必须已经存在且字段契约兼容。类目标须带 `@Model` 并在同次扫描集合中；字符串目标不会自动验证 Java 类，应在运行时核对。typed 注解**不会创建兄弟历史/归档模型**，不要把业务模型投射器的行为套到这里。

同一插件描述符只有一个所有者，禁止 `@AuditFields` 再叠 `@DataPlugin(name="BasicAudit")` 等重复声明；也不混用旧包 `com.ouroboros.data.model.annotations.plugins` 中的 `SoftDelete` 等同名或相近注解。

## 最小建模示例

以下仅示范定义语法，不是要求建立仓库资料功能；真实简单资料应先选业务模型。`companyId` 为真实业务字段，不因出现该字段就自动获得公司隔离。

```java
package com.example.warehouse.datamodel;

import com.ouroboros.data.annotation.AuditFields;
import com.ouroboros.data.annotation.Field;
import com.ouroboros.data.annotation.LogicalDelete;
import com.ouroboros.data.annotation.Model;
import com.ouroboros.data.annotation.PrimaryKey;
import com.ouroboros.data.annotation.Rule;
import com.ouroboros.data.annotation.UniqueConstraint;

@Model(fullName = "warehouse.Warehouse", rawName = "wms_warehouse", label = "仓库")
@AuditFields
@LogicalDelete
@UniqueConstraint(name = "company_code", fields = {"companyId", "code"})
public class WarehouseDataModel {
  @Field(size = 32)
  @PrimaryKey(generator = "snowflake")
  private String id;

  @Field(size = 32)
  @Rule("notEmpty")
  private String companyId;

  @Field(size = 64)
  @Rule({"notEmpty", "regex:[A-Z0-9_-]+"})
  private String code;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getCompanyId() { return companyId; }
  public void setCompanyId(String companyId) { this.companyId = companyId; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
}
```

在已加载的配置上使用 `@DataModelScan("com.example.warehouse.datamodel")`；Service 通过构造器接收 `com.ouroboros.data.model.TypedDataModel<String, WarehouseDataModel>`。平台刷新前的注入代理不代表模型已经就绪；缺模型时检查扫描、完整名、依赖与刷新诊断，不能无限等待。
