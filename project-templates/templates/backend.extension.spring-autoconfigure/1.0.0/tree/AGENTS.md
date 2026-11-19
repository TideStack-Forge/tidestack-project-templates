# Ouroboros Module Project

这是一个基于 Ouroboros 运行时能力的业务模块项目模板。项目通过 Maven 管理 Java 模块，通过 `src/main/metadata/` 元数据源码（打包到 `META-INF/ouroboros/metadata/`）、资源、SPI 和 Spring 自动配置接入平台能力。

## 快速入口


| 我需要...              | 去这里查看             |
| ---------------------- | ---------------------- |
| 了解项目结构和常用命令 | [README.md](README.md.ftl) |

## 红线规则

1. **优先复用平台机制**：模块、菜单、权限、UI Model、UI Schema、配置等能力优先通过 Ouroboros 既有资源目录、SPI 和自动配置接入。
2. **禁止平行实现**：不要在业务模块内重复实现组织、权限、配置、数据模型或 UI 元数据体系。
3. **禁止循环依赖**：共享实体、枚举、值对象放入项目约定的 common/domain 边界，功能模块之间默认不直接互相依赖。
4. **禁止绕过持久化边界**：需要持久化时优先使用项目约定的数据访问能力，不拼接裸 SQL 绕过平台机制。
5. **禁止硬编码动态配置**：运行期需要调整的配置应通过配置资源声明和读取；系统级静态配置走 Spring 配置。
6. **禁止未注册扩展点**：Spring 自动配置、SPI、资源定义必须放入对应 `META-INF/` 路径。
7. **禁止异常吞噬**：不得使用空 catch 块或忽略异常；异常处理必须保留上下文。
8. **禁止未实现 TODO**：不得提交 `// TODO: implement this method` 一类占位实现。
9. **禁止未验证变更**：新增或修改后端代码至少执行 `mvn -DskipTests package`；涉及测试能力时补充并执行对应测试。

## 开发准则

- 动手前先确认目标边界：业务实现、共享定义、启动聚合、资源定义或前端入口。
- 扩展前先搜索现有实现，优先沿用项目已有目录、命名、SPI 和资源格式。
- 只改本次需求必需的文件，不顺手重构无关代码。
- 文档变更要保证入口链接有效、目录存在、术语一致。
- 资源定义变更要保证模块、菜单、权限、UI Model、UI Schema、配置之间引用一致。
- 项目级 Agent skills 放在 `.agents/skills/`。

## 工作流

在执行可能影响工作区状态的操作前，先检查当前路径和 git 状态：

```bash
pwd
git status --short
```

搜索与编辑约定：

- 普通文本和文件搜索优先使用 `rg`。
- Java 结构性查找或批量改造优先考虑 `sg`。
- 手工文件修改优先使用 patch，避免脚本式覆盖未读文件。

常用后端验证：

```bash
mvn -DskipTests package
```

## 应用开发 Skills

本项目在 `.agents/skills/` 分发 17 个公共任务，源自平台公共套件。先选型时用[只读专家](.agents/skills/tidestack-howto/SKILL.md)，它只判断并推荐后续任务。明确实施需求后直接使用[业务模型](.agents/skills/tidestack-business-model-development/SKILL.md)、[数据模型](.agents/skills/tidestack-data-model-development/SKILL.md)、[Web 授权](.agents/skills/tidestack-web-authorization/SKILL.md)、[访问控制](.agents/skills/tidestack-access-control-development/SKILL.md)、[业务入口](.agents/skills/tidestack-business-entry-definition/SKILL.md)、[UI Schema](.agents/skills/tidestack-ui-schema-development/SKILL.md)等专项入口。资源契约与工具见[metadata](.agents/skills/tidestack-metadata-definition/SKILL.md)，环境联调见[local-debugging](.agents/skills/tidestack-local-debugging/SKILL.md)。

异常沿平台 BusinessException/ValidationException/InternalException/PlatformException 与统一错误码出口；按业务语义和处理需求定义类型，不吞失败或为每条提示创建空类型。
