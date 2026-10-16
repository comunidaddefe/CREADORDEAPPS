[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [switch]$FullClean
)

$ErrorActionPreference = "Stop"
$targetDir = $PSScriptRoot
if (-not $targetDir) { $targetDir = (Get-Location).Path }

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "   LIMPIEZA DE ARTEFACTOS Y ARCHIVOS RESIDUALES " -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan

$carpetasBasura = @(
    "dist",
    "dist-server",
    "dist-installer",
    "build",
    ".turbo",
    ".cache",
    "coverage"
)

if ($FullClean) {
    $carpetasBasura += "node_modules"
}

foreach ($folder in $carpetasBasura) {
    $fullPath = Join-Path $targetDir $folder
    if (Test-Path -LiteralPath $fullPath) {
        Write-Host "  [-] Eliminando carpeta: $folder..." -ForegroundColor DarkYellow
        Remove-Item -LiteralPath $fullPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Limpieza de archivos temporales sueltos
$extensionesBasura = @("*.tmp", "*.log", "*.bak", "Thumbs.db")
foreach ($patron in $extensionesBasura) {
    $archivos = Get-ChildItem -Path $targetDir -Filter $patron -File -Recurse -Depth 2 -ErrorAction SilentlyContinue
    foreach ($arch in $archivos) {
        Write-Host "  [-] Eliminando archivo residual: $($arch.Name)..." -ForegroundColor DarkGray
        Remove-Item -LiteralPath $arch.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n[PASS] Limpieza completada con exito." -ForegroundColor Green
if (-not $FullClean) {
    Write-Host "       (Nota: 'node_modules' se preservo. Usa .\clean.ps1 -FullClean para purga completa)." -ForegroundColor DarkGray
}
Write-Host "=================================================`n" -ForegroundColor Cyan