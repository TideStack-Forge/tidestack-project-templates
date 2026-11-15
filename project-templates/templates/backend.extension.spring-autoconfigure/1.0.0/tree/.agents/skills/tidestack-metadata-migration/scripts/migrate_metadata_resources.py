#!/usr/bin/env python3
"""Migrate old Ouroboros metadata resources to src/main/metadata."""

from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Iterable


OUROBOROS_ROOT = pathlib.Path("src/main/resources/META-INF/ouroboros")
RESOURCE_ROOT = pathlib.Path("src/main/resources")
METADATA_ROOT = pathlib.Path("src/main/metadata")

FIXED_OUROBOROS_FILES = (
    ("app-modules.json", "app-modules.json"),
    ("configuration.json", "configurations.json"),
    ("configurations.json", "configurations.json"),
    ("configuration-groups.json", "configuration-groups.json"),
)
FIXED_CLASSPATH_FILES = (
    "app.metadata.json",
    "modules.diff.json",
    "style.css",
)
DIRECTORY_MAPPINGS = (
    ("menu-model", ".menu.json", False, "", True),
    ("dev-menu-model", ".dev-menu.json", False, "", True),
    ("authority", ".authority.json", False, "", True),
    ("ui-model", ".ui-model.json", False, "", True),
    ("ui-schema", ".ui-schema.json", True, "", True),
    ("field-repository", ".field-type.json", False, "", True),
    ("field-types", ".field-type.json", False, "", True),
    ("dev-field-repository", ".field-type.json", False, "dev", True),
    ("logic-flow-node-define", ".flow-node.json", False, "", True),
    ("widget-definition", ".widget.json", False, "", True),
    ("business-log-template", ".business-log.json", False, "", True),
    ("notification-template", ".notification.json", False, "", True),
    ("data-init", ".data-init.json", False, "", True),
    ("logic-flow", ".logicflow.json", False, "logic-flow", True),
    ("data-dict", ".dict.json", False, "data-dict", True),
    ("mq-binding", ".mq.json", False, "mq-binding", True),
    ("schedule", ".schedule.json", False, "schedule", True),
    ("webapi", ".webapi.json", False, "webapi", True),
    ("i18n/messages", ".i18n.json", False, "i18n", True),
    ("organization-structure/positions", ".position.json", False, "", True),
    ("micro-web", ".micro-web.json", False, "micro-web", False),
)
RPC_AUTH_DIRECTORY = pathlib.Path("rpc-model/credential")
RPC_AUTH_TARGET_DIRECTORY = pathlib.Path("rpc-model/auth")
RPC_MODEL_DIRECTORY = pathlib.Path("rpc-model")
MICRO_WEB_PACKAGE_DIRECTORY = pathlib.Path("micro-web/package")
ERROR_CODE_DIRECTORY = pathlib.Path("error-code")
ERROR_CODE_COLLECTION_FILE = "error-codes.error.json"

METADATA_EXECUTION = """          <execution>
            <id>copy-metadata-sources</id>
            <phase>process-resources</phase>
            <goals>
              <goal>copy-resources</goal>
            </goals>
            <configuration>
              <outputDirectory>${project.build.outputDirectory}/META-INF/ouroboros/metadata</outputDirectory>
              <resources>
                <resource>
                  <directory>${project.basedir}/src/main/metadata</directory>
                  <filtering>false</filtering>
                  <includes>
                    <include>**/*</include>
                  </includes>
                  <excludes>
                    <exclude>**/.gitkeep</exclude>
                  </excludes>
                </resource>
              </resources>
            </configuration>
          </execution>"""

METADATA_PLUGIN = """      <!-- Ouroboros metadata sources: src/main/metadata -> META-INF/ouroboros/metadata -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-resources-plugin</artifactId>
        <version>3.3.1</version>
        <executions>
""" + METADATA_EXECUTION + """
        </executions>
      </plugin>"""


@dataclass(frozen=True)
class Migration:
    source: pathlib.Path
    target: pathlib.Path
    wraps_ui_schema: bool = False


@dataclass(frozen=True)
class JsonArrayMigration:
    sources: tuple[pathlib.Path, ...]
    target: pathlib.Path


def typed_name(name: str, suffix: str) -> str:
    if name.endswith(suffix):
        return name
    if not name.endswith(".json"):
        raise ValueError(f"Only JSON files can be migrated to {suffix}: {name}")
    return name[:-5] + suffix


def collect_migrations(module: pathlib.Path) -> tuple[list[Migration], list[JsonArrayMigration]]:
    migrations: list[Migration] = []
    array_migrations: list[JsonArrayMigration] = []
    ouroboros_root = module / OUROBOROS_ROOT
    metadata_root = module / METADATA_ROOT

    for source_name, target_name in FIXED_OUROBOROS_FILES:
        source = ouroboros_root / source_name
        if source.is_file():
            migrations.append(Migration(source, metadata_root / target_name))

    for file_name in FIXED_CLASSPATH_FILES:
        source = module / RESOURCE_ROOT / file_name
        if source.is_file():
            migrations.append(Migration(source, metadata_root / file_name))

    for directory_name, suffix, wraps_ui_schema, target_prefix, recursive in DIRECTORY_MAPPINGS:
        source_dir = ouroboros_root / directory_name
        if not source_dir.is_dir():
            continue
        source_iter = source_dir.rglob("*.json") if recursive else source_dir.glob("*.json")
        for source in sorted(source_iter):
            relative = source.relative_to(source_dir)
            target_name = typed_name(relative.name, suffix)
            target_parent = pathlib.Path(target_prefix) / relative.parent if target_prefix else relative.parent
            migrations.append(Migration(source, metadata_root / target_parent / target_name, wraps_ui_schema))

    collect_rpc_migrations(ouroboros_root, metadata_root, migrations)
    collect_micro_web_package_migrations(ouroboros_root, metadata_root, migrations)
    collect_error_code_migration(ouroboros_root, metadata_root, array_migrations)

    return migrations, array_migrations


def collect_rpc_migrations(ouroboros_root: pathlib.Path, metadata_root: pathlib.Path, migrations: list[Migration]) -> None:
    rpc_dir = ouroboros_root / RPC_MODEL_DIRECTORY
    if not rpc_dir.is_dir():
        return
    auth_dir = ouroboros_root / RPC_AUTH_DIRECTORY
    if auth_dir.is_dir():
        for source in sorted(auth_dir.rglob("*.json")):
            relative = source.relative_to(auth_dir)
            migrations.append(Migration(source, metadata_root / RPC_AUTH_TARGET_DIRECTORY / relative.parent / typed_name(relative.name, ".rpc.auth.json")))
    for source in sorted(rpc_dir.glob("*.json")):
        migrations.append(Migration(source, metadata_root / RPC_MODEL_DIRECTORY / typed_name(source.name, ".rpc.json")))


def collect_micro_web_package_migrations(ouroboros_root: pathlib.Path, metadata_root: pathlib.Path,
                                         migrations: list[Migration]) -> None:
    package_dir = ouroboros_root / MICRO_WEB_PACKAGE_DIRECTORY
    if not package_dir.is_dir():
        return
    for source in sorted(path for path in package_dir.rglob("*") if path.is_file()):
        relative = source.relative_to(package_dir)
        migrations.append(Migration(source, metadata_root / MICRO_WEB_PACKAGE_DIRECTORY / relative))


def collect_error_code_migration(ouroboros_root: pathlib.Path, metadata_root: pathlib.Path,
                                 array_migrations: list[JsonArrayMigration]) -> None:
    error_code_dir = ouroboros_root / ERROR_CODE_DIRECTORY
    if not error_code_dir.is_dir():
        return
    sources = tuple(sorted(error_code_dir.rglob("*.json")))
    if sources:
        array_migrations.append(JsonArrayMigration(sources, metadata_root / ERROR_CODE_COLLECTION_FILE))


def schema_name_for_target(metadata_root: pathlib.Path, target: pathlib.Path) -> str:
    relative = target.relative_to(metadata_root).as_posix()
    return relative[: -len(".ui-schema.json")]


def migrated_content(migration: Migration, metadata_root: pathlib.Path) -> bytes:
    if not migration.wraps_ui_schema:
        return migration.source.read_bytes()

    try:
        data = json.loads(migration.source.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{migration.source}: invalid JSON: {exc}") from exc

    if isinstance(data, dict) and data.get("name") and data.get("schema") is not None:
        wrapped = data
    else:
        wrapped = {
            "name": schema_name_for_target(metadata_root, migration.target),
            "schema": data,
        }
    return (json.dumps(wrapped, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def equal_bytes(path: pathlib.Path, content: bytes) -> bool:
    return path.is_file() and path.read_bytes() == content


def merged_json_array_content(migration: JsonArrayMigration) -> bytes:
    merged: list[object] = []
    for source in migration.sources:
        try:
            data = json.loads(source.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{source}: invalid JSON: {exc}") from exc
        if not isinstance(data, list):
            raise ValueError(f"{source}: expected a JSON array for error-code migration")
        merged.extend(data)
    return (json.dumps(merged, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def apply_migrations(module: pathlib.Path, migrations: Iterable[Migration], write: bool) -> list[str]:
    messages: list[str] = []
    metadata_root = module / METADATA_ROOT
    for migration in migrations:
        content = migrated_content(migration, metadata_root)
        display = f"{migration.source} -> {migration.target}"
        if migration.target.exists() and not equal_bytes(migration.target, content):
            raise ValueError(f"Target already exists with different content: {migration.target}")
        if not write:
            messages.append(f"DRY-RUN move {display}")
            continue
        migration.target.parent.mkdir(parents=True, exist_ok=True)
        if migration.target.exists():
            migration.source.unlink()
            messages.append(f"removed duplicate legacy {migration.source}")
            continue
        if migration.wraps_ui_schema:
            migration.target.write_bytes(content)
            migration.source.unlink()
        else:
            shutil.move(str(migration.source), str(migration.target))
        messages.append(f"moved {display}")
    return messages


def apply_json_array_migrations(array_migrations: Iterable[JsonArrayMigration], write: bool) -> list[str]:
    messages: list[str] = []
    for migration in array_migrations:
        content = merged_json_array_content(migration)
        source_display = ", ".join(str(source) for source in migration.sources)
        if migration.target.exists() and not equal_bytes(migration.target, content):
            raise ValueError(f"Target already exists with different content: {migration.target}")
        if not write:
            messages.append(f"DRY-RUN merge [{source_display}] -> {migration.target}")
            continue
        migration.target.parent.mkdir(parents=True, exist_ok=True)
        migration.target.write_bytes(content)
        for source in migration.sources:
            source.unlink()
        messages.append(f"merged [{source_display}] -> {migration.target}")
    return messages


def insert_metadata_plugin(pom_text: str) -> str:
    if has_metadata_execution(pom_text):
        return pom_text

    profiles_index = pom_text.find("<profiles>")
    search_end = profiles_index if profiles_index != -1 else len(pom_text)
    build_index = pom_text.find("<build>")
    resources_artifact = "<artifactId>maven-resources-plugin</artifactId>"
    resources_index = pom_text.find(resources_artifact, build_index if build_index != -1 else 0, search_end)
    if resources_index != -1:
        plugin_start = pom_text.rfind("<plugin>", 0, resources_index)
        plugin_end = pom_text.find("</plugin>", resources_index, search_end)
        if plugin_start == -1 or plugin_end == -1:
            raise ValueError("pom.xml has an incomplete maven-resources-plugin block")
        plugin_close = plugin_end + len("</plugin>")
        plugin_text = pom_text[plugin_start:plugin_close]
        executions_index = plugin_text.find("<executions>")
        if executions_index != -1:
            close_executions = plugin_text.find("</executions>", executions_index)
            if close_executions == -1:
                raise ValueError("maven-resources-plugin has <executions> without </executions>")
            absolute_close = plugin_start + close_executions
            return pom_text[:absolute_close] + "\n" + METADATA_EXECUTION + "\n" + pom_text[absolute_close:]
        execution_block = "\n        <executions>\n" + METADATA_EXECUTION + "\n        </executions>\n      "
        return pom_text[:plugin_end] + execution_block + pom_text[plugin_end:]

    if build_index != -1 and build_index < search_end:
        plugins_index = pom_text.find("<plugins>", build_index, search_end)
        if plugins_index != -1:
            close_plugins = pom_text.find("</plugins>", plugins_index, search_end)
            if close_plugins == -1:
                raise ValueError("pom.xml has <plugins> without </plugins>")
            return pom_text[:close_plugins] + "\n" + METADATA_PLUGIN + "\n" + pom_text[close_plugins:]
        close_build = pom_text.find("</build>", build_index, search_end)
        if close_build == -1:
            raise ValueError("pom.xml has <build> without </build>")
        plugins_block = "\n    <plugins>\n" + METADATA_PLUGIN + "\n    </plugins>\n"
        return pom_text[:close_build] + plugins_block + pom_text[close_build:]

    close_project = pom_text.rfind("</project>")
    if close_project == -1:
        raise ValueError("pom.xml is missing </project>")
    build_block = "\n  <build>\n    <plugins>\n" + METADATA_PLUGIN + "\n    </plugins>\n  </build>\n"
    return pom_text[:close_project] + build_block + pom_text[close_project:]


def has_metadata_execution(pom_text: str) -> bool:
    root = ET.fromstring(pom_text)
    namespace = {"m": root.tag.split("}")[0][1:]} if "}" in root.tag else {}
    prefix = "m:" if namespace else ""
    path = "/".join(prefix + part for part in ("build", "plugins", "plugin"))
    for plugin in root.findall(path, namespace):
        if plugin.findtext(prefix + "artifactId", namespaces=namespace) != "maven-resources-plugin":
            continue
        for execution in plugin.findall(prefix + "executions/" + prefix + "execution", namespace):
            execution_id = execution.findtext(prefix + "id", namespaces=namespace)
            if execution_id == "copy-metadata-sources":
                return True
    return False


def ensure_pom_packaging(module: pathlib.Path, write: bool, effective_pom: pathlib.Path | None = None) -> str:
    pom = module / "pom.xml"
    if not pom.is_file():
        return f"skip pom.xml: not found at {pom}"
    original = pom.read_text(encoding="utf-8")
    if effective_pom is not None:
        if has_metadata_execution(effective_pom.read_text(encoding="utf-8")):
            return "effective pom.xml already has copy-metadata-sources (possibly inherited)"
    elif not has_metadata_execution(original):
        root = ET.fromstring(original)
        if any(child.tag.rsplit("}", 1)[-1] == "parent" for child in root):
            raise ValueError("POM has a parent: pass --effective-pom from Maven help:effective-pom, or --skip-pom after verifying packaging; inheritance cannot be inferred from current POM text")
    updated = insert_metadata_plugin(original)
    if updated == original:
        return "pom.xml already has copy-metadata-sources"
    if write:
        pom.write_text(updated, encoding="utf-8")
        return "updated pom.xml with copy-metadata-sources"
    return "DRY-RUN update pom.xml with copy-metadata-sources"


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Migrate old Ouroboros metadata resources to src/main/metadata.")
    parser.add_argument("--module", default=".", help="Module root. Defaults to the current directory.")
    parser.add_argument("--write", action="store_true", help="Apply changes. Omit for dry-run.")
    parser.add_argument("--skip-pom", action="store_true", help="Do not add the Maven metadata packaging execution.")
    parser.add_argument("--effective-pom", type=pathlib.Path, help="Effective POM generated by Maven, including inherited/active profile executions")
    args = parser.parse_args(argv)

    module = pathlib.Path(args.module).resolve()
    if not module.is_dir():
        print(f"Module directory does not exist: {module}", file=sys.stderr)
        return 1

    try:
        migrations, array_migrations = collect_migrations(module)
        # Check every transform, target conflict and packaging decision before moving any source.
        apply_migrations(module, migrations, False)
        apply_json_array_migrations(array_migrations, False)
        if not args.skip_pom:
            ensure_pom_packaging(module, False, args.effective_pom)
        if not migrations and not array_migrations:
            print("No old metadata resources found.")
        for message in apply_migrations(module, migrations, args.write):
            print(message)
        for message in apply_json_array_migrations(array_migrations, args.write):
            print(message)
        if not args.skip_pom:
            print(ensure_pom_packaging(module, args.write, args.effective_pom))
    except Exception as exc:
        print(f"metadata migration failed: {exc}", file=sys.stderr)
        return 1

    if not args.write:
        print("Dry-run only. Re-run with --write to apply changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
