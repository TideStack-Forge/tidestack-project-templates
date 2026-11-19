---
name: tidestack-access-control-development
description: 为 TideStack（Ouroboros）应用定义和消费行列访问范围，或按需扩展权限定义、范围解析器及角色配置控件时使用。接口方法授权另用 Web 授权 Skill。
---

# 访问控制定义与消费

权限定义表达可配置范围，角色配置表达授予范围，业务查询实际落实范围。先区分接口授权、行列范围与已有业务对象 ACL，读[职责与静态结构](references/access-control.md#职责与静态结构)和[执行与组合](references/access-control.md#执行方与组合语义)。

1. 查真实权限、主体、模型与字段，明确公共字段、受控字段、行范围和未配置/空选择的语义。已有领域服务提供对象访问检查时复用其入口，不在 Controller 复制 ACL 算法。
2. 优先复用默认字段过滤和组织范围。静态结构放 `.authority.json` 的 accessControlDefine，使用[权限 Schema](../tidestack-metadata-definition/references/authority.schema.json)；已有定义就修改归属资源，不建立第二份同名定义。
3. 从真实 OuroborosAuthentication 取有效参数，将 FILTER 与业务条件求交，NONE 在数据操作前拒绝或短路；落实读取、输出和写入字段。空 Map 是 ALL，不能表示 NONE；不得捕获拒绝后改成无限制查询。
4. 仅在现有定义或范围不足时读取[高代码定义](references/access-control.md#高代码定义与注册)、[自定义解析器](references/access-control.md#自定义行范围解析器)或[配置表单扩展](references/access-control.md#角色配置表单扩展)。扩展沿正式 Spring 桥接/SPI，不要求普通业务查询实现这些接口。
5. 按实际功能覆盖列表、详情、count、分页、导出、更新、删除和批量，以及同角色不同主体、受限凭据与角色配置回读。新增或修改扩展时再验证其注册和参数解析行为。

涉及 originalFieldName 映射时先读[JSON 回读边界](references/access-control.md#需要验证的-json-回读边界)，核对应用实际版本；不据历史限制改写上游字段或添加猜测别名。
