---
name: tidestack-local-debugging
description: 配置或排查 TideStack（Ouroboros）应用的本地前后端联调，复用已有服务、隔离本地配置，按需启动前端基座并验证加载和关键路径时使用。仅清理本任务创建的资源。
---

# 应用本地联调

1. 查项目 README、启动模块、实际 Java/Maven/Node、环境配置和已有进程。先复用应用约定的后端、前端和数据源，不从示例猜生产地址或默认密码。
2. 按[环境与验证](references/environment.md)使用隔离本地配置，确认依赖、扫描、资源和模型准备完毕；已有服务可用时不重复启动。
3. 前端优先使用项目已有入口。缺少可用基座且任务需要页面验证时，按现有环境选择下面的 Docker 或源码启动方式；不要求消费项目克隆平台仓库。
4. 验证关键接口、授权拒绝、数据范围和真实页面；401 只证明某个保护入口存在，不代表业务 readiness。记录命令、端口、进程/容器和未完成验证。
5. 清理仅限本任务创建的资源，不按同名容器或固定端口强杀他人服务。

下面路径以当前 Skill 目录为准，生成项目通常位于 `.agents/skills/`。

## 按需启动 Docker 基座

```bash
bash <此Skill目录>/scripts/start_tidestack_web.sh --backend-port 18888 --image <与目标后端匹配的镜像> --container-name <本任务容器名>
```

也支持 --backend-url 和 --micro PATH=URL。Windows 使用 scripts/start_tidestack_web.ps1 的对应参数。优先使用已知匹配版本；auto 镜像不保证兼容目标后端。启动器为容器加归属 label；同名容器已存在时停止并说明，不自动删除。

## 已有平台源码时按需启动

```bash
bash <此Skill目录>/scripts/start-tidestack-frontend.sh <backend-url> --repo <ouroboros-checkout> --host 127.0.0.1 --port 8081
```

目标须包含 frontends/web/main-app/package.json 和已安装依赖。平台仓库内可省 --repo，独立安装显式传入。脚本读取 /api/sys/web-app-info，沿正式参数传入 api 与 micro_map；私密 URL/凭据不写回受跟踪文件。

排查 Docker、前端构建、端口或后端错误时保留原始原因，不用宽松 fallback 掩盖。缺少所需环境时说明尚未验证的行为，不把安装平台维护工具作为应用调试前提。
