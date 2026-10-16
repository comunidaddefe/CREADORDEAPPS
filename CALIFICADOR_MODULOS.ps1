# ============================================================
# AUDITOR ESTATICO HEURISTICO DE ALTA CONFIABILIDAD
# MODO ESTRICTO DE ALTA CONFIABILIDAD Y REVISION LINEA POR LINEA
#
# Uso:
#   .\CALIFICADOR_MODULOS.ps1
#
# O:
#   .\CALIFICADOR_MODULOS.ps1 -Ruta "C:\Ruta\Proyecto"
#   .\CALIFICADOR_MODULOS.ps1 -ZeroTolerance
#   .\CALIFICADOR_MODULOS.ps1 -RevisarCodigo
#   .\CALIFICADOR_MODULOS.ps1 -ZeroTolerance -MinScore 95
#
# Resultado:
#   Calificacion numerica 0-100 por modulo
#   Promedio general del proyecto
#
# NO MODIFICA ARCHIVOS
# NO BORRA
# NO COMPILA
# NO INSTALA
# NO HACE COMMIT
# ============================================================

param(
    [string]$Ruta = (Get-Location).Path,
    [switch]$ZeroTolerance,
    [switch]$RevisarCodigo,
    [int]$MinScore = 90
)

$ErrorActionPreference = "Stop"

if ($ZeroTolerance) {
    $RevisarCodigo = $true
}

# ------------------------------------------------------------
# CONFIGURACION
# ------------------------------------------------------------

$ExtensionesCodigo = @(
    ".go",
    ".cs",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".java",
    ".kt",
    ".rs",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".php",
    ".swift",
    ".sol",
    ".sql",
    ".ps1"
)

$ExtensionesTest = @(
    "_test.go",
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".test.js",
    ".spec.js",
    "_test.py",
    "test_",
    "tests"
)

$ExcluirDirectorios = @(
    ".git",
    ".github",
    ".idea",
    ".vscode",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "coverage",
    ".next",
    ".cache",
    "bin",
    "obj",
    "tmp",
    "temp",
    "custom-code-editor",
    "mi-nuevo-editor",
    "BACKUP",
    "public"
)

# ------------------------------------------------------------
# FUNCIONES
# ------------------------------------------------------------

function Es-DirectorioExcluido {
    param([string]$Nombre)

    return $ExcluirDirectorios -contains $Nombre
}

function Es-ArchivoCodigo {
    param([System.IO.FileInfo]$Archivo)

    return $ExtensionesCodigo -contains $Archivo.Extension.ToLower()
}

function Es-Test {
    param([System.IO.FileInfo]$Archivo)

    $nombre = $Archivo.Name.ToLower()
    $ruta   = $Archivo.FullName.ToLower()

    foreach ($patron in $ExtensionesTest) {
        if ($nombre -like "*$patron*" -or $ruta -like "*\$patron\*") {
            return $true
        }
    }

    # Check by content for specific languages
    try {
        $content = Get-Content -LiteralPath $Archivo.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($Archivo.Extension -in @(".ts", ".tsx", ".js", ".jsx")) {
            if ($content -match '\b(describe|it|test)\s*\(') {
                return $true
            }
        } elseif ($Archivo.Extension -eq ".py") {
            if ($content -match '^\s*def\s+test_') {
                return $true
            }
        } elseif ($Archivo.Extension -eq ".go") {
            if ($Archivo.Name -like "*_test.go" -and $content -match '^\s*func\s+Test[A-Z_][a-zA-Z0-9_]*\s*\(') {
                return $true
            }
        }
    } catch {}

    return $false
}

function Obtener-PruebasRelacionadas {
    param(
        [object]$Modulo,
        [System.IO.FileInfo[]]$TodosLosTests
    )

    if ($null -eq $TodosLosTests -or $TodosLosTests.Count -eq 0) {
        return @()
    }

    $relacionados = [System.Collections.Generic.Dictionary[string, System.IO.FileInfo]]::new()
    $nombreModulo = $Modulo.Name.Trim().ToLowerInvariant().Replace('\', '/')

    foreach ($test in $TodosLosTests) {
        try {
            $contenido = [System.IO.File]::ReadAllText($test.FullName, [System.Text.Encoding]::UTF8)
            $contenidoNormalizado = $contenido.Replace('\', '/').ToLowerInvariant()

            $esRelacionadoSrc = ($nombreModulo -eq "src" -and (
                $contenidoNormalizado.Contains("../src/") -or
                $contenidoNormalizado.Contains("@/")
            ))

            $esRelacionadoEntrypoint = ($nombreModulo -eq "[raiz-entrypoints]" -and (
                $contenidoNormalizado.Contains("../server") -or
                $contenidoNormalizado.Contains("../electron")
            ))

            if ($esRelacionadoSrc -or $esRelacionadoEntrypoint) {
                $relacionados[$test.FullName] = $test
            }
        } catch {
            Write-Warning "Error leyendo archivo de test $($test.FullName): $_"
        }
    }

    return @($relacionados.Values)
}

function Contar-Lineas {
    param([System.IO.FileInfo[]]$Archivos)

    $total = 0

    foreach ($archivo in $Archivos) {
        try {
            $total += [System.IO.File]::ReadAllLines($archivo.FullName).Length
        }
        catch {}
    }
    return $total
}

function Buscar-DeudaTecnica {
    param([System.IO.FileInfo[]]$Archivos)

    $resultado = @{
        TODO        = 0
        FIXME       = 0
        HACK        = 0
        PANIC       = 0
        PLACEHOLDER = 0
        FLOAT       = 0
        BIND_ANY    = 0
        Hallazgos   = [System.Collections.Generic.List[PSCustomObject]]::new()
    }

    foreach ($archivo in $Archivos) {
        try {
            $lineas = [System.IO.File]::ReadAllLines($archivo.FullName)
            
            # Evitar falsos positivos en el motor de diagnóstico que inspecciona estas mismas palabras clave
            if ($archivo.Name -match "CALIFICADOR_MODULOS|radiografia_codigo|junta_medica|Calificar-Proyecto|auditar_todo|autopsia_integridad|Verificar-Errores|audit_arquitectura|audit_funcional|stress-test|indagar_govet|locate-ghost-files|build|ContableFix.iss|buscar_caracteres_raros") { continue }

            for ($num = 0; $num -lt $lineas.Length; $num++) {
                $linea = $lineas[$num]
                $lineaNum = $num + 1
                $esArchivoTest = Es-Test $archivo
                $esArchivoTelemetria = ($archivo.FullName -match '[\\/](health|observability|metrics|node)[\\/]')

                # Pánico en tiempo de ejecución prohibido (se exceptúan suites de test que provocan pánicos deliberados)
                if ($linea -match '(?i)\bpanic\s*\(' -and -not $esArchivoTest -and $linea -notmatch '^\s*//') {
                    $resultado.PANIC++
                    $resultado.Hallazgos.Add([PSCustomObject]@{
                        Archivo = $archivo.FullName
                        Linea   = $lineaNum
                        Tipo    = "PANIC (NASA PROHIBITED)"
                        Detalle = $linea.Trim()
                    })
                }
                # Stubs e implementaciones pendientes (se excluyen atributos HTML como placeholder="..." y tipos generados)
                $esStubReal = ($linea -match '(?i)(//|/\*|#|<!--).*placeholder' -or 
                               $linea -match '(?i)\b(NOT IMPLEMENTED|IMPLEMENT ME)\b') -and
                              ($linea -notmatch 'placeholder\s*=' -and $linea -notmatch 'replyPlaceholder')
                if ($esStubReal) {
                    $resultado.PLACEHOLDER++
                    $resultado.Hallazgos.Add([PSCustomObject]@{
                        Archivo = $archivo.FullName
                        Linea   = $lineaNum
                        Tipo    = "STUB / PLACEHOLDER"
                        Detalle = $linea.Trim()
                    })
                }
                # Punto flotante en kernel financiero (excluyendo tests, telemetría y CPU de observabilidad)
                if ($archivo.Extension -eq ".go" -and -not $esArchivoTest -and -not $esArchivoTelemetria -and $linea -match '\b(float32|float64)\b' -and $linea -notmatch '^\s*//') {
                    $resultado.FLOAT++
                    $resultado.Hallazgos.Add([PSCustomObject]@{
                        Archivo = $archivo.FullName
                        Linea   = $lineaNum
                        Tipo    = "FLOAT IN FINANCIAL KERNEL"
                        Detalle = $linea.Trim()
                    })
                }
                if ($linea -match '0\.0\.0\.0:\d+') {
                    $resultado.BIND_ANY++
                    $resultado.Hallazgos.Add([PSCustomObject]@{
                        Archivo = $archivo.FullName
                        Linea   = $lineaNum
                        Tipo    = "INSECURE BIND (0.0.0.0)"
                        Detalle = $linea.Trim()
                    })
                }
                if ($linea -match '(?i)\bTODO\b') {
                    $resultado.TODO++
                }
                if ($linea -match '(?i)\bFIXME\b') {
                    $resultado.FIXME++
                }
                if ($linea -match '(?i)\bHACK\b') {
                    $resultado.HACK++
                }
            }
        }
        catch {}
    }

    return $resultado
}

function Calificar-Modulo {
    param(
        [object]$Modulo,
        [System.IO.FileInfo[]]$TodosLosTestsGlobales = @()
    )

    $getArgs = @{
        LiteralPath = $Modulo.FullName
        File        = $true
        ErrorAction = "SilentlyContinue"
    }
    if (-not $Modulo.EsRaiz) {
        $getArgs["Recurse"] = $true
    }

    $archivos = Get-ChildItem @getArgs |
        Where-Object {
            $ruta = $_.FullName
            $excluir = $false
            foreach ($dir in $ExcluirDirectorios) {
                if ($ruta -match "[\\/]$([regex]::Escape($dir))[\\/]") {
                    $excluir = $true
                    break
                }
            }
            -not $excluir
        }

    $codigo = @(
        $archivos |
        Where-Object { Es-ArchivoCodigo $_ }
    )

    $tests = @(
        $codigo |
        Where-Object { Es-Test $_ }
    )

    $testsExternos = Obtener-PruebasRelacionadas -Modulo $Modulo -TodosLosTests $TodosLosTestsGlobales
    $totalTestsEfectivos = $tests.Count + $testsExternos.Count

    $vacios = @(
        $archivos |
        Where-Object { $_.Length -eq 0 }
    )

    $documentacion = @(
        $archivos |
        Where-Object {
            $_.Extension -in @(".md", ".txt", ".rst") -or
            $_.Name -match '(?i)README|ARCHITECTURE|TESTING|SECURITY|REQUIREMENTS'
        }
    )

    $lineas = Contar-Lineas $codigo
    $deuda = Buscar-DeudaTecnica $codigo
    $archivosGrandes = 0

    foreach ($archivo in $codigo) {
        try {
            $cantidad = [System.IO.File]::ReadAllLines($archivo.FullName).Length
            if ($cantidad -gt 800) {
                $archivosGrandes++
                if ($ZeroTolerance) {
                    $deuda.Hallazgos.Add([PSCustomObject]@{
                        Archivo = $archivo.FullName
                        Linea   = $cantidad
                        Tipo    = "OVERSIZED FILE (>800 lines)"
                        Detalle = "Archivo excede limite de contencion NASA/JPL ($cantidad lineas)"
                    })
                }
            }
        }
        catch {}
    }

    # ========================================================
    # PUNTUACION
    # ========================================================

    $score = 100
    $problemas = New-Object System.Collections.Generic.List[string]

    if ($Modulo.Name -ne "docs") { # Only penalize for missing code if it's not the docs module
        if ($codigo.Count -eq 0) {
            $score -= 50
            $problemas.Add("Sin archivos de codigo")
        }
    }

    if ($vacios.Count -gt 0) {
        $penalizacion = [Math]::Min(20, $vacios.Count * 4)
        $score -= $penalizacion
        $problemas.Add("$($vacios.Count) archivo(s) vacio(s)")
    }

    $esModuloSQL = ($Modulo.Name -in @("data", "database", "schemas")) -or ($codigo.Count -gt 0 -and ($codigo | Where-Object { $_.Extension -ne ".sql" }).Count -eq 0)
    $esModuloContratos = ($Modulo.Name -eq "contracts") # Assuming 'contracts' might be a module name for Solidity

    if ($codigo.Count -gt 0 -and -not $esModuloSQL -and -not $esModuloContratos) {
        if ($totalTestsEfectivos -eq 0) {
            $score -= 15
            $problemas.Add("Sin pruebas detectadas")
        }
        else {
            $ratioTest = $totalTestsEfectivos / $codigo.Count
            if ($ratioTest -lt 0.05) {
                $score -= 10
                $problemas.Add("Cobertura estructural de tests muy baja")
            }
            elseif ($ratioTest -lt 0.10) {
                $score -= 5
                $problemas.Add("Pocos archivos de pruebas")
            }
        }
    }

    # Penalizar por falta de documentación solo si no es el módulo 'docs' o si el módulo 'docs' está vacío
    if ($Modulo.Name -eq "docs") {
        if ($documentacion.Count -eq 0) {
            $score -= 50 # Mayor penalización si el módulo de docs no tiene docs
            $problemas.Add("Modulo de documentacion vacio")
        }
    } elseif ($documentacion.Count -eq 0) {
        $score -= 10 # Penalización menor si no es el módulo de docs
        $problemas.Add("Sin documentacion")
    }

    if ($deuda.TODO -gt 0) {
        $p = [Math]::Min(10, $deuda.TODO)
        $score -= $p
        $problemas.Add("$($deuda.TODO) TODO")
    }

    if ($deuda.FIXME -gt 0) {
        $p = [Math]::Min(15, $deuda.FIXME * 2)
        $score -= $p
        $problemas.Add("$($deuda.FIXME) FIXME")
    }

    if ($deuda.HACK -gt 0) {
        $p = [Math]::Min(10, $deuda.HACK * 2)
        $score -= $p
        $problemas.Add("$($deuda.HACK) HACK")
    }

    if ($deuda.PLACEHOLDER -gt 0) {
        $p = [Math]::Min(20, $deuda.PLACEHOLDER * 4)
        $score -= $p
        $problemas.Add("$($deuda.PLACEHOLDER) implementacion(es) pendiente(s)")
    }

    if ($archivosGrandes -gt 0) {
        $p = [Math]::Min(10, $archivosGrandes * 2)
        $score -= $p
        $problemas.Add("$archivosGrandes archivo(s) >800 lineas")
    }

    # ========================================================
    # POLITICA DE TOLERANCIA CERO
    # ========================================================
    $brechasCriticas = 0
    if ($ZeroTolerance) {
        if ($deuda.PANIC -gt 0) {
            $score -= ($deuda.PANIC * 25)
            $problemas.Add("CRITICO: $($deuda.PANIC) llamada(s) a panic() prohibidas")
            $brechasCriticas += $deuda.PANIC
        }
        if ($deuda.PLACEHOLDER -gt 0) {
            $score -= ($deuda.PLACEHOLDER * 15)
            $problemas.Add("CRITICO: stubs o implementaciones inconclusas")
            $brechasCriticas += $deuda.PLACEHOLDER
        }
        if ($deuda.BIND_ANY -gt 0) {
            $score -= ($deuda.BIND_ANY * 30)
            $problemas.Add("CRITICO: binding 0.0.0.0 no perimetral")
            $brechasCriticas += $deuda.BIND_ANY
        }
        if ($vacios.Count -gt 0) {
            $score -= 30
            $problemas.Add("CRITICO: archivos vacios (0 bytes)")
            $brechasCriticas += $vacios.Count
        }
        if ($codigo.Count -gt 0 -and -not $esModuloSQL -and -not $esModuloContratos -and $totalTestsEfectivos -eq 0 -and -not $Modulo.EsRaiz) {
            $score = [Math]::Min($score, 30)
            $problemas.Add("CRITICO: modulo en produccion sin suite de tests")
            $brechasCriticas++
        }
    }

    if ($score -gt 100) { $score = 100 }
    if ($score -lt 0) { $score = 0 }

    $estado = switch ($score) {
        { $_ -ge 90 } { "EXCELENTE"; break }
        { $_ -ge 80 } { "MUY BUENO"; break }
        { $_ -ge 70 } { "BUENO"; break }
        { $_ -ge 60 } { "ACEPTABLE"; break }
        { $_ -ge 50 } { "DEBIL"; break }
        { $_ -ge 30 } { "MALO"; break }
        default { "CRITICO" }
    }

    if ($problemas.Count -eq 0) {
        $detalle = "Sin problemas estructurales detectados"
    }
    else {
        $detalle = $problemas -join "; "
    }

    return [PSCustomObject]@{
        Modulo        = $Modulo.Name
        Calificacion  = [int]$score
        Estado        = $estado
        BrechasCriticas = $brechasCriticas
        Archivos      = $archivos.Count
        Codigo        = $codigo.Count
        Tests         = $totalTestsEfectivos
        Documentacion = $documentacion.Count
        LineasCodigo  = $lineas
        Vacios        = $vacios.Count
        TODO          = $deuda.TODO
        FIXME         = $deuda.FIXME
        HACK          = $deuda.HACK
        Pendientes    = $deuda.PLACEHOLDER
        Grandes       = $archivosGrandes
        Observaciones = $detalle
        Hallazgos     = $deuda.Hallazgos
    }
}

# ============================================================
# INICIO
# ============================================================

Clear-Host

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     AUDITOR NUMERICO DE MODULOS - SOLO LECTURA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proyecto: $Ruta" -ForegroundColor White
Write-Host ""

if (-not (Test-Path -LiteralPath $Ruta)) {
    Write-Host "ERROR: La ruta no existe." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# Buscar modulos y archivos raiz
# ------------------------------------------------------------

$modulos = [System.Collections.Generic.List[object]]::new()
$directorios = @(
    Get-ChildItem `
        -LiteralPath $Ruta `
        -Directory `
        -ErrorAction SilentlyContinue |
    Where-Object {
        -not (Es-DirectorioExcluido $_.Name)
    }
)

foreach ($dir in $directorios) {
    $modulos.Add([PSCustomObject]@{
        Name     = $dir.Name
        FullName = $dir.FullName
        EsRaiz   = $false
        Categoria = switch ($dir.Name) {
            "src"             { "Fuente" }
            "test"            { "Pruebas" }
            "reports"         { "Evidencia" }
            "dist-server"     { "ArtefactoServidor" }
            "dist-installer"  { "Instalador" }
            default           { "General" }
        }
    })
}

$archivosRaiz = @(
    Get-ChildItem -LiteralPath $Ruta -File -ErrorAction SilentlyContinue |
    Where-Object { Es-ArchivoCodigo $_ }
)

if ($archivosRaiz.Count -gt 0) {
    $modulos.Add([PSCustomObject]@{
        Name     = "[RAIZ-ENTRYPOINTS]"
        FullName = $Ruta
        EsRaiz   = $true
        Categoria = "Fuente"
    })
}

if ($modulos.Count -eq 0) {
    $modulos.Add((Get-Item -LiteralPath $Ruta))
}

$resultados = @()

# Recopilación de todos los tests del repositorio para trazabilidad inter-módulos
$todosLosTestsGlobales = @(
    Get-ChildItem -LiteralPath $Ruta -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $ruta = $_.FullName
        ($ruta -match '\\/[\\/]' -or (Es-Test $_)) -and (-not (Es-DirectorioExcluido $_.Directory.Name))
    }
)

foreach ($modulo in $modulos) {
    if ($modulo.Categoria -in @("Evidencia", "ArtefactoServidor", "Instalador")) {
        $estadoEspecial = switch ($modulo.Categoria) {
            "Evidencia"        { "PENDIENTE DE VALIDACION" }
            "ArtefactoServidor" { "BUILD NO CERTIFICADO" }
            "Instalador"       { "INSTALADOR NO CERTIFICADO" }
        }
        $resultados += [PSCustomObject]@{
            Modulo          = $modulo.Name
            Calificacion    = "N/A"
            Estado          = $estadoEspecial
            BrechasCriticas = 0
            Codigo          = 0
            Tests           = 0
            Vacios          = 0
            Observaciones   = "Excluido de evaluacion numerica por categoria $($modulo.Categoria)"
        }
        continue
    }
    Write-Host "Analizando: $($modulo.Name) [$($modulo.Categoria)]" -ForegroundColor DarkGray
    $resultado = Calificar-Modulo -Modulo $modulo -TodosLosTestsGlobales $todosLosTestsGlobales
    $resultados += $resultado
}

$totalBrechas = ($resultados | Measure-Object -Property BrechasCriticas -Sum).Sum
if ($null -eq $totalBrechas) { $totalBrechas = 0 }

# ============================================================
# RANKING
# ============================================================

$resultados = @(
    $resultados |
    Sort-Object Calificacion -Descending
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                    CALIFICACIONES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$columnas = @("Modulo", "Calificacion", "Estado", "Codigo", "Tests", "Vacios", "TODO", "FIXME", "Pendientes")
$resultados | Format-Table -Property $columnas -AutoSize

# ============================================================
# PROMEDIO GENERAL
# ============================================================

$evaluados = @($resultados | Where-Object { $_.Calificacion -ne "N/A" })
$promedio = [Math]::Round(
    (
        $evaluados |
        Measure-Object `
            -Property Calificacion `
            -Average
    ).Average,
    2
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CALIFICACION GENERAL DEL PROYECTO: " -NoNewline

if ($promedio -ge 90) {
    Write-Host "$promedio / 100" -ForegroundColor Green
}
elseif ($promedio -ge 70) {
    Write-Host "$promedio / 100" -ForegroundColor Yellow
}
elseif ($promedio -ge 50) {
    Write-Host "$promedio / 100" -ForegroundColor DarkYellow
}
else {
    Write-Host "$promedio / 100" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# DETALLE
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                 DETALLE POR MODULO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

foreach ($r in $resultados) {
    Write-Host ""
    Write-Host "[$($r.Calificacion)/100] $($r.Modulo)" -ForegroundColor White
    Write-Host "  Estado:        $($r.Estado)"
    Write-Host "  Codigo:        $($r.Codigo)"
    Write-Host "  Tests:         $($r.Tests)"
    Write-Host "  Lineas:        $($r.LineasCodigo)"
    Write-Host "  Docs:          $($r.Documentacion)"
    Write-Host "  Vacios:        $($r.Vacios)"
    Write-Host "  TODO:          $($r.TODO)"
    Write-Host "  FIXME:         $($r.FIXME)"
    Write-Host "  HACK:          $($r.HACK)"
    Write-Host "  Pendientes:    $($r.Pendientes)"
    Write-Host "  >800 lineas:   $($r.Grandes)"
    Write-Host "  Observaciones: $($r.Observaciones)"
}

if ($RevisarCodigo -or $ZeroTolerance) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   PERITAJE FORENSE DE CODIGO FUENTE (LINEA POR LINEA)      " -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    $todosHallazgos = [System.Collections.Generic.List[PSCustomObject]]::new()
    foreach ($r in $resultados) {
        if ($r.Hallazgos) {
            foreach ($h in $r.Hallazgos) {
                $rel = $h.Archivo.Replace($Ruta, "").TrimStart([char[]]@('\', '/'))
                $evidencia = $h.Detalle
                if ($evidencia.Length -gt 60) {
                    $evidencia = $evidencia.Substring(0, 57) + "..."
                }
                $todosHallazgos.Add([PSCustomObject]@{
                    Ubicacion  = "$($rel):$($h.Linea)"
                    Infraccion = $h.Tipo
                    Evidencia  = $evidencia
                })
            }
        }
    }

    if ($todosHallazgos.Count -eq 0) {
        Write-Host " [PASS] Cero transgresiones o stubs detectados en codigo fuente." -ForegroundColor Green
    } else {
        Write-Host " Se detectaron $($todosHallazgos.Count) transgresion(es) en codigo fuente:" -ForegroundColor Red
        Write-Host ""
        $todosHallazgos | Format-Table -AutoSize
    }
    Write-Host ""
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "AUDITORIA TERMINADA - NO SE MODIFICO NINGUN ARCHIVO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($ZeroTolerance) {
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "     DICTAMEN DE CERTIFICACION - TOLERANCIA CERO             " -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    $colorBrechas = if ($totalBrechas -eq 0) { "Green" } else { "Red" }
    $colorPromedio = if ($promedio -ge $MinScore) { "Green" } else { "Red" }
    Write-Host "  Brechas Criticas Totales: $totalBrechas" -ForegroundColor $colorBrechas
    Write-Host "  Umbral Minimo Requerido:  $MinScore / 100" -ForegroundColor White
    Write-Host "  Puntaje Obtenido:         $promedio / 100" -ForegroundColor $colorPromedio

    if ($totalBrechas -gt 0 -or $promedio -lt $MinScore) {
        Write-Host "`n[STATIC GATE REJECTED] El sistema no cumple los requisitos de Tolerancia Cero." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "`n[STATIC GATE PASSED] Certificacion aprobada al 100%." -ForegroundColor Green
        exit 0
    }
} else {
    exit 0
}
