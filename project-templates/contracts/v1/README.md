# Project Template Contract v1

This directory contains the versioned project-generation contract surface shared by catalog publishing and Java validation.

The v1 contract is intentionally small and fail-closed:

- `catalog.schema.json` validates signed catalog payload structure before business resolution.
- `parameter-contract.schema.json` validates the restricted parameter JSON Schema subset accepted by templates.
- `qualification-descriptor.schema.json` validates CI qualification descriptors used by preview and stable publication gates.
- `qualification-attestation.schema.json` validates immutable Ed25519 attestation envelopes.
- `corpus/` contains positive and negative fixtures consumed by automated tests.

Template source manifests are FreeMarker-compatible v2 artifacts documented under `../v2/`; templates and generated archives must not be committed here.

Publication governance lives one level above these schemas:

- Template qualification scripts write descriptor, attestation, trust-root and report files to `project-templates/target/qualification/<templateId>/`.
- `project-templates/scripts/test-release-pipeline.sh` consumes those outputs and runs the isolated preview/stable/revoke/rollback publication gate.
- Synthetic stable promotion fixtures must use a non-`SNAPSHOT` platform version and must never write a production catalog from this repository run.
