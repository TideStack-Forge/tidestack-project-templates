# 方法注解与授权契约

## 注解用法

```java
@GetMapping("/{id}")
@Authority("warehouse.warehouse.read")
public WarehouseView get(@PathVariable String id) {
  return warehouseService.get(id);
}
```

这是实际 Controller 中的方法片段，`WarehouseView`、Service 和路由须替换为已实现的契约，不创建虚假的业务接口。注解从 `com.ouroboros.security.annotation.Authority` 导入，映射从 `org.springframework.web.bind.annotation` 导入。

- `@Authority` 的 target **仅 METHOD**，`String[] value()` 支持 `@Authority("...")` 或 `@Authority({"...read", "...export"})`。
- 当前提供器对映射元数据中的 `Method.getAnnotation(Authority.class)` 直接读取；写在实际映射方法上，不依赖类级、组合元注解或接口声明上的注解自动继承。
- 数组中的每个权限都会绑定到该方法的实际 API。平台普通身份按“匹配该 API 的权限中任一获准”放行，**数组不表示 AND**，不能据此实现同时具备两种权限。需要独立业务授权条件时，沿平台决策机制在正确用例边界显式校验，并测试该契约。
- 实际路由合并类与方法映射，由 RequestMapping 元数据提供。相同 API 还可能被其他权限资源绑定；新增宽泛 `apis` 会改变入口可达性，验证重叠映射。
- `@Anonymous` 同包、同样仅 METHOD，明确公开访问。不要与 `@Authority` 叠加；公开请求会走匿名匹配路径，不能期待 Authority 再补一次保护。
- 不擅自引入 Spring `@PreAuthorize`、Shiro 注解或第二套拦截器；它们不等同于平台的权限资源和数据范围机制。

## 权限定义与授予

`AnnotationAuthorityProvider` 在元数据刷新后收集方法注解，按权限完整名合并真实 API。JSON 资源、程序化 `AuthorityProvider` 和注解定义均进入 `AuthorityCenter`，同名资源经正式合并机制组合；它们不是彼此独立的授权系统。

注解只提供权限到 API 的关联。显示标题、模块归属、UI/菜单引用和数据控制定义按现有资源维护，角色还必须授予该权限。名称保持一致，不能依赖某个提供器的大小写宽容来混写标识。

`delegable` 默认 false。开启它只表示权限允许进入委托评估，仍受角色授权、凭据资源和授权边界限制；不是允许匿名或自动给第三方应用授权。委托身份有额外的目标一致性检查，多权限接口不能只用平台管理员测试。

## 高代码消费访问控制

通过 `com.ouroboros.security.context.CurrentSecurityContextHolder.findAuthentication()` 获取当前 `OuroborosAuthentication` 实例；缺失身份按平台认证异常处理，不构造管理员或回退为无限制。不要编造静态 `OuroborosAuthentication.getCurrent()`。

- `authentication.getAccessControlParams()`：当前请求的已决策参数，依赖真实请求与决策边界。
- `authentication.getAccessControlParams("warehouse.warehouse.read")`：指定权限的有效参数，仍经平台决策；不能把“获取某权限参数”当作权限不存在时返回空条件。
- `getRowConstraint()` 返回 ALL/FILTER/NONE；`getAllowedFields()`、`getDisallowedFields()` 表达字段范围。详见[访问控制扩展](../../tidestack-access-control-development/references/access-control.md)。

平台组合规则是同一权限的多个角色授权并集，受限凭据再与授权边界求交；不要在 Service 自行重算角色集合，或用原始用户角色绕过委托凭据限制。一个接口处理多个模型时分别明确所需权限与可信执行范围，不借用某个宽泛请求权限操作全部模型。

typed 数据模型并不自动套用这些结果。查询将用户搜索条件与行约束做 AND；字段筛选作用于实际读取/返回，写入字段也需验证。详情、计数、导出、更新、删除和批量不能遗漏。NONE 应短路为空结果或拒绝对应操作，不能丢弃条件后继续执行。

后台任务使用平台支持的显式身份/上下文边界，执行完恢复上下文；不从另一个请求复制 ThreadLocal，也不改全局 delegate 来模拟用户。

## 源码定位

基线见 [Skill](../SKILL.md)。在 `security/ouroboros-web-security/` 下检查：

- `ouroboros-web-security-annotation/.../security/annotation/{Authority,Anonymous}.java`
- `ouroboros-web-security-rbac-manage/.../rbac/provider/{AnnotationAuthorityProvider,SpringBeanAuthorityProvider}.java`
- `ouroboros-web-security-runtime/.../authorize/filter/AuthorizeCheckFilterSupplier.java`
- `ouroboros-web-security-core/.../{authority/AuthorityCenter,authorize/AuthorizationEvaluator,authentication/OuroborosAuthentication,context/CurrentSecurityContextHolder}.java`

上游任务指南位于 `docs/handbook/docs/fusion-development/authority-subject-and-access-control-design.md`。以目标版本源码和实际决策为准，不用注解名称推断完整安全语义。
