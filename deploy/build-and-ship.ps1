#requires -Version 5
<#
.SYNOPSIS
    Build the Tadbir Budget frontend locally, package it, and ship it to the VM
    into a per-version folder. Run on your Windows machine.

.DESCRIPTION
    The version is read from ./version (next to this script), like the backend
    reads it from the POM. The deliverable is uploaded to:

        <RemoteBase>/<version>/tadbir-budget-frontend-<version>.tar.gz

    so each version lands in its own folder — easy to keep, distinguish, or roll
    back. scp prompts for the server password.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\build-and-ship.ps1
#>
[CmdletBinding()]
param(
    [string]$VmUser     = "root",
    [string]$VmHost     = "192.168.1.203",
    [string]$RemoteBase = "/opt/tadbir-budget-frontend"
)

$ErrorActionPreference = "Stop"
$DeployDir = $PSScriptRoot
$RepoRoot  = Split-Path $DeployDir -Parent

# -- Version (from deploy/version, like the backend's POM) ----------------------
$versionFile = Join-Path $DeployDir "version"
if (-not (Test-Path $versionFile)) { throw "version file not found: $versionFile" }
$Version = ((Get-Content -Raw -LiteralPath $versionFile) -replace '\s', '')
if ([string]::IsNullOrWhiteSpace($Version)) { throw "version file is empty" }
Write-Host "Version: $Version" -ForegroundColor Cyan

# -- Build (at the repo root) ---------------------------------------------------
Set-Location $RepoRoot
Write-Host "> [1/4] npm ci ..."
& npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

# 'build' is production by default (angular.json defaultConfiguration).
Write-Host "> [2/4] Building Angular (production) ..."
& npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

$browser = Join-Path $RepoRoot "dist\tadbir-budget\browser"
if (-not (Test-Path $browser)) { throw "build output not found: $browser" }

# -- Package deploy/release -----------------------------------------------------
Write-Host "> [3/4] Packaging the deliverable ..."
$release = Join-Path $DeployDir "release"
$tarName = "tadbir-budget-frontend-$Version.tar.gz"
$tarball = Join-Path $DeployDir $tarName
if (Test-Path $release) { Remove-Item $release -Recurse -Force }
if (Test-Path $tarball) { Remove-Item $tarball -Force }
New-Item -ItemType Directory -Path $release | Out-Null

Copy-Item $browser (Join-Path $release "browser") -Recurse

# Copy the shell/conf files forcing LF endings so they run on the Linux VM.
$utf8 = New-Object System.Text.UTF8Encoding $false
function Copy-TextLf([string]$Src, [string]$Dst) {
    $text = (Get-Content -Raw -LiteralPath $Src) -replace "`r`n", "`n"
    [IO.File]::WriteAllText($Dst, $text, $utf8)
}
Copy-TextLf (Join-Path $DeployDir "nginx.conf") (Join-Path $release "nginx.conf")
Copy-TextLf (Join-Path $DeployDir "Dockerfile") (Join-Path $release "Dockerfile")
Copy-TextLf (Join-Path $DeployDir "deploy.sh")  (Join-Path $release "deploy.sh")
# Stamp the version so deploy.sh tags the image with it.
[IO.File]::WriteAllText((Join-Path $release "VERSION"), $Version, $utf8)

# Windows 10+ ships tar.exe (bsdtar). Pack the CONTENTS of release/ (no wrapper).
& tar -czf $tarball -C $release "."
if ($LASTEXITCODE -ne 0) { throw "tar failed" }

# -- Ship into a per-version folder on the VM ----------------------------------
$remoteDir = "$RemoteBase/$Version"
Write-Host "> [4/4] Shipping to ${VmUser}@${VmHost}:$remoteDir (enter the server password when prompted) ..."
& ssh "$VmUser@$VmHost" "mkdir -p '$remoteDir'"
if ($LASTEXITCODE -ne 0) { throw "ssh mkdir failed" }
& scp $tarball "${VmUser}@${VmHost}:$remoteDir/"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

Write-Host ""
Write-Host "OK  Uploaded -> ${VmUser}@${VmHost}:$remoteDir/$tarName" -ForegroundColor Green
Write-Host "    Deploy on the VM:"
Write-Host "      ssh $VmUser@$VmHost"
Write-Host "      cd $remoteDir && tar -xzf $tarName && bash deploy.sh"
