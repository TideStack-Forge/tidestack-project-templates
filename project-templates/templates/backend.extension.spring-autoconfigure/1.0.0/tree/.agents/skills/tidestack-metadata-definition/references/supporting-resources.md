# 支撑资源的开发闭环

| 能力 | 定义与消费者 | 必须验证 |
| --- | --- | --- |
| 字典 | `.dict.json` → 对应字典 provider/runtime → UI 或业务调用 | 稳定键、类型、启用、加载来源、实际选择器/查询消费与刷新；同键覆盖按目标 provider 核对 |
| 初始化数据 | `.data-init.json` → provider/gateway/ledger/lock/事务链 | insert-if-missing，不是 upsert；版本变化不自动覆盖已有记录。重复运行、失败重试与并发，不把它当数据库迁移 |
| 动态配置 | configurations.json / configuration-groups.json 或当前支持的单项文件 → ConfigurationService → 真实业务消费者 | 分组引用、作用域、默认/空值、权限和修改后的生效方式；静态系统环境走 Spring。配置文件存在不代表消费者会响应 |
| 错误码 | 固定集合 error-codes.error.json 等正式 provider → ErrorCodeRegistry → 应用错误映射 | 稳定 code、默认消息、参数、重复定义、实际异常出口；异常体系见[错误契约](../../tidestack-backend-extension-development/references/errors.md) |
| 国际化 | `.i18n.json` → 对应语言 provider → 消息本地化出口 | 稳定 key、语言、插值参数、缺翻译回退和实际页面/API 展示 |
| 岗位与组织 | `.position.json` → 正式组织初始化/资源机制 | 标识、组织关系与角色/主体绑定；资源存在不等于用户获得权限 |

单文件与集合文件的加载支持按目标 provider 核实，不因 Schema 列出一种格式就假定每个 classpath/workspace 来源都支持。错误码、通知、RPC 等有各自模块依赖；应用未包含对应 runtime 时先处理装配。

配置、字典或模板删除前查引用。数据初始化不修改已存在业务数据；需要改值时使用正式业务/迁移流程。不要清 ledger、改版本号或停同步监听器来强行重跑。

精确键名与结构使用本 Skill 对应 Schema；初始化入口见 `docs/guides/data-initialization-guide.md`，配置见手册 `guide/tutorial/configuration/index.md`。应用环境私密配置不写入公共示例。
