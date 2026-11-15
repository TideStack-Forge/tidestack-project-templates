# 官方项目模板

通过平台的项目生成入口选择模板族、框架和构建工具，填写参数后下载生成项目。模板作者从 `templates/<template-id>/<version>/template.json` 修改参数、文件操作与 `tree/` 内的模板文件。源码规则见 [v2 契约](contracts/v2/README.md)，签名与目录发布规则见 [v1 契约](contracts/v1/README.md)。

前端包含应用、布局、组件库、登录页和平台组件库，每类支持 React/Webpack、Vue/Vite；后端提供 Spring Boot 自动配置 Maven 扩展包。模板携带项目所需的 Agent 上下文和技能文件，模板中的 FreeMarker 占位符由平台生成服务处理。

## 独立校验

需要 Node.js 22.18+（Vite 要求 22.12+）。在当前目录安装校验依赖：

```bash
npm ci
PROJECT_TEMPLATES_NODE_MODULES="$PWD/node_modules" bash scripts/verify-frontend-templates.sh --qualification --clean
bash scripts/verify-backend-templates.sh --qualification --clean
bash scripts/verify-template-publication.sh --clean
```

前端校验渲染全部分支、构建生成项目并验证生命周期与产物；`--family frontend.micro-app` 可缩小到一个模板族。总仓已有前端依赖时，可省略 `PROJECT_TEMPLATES_NODE_MODULES` 沿用平台前端依赖。

后端现有校验检查生成 POM、自动配置注册及模板文件契约，不执行 Maven 编译，也不启动平台；生成的后端项目需要平台 BOM 与 Maven 插件可用后再运行 `mvn verify`。前端生成项目依赖公开 npm 包 `ouroboros-sdk`。模板资产独立分发不代表生成项目脱离平台契约。

发布校验使用临时签名、合成的非 SNAPSHOT 测试数据和本地目录，验证摘要、签名、preview/stable 门禁、撤销与回滚，不向线上发布。生成结果位于忽略的 `target/` 和 `dist/`，不可当作生产发布。
