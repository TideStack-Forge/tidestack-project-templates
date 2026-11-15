#!/usr/bin/env bash
set -euo pipefail

for arg in "$@"; do
  case "${arg}" in
    --synthetic-non-snapshot-fixture|--assert-no-production-catalog-write|--immutable-artifacts|--jcs-corpus|--signed-qualification-profile|--canonical-descriptor|--signed-attestation|--attestation-fetch-security|--preview-publication|--stable-promotion|--signed-catalog|--revoke|--rollback)
      ;;
    *)
      echo "unknown release pipeline assertion: ${arg}" >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/verify-template-publication.sh" --clean
