---
name: tidestack-metadata-migration
description: Use when migrating old TideStack (legacy Ouroboros) metadata resources to src/main/metadata typed suffix files and adding Maven metadata packaging configuration.
---

# TideStack Metadata Migration

Use this skill when a module still stores metadata in old classpath resource locations and needs to move to the current `src/main/metadata/` convention. The migration script defaults to dry-run; pass `--write` only after reviewing the planned moves.

## Workflow

1. Choose the module root that owns the old metadata resources.
2. Run a dry-run migration:

```bash
python3 skills/tidestack-metadata-migration/scripts/migrate_metadata_resources.py \
  --module <module>
```

3. Review the planned moves and any conflicts.
4. Apply the migration:

```bash
python3 skills/tidestack-metadata-migration/scripts/migrate_metadata_resources.py \
  --module <module> \
  --effective-pom <reviewed-effective-pom.xml> \
  --write
```

5. Validate changed JSON files with `tidestack-metadata-definition` and the matching `references/<type>.schema.json` schema.
6. Run `mvn -DskipTests package` in the migrated module, or the closest parent that builds it.

## Mapping

| Old source | New source |
|------------|------------|
| `src/main/resources/META-INF/ouroboros/app-modules.json` | `src/main/metadata/app-modules.json` |
| `src/main/resources/META-INF/ouroboros/configuration.json` | `src/main/metadata/configurations.json` |
| `src/main/resources/META-INF/ouroboros/configurations.json` | `src/main/metadata/configurations.json` |
| `src/main/resources/META-INF/ouroboros/configuration-groups.json` | `src/main/metadata/configuration-groups.json` |
| `src/main/resources/app.metadata.json` | `src/main/metadata/app.metadata.json` |
| `src/main/resources/modules.diff.json` | `src/main/metadata/modules.diff.json` |
| `src/main/resources/style.css` | `src/main/metadata/style.css` |
| `src/main/resources/META-INF/ouroboros/menu-model/**/*.json` | `src/main/metadata/**/*.menu.json` |
| `src/main/resources/META-INF/ouroboros/dev-menu-model/**/*.json` | `src/main/metadata/**/*.dev-menu.json` |
| `src/main/resources/META-INF/ouroboros/authority/**/*.json` | `src/main/metadata/**/*.authority.json` |
| `src/main/resources/META-INF/ouroboros/ui-model/**/*.json` | `src/main/metadata/**/*.ui-model.json` |
| `src/main/resources/META-INF/ouroboros/ui-schema/**/*.json` | `src/main/metadata/**/*.ui-schema.json` |
| `src/main/resources/META-INF/ouroboros/field-repository/**/*.json` | `src/main/metadata/**/*.field-type.json` |
| `src/main/resources/META-INF/ouroboros/field-types/**/*.json` | `src/main/metadata/**/*.field-type.json` |
| `src/main/resources/META-INF/ouroboros/dev-field-repository/**/*.json` | `src/main/metadata/dev/**/*.field-type.json` |
| `src/main/resources/META-INF/ouroboros/logic-flow-node-define/**/*.json` | `src/main/metadata/**/*.flow-node.json` |
| `src/main/resources/META-INF/ouroboros/widget-definition/**/*.json` | `src/main/metadata/**/*.widget.json` |
| `src/main/resources/META-INF/ouroboros/business-log-template/**/*.json` | `src/main/metadata/**/*.business-log.json` |
| `src/main/resources/META-INF/ouroboros/notification-template/**/*.json` | `src/main/metadata/**/*.notification.json` |
| `src/main/resources/META-INF/ouroboros/data-init/**/*.json` | `src/main/metadata/**/*.data-init.json` |
| `src/main/resources/META-INF/ouroboros/rpc-model/*.json` | `src/main/metadata/rpc-model/*.rpc.json` |
| `src/main/resources/META-INF/ouroboros/rpc-model/credential/**/*.json` | `src/main/metadata/rpc-model/auth/**/*.rpc.auth.json` |
| `src/main/resources/META-INF/ouroboros/logic-flow/**/*.json` | `src/main/metadata/logic-flow/**/*.logicflow.json` |
| `src/main/resources/META-INF/ouroboros/data-dict/**/*.json` | `src/main/metadata/data-dict/**/*.dict.json` |
| `src/main/resources/META-INF/ouroboros/mq-binding/**/*.json` | `src/main/metadata/mq-binding/**/*.mq.json` |
| `src/main/resources/META-INF/ouroboros/schedule/**/*.json` | `src/main/metadata/schedule/**/*.schedule.json` |
| `src/main/resources/META-INF/ouroboros/webapi/**/*.json` | `src/main/metadata/webapi/**/*.webapi.json` |
| `src/main/resources/META-INF/ouroboros/i18n/messages/**/*.json` | `src/main/metadata/i18n/**/*.i18n.json` |
| `src/main/resources/META-INF/ouroboros/organization-structure/positions/**/*.json` | `src/main/metadata/**/*.position.json` |
| `src/main/resources/META-INF/ouroboros/micro-web/*.json` | `src/main/metadata/micro-web/*.micro-web.json` |
| `src/main/resources/META-INF/ouroboros/micro-web/package/**` | `src/main/metadata/micro-web/package/**` |
| `src/main/resources/META-INF/ouroboros/error-code/**/*.json` | merged into `src/main/metadata/error-codes.error.json` |

UI Schema files are migrated to the current wrapper shape. If an old file is already `{ "name": ..., "schema": ... }`, the content is preserved. Otherwise the script wraps the old AMIS object as `{ "name": "<relative/path>", "schema": <old content> }`.
Error-code files are expected to be JSON arrays and are merged into the fixed `error-codes.error.json` collection file.

## Maven Packaging

脚本检查真实 build/plugins 中的 execution。存在父 POM 且本模块没有执行时，先用项目实际 Maven 配置生成 `help:effective-pom -Doutput=<临时绝对路径>`，通过 `--effective-pom` 传入；继承或活动 profile 已提供 copy-metadata-sources 时不再添加。也可在已自行验证打包配置后显式 `--skip-pom`。脚本不猜父 POM 的有效构建，也不把 pluginManagement、注释或未激活 profile 的文字当成执行。

需要新增时，execution 将 src/main/metadata 复制到 META-INF/ouroboros/metadata。迁移先预检全部转换、冲突和 POM 再写入；完成后检查实际 JAR 内容。此工具只迁移目录与信封，不升级业务 formatVersion、Java API 或数据库。

## Rules

- Keep generated typed file suffixes exactly as listed in the mapping table.
- Do not leave both old and new copies of the same metadata resource after a successful `--write` migration.
- Treat target conflicts as blockers unless the target file has identical content.
- Do not migrate unknown old metadata directories blindly; inspect runtime support first.
- Validate UI Schema wrapper files with `tidestack-metadata-definition` and `references/ui-schema.schema.json` after migration.
