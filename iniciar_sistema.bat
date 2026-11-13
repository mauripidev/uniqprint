@echo off
title Uniqprint - Servidor de Producao
echo ===================================================
echo     Iniciando Uniqprint em Producao (Rede Local)
echo ===================================================
echo.

cd /d "%~dp0backend"

echo Verificando e aplicando migracoes no banco de dados...
call npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao conectar ao banco de dados ou aplicar migracoes.
    echo Verifique se o servico do MySQL esta em execucao e o .env esta correto.
    pause
    exit /b %errorlevel%
)

echo.
echo Iniciando servidor Uniqprint...
call node dist/servidor.js

pause

