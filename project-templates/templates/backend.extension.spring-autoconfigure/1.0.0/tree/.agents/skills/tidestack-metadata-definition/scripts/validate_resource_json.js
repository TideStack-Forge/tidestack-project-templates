#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function usage() {
  console.log(`Usage:
  node validate_resource_json.js --subset --schema SCHEMA --json RESOURCE_JSON [--forbid-submenus]

Options:
  --schema PATH       Path to the JSON Schema file.
  --json PATH         Path to the resource JSON file.
  --subset            Explicitly run subset checks only (not full Draft 2020-12 validation).
  --forbid-submenus   Fail if an app module resource uses subMenus.
  -h, --help          Show this help.`);
}

function parseArgs(argv) {
  const args = { schema: "", json: "", forbidSubmenus: false };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "-h" || item === "--help") {
      args.help = true;
    } else if (item === "--schema") {
      i += 1;
      args.schema = argv[i] || "";
    } else if (item === "--json") {
      i += 1;
      args.json = argv[i] || "";
    } else if (item === "--forbid-submenus") {
      args.forbidSubmenus = true;
    } else if (item === "--subset") {
      args.subset = true;
    } else {
      throw new Error(`unknown option: ${item}`);
    }
  }
  if (!args.help && (!args.schema || !args.json)) {
    throw new Error("--schema and --json are required");
  }
  return args;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "string";
  if (typeof value === "object") return "object";
  return typeof value;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function deepEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

class MinimalValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(value) {
    const errors = [];
    this.validateNode(value, this.schema, "$", errors);
    return errors;
  }

  resolveRef(ref) {
    if (!ref.startsWith("#/")) {
      throw new Error(`$ref: unsupported ref ${JSON.stringify(ref)}`);
    }
    let node = this.schema;
    for (const rawPart of ref.slice(2).split("/")) {
      const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
      if (node === undefined || node === null || !(part in node)) {
        throw new Error(`$ref: unresolved ref ${JSON.stringify(ref)}`);
      }
      node = node[part];
    }
    return node;
  }

  validateNode(value, schema, currentPath, errors) {
    if (!schema || typeof schema !== "object") {
      return;
    }

    if (schema.$ref) {
      this.validateNode(value, this.resolveRef(schema.$ref), currentPath, errors);
      return;
    }

    if (Array.isArray(schema.allOf)) {
      for (const branch of schema.allOf) {
        this.validateNode(value, branch, currentPath, errors);
      }
    }

    if (Array.isArray(schema.anyOf)) {
      const branchErrors = [];
      for (const branch of schema.anyOf) {
        const localErrors = [];
        this.validateNode(value, branch, currentPath, localErrors);
        if (localErrors.length === 0) {
          return;
        }
        branchErrors.push(...localErrors);
      }
      errors.push(`${currentPath}: did not match any allowed schema`);
      return;
    }

    if (Array.isArray(schema.oneOf)) {
      let matches = 0;
      for (const branch of schema.oneOf) {
        const localErrors = [];
        this.validateNode(value, branch, currentPath, localErrors);
        if (localErrors.length === 0) {
          matches += 1;
        }
      }
      if (matches !== 1) {
        errors.push(`${currentPath}: expected exactly one matching schema, got ${matches}`);
      }
      return;
    }

    const expectedType = schema.type;
    if (expectedType !== undefined) {
      const expected = Array.isArray(expectedType) ? expectedType : [expectedType];
      if (!expected.some((item) => this.matchesType(value, item))) {
        errors.push(`${currentPath}: expected ${expected.join("/")}, got ${typeName(value)}`);
        return;
      }
    }

    if ("const" in schema && !deepEqual(value, schema.const)) {
      errors.push(`${currentPath}: expected constant ${JSON.stringify(schema.const)}`);
    }

    if (Array.isArray(schema.enum) && !schema.enum.some((item) => deepEqual(item, value))) {
      const allowed = schema.enum.map((item) => JSON.stringify(item)).join(", ");
      errors.push(`${currentPath}: expected one of ${allowed}`);
    }

    if (typeof value === "string") {
      if ("minLength" in schema && value.length < schema.minLength) {
        errors.push(`${currentPath}: length must be >= ${schema.minLength}`);
      }
      if ("maxLength" in schema && value.length > schema.maxLength) {
        errors.push(`${currentPath}: length must be <= ${schema.maxLength}`);
      }
      if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
        errors.push(`${currentPath}: does not match pattern ${schema.pattern}`);
      }
    }

    if (typeof value === "number") {
      if ("minimum" in schema && value < schema.minimum) {
        errors.push(`${currentPath}: must be >= ${schema.minimum}`);
      }
      if ("maximum" in schema && value > schema.maximum) {
        errors.push(`${currentPath}: must be <= ${schema.maximum}`);
      }
    }

    if (Array.isArray(value)) {
      const itemSchema = schema.items;
      if (itemSchema !== undefined) {
        value.forEach((item, index) => {
          this.validateNode(item, itemSchema, `${currentPath}[${index}]`, errors);
        });
      }
      if (schema.uniqueItems) {
        const seen = new Set();
        value.forEach((item, index) => {
          const key = stableStringify(item);
          if (seen.has(key)) {
            errors.push(`${currentPath}[${index}]: duplicate array item`);
          }
          seen.add(key);
        });
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const key of schema.required || []) {
        if (!(key in value)) {
          errors.push(`${currentPath}.${key}: required property missing`);
        }
      }

      const properties = schema.properties || {};
      const additional = schema.additionalProperties === undefined ? true : schema.additionalProperties;
      for (const [key, item] of Object.entries(value)) {
        const itemPath = `${currentPath}.${key}`;
        if (key in properties) {
          this.validateNode(item, properties[key], itemPath, errors);
        } else if (additional === false) {
          errors.push(`${itemPath}: unknown property`);
        } else if (additional && typeof additional === "object") {
          this.validateNode(item, additional, itemPath, errors);
        }
      }
    }
  }

  matchesType(value, expected) {
    if (expected === "null") return value === null;
    if (expected === "boolean") return typeof value === "boolean";
    if (expected === "integer") return Number.isInteger(value);
    if (expected === "number") return typeof value === "number";
    if (expected === "string") return typeof value === "string";
    if (expected === "array") return Array.isArray(value);
    if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
    return true;
  }
}

function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`error: ${error.message}`);
    usage();
    return 2;
  }

  if (args.help) {
    usage();
    return 0;
  }

  if (!args.subset) {
    console.error("This Node.js validator supports subset checks only. Use the Python validator with jsonschema for full validation, or explicitly pass --subset.");
    return 2;
  }

  const schemaPath = path.resolve(args.schema);
  const jsonPath = path.resolve(args.json);

  let schema;
  let data;
  try {
    schema = loadJson(schemaPath);
    data = loadJson(jsonPath);
  } catch (error) {
    console.error(`JSON parse failed: ${error.message}`);
    return 1;
  }

  let errors;
  try {
    errors = new MinimalValidator(schema).validate(data);
  } catch (error) {
    console.error(`schema validation failed: ${error.message}`);
    return 1;
  }

  if (errors.length > 0) {
    console.error(`${jsonPath}: schema validation failed`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    return 1;
  }

  if (args.forbidSubmenus) {
    const policyErrors = [];
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item && typeof item === "object" && !Array.isArray(item) && Object.prototype.hasOwnProperty.call(item, "subMenus")) {
          const name = item.fullName || `[${index}]`;
          policyErrors.push(`$[${index}] ${name}: subMenus is forbidden by default; model child sections as app modules`);
        }
      });
    } else if (data && typeof data === "object" && !Array.isArray(data) && Object.prototype.hasOwnProperty.call(data, "subMenus")) {
      const name = data.fullName || "$";
      policyErrors.push(`${name}: subMenus is forbidden by default; model child sections as app modules`);
    }

    if (policyErrors.length > 0) {
      console.error(`${jsonPath}: resource policy validation failed`);
      for (const error of policyErrors) {
        console.error(`- ${error}`);
      }
      return 1;
    }
  }

  console.log(`${jsonPath}: subset checks passed; complete Draft 2020-12 validation NOT performed`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
