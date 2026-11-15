# 能力地图与按需检索

本目录携带 dev-next 能力地图的同源数据快照，可随 Skill 离开平台仓库使用。覆盖数据、业务、流程、页面、集成、身份、组织、文件、统计、AI、公共技术与扩展领域；前后端能力可以组合，不按条目数增加 Skill。

| 资源 | 读取时机 |
| --- | --- |
| [index.json](index.json) | 按任务检索候选 ID、简介、适用场景与接入方式 |
| [catalog.json](catalog.json) | 只提取候选条目的入口、前提、限制、模块、文档及组合建议 |
| [catalog.schema.json](catalog.schema.json) | 需要理解或校验目录格式时 |
| [capability-sources.json](capability-sources.json) | 核对快照来源、摘要、数量和源码验证状态时 |

## 读取步骤

1. 明确角色、输入输出、状态变更、部署版本与外部系统。先检索索引，不把全目录放进上下文。
2. 根据 `summary`、`useWhen` 和 `access` 选候选，随后只读取这些 ID 的完整条目；名称相似不足以判断可用。
3. 核对 `requires`、`limits`、`entryPoints`、`modules` 与 `availability`。`host`、`assembled`、`optional` 表示接入方式，不表示当前实例已经启用；模块路径不是完整 Maven 依赖清单。
4. 优先读 `docs.coverage=guide` 的目标版本指南。只有 `related` 文档时，继续核对源码/API；缺少证据则列为条件，不补造签名。`related` 能力 ID 也只是组合建议，不是完整依赖图。
5. 输出稳定 ID、分工、业务实现边界、缺少的装配/配置/身份条件、验证建议与后续 Skill。只推荐，不执行开发。

可以使用只读的 [query_capabilities.py](../scripts/query_capabilities.py)。在 Skill 根目录执行；只需 Python 标准库：

```bash
python3 scripts/query_capabilities.py --search '审批'
python3 scripts/query_capabilities.py --search 'integration' --limit 12
python3 scripts/query_capabilities.py --id be.integration.delayed --id be.business.actions --id fe.stomp
```

检索匹配索引条目的文本，多个空格分隔的关键词须同时匹配；零结果时换用业务同义词或稳定 ID。`--id` 只输出指定条目及来源，不输出整份目录。没有 Python 时，可直接搜索 index.json，再用 jq 提取 catalog.json 的候选条目。

## 组合与路由示例

| 需求 | 候选能力 | 后续 Skill |
| --- | --- | --- |
| 基础资料与标准维护 | `be.business.model`、`be.business.actions` | business-model；投射不能覆盖的资源再用 metadata/business-entry |
| Java 模型与约束扩展 | `be.data.typed`、`be.data.primary-key`、`be.extension.data-plugin` | data-model；工程装配另用 backend-extension |
| 高代码接口和数据范围 | `be.identity.rbac`、`be.identity.data-control`、`be.data.access-plugin` | web-authorization、access-control |
| 页面与专门交互 | `be.page.schema`、`fe.schema-render`、`fe.micro-component`、`fe.micro-app` | ui-schema；需要组件或微前端时用 frontend-extension |
| 单据审批及页面进度 | `be.execution.approval`、`fe.workflow-timeline` | approval、ui-schema |
| 订单超时关闭并刷新 | `be.integration.delayed`、`be.business.actions`、`be.integration.websocket`、`fe.stomp` | 业务模型/Handler；调度和实时通信查候选条目指南 |
| 可靠后台处理与外部通知 | `be.business.events`、`be.business.event-recovery`、`be.integration.rpc`、`be.integration.notification` | business-event、rpc、notification，按需组合 |
| 统计看板或 AI 接入 | `be.analytics.dataset`、`be.analytics.report`、`be.ai.invocation`、`be.ai.retrieval` | 先查目录指南与限制；工程接入、元数据和 UI 仅推荐实际需要的任务 |

这些只是检索起点。超时任务仍需处理重复执行、已完成订单和后台身份；界面权限显示不能代替后端授权。目录未收录不等于平台不支持，应核对目标版本再判断。

## 来源与适用边界

权威数据位于平台仓库 `docs/handbook/static/capabilities/`；说明来自 `docs/handbook/docs/reference/platform-capability-map.md` 和 `capability-catalog.md`。同步工具复制 JSON 原文并记录摘要，不维护第二份能力定义。

保留目录自己的 `source.revision`、`basis: working-tree`、`verification: source-reviewed`、`runtimeVerified: false`。它们记录盘点依据，不是发布版本或逐项运行验收；分发基线另记在 capability-sources.json。消费者必须核对实际依赖和部署条件。

`sources`、`modules` 相对于平台仓库根；`docs.path` 相对于 `docs/handbook/docs/`。独立项目没有这些文件时，应读取匹配版本手册或取得对应源码，不能把路径拼成未经确认的网站/生产 API URL。

目录提供选型知识，不授予执行权限，也不把能力自动注册为 AI 工具或 MCP 服务。平台的 MCP 接入条目描述调用外部工具的能力。
