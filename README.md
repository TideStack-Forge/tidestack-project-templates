# TideStack Project Templates

官方项目模板、模板契约和本地校验工具。包含 6 个模板族、11 个模板组合：前端应用、布局、组件库、登录页、平台组件库，以及 Spring Boot 自动配置扩展包。前端提供 React/Webpack 和 Vue/Vite 两条分支。

模板入口和使用方式见 `project-templates/README.md`。此仓库分发模板资产；项目生成服务由 TideStack 平台提供，后端扩展项目的完整 Maven 构建需要平台 BOM 和 Maven 插件可用。

由总仓 `scripts/open-source/export-component.py --component project-templates` 单向生成。模板、契约和测试在总仓修改并验证后同步，本仓库不维护第二套生成器。许可证随总仓发布决策统一确定，当前为本地发布候选。
