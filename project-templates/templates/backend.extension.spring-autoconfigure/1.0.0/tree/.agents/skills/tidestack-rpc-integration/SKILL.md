---
name: tidestack-rpc-integration
description: 为 TideStack（Ouroboros）配置出站 RPC 模型及认证资源，从 Java 或逻辑流调用外部系统，处理映射、超时、重试和失败契约时使用。入站 Controller/WebAPI 不属于出站 RPC。
---

# RPC 与外部调用

1. 明确外部协议、真实地址、请求响应、认证、超时、幂等和环境配置，先查已有 RPC。普通应用已有合适客户端时不强制先建立逻辑流。
2. `.rpc.json` 定义启用状态、请求和引用；`.rpc.auth.json` 提供正式认证定义，凭据通过目标环境的配置/秘密管理提供。按[metadata](../tidestack-metadata-definition/SKILL.md)验证并检查运行时已加载。
3. Java 注入 RpcInvocationExecutor，用 RpcInvocationRequest 调用；DefinitionCenter/RuntimeRegistry 是发现入口，不是执行接口。细节见[执行与失败](references/invocation.md)。
4. 流程节点复用同一 RPC 名称，明确参数位置、默认值、缺失/null 和结果映射。协议成功不代表远端业务成功。
5. 用受控外部服务验证 URL、方法、参数与脱敏认证，覆盖缺失/禁用模型、缺凭据、超时、远程错误和业务拒绝。写操作只有确认幂等才启用重试。

不记录 token、密码或完整敏感载荷。认证类型和凭据加载按真实插件核对，不因有 Schema 就假定所有协议已安装。
