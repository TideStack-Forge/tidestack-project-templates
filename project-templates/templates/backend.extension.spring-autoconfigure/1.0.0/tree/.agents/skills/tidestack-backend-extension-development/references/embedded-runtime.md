# 内嵌基座工程初始化

应用自己的 Spring Boot 程序负责启动和装配。普通业务模块可以复用后端模块 archetype；完整运行依赖由启动模块负责，不能使用扩展包的依赖过滤结果代替。

## 建立根工程和业务模块

建议从 `myapp/pom.xml`、`myapp-domain/`、`myapp-business/`、`myapp-webapp/` 和 `config/` 开始。只在确有共享定义时创建 domain 模块；前端和部署目录按需求增加。

根 POM 使用 `pom` packaging，登记实际模块，并导入 `com.ouroboros:ouroboros-bom`。用 `ouroboros.version` 指定团队确认的可解析版本；BOM 不会自动引入运行模块或继承平台仓库的资源复制任务。统一设置 Java 21 和编译器参数名保留，并核对该目标版本的 Spring Boot 基线。

从官方 archetype 生成普通业务模块，例如：

```bash
mvn archetype:generate -B \
  -DarchetypeGroupId=com.ouroboros \
  -DarchetypeArtifactId=ouroboros-module-archetype \
  -DarchetypeVersion="$TIDESTACK_VERSION" \
  -DgroupId=com.example.myapp \
  -DartifactId=myapp-business \
  -Dversion=0.1.0-SNAPSHOT \
  -Dpackage=com.example.myapp.business \
  -DautoConfigClassName=BusinessAutoConfiguration
```

先设置 `TIDESTACK_VERSION`，并确认仓库实际发布了该 archetype。生成后使模块继承应用父 POM、统一平台版本并登记 reactor。保留模块的资源复制与自动配置注册。

业务模块产出普通 JAR，不执行 Spring Boot repackage。`src/main/metadata/` 经 resources 插件复制到 `META-INF/ouroboros/metadata/`。自动配置负责导入本模块 Bean，SPI 实现登记到对应的 `META-INF/services/`。

## 装配启动模块

启动模块依赖业务模块，并实际引入 HTTP、数据库驱动及所需基座运行库。可以从 `ouroboros-ability-all-runtime` 开始；审批、UI Schema 实时管理等公共应用模块按需显式加入。源码可用时，对照同版本的 `platform/ouroboros-mothership/pom.xml` 核对运行装配。

业务模块中的 `provided` 库必须由启动模块直接或传递提供。不要把所需运行库设为 `provided` 后假定部署环境会补齐。

```java
package com.example.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

启动类扫描应用包，基座通过自动配置与 SPI 接入；不要扩大到整个 `com.ouroboros`。在启动模块绑定配套版本的 `spring-boot-maven-plugin:repackage`，交付可执行 JAR；只有项目已选择外置依赖启动方案时，才改用对应的分层装配。

## 配置工具和本地运行

- 声明 Java 类型化模型的模块按需启用 `typed-data-model` profile。启用后，本地和 CI 都要带上该 profile；长期采用时可将其编译配置移入该业务模块的常规 build。
- 不启用 `filter-platform-provided-dependencies`；从生成的业务模块移除该扩展交付 profile 和不再使用的 `copy-dependencies` 执行。启动模块保留完整运行依赖。
- 创建不含真实凭据的 `config/application-local.example.yml`，将实际本机配置排除出版本管理。
- 显式安排数据库、应用元数据路径、工作目录与必要外部服务；Java 模型模块用 `@DataModelScan` 声明扫描包，启动模块装配 typed runtime。

先构建工程，再从启动模块运行：

```bash
mvn clean install
mvn -pl myapp-webapp spring-boot:run \
  -Dspring-boot.run.profiles=local \
  -Dspring-boot.run.arguments=--spring.config.additional-location=optional:file:../config/
```

有类型化元数据生成时，在构建命令中追加 `-Ptyped-data-model`。如果用 `-am spring-boot:run`，在父工程默认跳过 Boot run，只在启动模块取消跳过。

核对业务 JAR 的资源、启动包的完整运行依赖，再实际启动验证模型发现和业务入口。编译通过不能代替数据库、权限和前端联调验收。
