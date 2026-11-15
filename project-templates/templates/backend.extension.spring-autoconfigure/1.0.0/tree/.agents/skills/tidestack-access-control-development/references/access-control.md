# 访问控制定义、解析与执行

内容导航：[静态结构](#职责与静态结构) · [JSON 回读限制](#需要验证的-json-回读边界) · [高代码定义](#高代码定义与注册) · [行范围解析器](#自定义行范围解析器) · [配置表单](#角色配置表单扩展) · [执行与组合](#执行方与组合语义) · [验证](#来源与回归验证)

## 职责与静态结构

权限定义说明“可以如何配置”，角色设置说明“实际允许什么”，解析器把设置转换为约束，高代码执行方把约束落实到数据操作。只写 `accessControlDefine` 不会自动限制任意数据模型调用。

静态结构放在 `*.authority.json` 的 `accessControlDefine` 内，完整 Schema 位于[元数据 Skill](../../tidestack-metadata-definition/references/authority.schema.json)。不要将该对象单独保存为平台不识别的 `.access-control.json`。

| 字段 | 用法与边界 |
| --- | --- |
| `canControlFields` | 是否启用字段范围；关闭时允许字段为 `*`。 |
| `fieldSelectionRequired` | 默认 false：角色未配置字段选择时沿用“全部字段”。敏感数据需要显式选择时设置 true，并验证空选择只保留公共字段。 |
| `commonFields` | 始终允许的字段，项含 `name/label/type/description`。不应将敏感字段放入此列表。 |
| `controlledFields` | 可由角色选择的字段；字段名用真实逻辑字段名。与公共列表都为空时当前实现仍返回 `*`，不能用两个空数组表示不允许任何字段。 |
| `filterDefine` | 行范围定义数组；每项通常含 `name/label/dataType`，按需要配置 `originalFieldType/originalFieldName/settingSchema`。普通字段过滤无需自定义解析器。 |
| `settingSchema` | 配置角色范围的 AMIS 控件数组。控件 name 必须与解析器接收的参数对应，不能凭空填不存在的 API 作为 source。 |

`description` 可省略，仅在帮助管理员做实际配置选择时填写，不放开发思路、扩展实现说明或调试信息，遵循 [UI Schema 文案规则](../../tidestack-ui-schema-development/SKILL.md)。

普通过滤器使用真实字段名；默认 `DefaultACFilterBuilder` 仅消费已在 `filterDefine` 声明且不以 `$` 开头的参数。平台已有 `$byEmployee`、`$byDepartment`、`$byCompany` 组织范围及对应配置控件，先复用，核对当前身份组织上下文和模型的实际审计字段，不机械套用。

### 需要验证的 JSON 回读边界

Schema 声明 `originalFieldName`；本源码基线的 `SimpleAccessControlFilterDefine` 的内部字段却为 `originalField`，getter 为 `getOriginalFieldName()`，未提供相应写入方法。较早应用 JAR 的 `Json.toBean(AccessControlFilterDefine.class, json)` 回读验证中，`originalFieldName` 和猜测别名 `originalField` 均未让 getter 回读出值。

因此依赖该映射的定义必须验证加载后 getter，不能以 Schema 通过作为成功证据；需要时在高代码 `AccessControlFilterDefine` 实现中明确返回字段名，经 `AuthorityProvider` 提供。不要改上游 Schema、发明 JSON 别名或用反射写字段掩盖问题。普通同名字段过滤不依赖此属性，可继续使用 JSON 定义；此限制不表示全部权限 JSON 不可用。

## 高代码定义与注册

`com.ouroboros.security.authority.AuthorityProvider` 提供：

- `List<Authority> getAuthority(String fullName)`：返回本提供器对该完整名的定义，没有则空列表。
- `List<Authority> getAllAuthorities()`：返回全部定义，与按名查询保持一致。

在应用正常扫描的业务包声明 Spring Bean，由平台 `SpringBeanAuthorityProvider` 正式桥接到 `AuthorityCenter`；此时不要再把同一个类重复登记为 SPI。独立无参 SPI 实现则登记 `META-INF/services/com.ouroboros.security.authority.AuthorityProvider`。使用其中一条正式路径；需要自动配置时仍按项目规范注册配置类。

下面仅示范“库存读取权限按仓库限制并控制成本字段”的定义语法，实际字段和权限必须先确认。API 绑定由对应实际 Controller 上的 `@Authority("warehouse.stock.read")` 提供，因此示例不编造 `apis`。若已有 JSON 维护同一字段和范围，不再复制本定义。

```java
package com.example.warehouse.security;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import com.ouroboros.security.authority.Authority;
import com.ouroboros.security.authority.AuthorityProvider;
import com.ouroboros.security.authority.BaseAuthority;
import com.ouroboros.security.authority.accesscontrol.AccessControlDefine;
import com.ouroboros.security.authority.accesscontrol.AccessControlFilterDefine;
import com.ouroboros.uischema.schema.SchemaNode;

@Component
public final class StockAuthorityProvider implements AuthorityProvider {
  private final List<Authority> authorities;

  public StockAuthorityProvider() {
    var authority = new BaseAuthority();
    authority.setFullName("warehouse.stock.read");
    authority.setTitle("库存查询");
    authority.setAccessControlDefine(new StockAccessControlDefine());
    authorities = List.of(authority);
  }

  @Override
  public List<Authority> getAuthority(String fullName) {
    return authorities.stream().filter(a -> a.getFullName().equals(fullName)).toList();
  }

  @Override
  public List<Authority> getAllAuthorities() { return authorities; }

  private static final class StockAccessControlDefine implements AccessControlDefine {
    @Override
    public Boolean getCanControlFields() { return true; }
    @Override
    public boolean isFieldSelectionRequired() { return true; }
    @Override
    public List<Field> getCommonFields() {
      return List.of(new Field("id", "标识", "String", null),
          new Field("warehouseId", "仓库", "String", null));
    }
    @Override
    public List<Field> getControlledFields() {
      return List.of(new Field("unitCost", "单位成本", "Decimal", null));
    }
    @Override
    public List<AccessControlFilterDefine> getFilterDefine() {
      return List.of(new WarehouseScopeFilterDefine());
    }
  }

  private static final class WarehouseScopeFilterDefine implements AccessControlFilterDefine {
    @Override public String getName() { return "$warehouseScope"; }
    @Override public String getLabel() { return "仓库范围"; }
    @Override public String getDescription() { return null; }
    @Override public String getDataType() { return "List"; }
    @Override public String getOriginalFieldType() { return "String"; }
    @Override public String getOriginalFieldName() { return "warehouseId"; }
    @Override public List<SchemaNode> getSettingSchema() { return List.of(); }
    @Override public Map<String, Object> getExtraProps() { return Map.of(); }
    @Override public Object getExtraProp(String key) { return null; }
  }
}
```

`SimpleAccessControlDefine` 和 `SimpleAccessControlFilterDefine` 不是提供完整 setter 的构建器，不能生成不存在的 `setFilterDefine/setOriginalFieldName` 调用。高代码可直接实现接口，如上；静态配置使用正式 JSON 加载器，不创建第二套反序列化器。

## 自定义行范围解析器

接口为 `com.ouroboros.security.authority.accesscontrol.filter.AccessControlFilterBuilder`：

- `Map<String,Object> build(Map<String,Object> params, AccessControlDefine define)`
- `RowConstraint resolve(Map<String,Object> params, AccessControlDefine define)`，默认实现将 build 的空 Map 转成 ALL、非空转成 FILTER。

`RowScopeResolver extends AccessControlFilterBuilder` 是同契约的语义别名。当前 `DefaultAccessControlParams` 实际枚举 **AccessControlFilterBuilder SPI**；只注册别名文件不保证执行。新实现可实现 RowScopeResolver，并在下列两个文件登记**同一实现完整名**，与平台别名契约保持一致，不创建第二份解析算法：

```text
META-INF/services/com.ouroboros.security.authority.accesscontrol.filter.AccessControlFilterBuilder
META-INF/services/com.ouroboros.security.authority.accesscontrol.filter.RowScopeResolver
```

每个文件的内容为示例实现 `com.example.warehouse.security.WarehouseScopeResolver`。普通 Java SPI 类须可无参实例化；不靠 `@Autowired` 给 ServiceLoader 创建的实例注入依赖。有 Spring 服务依赖时沿用已存在的正式桥接模式并验证生命周期，缺失服务不得回退为全部数据。

以下示例约定：未配置本范围代表不额外限制；显式空列表代表无可访问仓库；非空列表为角色授权的仓库标识。若业务要求“未配置也拒绝”，须在授权配置及消费边界落实，因为当前 `DefaultAccessControlParams` 对整体空设置直接返回 ALL，不一定调用解析器。

```java
package com.example.warehouse.security;

import java.util.List;
import java.util.Map;
import com.ouroboros.security.authority.accesscontrol.AccessControlDefine;
import com.ouroboros.security.authority.accesscontrol.RowConstraint;
import com.ouroboros.security.authority.accesscontrol.filter.RowScopeResolver;
import com.ouroboros.security.exception.AuthorizationDeniedException;

public final class WarehouseScopeResolver implements RowScopeResolver {
  private static final String KEY = "$warehouseScope";

  @Override
  public RowConstraint resolve(Map<String, Object> params, AccessControlDefine define) {
    if (!params.containsKey(KEY)
        || define.getFilterDefine().stream().noneMatch(f -> KEY.equals(f.getName()))) {
      return RowConstraint.all();
    }
    Object value = params.get(KEY);
    if (!(value instanceof List<?> values)
        || values.stream().anyMatch(v -> !(v instanceof String id) || id.isBlank())) {
      throw new AuthorizationDeniedException("仓库范围必须为明确标识列表");
    }
    var ids = values.stream().map(String.class::cast).distinct().toList();
    params.remove(KEY);
    return ids.isEmpty() ? RowConstraint.none()
        : RowConstraint.filter(Map.of("warehouseId", ids));
  }

  @Override
  public Map<String, Object> build(Map<String, Object> params, AccessControlDefine define) {
    var rows = resolve(params, define);
    if (rows.mode() == RowConstraint.Mode.NONE) {
      throw new AuthorizationDeniedException("没有可访问的仓库数据");
    }
    return rows.condition();
  }
}
```

规则：

- 仅消费当前定义声明、自己认识的参数，成功解析后从可变 params 移除；不要清空他人参数，也不要仅返回过滤条件却留下自己的设置造成后续失败。
- 没有自己的参数时返回 ALL 让其他解析器工作；参数存在但无有效上下文、格式错误或越权时拒绝或返回 NONE，不能忽略后放行。
- 当前链把各解析器结果 AND；解析结束仍有未知参数会抛 `AuthorizationDeniedException`。禁止将未知参数静默丢弃。
- `$` 前缀适合自定义语义参数，普通默认构建器会忽略它，但必须为其提供真实解析器。不要抢占 `$fieldControl` 或平台组织维度名称。
- `build` 的旧 Map 契约无法表达 NONE；如示例一样在该路径抛拒绝异常，不能把 NONE 转成空 Map。

## 角色配置表单扩展

简单控件直接配置 `filterDefine[].settingSchema`，由 `EmbedFilterSettingSchemaGenerator` 使用；需要统一复用、动态生成或特殊配置语义时实现 `com.ouroboros.security.authority.accesscontrol.setting.ACFilterSettingSchemaGenerator`，其方法为 `supports(AccessControlDefine, AccessControlFilterDefine)` 和 `List<SchemaNode> generate(AccessControlDefine, AccessControlFilterDefine)`。

平台角色设置表单的值位于 `accessControlParams`，因此内嵌或生成控件的 name 应为 `accessControlParams.$warehouseScope` 等完整数据路径；解析器收到的是其下的 `$warehouseScope` 键。内嵌生成器原样返回 Schema，不会补前缀。在自定义表单中则核对实际数据域，不能机械复制路径。

```java
package com.example.warehouse.security;

import java.util.List;
import java.util.Map;
import com.ouroboros.security.authority.accesscontrol.AccessControlDefine;
import com.ouroboros.security.authority.accesscontrol.AccessControlFilterDefine;
import com.ouroboros.security.authority.accesscontrol.setting.ACFilterSettingSchemaGenerator;
import com.ouroboros.uischema.schema.SchemaNode;

public final class WarehouseScopeSettingSchemaGenerator implements ACFilterSettingSchemaGenerator {
  @Override
  public boolean supports(AccessControlDefine define, AccessControlFilterDefine filter) {
    return "$warehouseScope".equals(filter.getName());
  }

  @Override
  public List<SchemaNode> generate(AccessControlDefine define, AccessControlFilterDefine filter) {
    return List.of(new SchemaNode(Map.of(
        "type", "input-array", "name", "accessControlParams." + filter.getName(), "label", filter.getLabel(),
        "items", Map.of("type", "input-text"))));
  }
}
```

注册 `META-INF/services/com.ouroboros.security.authority.accesscontrol.setting.ACFilterSettingSchemaGenerator`，内容为实现完整名。示例仅演示标识列表输入；真实选择器的数据源使用已验证且受保护的 API，不能杜撰。校验空列表能否保存并回读，表单不应把“无可见数据”静默变成删除配置。

`AccessControlDefineUtils` 按反向优先级取第一个 supports 的生成器，支持范围要精确；内嵌 Schema 和自定义生成器不要无意竞争。整体字段控制表单另有 `ACSettingSchemaGenerator`（`supports(AccessControlDefine)`、`generate(AccessControlDefine)`）及同全名 SPI，通常复用平台字段控件即可，不为一个范围重写整个角色编辑器。生成表单不等于执行权限，解析器和执行方仍须落实。

dev-next 的 `b11389ae7e` 已通过该 SPI 注册内建 `FieldControlSettingSchemaGenerator`。目标基座含此修复时直接复用；较旧应用字段控件缺失时先核对平台版本与注册产物，不在业务应用重复实现生成器掩盖装配问题。

## 执行方与组合语义

有效参数从当前 `OuroborosAuthentication` 获取，见 [Web 权限契约](../../tidestack-web-authorization/references/authorization.md#高代码消费访问控制)。

- `getRowConstraint()` 的 `mode()` 为 ALL/FILTER/NONE，`condition()` 为 QueryDSL 条件。用户筛选与 FILTER 使用 AND；ALL 仍保留业务筛选；NONE 在进入数据操作前短路，不允许变成不带 where 的更新/删除。
- `getFilters()` 遇到 NONE 会抛拒绝异常，不能捕获后改用空条件。不要用空 Map、`id=null` 或随意挑选不存在的 ID 表达无权访问。
- `getAllowedFields()` 返回 `*` 代表不限字段；普通列表是实际允许集合；空列表不是通配符。`getDisallowedFields()` 是受控字段中的排除项，不能据其为空推断所有未声明字段都可暴露。高代码根据本接口契约落实投影、返回 VO、可写字段及显式空集合语义。
- 多角色对同一权限求并集，受限凭据与边界求交，由 `AuthorizationEvaluator` 和平台参数组合机制执行；单次角色设置中的多个范围解析器求交。不要自行把全部角色范围 AND，或把任意权限的范围 OR 给当前操作。
- 读取详情、count、导出及批量与普通列表使用相同边界；更新/删除的目标条件先求交，新增/修改还须核对目标业务归属，不能只过滤返回结果。

## 来源与回归验证

基线见 [Skill](../SKILL.md)。核心源码在 `security/ouroboros-web-security/`：

- `ouroboros-web-security-core/.../authority/accesscontrol/`：Define、FilterDefine、DefaultAccessControlParams、RowConstraint 与各 SPI。
- `ouroboros-web-security-rbac-manage/.../rbac/{provider,accesscontrol,util/AccessControlDefineUtils.java}`：Spring 提供器桥接和配置控件选择。
- `ability/ouroboros-organization-structure/.../security/OrganizationStructureAccessControlFilterBuilder.java`：组织范围与上下文示例。

新增扩展至少验证：SPI 可发现；未配置、空集合、正常集合、错误类型、未知键；无上下文时失败关闭；公共/受控/显式空字段；角色并集与边界交集；高代码实际查询及写入结果。保存角色设置后用实际序列化/解析回读，再验证 HTTP 与数据结果；不以控件出现或源码包含注册名代替验收。
