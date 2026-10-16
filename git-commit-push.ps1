[CmdletBinding()]
param(
    [Parameter(Position = 0, Mandatory = $false)]
    [string]$Mensaje = ""
)

$ErrorActionPreference = "Stop"

$gitCheck = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0 -or $gitCheck -ne "true") {
    Write-Host "[ERROR] El directorio actual no es un repositorio Git valido." -ForegroundColor Red
    exit 1
}

$cambios = git status --porcelain
if (-not $cambios) {
    Write-Host "[INFO] No se detectaron cambios modificados o nuevos para commitear." -ForegroundColor Yellow
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Mensaje)) {
    $Mensaje = Read-Host "Ingresa el mensaje para el commit"
}

if ([string]::IsNullOrWhiteSpace($Mensaje)) {
    Write-Host "[ERROR] El mensaje del commit no puede estar vacio." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "`n[1/3] Preparando cambios (git add -A)..." -ForegroundColor Cyan
    git add -A
    if ($LASTEXITCODE -ne 0) { throw "Fallo al ejecutar 'git add -A'" }

    Write-Host "[2/3] Generando commit: '$Mensaje'..." -ForegroundColor Cyan
    git commit -m "$Mensaje"
    if ($LASTEXITCODE -ne 0) { throw "Fallo al crear el commit" }

    $currentBranch = (git branch --show-current).Trim()
    if (-not $currentBranch) {
        $currentBranch = "main"
    }

    Write-Host "[3/3] Subiendo cambios a origin/$currentBranch..." -ForegroundColor Cyan
    git push origin $currentBranch
    if ($LASTEXITCODE -ne 0) { throw "Fallo al ejecutar 'git push'" }

    Write-Host "`n=================================================" -ForegroundColor Green
    Write-Host " [PASS] Commit y push completados exitosamente   " -ForegroundColor Green
    Write-Host " Rama: $currentBranch                           " -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
}
catch {
    Write-Host "`n[ERROR] Ocurrio un error en el pipeline de Git: $_" -ForegroundColor Red
    exit 1
}