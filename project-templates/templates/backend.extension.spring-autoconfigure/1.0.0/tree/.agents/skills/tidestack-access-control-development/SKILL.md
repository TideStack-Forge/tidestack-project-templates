---
name: tidestack-access-control-development
description: 为 TideStack（Ouroboros）定义或消费行列访问范围，实现 AccessControlDefine、AuthorityProvider、AccessControlFilterBuilder/RowScopeResolver 或角色配置控件扩展时使用。接口方法授权另用 Web 授权 Skill。
---

# 访问控制定义与扩展

先阅读[定义、解析器、表单与消费契约](references/access-control.md)。权限定义表达可配置范围，角色配置表达授予范围，解析器生成约束，业务查询实际落实范围。

1. 查真实权限、主体、模型与字段，明确公共字段、受控字段、行范围和未配置/空选择的语义。
2. 先复用默认字段过滤和组织范围，能配置完成就不新建解析器。静态结构放 `.authority.json` 的 accessControlDefine，使用[metadata 的权限 Schema](../tidestack-metadata-definition/references/authority.schema.json)，不编造新后缀。
3. JSON 不足时通过 AuthorityProvider 的 Spring 桥接或 SPI 提供，避免两份同名定义。需要新范围才实现 AccessControlFilterBuilder；控件使用内嵌 settingSchema 或正式生成器。
4. 空 Map 是 ALL，不能表示 NONE。未知键、主体缺失和错误参数不得放宽权限；仅消费本规则认识且成功解析的参数。
5. 从真实 OuroborosAuthentication 取有效参数，将 FILTER 与业务条件求交，NONE 在数据操作前拒绝或短路；落实读取、输出和写入字段。不得捕获 getFilters 的拒绝后改成无限制查询。
6. 覆盖列表、详情、count、分页、锁查询、导出、更新、删除和批量，以及同角色不同主体、受限凭据与角色配置回读。

早期应用原型已与 dev-next@7f9b5b381f9ba1632623299d5ce6172364c5578c 核对；本轮又整合到 4b525ad61456db1f80f09235765acd93f136b472，包含平台字段控制生成器的 SPI 注册修复。参考中的历史 JSON 回读结果仅用于提示验证边界；新应用必须检查自身依赖，不能据此改写上游字段或添加猜测别名。
