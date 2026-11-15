#!/usr/bin/env bash
set -euo pipefail

default_image_base="registry.cn-hangzhou.aliyuncs.com/ouroboros/ouroboros-web"
default_image_tag="2.0.0-prerelease"
image="auto"
container_name="ouroboros-web-debug"
host_port="auto"
explicit_listen_port=false
backend_port=""
backend_url=""
deploy_web_root=""
micro_mappings=()

usage() {
  cat <<'EOF'
Usage:
  start_tidestack_web.sh (--backend-port PORT | --backend-url URL) [options]

Options:
  --backend-port PORT       Local backend port on the host machine.
  --backend-url URL         Explicit backend URL, must start with http:// or https://.
  --listen-port PORT|auto   Host port for ouroboros-web. Default: auto from 18080.
  --image IMAGE|auto        Docker image. Default: auto, arm64 hosts use registry.cn-hangzhou.aliyuncs.com/ouroboros/ouroboros-web:2.0.0-prerelease-arm64.
  --container-name NAME     Container name. Default: ouroboros-web-debug.
  --micro PATH=URL          Micro frontend proxy mapping. Repeatable.
  --deploy-web-root PATH    Host directory mounted read-only to /app/deploy/web.
  -h, --help                Show this help.
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

normalize_micro_path() {
  local raw="$1"
  [[ -n "$raw" ]] || fail "micro mapping path cannot be empty"
  [[ "$raw" == /* ]] || raw="/$raw"
  [[ "$raw" == */ ]] || raw="$raw/"
  printf '%s' "$raw"
}

validate_url() {
  local label="$1"
  local value="$2"
  case "$value" in
    http://*|https://*) ;;
    *) fail "$label must start with http:// or https://: $value" ;;
  esac
}

port_is_listening() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    return $?
  fi
  return 1
}

find_available_port() {
  local start="$1"
  local port="$start"
  while (( port <= start + 100 )); do
    if ! port_is_listening "$port"; then
      printf '%s' "$port"
      return 0
    fi
    port=$((port + 1))
  done
  fail "no available listen port found from $start to $((start + 100))"
}

select_default_image() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    arm64|aarch64)
      printf '%s:%s-arm64' "$default_image_base" "$default_image_tag"
      ;;
    *)
      printf '%s:%s' "$default_image_base" "$default_image_tag"
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-port)
      [[ $# -ge 2 ]] || fail "--backend-port requires a value"
      backend_port="$2"
      shift 2
      ;;
    --backend-url)
      [[ $# -ge 2 ]] || fail "--backend-url requires a value"
      backend_url="$2"
      shift 2
      ;;
    --listen-port)
      [[ $# -ge 2 ]] || fail "--listen-port requires a value"
      host_port="$2"
      explicit_listen_port=true
      shift 2
      ;;
    --image)
      [[ $# -ge 2 ]] || fail "--image requires a value"
      image="$2"
      shift 2
      ;;
    --container-name)
      [[ $# -ge 2 ]] || fail "--container-name requires a value"
      container_name="$2"
      shift 2
      ;;
    --micro)
      [[ $# -ge 2 ]] || fail "--micro requires a PATH=URL value"
      micro_mappings+=("$2")
      shift 2
      ;;
    --deploy-web-root)
      [[ $# -ge 2 ]] || fail "--deploy-web-root requires a path"
      deploy_web_root="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
done

if [[ -n "$backend_url" && -n "$backend_port" ]]; then
  fail "use either --backend-url or --backend-port, not both"
fi

if [[ -z "$backend_url" ]]; then
  [[ -n "$backend_port" ]] || fail "backend is required: pass --backend-port or --backend-url"
  [[ "$backend_port" =~ ^[0-9]+$ ]] || fail "--backend-port must be numeric: $backend_port"
  backend_url="http://host.docker.internal:$backend_port"
fi

validate_url "backend URL" "$backend_url"

micro_proxy_map=""
for mapping in ${micro_mappings[@]+"${micro_mappings[@]}"}; do
  [[ "$mapping" == *=* ]] || fail "--micro must be PATH=URL: $mapping"
  path="${mapping%%=*}"
  target="${mapping#*=}"
  validate_url "micro target for $path" "$target"
  normalized_path="$(normalize_micro_path "$path")"
  if [[ -n "$micro_proxy_map" ]]; then
    micro_proxy_map="$micro_proxy_map,"
  fi
  micro_proxy_map="$micro_proxy_map$normalized_path=$target"
done

docker version >/dev/null

if docker container inspect "$container_name" >/dev/null 2>&1; then
  container_owner="$(docker container inspect --format '{{ index .Config.Labels "dev.tidestack.launcher" }}' "$container_name")"
  [[ "$container_owner" == "local-debugging" ]] || fail "container $container_name is not owned by this launcher; choose another --container-name"
  container_backend="$(docker container inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$container_name")"
  [[ "$container_backend" == *"BACKEND_URL=$backend_url"* ]] || fail "container $container_name targets another backend; choose another --container-name"
  fail "container $container_name already exists; reuse it or explicitly stop it before restarting"
fi

if [[ "$image" == "auto" ]]; then
  image="$(select_default_image)"
fi

if [[ "$host_port" == "auto" ]]; then
  host_port="$(find_available_port 18080)"
else
  [[ "$host_port" =~ ^[0-9]+$ ]] || fail "--listen-port must be numeric or auto: $host_port"
  if [[ "$explicit_listen_port" == true ]] && port_is_listening "$host_port"; then
    fail "listen port $host_port is already in use"
  fi
fi

docker_args=(
  run
  --rm
  -d
  --name "$container_name"
  --label dev.tidestack.launcher=local-debugging
  -p "$host_port:80"
  --add-host=host.docker.internal:host-gateway
  -e "BACKEND_URL=$backend_url"
)

if [[ -n "$micro_proxy_map" ]]; then
  docker_args+=(-e "MICRO_PROXY_MAP=$micro_proxy_map")
fi

if [[ -n "$deploy_web_root" ]]; then
  [[ -d "$deploy_web_root" ]] || fail "--deploy-web-root does not exist or is not a directory: $deploy_web_root"
  docker_args+=(-v "$deploy_web_root:/app/deploy/web:ro")
fi

docker "${docker_args[@]}" "$image" >/dev/null

echo "Started $container_name"
echo "Web URL: http://localhost:$host_port"
echo "Backend URL: $backend_url"
echo "Image: $image"
if [[ -n "$micro_proxy_map" ]]; then
  echo "Micro proxy map: $micro_proxy_map"
fi
