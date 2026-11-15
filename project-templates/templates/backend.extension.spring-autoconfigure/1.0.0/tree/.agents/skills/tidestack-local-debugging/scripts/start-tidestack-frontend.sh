#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 <backend-url> [--repo <checkout>] [--host <host>] [--port <port>]

Options:
  --repo <path>    Target TideStack checkout (required for standalone installations).
  --host <host>    Host passed to the webpack dev server.
  --port <port>    Port passed to the webpack dev server.
  -h, --help       Show this help.
EOF
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 2
fi

case "$1" in
  -h|--help)
    usage
    exit 0
    ;;
esac

backend_url="$1"
shift

while [[ "${backend_url}" == */ ]]; do
  backend_url="${backend_url%/}"
done

if [[ ! "${backend_url}" =~ ^https?://[^[:space:]]+$ ]]; then
  printf 'Invalid backend URL: %s\n' "${backend_url}" >&2
  usage
  exit 2
fi

repo_root=""
frontend_options=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--host|--port)
      if [[ $# -lt 2 || -z "$2" || "$2" == --* ]]; then
        printf 'Missing value for %s\n' "$1" >&2
        exit 2
      fi
      if [[ "$1" == --repo ]]; then
        repo_root="$2"
      else
        frontend_options+=("$1" "$2")
      fi
      shift 2
      ;;
    *)
      printf 'Unsupported option: %s\n' "$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "${repo_root}" ]]; then
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
fi
if [[ ! -d "${repo_root}/frontends/web/main-app" ]]; then
  printf 'Target checkout not found. Pass --repo <TideStack checkout>.\n' >&2
  exit 1
fi
frontend_dir="$(cd "${repo_root}/frontends/web/main-app" && pwd)"

if [[ ! -f "${frontend_dir}/package.json" ]]; then
  printf 'Frontend shell package was not found: %s\n' "${frontend_dir}" >&2
  exit 1
fi

if [[ ! -x "${frontend_dir}/node_modules/.bin/webpack" ]]; then
  printf 'Frontend dependencies are missing. Run "npm ci" in %s and retry.\n' "${frontend_dir}" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  printf 'Required command not found: curl\n' >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  printf 'Required command not found: jq\n' >&2
  exit 1
fi

printf 'Fetching web-app-info from %s/api/sys/web-app-info\n' "${backend_url}"
if ! web_app_info="$(curl --fail-with-body --silent --show-error --location --max-time 15 "${backend_url}/api/sys/web-app-info")"; then
  printf 'Failed to fetch web-app-info from %s\n' "${backend_url}" >&2
  exit 1
fi

if ! jq -e 'type == "object" and ((.code | tostring) == "0") and (.data | type == "object")' >/dev/null <<<"${web_app_info}"; then
  printf 'Invalid web-app-info response: expected {"code":0,"data":{...}}\n' >&2
  exit 1
fi

if ! entries="$(jq -r '
  def micro_entry:
    select(type == "string" and length > 0)
    | if startswith("http://") or startswith("https://") then error("absolute URL") else . end
    | sub("^/+"; "")
    | "/" + .
    | sub("/+$"; "") + "/";
  def first_nonempty($values):
    $values | map(select(type == "string" and length > 0)) | .[0];
  def route_entry:
    first_nonempty([.entry, ((.config // {}) | .entry)]);
  def component_entry:
    first_nonempty([.publicPath, .entry]);
  def route_tree:
    ., ((.children // [])[] | route_tree);
  def is_micro_route:
    any([.type, .routeType][]?;
      type == "string"
      and ((ascii_downcase) as $kind
        | ["micro", "qb_template", "qb", "quick"] | index($kind) != null));
  [
    .data.headerEntry,
    .data.sidebarEntry,
    .data.loginEntry,
    (.data.amisLibrary
      | if type == "string" then . else first_nonempty([.entry, .publicPath]) end),
    ((.data.componentLibraries // [])[]? | component_entry),
    ((.data.platformComponentLibraries // [])[]? | component_entry),
    ((.data.routes // [])[]? | route_tree
      | select(is_micro_route)
      | route_entry)
  ]
  | map(micro_entry)
  | reduce .[] as $entry
      ([]; if index($entry) == null then . + [$entry] else . end)
  | .[]
' <<<"${web_app_info}")"; then
  printf 'Could not extract usable micro-frontend entries from web-app-info.\n' >&2
  exit 1
fi

micro_entries=()
while IFS= read -r entry; do
  if [[ -n "${entry}" ]]; then
    micro_entries+=("${entry}")
  fi
done <<<"${entries}"
if [[ ${#micro_entries[@]} -eq 0 || -z "${micro_entries[0]}" ]]; then
  printf 'web-app-info did not contain any usable micro-frontend entries.\n' >&2
  exit 1
fi

start_args=(start -- --api "${backend_url}")
if [[ ${#frontend_options[@]} -gt 0 ]]; then
  start_args+=("${frontend_options[@]}")
fi

printf 'Discovered micro-frontend entries (%d):\n' "${#micro_entries[@]}"
for entry in "${micro_entries[@]}"; do
  printf '  %s\n' "${entry}"
  start_args+=(--micro_map "${entry}=${backend_url}")
done

printf 'Starting frontend shell in %s\n' "${frontend_dir}"
cd "${frontend_dir}"
exec npm "${start_args[@]}"
