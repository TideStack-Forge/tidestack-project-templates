# 标准基座扩展工程初始化

标准统一运行时基座提供正式启动入口。应用工程维护模型资源、普通扩展 JAR、前端包和部署配置。

## 建立应用资产目录

```text
myapp/
├── metadata/                 # 应用元数据目录
├── service/                  # 普通 Java 扩展工程
├── web/                      # 按需创建的微前端等工程
└── deploy/                   # 基座版本与部署配置
```

单仓可直接使用这个结构。选择 Git submodule 时，先使用团队提供的真实仓库地址，提交每个子模块的固定指针；不要为套用结构新建远端仓库或自动跟进所有子仓库的分支头。

## 生成后端扩展

使用开发平台的 `backend.extension.spring-autoconfigure` 模板族，或通过已发布的 archetype 生成 `service` 模块：

```bash
mvn archetype:generate -B \
  -DarchetypeGroupId=com.ouroboros \
  -DarchetypeArtifactId=ouroboros-module-archetype \
  -DarchetypeVersion="$TIDESTACK_VERSION" \
  -DgroupId=com.example.myapp \
  -DartifactId=service \
  -Dversion=0.1.0-SNAPSHOT \
  -Dpackage=com.example.myapp.service \
  -DautoConfigClassName=ServiceAutoConfiguration
```

设置 `TIDESTACK_VERSION` 并核对 archetype 的可用性。生成后的 `ouroboros.version` 与目标基座配套，不能只改 archetype 版本而保留不匹配的依赖基线。

扩展产出普通 JAR，不加入 Boot repackage。基座提供的 API 使用 `provided`，新增第三方运行依赖按实际需要声明。保留自动配置、SPI 和 `src/main/metadata` 的打包任务。

## 选择编译和交付工具

Java `@Model` 类需要生成查询字段时启用 `typed-data-model` profile；它与交付依赖过滤互相独立。

先取得与目标基座对应的 runtime manifest，再构建交付依赖：

```bash
mvn clean verify \
  -Douroboros.extension.manifestUrl="$RUNTIME_MANIFEST_URL"
```

有类型化元数据生成时，追加 `-Ptyped-data-model`。`ouroboros-dependency-maven-plugin:filter` 在 package 阶段处理已复制到 `target/lib` 的依赖，生成 `target/extension-lib` 和过滤报告。按完整坐标及版本剔除基座已有库；异版本默认保留并提示，需要继续解决兼容性。

交付项目自身的 JAR 和 `extension-lib`，不要同时再复制整份 `lib`。本地编译不需要 runtime manifest；正式扩展交付则需保存所用清单与报告。

## 装配元数据和前端

JAR 随带资源与应用目录资源使用各自的 Provider 布局，不能直接交换目录。可复用资源放进扩展的 `src/main/metadata`；应用级定义留在 `metadata/`。不要复制已有应用元数据来伪造新应用的身份或凭据。

在流水线的临时目录装配：

- 后端 JAR 和保留依赖进入 `metadata/extend/`。
- 前端构建包进入 `metadata/micro-web/package/`，注册定义与包名、路径一致。
- 使用基座配套的应用定义和部署配置，记录镜像 digest 与整组资产版本。

## 本地调试与验证

本地启动类可以放在 `src/test/java`，通过测试依赖装配运行能力并使用测试 classpath；正式 JAR 中不携带这个入口。也可以使用 IDEA 的 Deploy & Debug 调试平台测试实例。

检查扩展 JAR 中的资源和注册文件，再用目标标准基座验证 Bean、模型、页面和权限。测试启动类通过不能覆盖正式镜像中的类路径差异。前端联调交给 `tidestack-local-debugging`，后端实现交给 `tidestack-backend-extension-development`。
