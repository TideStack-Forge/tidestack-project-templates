---
name: tidestack-backend-extension-development
description: 创建或调整 TideStack（Ouroboros）后端扩展工程、嵌入式 Spring Boot 宿主、自动配置、扩展点注册、元数据打包及交付时使用。已有工程内的普通模型和接口实现使用对应专项 Skill。
---

# 后端扩展接入与交付

本 Skill 负责自定义 Java 代码如何进入平台，不把每个业务功能都转成工程改造。

1. 明确是独立嵌入式宿主、平台托管扩展 JAR，还是现有业务模块。新工程先检查目标目录，分别按[内嵌基座](references/embedded-runtime.md)或[标准基座扩展](references/standard-runtime.md)初始化；运行模式与单仓/子模块组织独立选择。扩展模板本身不提供完整宿主。
2. 按[装配与交付](references/assembly.md)配置依赖和产物。平台已经提供的依赖才适合在扩展中使用 provided；宿主仍须实际带齐运行时。
3. 沿真实装配机制注册：自动配置、ServiceLoader、Spring Bean 集合各不相同。`@DataModelScan` 不等于导入 typed runtime；注解类在 JAR 中也不代表已生效。
4. 元数据源码放 `src/main/metadata/`，构建到 `META-INF/ouroboros/metadata/`，继承配置够用就不重复添加。定义和校验见[metadata](../tidestack-metadata-definition/SKILL.md)。
5. 业务实现分别读取[业务模型](../tidestack-business-model-development/SKILL.md)、[数据模型](../tidestack-data-model-development/SKILL.md)、[接口授权](../tidestack-web-authorization/SKILL.md)。异常和认证扩展按需读[错误契约](references/errors.md)、[认证与后台集成](references/integrations.md)。
6. 编译、测试、检查 JAR 内容，在隔离目标应用验证加载和实际调用；依赖过滤变化再验证平台更新/移除生命周期。

生成工程使用已发布且配套的 archetype，或同版本源码中的模板；在新目录生成后合入已有工程，保留原有修改。类型化元数据生成使用[数据模型编译参考](../tidestack-data-model-development/references/typed-data-models.md)中的 annotation processor；它与扩展交付依赖过滤相互独立，不是 Maven 插件。

平台源码中可参考后端 spring-autoconfigure 模板与 Maven archetype；生成项目无需拥有 monorepo 的资格验证脚本。构建使用本项目 Maven 入口，跳过测试的 package 只能证明打包，不代表行为验证完成。
