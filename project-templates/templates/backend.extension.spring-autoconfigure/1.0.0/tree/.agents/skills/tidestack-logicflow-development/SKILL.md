---
name: tidestack-logicflow-development
description: 为 TideStack（Ouroboros）设计或修改自动逻辑流，映射输入输出、脚本、数据/RPC 节点，或从 Java 调用流程时使用。人工审批使用审批接入 Skill。
---

# 逻辑流开发

1. 明确可验证的输入顺序、类型、输出、错误、身份和事务。简单本地 Java 方法无需为调用它而建立流程或节点。
2. 查已加载流程及正式节点，新增资源使用 `.logicflow.json` 和[metadata Schema](../tidestack-metadata-definition/references/logicflow.schema.json)。Schema 不检查全部图语义、节点可用性与部署条件。
3. 按数据域映射节点输入输出和分支；Try 失败必须传播。数据权限节点 authFilter/authAllowedFields/authDisallowedFields 的输出要实际映射到查询和返回，不能放一个节点就声称已授权过滤。
4. Java 通过 `LogicFlowExecutionFacade.execute(name, List<Object>)` 调用，列表位置对应输入。单对象输入也放在单元素列表；使用返回 Try 的正式失败语义，不自行缓存模型快照或直接调用引擎旁路启用/设计门禁。
5. 按需阅读[脚本与节点扩展](references/scripts-and-nodes.md)。HTTP 入站使用 WebAPI 的流程处理器；后台调度需显式身份，RPC 用[专门任务](../tidestack-rpc-integration/SKILL.md)。
6. 在平台与 Java 两个入口比较同一组输入输出，覆盖禁用、设计错误、非法输入、业务失败、无权限和事务回滚。外部副作用按对端幂等和事件机制验证。

依据：手册 `fusion-development/backend-development/logicflow-model.md`，源码 LogicFlowExecutionFacade；实际输入以应用定义为准。
