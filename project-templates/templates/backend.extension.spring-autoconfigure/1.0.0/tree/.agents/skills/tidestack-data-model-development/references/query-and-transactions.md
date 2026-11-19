# 查询、失败传播与事务

## 查询与分页

动态模型用 `DataModelCenter.getDataModel("sales.Order")`，返回 Optional；多数据站同名模型使用 `数据站名:模型全名`。类型化模型使用 TypedDataModelCenter 或已装配的泛型 Bean。查询条件使用逻辑字段名，保持值的真实类型，不拼接 SQL。

以下是已有 Service 内的方法片段，使用 `com.ouroboros.data.model.TypedDataModel` 和 `io.vavr.control.Try`。假定模型有 id 字段；effectiveWhere 已是业务筛选与授权范围的 AND，select 已按可读字段裁剪，NONE 在进入查询前短路。offset/limit 先按接口约定验证：

```java
record Page<M>(java.util.List<M> items, long total) {}

static <M> Try<Page<M>> queryPage(
    TypedDataModel<String, M> model,
    java.util.Collection<String> select,
    java.util.Map<String, Object> effectiveWhere,
    int offset, int limit) {
  return model.query(select, effectiveWhere, "id ASC", offset, limit)
      .flatMap(items -> model.count(effectiveWhere)
          .map(total -> new Page<>(items, total)));
}
```

列表和 count 使用相同约束，分页使用稳定排序。两次读取不自动形成同一快照；需要严格一致结果时确认真实事务与隔离要求。关联和投影复用目标版本 QueryDSL，详情、导出和锁查询也落实相同授权。

## Try 与无记录

上例用 flatMap 连接返回 Try 的查询。用 `map(model -> model.insert(entity))` 会得到嵌套 Try；再映射成 null 会丢失内部 Failure。不要将查询异常用 getOrElse 转成空列表，再据此决定插入；也不要把 count 失败转成 0。

成功查询返回空集合才表示该查询没有记录；`get(id)` 的失败未必都是“不存在”，不可把所有 Failure 用 toJavaOptional 丢弃。更新/删除的成功结果为 0 时，按实际条件判断未命中或冲突，不能直接宣布操作成功。

需要在事务用例边界抛出失败时，可用 `result.getOrElseThrow(OuroborosExceptionMapper::toOuroborosException)`，映射类为 `com.ouroboros.exception.mapper.OuroborosExceptionMapper`。仅返回 Try.failure 并不等于 Spring 事务已标记回滚；确保异常在事务方法返回前传播，或沿已有事务契约明确回滚。catch 应恢复、转换或传播，不返回伪造成功。

## 事务、并发与代码归属

跨对象写入确认同一数据站和真实事务管理器，使用现有 Spring 事务或 TransactionTemplate。BusinessAction 通过正式 Runtime 执行；直接 DataModel 调用不自动获得 Action 的授权、只读守卫、输入校验和事件语义。

锁、条件更新、版本校验和幂等键按竞争场景选择。先查再写不保证并发唯一，本地事务也不能回滚文件或远程效果；跨系统协作优先复用[业务事件](../../tidestack-business-event-development/SKILL.md)或对方幂等协议。

沿项目既有分层组织代码。简单 Service 可以直接使用数据模型；既有领域仓储也可封装平台数据 API。不要为套模板强制加 Repository/Facade，不另建绕过平台的 DAO。项目已明确禁止仓储层时遵守项目约定。

## 可用阶段与验证

模型注入成功不表示已经刷新并可查询；不在构造器或过早初始化阶段读取。加载失败查原诊断，不无限等待或在插件内递归重入顶层模型。

验证成功/空查询、数据库失败传播、0 行写入、事务回滚、并发冲突、字段与行范围；逻辑删除同时核对 count、导出及恢复。

来源：目标版本 TypedDataModel 查询/计数接口；平台文档 `fusion-development/backend-development/data-model.md`、`api/backend/data-query-dsl/`。独立应用使用已安装版本对应 API，不要求持有平台源码。
