param(
    [string]$BackendPort = "",
    [string]$BackendUrl = "",
    [string]$ListenPort = "auto",
    [string]$Image = "auto",
    [string]$ContainerName = "ouroboros-web-debug",
    [string[]]$Micro = @(),
    [string]$DeployWebRoot = "",
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$DefaultImageBase = "registry.cn-hangzhou.aliyuncs.com/ouroboros/ouroboros-web"
$DefaultImageTag = "2.0.0-prerelease"

function Show-Usage {
    @"
Usage:
  .\start_tidestack_web.ps1 (-BackendPort PORT | -BackendUrl URL) [options]

Options:
  -BackendPort PORT       Local backend port on the host machine.
  -BackendUrl URL         Explicit backend URL, must start with http:// or https://.
  -ListenPort PORT|auto   Host port for ouroboros-web. Default: auto from 18080.
  -Image IMAGE|auto       Docker image. Default: auto, arm64 hosts use registry.cn-hangzhou.aliyuncs.com/ouroboros/ouroboros-web:2.0.0-prerelease-arm64.
  -ContainerName NAME     Container name. Default: ouroboros-web-debug.
  -Micro PATH=URL         Micro frontend proxy mapping. Repeatable.
  -DeployWebRoot PATH     Host directory mounted read-only to /app/deploy/web.
  -Help                   Show this help.
"@
}

function Fail {
    param([string]$Message)
    Write-Error "error: $Message"
    exit 1
}

function Normalize-MicroPath {
    param([string]$Raw)
    if ([string]::IsNullOrWhiteSpace($Raw)) {
        Fail "micro mapping path cannot be empty"
    }
    if (-not $Raw.StartsWith("/")) {
        $Raw = "/$Raw"
    }
    if (-not $Raw.EndsWith("/")) {
        $Raw = "$Raw/"
    }
    return $Raw
}

function Assert-HttpUrl {
    param(
        [string]$Label,
        [string]$Value
    )
    if ($Value -notmatch '^https?://') {
        Fail "$Label must start with http:// or https://: $Value"
    }
}

function Test-PortInUse {
    param([int]$Port)
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        return $false
    }
    catch {
        return $true
    }
    finally {
        if ($listener) {
            $listener.Stop()
        }
    }
}

function Find-AvailablePort {
    param([int]$Start)
    for ($port = $Start; $port -le ($Start + 100); $port++) {
        if (-not (Test-PortInUse $port)) {
            return $port
        }
    }
    Fail "no available listen port found from $Start to $($Start + 100)"
}

function Select-DefaultImage {
    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
    if ($arch -eq "Arm64") {
        return "${DefaultImageBase}:${DefaultImageTag}-arm64"
    }
    return "${DefaultImageBase}:${DefaultImageTag}"
}

if ($Help) {
    Show-Usage
    exit 0
}

if ($BackendUrl -and $BackendPort) {
    Fail "use either -BackendUrl or -BackendPort, not both"
}

if (-not $BackendUrl) {
    if (-not $BackendPort) {
        Fail "backend is required: pass -BackendPort or -BackendUrl"
    }
    if ($BackendPort -notmatch '^[0-9]+$') {
        Fail "-BackendPort must be numeric: $BackendPort"
    }
    $BackendUrl = "http://host.docker.internal:$BackendPort"
}

Assert-HttpUrl "backend URL" $BackendUrl

$microProxyItems = @()
foreach ($Mapping in $Micro) {
    if ($Mapping -notmatch '=') {
        Fail "-Micro must be PATH=URL: $Mapping"
    }
    $parts = $Mapping.Split("=", 2)
    $path = $parts[0]
    $target = $parts[1]
    Assert-HttpUrl "micro target for $path" $target
    $normalizedPath = Normalize-MicroPath $path
    $microProxyItems += "$normalizedPath=$target"
}
$microProxyMap = $microProxyItems -join ","

docker version | Out-Null

$existing = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
if ($existing) {
    Fail "container $ContainerName already exists; reuse it, choose another -ContainerName, or explicitly stop the owned container before restarting"
}

if ($Image -eq "auto") {
    $Image = Select-DefaultImage
}

if ($ListenPort -eq "auto") {
    $ListenPort = [string](Find-AvailablePort 18080)
}
elseif ($ListenPort -notmatch '^[0-9]+$') {
    Fail "-ListenPort must be numeric or auto: $ListenPort"
}
elseif (Test-PortInUse ([int]$ListenPort)) {
    Fail "listen port $ListenPort is already in use"
}

$dockerArgs = @(
    "run",
    "--rm",
    "-d",
    "--name", $ContainerName,
    "--label", "dev.tidestack.launcher=local-debugging",
    "-p", "${ListenPort}:80",
    "--add-host=host.docker.internal:host-gateway",
    "-e", "BACKEND_URL=$BackendUrl"
)

if ($microProxyMap) {
    $dockerArgs += @("-e", "MICRO_PROXY_MAP=$microProxyMap")
}

if ($DeployWebRoot) {
    if (-not (Test-Path -LiteralPath $DeployWebRoot -PathType Container)) {
        Fail "-DeployWebRoot does not exist or is not a directory: $DeployWebRoot"
    }
    $resolvedDeployWebRoot = (Resolve-Path -LiteralPath $DeployWebRoot).Path
    $dockerArgs += @("-v", "${resolvedDeployWebRoot}:/app/deploy/web:ro")
}

$dockerArgs += $Image

docker @dockerArgs | Out-Null

Write-Output "Started $ContainerName"
Write-Output "Web URL: http://localhost:$ListenPort"
Write-Output "Backend URL: $BackendUrl"
Write-Output "Image: $Image"
if ($microProxyMap) {
    Write-Output "Micro proxy map: $microProxyMap"
}
