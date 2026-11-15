---
name: tidestack-local-debugging
description: 配置或排查 TideStack（Ouroboros）应用的本地后端与前端联调，发现环境、隔离本地配置、启动源码/Docker 基座并验证加载和关键路径时使用。仅清理本任务创建的资源。
---

# 应用本地联调

1. 查当前目录、Git 状态、项目 README、启动模块、实际 Java/Maven/Node、环境配置和已有进程。复用提供的后端与数据源信息，不从示例猜生产地址或默认密码。
2. 后端按[环境与验证](references/environment.md)使用隔离本地配置，确认依赖、扫描、资源和模型准备完毕；已有服务可用时不重复启动。
3. 前端模式二选一：本地源码基座或 Docker web base。以下路径以当前 Skill 目录为准，monorepo 位于 skills，生成项目位于 .agents/skills。
4. 验证后端关键接口、授权拒绝、数据范围和真实页面；401 只证明某个保护入口存在，不代表业务 readiness。记录启动命令、端口、进程/容器和未完成验证。
5. 清理仅限本任务创建的资源，不按同名容器或固定端口强杀他人服务。

## 源码前端

```bash
bash <此Skill目录>/scripts/start-tidestack-frontend.sh <backend-url> --repo <ouroboros-checkout> --host 127.0.0.1 --port 8081
```

目标必须包含 frontends/web/main-app/package.json 和已安装依赖；monorepo 内可省 --repo，独立安装显式传入。脚本读取 /api/sys/web-app-info，沿正式参数传入 api 与 micro_map，不修改源码代理配置。私密 URL/凭据不写回受跟踪文件。

## Docker 基座

```bash
bash <此Skill目录>/scripts/start_tidestack_web.sh --backend-port 18888 --image <与目标后端匹配的镜像> --container-name <本任务容器名>
```

也支持 --backend-url 和 --micro PATH=URL。Windows 使用 scripts/start_tidestack_web.ps1 的对应 PowerShell 参数。auto 镜像只是便利默认，不保证兼容目标后端；优先使用已知匹配版本。

启动器为容器加归属 label；同名容器已存在时停止并说明，不自动删除。排查 Docker/webpack/端口/后端错误时保留原始原因，不用宽松 fallback 掩盖。
