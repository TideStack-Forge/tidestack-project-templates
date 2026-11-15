#!/usr/bin/env python3
"""Validate Ouroboros resource JSON files with bundled JSON Schemas."""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
from typing import Any


def load_json(path: pathlib.Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def type_name(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int) and not isinstance(value, bool):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


class ValidationError(Exception):
    def __init__(self, path: str, message: str) -> None:
        super().__init__(f"{path}: {message}")


class MinimalValidator:
    def __init__(self, schema: dict[str, Any]) -> None:
        self.schema = schema

    def validate(self, value: Any) -> list[str]:
        errors: list[str] = []
        self._validate(value, self.schema, "$", errors)
        return errors

    def _resolve_ref(self, ref: str) -> dict[str, Any]:
        if not ref.startswith("#/"):
            raise ValidationError("$ref", f"unsupported ref {ref!r}")
        node: Any = self.schema
        for part in ref[2:].split("/"):
            part = part.replace("~1", "/").replace("~0", "~")
            node = node[part]
        return node

    def _validate(self, value: Any, schema: dict[str, Any], path: str, errors: list[str]) -> None:
        if "$ref" in schema:
            self._validate(value, self._resolve_ref(schema["$ref"]), path, errors)
            return

        if "anyOf" in schema:
            branch_errors: list[str] = []
            for branch in schema["anyOf"]:
                local_errors: list[str] = []
                self._validate(value, branch, path, local_errors)
                if not local_errors:
                    return
                branch_errors.extend(local_errors)
            errors.append(f"{path}: did not match any allowed schema")
            return

        expected_type = schema.get("type")
        if expected_type is not None:
            expected = expected_type if isinstance(expected_type, list) else [expected_type]
            if not any(self._matches_type(value, item) for item in expected):
                errors.append(f"{path}: expected {'/'.join(expected)}, got {type_name(value)}")
                return

        if "enum" in schema and value not in schema["enum"]:
            allowed = ", ".join(repr(item) for item in schema["enum"])
            errors.append(f"{path}: expected one of {allowed}")

        if isinstance(value, str) and "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: length must be >= {schema['minLength']}")

        if isinstance(value, list):
            item_schema = schema.get("items")
            if item_schema is not None:
                for index, item in enumerate(value):
                    self._validate(item, item_schema, f"{path}[{index}]", errors)
            if schema.get("uniqueItems"):
                seen = set()
                for index, item in enumerate(value):
                    key = json.dumps(item, ensure_ascii=False, sort_keys=True)
                    if key in seen:
                        errors.append(f"{path}[{index}]: duplicate array item")
                    seen.add(key)

        if isinstance(value, dict):
            for key in schema.get("required", []):
                if key not in value:
                    errors.append(f"{path}.{key}: required property missing")

            properties = schema.get("properties", {})
            additional = schema.get("additionalProperties", True)
            for key, item in value.items():
                item_path = f"{path}.{key}"
                if key in properties:
                    self._validate(item, properties[key], item_path, errors)
                elif additional is False:
                    errors.append(f"{item_path}: unknown property")
                elif isinstance(additional, dict):
                    self._validate(item, additional, item_path, errors)

    @staticmethod
    def _matches_type(value: Any, expected: str) -> bool:
        if expected == "null":
            return value is None
        if expected == "boolean":
            return isinstance(value, bool)
        if expected == "integer":
            return isinstance(value, int) and not isinstance(value, bool)
        if expected == "number":
            return (isinstance(value, int) or isinstance(value, float)) and not isinstance(value, bool)
        if expected == "string":
            return isinstance(value, str)
        if expected == "array":
            return isinstance(value, list)
        if expected == "object":
            return isinstance(value, dict)
        return True


def validate_with_jsonschema(schema: dict[str, Any], data: Any, schema_path: pathlib.Path) -> list[str] | None:
    try:
        from jsonschema import Draft202012Validator  # type: ignore
        from referencing import Registry, Resource
        from referencing.jsonschema import DRAFT202012
    except ImportError:
        return None

    Draft202012Validator.check_schema(schema)
    registry = Registry()
    for path in sorted(schema_path.parent.glob("*.schema.json")):
        definition = load_json(path)
        resource = Resource.from_contents(definition, default_specification=DRAFT202012)
        registry = registry.with_resource(path.as_uri(), resource)
        if isinstance(definition, dict) and "$id" in definition:
            registry = registry.with_resource(definition["$id"], resource)
    registry = registry.with_resource(
        schema_path.as_uri(), Resource.from_contents(schema, default_specification=DRAFT202012)
    )
    validator = Draft202012Validator({"$ref": schema_path.as_uri()}, registry=registry)
    return [
        f"{'.'.join(str(part) for part in error.absolute_path) or '$'}: {error.message}"
        for error in sorted(validator.iter_errors(data), key=lambda item: item.json_path)
    ]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate an Ouroboros resource JSON file against a JSON Schema.")
    parser.add_argument("--schema", required=True, help="Path to the JSON Schema file.")
    parser.add_argument("--json", required=True, help="Path to the resource JSON file.")
    parser.add_argument("--subset", action="store_true", help="Run only bundled subset checks, not complete Draft 2020-12 validation.")
    parser.add_argument(
        "--forbid-submenus",
        action="store_true",
        help="Fail if an app module resource uses subMenus when the project policy forbids them.",
    )
    args = parser.parse_args(argv)

    schema_path = pathlib.Path(args.schema).resolve()
    json_path = pathlib.Path(args.json)

    try:
        schema = load_json(schema_path)
        data = load_json(json_path)
    except Exception as exc:
        print(f"JSON parse failed: {exc}", file=sys.stderr)
        return 1

    try:
        errors = MinimalValidator(schema).validate(data) if args.subset else validate_with_jsonschema(schema, data, schema_path)
    except Exception as exc:
        print(f"Schema validation failed: {exc}", file=sys.stderr)
        return 1
    if errors is None:
        print("Full validation requires jsonschema and referencing. Install scripts/requirements.txt or explicitly request --subset.", file=sys.stderr)
        return 2

    if errors:
        print(f"{json_path}: schema validation failed", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if args.forbid_submenus:
        policy_errors: list[str] = []
        if isinstance(data, list):
            for index, item in enumerate(data):
                if isinstance(item, dict) and "subMenus" in item:
                    name = item.get("fullName", f"[{index}]")
                    policy_errors.append(f"$[{index}] {name}: subMenus is forbidden by default; model child sections as app modules")
        elif isinstance(data, dict) and "subMenus" in data:
            name = data.get("fullName", "$")
            policy_errors.append(f"{name}: subMenus is forbidden by default; model child sections as app modules")

        if policy_errors:
            print(f"{json_path}: resource policy validation failed", file=sys.stderr)
            for error in policy_errors:
                print(f"- {error}", file=sys.stderr)
            return 1

    mode = "subset checks passed; complete Draft 2020-12 validation NOT performed" if args.subset else "Draft 2020-12 validation passed"
    print(f"{json_path}: {mode}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
