---
name: tidestack-ui-schema-development
description: 为 TideStack（Ouroboros）编写或调整 AMIS UI Schema 页面、列表、表单、dialog/drawer、动作、接口绑定、校验和用户文案时使用。包括 typed 资源封装及交互验证；自定义前端工程使用前端扩展 Skill。
---

# UI Schema 页面开发

1. 查模型视图、已投射页面和实际接口，明确页面状态、权限和用户操作。优先更新归属资源，不用手写同名页面绕过投射错误。
2. `src/main/metadata/**/*.ui-schema.json` 使用 name/schema 包装；内嵌 schema 才是 AMIS 内容。直接渲染的组件 JSON、旧 classpath 文件和 typed 资源加载规则不同，不能互换。使用[metadata](../tidestack-metadata-definition/SKILL.md)校验。
3. 先确定用户任务，再选 page/crud/form/dialog/drawer 与必要布局。参考[表单与文案](references/forms-and-copy.md)，避免机械套 panel。
4. 从真实契约填写 api/initApi、输入字段、查询条件、分页、返回数据和错误。没有接口证据就标出依赖，不杜撰 URL；前端数据过滤与显隐不能替代后端授权。
5. 给动作明确目标组件、输入、提交/确认、成功后的刷新/关闭，以及失败保留状态。核对数据域和表达式，避免同名字段或嵌套表单引用错误。复用子页面、动态 Schema、弹窗路由或选择器时，读[组合、路由与取值](references/composition-and-routing.md)。
6. 按[交互验证](references/interaction-checks.md)在目标基座验证。JSON Schema 只检查资源形态，不保证 AMIS 专有属性和 actions 可见。

菜单、权限和路由接入使用[业务入口](../tidestack-business-entry-definition/SKILL.md)。需要特殊组件/微前端时用[前端扩展](../tidestack-frontend-extension-development/SKILL.md)，不为了复杂后端自动切换页面技术。
