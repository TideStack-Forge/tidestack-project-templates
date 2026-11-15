# Action Handler 与功能插件

单一模型的一项业务操作优先 Action Handler；面向多个模型复用的功能、投射与配置能力才考虑 BusinessModelFeaturePlugin。先确认已有 feature 名称和模型 enabledPlugins，不通过在 JSON 填一个名字宣称插件已经装配。

prepare 阶段修改/准备模型语义，projection 阶段参与目标资源生成，各阶段使用正式上下文与生命周期。实现按实际 SPI 注册，保留投射资源所有权和冲突诊断；不能在每次投射中无条件重复追加同名字段、Action 或页面。

字段扩展需要区分业务字段编辑器、ValueType/Builder 与数据库 DataTypeBuilder。Unknown 回退不代表已支持新类型；验证存储映射、序列化和真实读写。数据操作插件与注解装饰器见[数据模型参考](../../tidestack-data-model-development/references/extensions.md)。

定位：手册 `fusion-development/plugin-extensions/backend/business-model-plugins.md`、`data-field-types.md`，源码 `core/ouroboros-business-model`。
