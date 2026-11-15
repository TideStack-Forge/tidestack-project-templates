---
name: tidestack-business-entry-definition
description: 将 TideStack（Ouroboros）业务能力接入应用模块、菜单、权限及 UI 路由，核对已有、业务模型投射和手写资源的归属与引用时使用。适用于多资源业务入口，不负责重复生成模型已拥有的资源。
---

# 业务入口与资源引用

1. 查真实业务模型、投射结果、Controller、现有模块和路由，列明每项资源由谁拥有。业务模型先使用[业务模型 Skill](../tidestack-business-model-development/SKILL.md)。
2. 确认需要什么入口。复用已有 Maven/Java 模块与应用模块；API-only 不需要页面，微前端路由通常不需要 UI Schema，每个操作不一定建立应用模块。
3. 保留真实导航层级，不额外发明根节点。检查目标运行时的 parent、名称推导与菜单语义；不要把某次页面设计中的 subMenus 禁用约定推广到所有项目。
4. 只补缺少的手写资源。按[资源契约](../tidestack-metadata-definition/SKILL.md)选择 Schema；字段和支撑资源见其参考。
5. 按下表检查引用，再验证打包、加载、真实路由和角色行为。

| 资源 | 必须核对 |
| --- | --- |
| app-modules.json | fullName/parent、所属 menu、authorities 都指向真实资源 |
| menu | fullName、路由 url 与目标页面一致 |
| authority | fullName 稳定；menuItems、uiViews 存在；apis 来源为实际接口契约 |
| UI Model | path、type 与渲染方式一致，所引用 Schema 或微应用已加载 |
| UI Schema | typed 文件使用 name/schema 包装，内容遵循[页面 Skill](../tidestack-ui-schema-development/SKILL.md) |

方法 `@Authority` 已贡献真实 API 绑定时，不在 JSON 中机械复制；注解、资源和角色使用同一权限名。数据范围仍由[访问控制](../tidestack-access-control-development/SKILL.md)落实。前端显隐不能代替后端授权。

交付修改/复用/投射资源清单和验证结果。验证有权限、无权限、同角色不同主体的页面及直接 API；检查详情、count、分页和导出。加载失败查原诊断，不通过创建同名手写资源绕过投射失败。
