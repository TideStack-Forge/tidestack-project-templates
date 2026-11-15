---
name: tidestack-web-authorization
description: 在 TideStack（Ouroboros）高代码 Controller 方法声明或排查 Authority、Anonymous，核对真实路由、权限资源、角色与执行身份时使用；包含直接 HTTP 授权验证，不替代数据范围控制。
---

# Web 接口授权

正式链路：Controller 方法注解 → RequestMapping 元数据 → AnnotationAuthorityProvider → AuthorityCenter → 认证/授权决策。沿用它，不另建权限表、拦截器或手写角色旁路。

1. 确认真实方法、HTTP 路径、输入与业务行为，先复用已有权限和模型投射接口。
2. 阅读[方法注解与授权契约](references/authorization.md)，在实际映射的方法上直接标 `com.ouroboros.security.annotation.Authority`。多权限数组表示普通身份匹配 API 时任一获准，不是 AND；必须验证重叠 API 和委托身份边界。
3. 用[metadata](../tidestack-metadata-definition/SKILL.md)维护同名权限的标题、模块、菜单、UI 及必要 accessControlDefine。注解贡献实际 API 时不复制一份绑定。
4. 给目标角色授权。匿名接口只在明确公开需求下使用 Anonymous，不与 Authority 混用或作为排障放行。
5. 高代码通过[访问控制](../tidestack-access-control-development/SKILL.md)落实行列约束；允许进入接口不代表任意数据可操作。异步、MQ 和任务明确后台身份。
6. 核对实际加载和刷新后 AuthorityCenter 的绑定。匿名、登录无权限、获授权三类身份分别调用，检查 Controller 是否执行和数据结果；不把全部拒绝写死为同一 HTTP 状态。

本基线 dev-next@7f9b5b381f9ba1632623299d5ce6172364c5578c 的安全注解、Provider 与决策实现与 WMS 原型核对版本一致；参考已移除项目路径。实际应用仍按加载依赖和真实 HTTP 验证。
