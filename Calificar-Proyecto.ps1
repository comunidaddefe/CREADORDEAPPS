# ======================================================
# AUDITORIA Y CALIFICACION UNIVERSAL DE PROYECTOS (POLYGLOT)
# ======================================================

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$TargetDir = ""
)

if (-not $TargetDir -or -not (Test-Path $TargetDir)) {
    if ($PSScriptRoot -and (Test-Path -LiteralPath $PSScriptRoot)) {
        $TargetDir = (Resolve-Path $PSScriptRoot).Path
    } else {
        $TargetDir = (Get-Location).Path
    }
}

Push-Location -LiteralPath $TargetDir
try {
    $Score = 0
    $MaxScore = 100

    # Detección de Stack tecnológico
    $slnFiles    = @(Get-ChildItem -LiteralPath $TargetDir -Filter "*.sln" -File -Recurse -Depth 2 -ErrorAction SilentlyContinue)
    $csprojFiles = @(Get-ChildItem -LiteralPath $TargetDir -Filter "*.csproj" -File -Recurse -Depth 3 -ErrorAction SilentlyContinue)
    $hasCargo    = Test-Path (Join-Path $TargetDir "Cargo.toml")
    $hasPackage  = Test-Path (Join-Path $TargetDir "package.json")
    $hasPython   = (Test-Path (Join-Path $TargetDir "requirements.txt")) -or (Test-Path (Join-Path $TargetDir "main.py")) -or (Test-Path (Join-Path $TargetDir "pyproject.toml"))
    $hasGo       = (Test-Path (Join-Path $TargetDir "go.mod")) -or (Get-ChildItem -LiteralPath $TargetDir -Filter "*.go" -File -Recurse -Depth 2 -ErrorAction SilentlyContinue).Count -gt 0

    $stack = "Generico"
    if ($slnFiles.Count -gt 0 -or $csprojFiles.Count -gt 0) {
        $stack = "DotNet"
    } elseif ($hasGo) {
        $stack = "Go"
    } elseif ($hasPython) {
        $stack = "Python"
    } elseif ($hasCargo) {
        $stack = "Rust"
    } elseif ($hasPackage) {
        $stack = "Node"
    }

    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "   AUDITORIA DE SALUD DE PROYECTO               " -ForegroundColor Yellow
    Write-Host "   Stack Detectado: $stack                       " -ForegroundColor DarkGray
    Write-Host "=================================================`n" -ForegroundColor Cyan

    # --- Verificación de Entorno Base ---
    Write-Host "[ENTORNO] Verificando herramientas base..." -ForegroundColor Yellow

    switch ($stack) {
        "DotNet" {
            if (Get-Command dotnet -ErrorAction SilentlyContinue) {
                $dotnetVersion = & dotnet --version
                Write-Host "  [+] .NET SDK instalado: $dotnetVersion" -ForegroundColor Green
                $Score += 25
            } else {
                Write-Host "  [-] .NET SDK NO detectado en el sistema" -ForegroundColor Red
            }
        }
        "Go" {
            if (Get-Command go -ErrorAction SilentlyContinue) {
                $goVersion = & go version
                Write-Host "  [+] Go instalado: $goVersion" -ForegroundColor Green
                $Score += 25
            } else {
                Write-Host "  [-] Go NO detectado en el sistema" -ForegroundColor Red
            }
        }
        "Node" {
            if (Get-Command node -ErrorAction SilentlyContinue) {
                $nodeVersion = & node --version
                Write-Host "  [+] Node instalado: $nodeVersion" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] Node NO detectado en el sistema" -ForegroundColor Red
            }
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                Write-Host "  [+] npm instalado" -ForegroundColor Green
                $Score += 10
            } else {
                Write-Host "  [-] npm NO detectado" -ForegroundColor Red
            }
        }
        "Rust" {
            if (Get-Command rustc -ErrorAction SilentlyContinue) {
                $rustVersion = & rustc --version
                Write-Host "  [+] Rust instalado: $rustVersion" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] Rust NO detectado en el sistema" -ForegroundColor Red
            }
            if (Get-Command cargo -ErrorAction SilentlyContinue) {
                Write-Host "  [+] Cargo instalado" -ForegroundColor Green
                $Score += 10
            } else {
                Write-Host "  [-] Cargo NO detectado" -ForegroundColor Red
            }
        }
        "Python" {
            $pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { $null }
            if ($pyCmd) {
                $pyVersion = & $pyCmd --version 2>&1
                Write-Host "  [+] Python instalado: $pyVersion" -ForegroundColor Green
                $Score += 25
            } else {
                Write-Host "  [-] Python NO detectado en el sistema" -ForegroundColor Red
            }
        }
        default {
            Write-Host "  [!] Stack '$stack' no cuenta con verificador de binarios especifico" -ForegroundColor DarkGray
            $Score += 10
        }
    }

    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Host "  [+] Git instalado" -ForegroundColor Green
        $Score += 5
    } else {
        Write-Host "  [-] Git NO detectado" -ForegroundColor DarkGray
    }

    # 2. Estructura del Proyecto (30 Puntos)
    Write-Host ""
    Write-Host "[2/3] Verificando Estructura de Archivos..." -ForegroundColor Yellow

    switch ($stack) {
        "DotNet" {
            if ($slnFiles.Count -gt 0 -or $csprojFiles.Count -gt 0) {
                Write-Host "  [+] Archivo .sln o .csproj presente ($($slnFiles.Count) sln, $($csprojFiles.Count) csproj)" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] No se encontraron archivos .sln ni .csproj" -ForegroundColor Red
            }
            if ((Test-Path "src") -or (Test-Path "Program.cs") -or (Get-ChildItem -LiteralPath $TargetDir -Filter "Program.cs" -File -Recurse -Depth 3 -ErrorAction SilentlyContinue).Count -gt 0) {
                Write-Host "  [+] Estructura estandar (src/ o Program.cs) detectada" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] No se detecto punto de entrada Program.cs ni carpeta src/" -ForegroundColor Red
            }
        }
        "Go" {
            if (Test-Path "go.mod") {
                Write-Host "  [+] go.mod presente" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] go.mod no encontrado en: $TargetDir" -ForegroundColor Red
            }
            if ((Test-Path "internal") -or (Test-Path "cmd")) {
                Write-Host "  [+] Estructura estandar (internal/ o cmd/) detectada" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] No se detectaron carpetas canonicas internal/ o cmd/" -ForegroundColor Red
            }
        }
        "Node" {
            if (Test-Path "package.json") {
                Write-Host "  [+] package.json presente" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] package.json no encontrado" -ForegroundColor Red
            }
            if (Test-Path "src") {
                Write-Host "  [+] Directorio src/ presente" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] Directorio src/ no encontrado" -ForegroundColor Red
            }
        }
        "Rust" {
            if (Test-Path "Cargo.toml") {
                Write-Host "  [+] Cargo.toml presente" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] Cargo.toml no encontrado en: $TargetDir" -ForegroundColor Red
            }
            if (Test-Path "src/main.rs") {
                Write-Host "  [+] Punto de entrada src/main.rs encontrado" -ForegroundColor Green
                $Score += 15
            } elseif (Test-Path "src") {
                Write-Host "  [+] Carpeta src/ presente pero falta main.rs" -ForegroundColor Yellow
                $Score += 5
            } else {
                Write-Host "  [-] Carpeta /src no encontrada" -ForegroundColor Red
            }
        }
        "Python" {
            if ((Test-Path "requirements.txt") -or (Test-Path "pyproject.toml")) {
                Write-Host "  [+] Manifiesto de dependencias (requirements.txt / pyproject.toml) presente" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] No se encontro requirements.txt ni pyproject.toml" -ForegroundColor Red
            }
            if ((Test-Path "main.py") -or (Test-Path "app.py") -or (Test-Path "src")) {
                Write-Host "  [+] Estructura base (main.py, app.py o src/) detectada" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] No se detecto main.py, app.py ni carpeta src/" -ForegroundColor Red
            }
        }
        default {
            Write-Host "  [!] Evaluando estructura generica..." -ForegroundColor DarkGray
            $Score += 15
        }
    }

    # 3. Compilación y Código (40 Puntos)
    Write-Host ""
    Write-Host "[3/3] Evaluando Estado del Codigo y Compilacion..." -ForegroundColor Yellow

    switch ($stack) {
        "DotNet" {
            Write-Host "  [*] Ejecutando 'dotnet build'..." -ForegroundColor Gray
            $buildProcess = Start-Process dotnet -ArgumentList "build" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($buildProcess -and $buildProcess.ExitCode -eq 0) {
                Write-Host "  [+] Compilacion dotnet build superada exitosamente" -ForegroundColor Green
                $Score += 25
            } else {
                Write-Host "  [-] Fallo al compilar el proyecto .NET" -ForegroundColor Red
            }

            Write-Host "  [*] Verificando suite de pruebas con 'dotnet test'..." -ForegroundColor Gray
            $testProcess = Start-Process dotnet -ArgumentList "test --no-build" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($testProcess -and $testProcess.ExitCode -eq 0) {
                Write-Host "  [+] Suite de pruebas .NET superada exitosamente" -ForegroundColor Green
                $Score += 15
            } else {
                $hasBinaries = (Get-ChildItem -LiteralPath $TargetDir -Filter "*.dll" -File -Recurse -Depth 4 -ErrorAction SilentlyContinue).Count -gt 0
                if ($hasBinaries) {
                    Write-Host "  [+] Ensamblados binarios (.dll) generados en /bin u /obj" -ForegroundColor Green
                    $Score += 10
                } else {
                    Write-Host "  [-] Pruebas no acreditadas o binarios ausentes" -ForegroundColor DarkGray
                }
            }
        }
        "Go" {
            Write-Host "  [*] Ejecutando 'go vet ./...' (Analisis estatico)..." -ForegroundColor Gray
            $vetProcess = Start-Process go -ArgumentList "vet ./..." -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($vetProcess -and $vetProcess.ExitCode -eq 0) {
                Write-Host "  [+] Analisis go vet superado exitosamente" -ForegroundColor Green
                $Score += 20
            } else {
                Write-Host "  [-] go vet detecto anomalias o fallos sintacticos" -ForegroundColor Red
            }

            Write-Host "  [*] Verificando compilabilidad con 'go build ./...'..." -ForegroundColor Gray
            $buildProcess = Start-Process go -ArgumentList "build ./..." -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($buildProcess -and $buildProcess.ExitCode -eq 0) {
                Write-Host "  [+] El proyecto compila sin errores" -ForegroundColor Green
                $Score += 20
            } else {
                Write-Host "  [-] Fallo al compilar paquetes Go" -ForegroundColor Red
            }
        }
        "Node" {
            Write-Host "  [*] Presuponiendo dependencias instaladas (omitiendo npm ci)..." -ForegroundColor DarkGray
            $npmCmd = if ($IsWindows -or $env:OS -match "Windows") { "npm.cmd" } else { "npm" }

            # 1. Typecheck (15 Puntos)
            Write-Host "  [*] Ejecutando 'npm run typecheck'..." -ForegroundColor Gray
            $tcProcess = Start-Process $npmCmd -ArgumentList "run typecheck" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($tcProcess -and $tcProcess.ExitCode -eq 0) {
                Write-Host "  [+] Verificacion de tipos exitosa (0 errores)" -ForegroundColor Green
                $Score += 15
            } else {
                Write-Host "  [-] Errores detectados en verificacion de tipos" -ForegroundColor Red
            }

            # 2. Tests (15 Puntos)
            Write-Host "  [*] Ejecutando suite de pruebas con 'npm test'..." -ForegroundColor Gray
            $testOutputFile = [System.IO.Path]::GetTempFileName()
            $testErrFile = [System.IO.Path]::GetTempFileName()
            $testProcess = Start-Process $npmCmd -ArgumentList "test" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $testOutputFile -RedirectStandardError $testErrFile -ErrorAction SilentlyContinue
            $testOutput = if (Test-Path $testOutputFile) { Get-Content $testOutputFile -Raw } else { "" }
            $testErr = if (Test-Path $testErrFile) { Get-Content $testErrFile -Raw } else { "" }
            Remove-Item $testOutputFile -ErrorAction SilentlyContinue
            Remove-Item $testErrFile -ErrorAction SilentlyContinue
            $testCombined = "$testOutput`n$testErr"

            Write-Host "--- Evidencia de Pruebas ---" -ForegroundColor DarkGray
            Write-Host $testCombined -ForegroundColor DarkGray
            Write-Host "----------------------------" -ForegroundColor DarkGray

            $testCountMatch = [regex]::Match($testCombined, "tests\s+(\d+)")
            $passCountMatch = [regex]::Match($testCombined, "pass\s+(\d+)")
            $failCountMatch = [regex]::Match($testCombined, "fail\s+(\d+)")

            $testsCount = if ($testCountMatch.Success) { [int]$testCountMatch.Groups[1].Value } else { 0 }
            $failCount = if ($failCountMatch.Success) { [int]$failCountMatch.Groups[1].Value } else { 0 }

            if ($testProcess -and $testProcess.ExitCode -eq 0 -and $testsCount -gt 0 -and $failCount -eq 0) {
                Write-Host "  [+] Suite de pruebas acreditada ($testsCount ejecutadas, 0 fallos)" -ForegroundColor Green
                $Score += 15
            } elseif ($testsCount -eq 0) {
                Write-Host "  [-] Suite de pruebas NO ACREDITADA: 0 pruebas ejecutadas" -ForegroundColor Red
                $MaxScore = [Math]::Min($MaxScore, 85) # Imposibilita calificar A+ (90+)
            } else {
                Write-Host "  [-] Fallo o errores en suite de pruebas (fail: $failCount)" -ForegroundColor Red
            }

            # 3. Compilación / Bundle de Producción (10 Puntos)
            Write-Host "  [*] Verificando build de produccion con 'npm run build'..." -ForegroundColor Gray
            $buildProcess = Start-Process $npmCmd -ArgumentList "run build" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($buildProcess -and $buildProcess.ExitCode -eq 0) {
                Write-Host "  [+] Build de produccion generado correctamente" -ForegroundColor Green
                $Score += 10
            } else {
                Write-Host "  [-] Fallo en compilacion del paquete de produccion" -ForegroundColor Red
            }
        }
        "Rust" {
            if (Test-Path "Cargo.toml") {
                Write-Host "  [*] Ejecutando 'cargo check' (Verificando sintaxis y tipos)..." -ForegroundColor Gray
                $checkProcess = Start-Process cargo -ArgumentList "check" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
                if ($checkProcess -and $checkProcess.ExitCode -eq 0) {
                    Write-Host "  [+] El proyecto compila perfectamente sin errores" -ForegroundColor Green
                    $Score += 25
                } else {
                    Write-Host "  [-] El codigo tiene errores de compilacion" -ForegroundColor Red
                }

                $binaries = Get-ChildItem -Path "target" -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue
                if ($binaries) {
                    Write-Host "  [+] Executable .exe compilado encontrado en /target" -ForegroundColor Green
                    $Score += 15
                } else {
                    Write-Host "  [-] No se ha generado ejecutable aun (Ejecuta 'cargo build')" -ForegroundColor DarkGray
                }
            } else {
                Write-Host "  [-] No se pudo probar la compilacion sin Cargo.toml" -ForegroundColor Red
            }
        }
        "Python" {
            $pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }
            Write-Host "  [*] Verificando sintaxis con compileall..." -ForegroundColor Gray
            $compileProcess = Start-Process $pyCmd -ArgumentList "-m compileall -q ." -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($compileProcess -and $compileProcess.ExitCode -eq 0) {
                Write-Host "  [+] Sintaxis Python verificada correctamente" -ForegroundColor Green
                $Score += 20
            } else {
                Write-Host "  [-] Errores sintacticos en scripts Python" -ForegroundColor Red
            }

            Write-Host "  [*] Ejecutando pruebas unitarias con unittest..." -ForegroundColor Gray
            $testProcess = Start-Process $pyCmd -ArgumentList "-m unittest discover -s . -p '*test*.py'" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($testProcess -and $testProcess.ExitCode -eq 0) {
                Write-Host "  [+] Pruebas unitarias de Python acreditadas" -ForegroundColor Green
                $Score += 20
            } else {
                Write-Host "  [-] Suite de pruebas unitarias no acreditada" -ForegroundColor DarkGray
            }
        }
        default {
            Write-Host "  [!] Stack generico: no hay paso de compilacion automatico definido" -ForegroundColor DarkGray
            $Score += 20
        }
    }

    # 4. Resultado y Diagnostico
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "            RESULTADO FINAL               " -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan

    if ($Score -ge 90) { 
        $Grade = "A+ (Proyecto Solido y Listo para Red/Pruebas)"; $Color = "Green" 
    } elseif ($Score -ge 75) { 
        $Grade = "A (Buen estado, compila correctamente)"; $Color = "Green" 
    } elseif ($Score -ge 60) { 
        $Grade = "B (En desarrollo, faltan binarios o dependencias)"; $Color = "Yellow" 
    } elseif ($Score -ge 40) { 
        $Grade = "C (Estructura inicial, falta completar codigo)"; $Color = "Yellow" 
    } else { 
        $Grade = "F (Incompleto o entorno no preparado)"; $Color = "Red" 
    }

    Write-Host "Puntuacion de Salud: $Score / $MaxScore" -ForegroundColor $Color
    Write-Host "Calificacion del Proyecto: $Grade" -ForegroundColor $Color
    Write-Host ""
} finally {
    Pop-Location
}