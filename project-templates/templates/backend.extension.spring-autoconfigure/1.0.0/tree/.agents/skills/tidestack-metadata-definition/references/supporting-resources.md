# 支撑资源的定义与使用

| 能力 | 应用用法 | 必须验证 |
| --- | --- | --- |
| 字典 | `.dict.json` 定义稳定名称、条目 code 和展示 label，UI/业务引用已有字典 | 类型、平面/树形、启用、加载、选择器值及刷新结果，见下文所有权规则 |
| 初始化数据 | `.data-init.json` 补充缺少的初始记录 | insert-if-missing，不是 upsert；版本变化不自动覆盖已有记录，验证重复运行及失败重试 |
| 动态配置 | configurations.json/configuration-groups.json 或已支持的单项定义，业务通过 ConfigurationService 读取 | 分组、作用域、默认/空值、权限、修改后的实际生效方式 |
| 错误码 | error-codes.error.json 集合定义错误，异常使用对应引用 | 稳定编号、消息、参数、冲突及实际 HTTP 行为，见[业务异常](../../tidestack-backend-extension-development/references/errors.md) |
| 国际化 | `.i18n.json` 定义语言资源，页面/消息引用稳定 key | 插值、缺翻译回退和真实展示 |
| 岗位与组织 | `.position.json` 声明岗位并通过已有组织能力使用 | 标识、组织关系及主体/角色绑定；资源存在不等于授予用户权限 |

## 字典的数据所有权

当前字典资源加载时：名称不存在则创建；已存在且传入资源 editable=false 时按资源替换；editable=true 的已有字典不由同一刷新路径覆盖。这与初始化数据的 insert-if-missing 不同。

代码维护的固定字典可选 editable=false；允许运营人员维护的字典明确选择 editable=true。把已有字典从可编辑改为不可编辑可能覆盖用户维护的条目，应先确认数据所有权和变更方案。不要把 editable 仅当成界面是否显示编辑按钮。

条目 code 是业务存值，label 可以调整；树形字典还需校对 parent/children。替换前查已有数据与页面引用，使用隔离环境验证刷新后的实际结果；不把平台当前替换实现复制成业务同步程序。

## 配置的实际消费

动态配置使用 `com.ouroboros.configuration.ConfigurationService`；例如在已有服务中注入 configurationService 后读取：

```java
boolean enabled = configurationService
    .get(Boolean.class, "warehouse.inventory.reserveEnabled")
    .orElse(false);
```

示例键须由应用定义；键不存在时使用这里明确的默认值。配置值变化是否立即生效取决于业务读取时机，不要只在构造器读取一次却承诺动态更新。结构化配置要区分缺失、空白与格式错误，错误值应明确拒绝。

进程地址、存储目录等静态环境走 Spring。个人偏好复用平台已有用户设置能力，明确 user/app/client/key 维度并从服务端确定当前用户，不自建通用偏好表。敏感项使用目标环境支持的正式配置/秘密管理，不回显真实值。

## 加载、删除与验证

单项与集合格式、classpath 与工作目录的支持按目标版本确认；声明资源不代表实际能力已装配。使用对应 Schema 校验后，通过真实消费者验证，不要求应用重建资源加载器或初始化账本。

配置、字典或模板删除前查引用。初始化数据不修改已有业务数据；需要修改时走正式业务或迁移流程，不通过清账本、改版本号或停监听器强制重跑。

初始化契约见目标版本 `docs/guides/data-initialization-guide.md`，配置见手册 `guide/tutorial/configuration/index.md`；独立应用无需拥有平台内部目录即可使用随 Skill 分发的 Schema。
