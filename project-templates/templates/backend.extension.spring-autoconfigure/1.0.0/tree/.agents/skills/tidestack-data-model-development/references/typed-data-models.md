# Typed data model compilation

`com.ouroboros:ouroboros-data-typed-meta-processor` is an annotation processor invoked by `maven-compiler-plugin`. It is not a Maven plugin goal and has no dependency-filtering responsibility. Both embedded-runtime business modules and standard-runtime extensions may use it.

Use the same target platform version for typed-core and the processor. The official module archetype and backend extension template provide an optional `typed-data-model` profile:

```bash
mvn clean verify -Ptyped-data-model
```

Enable it consistently in the IDE and CI for a module whose sources reference generated meta classes. A project that always uses typed metadata can move the profile's dependency and compiler configuration into its regular build.

For an existing module, add `ouroboros-data-typed-core` to its compilation dependencies and merge this into its existing compiler plugin configuration:

```xml
<configuration>
  <parameters>true</parameters>
  <proc>full</proc>
  <annotationProcessorPaths>
    <path>
      <groupId>com.ouroboros</groupId>
      <artifactId>ouroboros-data-typed-meta-processor</artifactId>
      <version>${ouroboros.version}</version>
    </path>
  </annotationProcessorPaths>
</configuration>
```

Preserve other required processors, such as Lombok. Explicit processor paths replace automatic processor discovery from ordinary dependencies; do not discard the project's existing paths. Do not add the processor to deployed runtime dependencies.

For standard extensions, typed-core is normally `provided` by the base. For embedded projects, the startup module must actually assemble typed runtime and its libraries, even if the business module uses `provided`.

## What is generated

For `@Model` class `PointRecord` with declared `@Field` members, compilation generates same-package `PointRecordMeta` with:

- `MODEL_NAME`, from `@Model.fullName` or the class name.
- `SCHEMA_HASH`, describing the generated model and field signature.
- A static root `pointRecord` and typed field members.
- `as(String alias)` for query aliases.

For example, with an annotated String `ownerId` field:

```java
import static com.example.reward.model.PointRecordMeta.pointRecord;
import com.ouroboros.data.dsl.query.Query;

var statement = Query.from(pointRecord)
    .where(pointRecord.ownerId.eq("member-1"))
    .select(pointRecord.ownerId)
    .build();
```

This builds a statement through the same Query DSL. Generated metadata does not execute queries, create database tables, register `@Model` classes, or provide authorization. Keep `@DataModelScan`, typed runtime assembly and business authorization in their canonical paths. It does not generate Java types from arbitrary JSON business-model definitions.

## Verification

Compile a real annotated model and a consumer of its generated class in the same module. Check output under `target/generated-sources/annotations/` and the compiled `*Meta.class` in the JAR. A missing field or incompatible value type must fail compilation.

If no class appears, check annotation processing, the active profile, processor resolution and annotation imports. The current processor handles fields declared on the annotated class; do not assume inherited fields are generated. Avoid source fields named `MODEL_NAME`, `SCHEMA_HASH` or the generated root name. Keep generated source out of `src/main/java` and regenerate after model changes.
