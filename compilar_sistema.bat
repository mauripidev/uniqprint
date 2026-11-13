@echo off
title Uniqprint - Compilar para Producao
echo ===================================================
echo         Compilando Front-end e Back-end
echo ===================================================
echo.

echo 1. Instalando dependencias e compilando o Front-end...
cd /d "%~dp0frontend"
call npm install
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do Front-end.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Instalando dependencias e compilando o Back-end...
cd /d "%~dp0backend"
call npm install
call npm run prisma:generate
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do Back-end.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   Compilacao concluida com sucesso!
echo   Execute iniciar_sistema.bat para rodar o sistema.
echo ===================================================
pause

