@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   CreadorDeApps - Pipeline de Compilacion y Empaquetado
echo   Doctrina: ZERO TRUST ^| ZERO PATCHES ^| EVIDENCE FIRST
echo ====================================================================
echo.

:: Paso 1: Verificacion de entorno
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm no esta instalado o no se encuentra en el PATH.
    exit /b 1
)

:: Paso 2: Verificacion estricta de tipos (Evidence First)
echo [1/4] Ejecutando comprobacion de tipos (typecheck)...
call npm run typecheck
if %ERRORLEVEL% neq 0 (
    echo [ERROR] La comprobacion de tipos fallo. Abortando empaquetado.
    exit /b 1
)
echo      Tipos validados: 0 errores.
echo.

:: Paso 3: Compilacion del bundle de produccion
echo [2/4] Generando bundle de produccion (vite build)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo en la compilacion de Vite.
    exit /b 1
)
echo      Artefactos generados correctamente en dist\
echo.

:: Paso 4: Localizacion del compilador Inno Setup
echo [3/4] Localizando Inno Setup Compiler (ISCC.exe)...
set "ISCC_PATH="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not defined ISCC_PATH (
    where ISCC.exe >nul 2>&1 && set "ISCC_PATH=ISCC.exe"
)

if not defined ISCC_PATH (
    echo [ADVERTENCIA] ISCC.exe no fue encontrado.
    echo Instala Inno Setup 6 para generar el instalador automatico: https://jrsoftware.org/isdl.php
    echo El bundle en dist\ quedo listo para ejecucion directa con electron.
    exit /b 0
)

:: Paso 5: Generacion del instalador nativo
echo [4/4] Compilando instalador con Inno Setup...
"%ISCC_PATH%" "%~dp0installer.iss"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la creacion del instalador con Inno Setup.
    exit /b 1
)

echo.
echo ====================================================================
echo   COMPILACION Y EMPAQUETADO EXITOSO
echo   Instalador generado en: dist-installer\CreadorDeApps-Setup-1.0.0.exe
echo ====================================================================
exit /b 0