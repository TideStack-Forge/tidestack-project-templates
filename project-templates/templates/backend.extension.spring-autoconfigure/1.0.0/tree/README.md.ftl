# ${project.name}

这是一个后端 Maven 扩展包项目，可直接接入 Ouroboros 平台。

## 项目定位

- Maven 组织：`${groupId}`
- Maven 构件：`${artifactId}`
- 项目版本：`${version}`
- Java 包名：`${esc.javaPackage(packageName)}`
- 自动配置类：`${esc.javaPackage(packageName)}.${esc.identifier(autoConfigurationClassName)}`
- 运行基座：Ouroboros `2.0.0-rc.1-SNAPSHOT`

## 模板内容

| 路径 | 用途 |
|------|------|
| `pom.xml` | Maven 构建、依赖复制、JDK 21 编译和平台依赖过滤 |
| `src/main/java/` | Spring 自动配置入口 |
| `src/main/metadata/` | 作者态 JSON 元数据源码，构建时打包到 `META-INF/ouroboros/metadata/` |
| `src/main/resources/META-INF/spring/` | Spring Boot 3 自动配置注册 |
| `.agents/skills/` | 资源定义与本地联调辅助说明 |
| `AGENTS.md` | 生成项目内的编码约束和上下文 |

## 元数据约定

作者态元数据源码统一放在 `src/main/metadata/` 下，并在构建时进入 `META-INF/ouroboros/metadata/`。如果项目还保留旧目录格式，可使用 `.agents/skills/ouroboros-metadata-migration/` 迁移。

| 资源 | 默认路径 |
|------|----------|
| 应用模块 | `src/main/metadata/app-modules.json` |
| 菜单 | `src/main/metadata/<namespace>/<capability>.menu.json` |
| 权限 | `src/main/metadata/<namespace>/<capability>.authority.json` |
| UI Model | `src/main/metadata/<namespace>/<capability>.ui-model.json` |
| UI Schema | `src/main/metadata/<namespace>/<capability>.ui-schema.json`，内容为 `{ "name": "<namespace>/<capability>", "schema": { ... } }` |
| 配置元数据 | `src/main/metadata/configurations.json`、`src/main/metadata/configuration-groups.json` |

## 开发工具

推荐安装 **TideStack Develop** 插件以获得更好的开发体验：使用 IntelliJ IDEA 时，可在 JetBrains Marketplace 搜索并安装 `TideStack Develop`；使用 Visual Studio Code 时，可在 VS Code Marketplace 搜索并安装同名插件。插件提供模型元数据的可视化编辑、项目开发配置和本地调试相关能力，适合与本模板生成的项目配合使用。

## 常用命令

```bash
mvn -DskipTests package
```

本模板生成标准基座加载的普通扩展 JAR。只有标准基座扩展模式使用依赖过滤；内嵌基座工程须由自己的启动模块携带完整运行依赖，不使用过滤后的扩展目录替代。

交付扩展时，传入与目标基座配套的运行依赖清单：

```bash
mvn -DskipTests package -Douroboros.extension.manifestUrl=<manifest-url>
```

交付本项目 JAR 和 `target/extension-lib/` 中保留的依赖，并核对过滤报告；不要再把整份 `target/lib/` 一并交付。

## 类型化数据模型编译

Java `@Model` 类需要生成查询字段时，启用模板提供的 profile：

```bash
mvn clean verify -Ptyped-data-model
```

该 profile 通过 `maven-compiler-plugin` 调用 `ouroboros-data-typed-meta-processor`，在 `target/generated-sources/annotations/` 生成同包的 `模型类名Meta`。类型化编译适用于两种工程模式，与依赖过滤独立；正式扩展交付时可以同时传入运行清单。

处理器只用于编译，不随运行依赖交付。它与 `ouroboros-data-typed-core` 的版本应和目标基座一致；已有 Lombok 等处理器时保留原有配置。生成的类不能代替 `@DataModelScan`、typed runtime 或权限控制。本地 IDE 与 CI 均需启用该 profile，或将其配置纳入业务模块的常规构建。
