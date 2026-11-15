# 宿主与扩展 JAR

| 类型 | 依赖与交付 |
| --- | --- |
| 嵌入式 Spring Boot 宿主 | 可执行应用，依赖实际使用的平台 runtime，按宿主配置 Spring Boot 打包和环境；不能把全部平台依赖都设为 provided |
| 平台托管扩展 | 普通库 JAR，平台已有依赖按官方模板 provided；不把 Boot fat JAR 作为扩展上传；仅此路径按目标 manifest 使用依赖过滤插件 |
| 已有业务模块 | 沿已有构建和所有权添加实现，不为局部功能另建装配框架 |

Spring Boot 3 自动配置使用 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`；目标 Ouroboros 的扩展模板同时保留 `META-INF/spring.factories` 注册同一配置。核对实际加载器需要哪些入口，不把两份注册当成两套初始化。普通 Spring Bean 通过已有扫描或配置导入。

SPI 文件 `META-INF/services/<接口完整名>` 每行一个可实例化实现。需要 Spring 服务的实例应使用正式桥接，不能假设 ServiceLoader 自动注入。外部认证 Builder 是 Spring 集合装配的例子，不应因为叫“插件”就编造 SPI。

构建后检查模型、配置、SPI 和 metadata 实际进入 JAR，测试从消费者上下文发现它们。需检查有效 POM 的 process-resources 执行和继承条件；不要依赖当前 POM 恰好包含某个字符串。

动态配置由 ConfigurationService 消费，系统静态环境配置走 Spring。只声明配置资源不会自动更新应用行为。详见[支撑资源](../../tidestack-metadata-definition/references/supporting-resources.md)。
