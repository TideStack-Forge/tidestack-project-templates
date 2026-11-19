---
name: tidestack-web-authorization
description: 为 TideStack（Ouroboros）高代码 Web 接口选择 Authority、PermitAll 或 Anonymous，核对路由、已有权限绑定、角色及执行身份时使用；不替代数据范围控制。
---

# Web 接口授权

1. 确认真实方法、路径和业务行为，先查模型投射接口、已有方法注解及权限 JSON 的 `apis`，避免重复绑定。
2. 按[访问契约与方法注解](references/authorization.md)选择明确权限、平台已认证自服务或匿名公开。新高代码权限接口优先在实际映射方法上使用 `com.ouroboros.security.annotation.Authority`；已有 JSON 绑定可继续复用。
3. 用[metadata](../tidestack-metadata-definition/SKILL.md)维护同名权限的展示、模块及必要数据控制定义，并给目标角色授权。方法注解已贡献 API 时不机械复制绑定。
4. 通过[访问控制](../tidestack-access-control-development/SKILL.md)落实行列范围；自服务接口从服务端身份确定数据归属。接口允许访问不代表任意记录都可操作。
5. 用匿名、登录无权限和获授权身份直接调用，验证拒绝、结果和页面行为；使用委托凭据时单独验证其边界。不要将所有拒绝写死为同一 HTTP 状态。

`@PermitAll` 在本平台只对已认证的 PLATFORM 凭据提供免权限入口，不等于匿名或对所有凭据放行。多项 `@Authority` 是任一获准，不能表达 AND。异步、MQ 和任务使用显式后台身份，不继承另一个请求的上下文。
