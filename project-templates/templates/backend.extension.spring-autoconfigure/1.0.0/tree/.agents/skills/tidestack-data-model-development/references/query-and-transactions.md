# 查询、事务与模型生命周期

按全名使用 `DataModelCenter.getDataModel("sales.Order")` 返回 Optional；多数据站同名模型使用 `数据站名:模型全名`。类型化模型用 TypedDataModelCenter 或已装配的泛型 Bean。返回 Try 的操作必须传播或按业务边界转换失败，不用 getOrElse 将数据库失败转换成空结果。

平台 QueryDSL 的 query/where、分页、关联、排序和投影以目标版本 API 为准。查询条件使用逻辑字段名，值保持类型，不拼接 SQL。选择字段、count、详情、导出和锁查询都消费相同授权边界；字段裁剪还包括返回对象和允许写入字段。

跨对象写入明确同一数据站和真实事务边界，使用已有 Spring 事务或 TransactionTemplate。BusinessAction 通过正式 Runtime 执行以保留授权、只读守卫、Schema 和事件；直接 DataModel 调用不自动获得某个 Action 的全部校验。

锁、条件更新、版本校验与幂等键按真实竞争场景选择并验证。读取后计算再写入本身不防并发覆盖，运行期唯一检查也不保证数据库原子唯一。跨系统副作用用正式事件/Outbox 或对方幂等协议，不宣称本地事务能回滚远程请求。

模型刷新前注入可以成功，但代理尚不可查询。扫描、注册、数据站连接、迁移、刷新和可查询是不同阶段；失败检查原诊断，不无限等待或在插件内部递归重入顶层模型。

定位：手册 `fusion-development/backend-development/data-model.md`、`api/backend/data-query-dsl/`，源码 `core/ouroboros-data`。
