@echo off
echo ========================================
echo    DEPLOY AUTOMATICO - VERCEL
echo ========================================
echo.

echo 1. Testando build local...
npm run vercel-build

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Build local falhou! Corrija os problemas antes de continuar.
    pause
    exit /b 1
)

echo.
echo 2. Build local OK! Agora faca o deploy:
echo.
echo    Opcao 1 - GitHub + Vercel:
echo    1. Faca commit das alteracoes no GitHub
echo    2. Acesse vercel.com
echo    3. Conecte sua conta GitHub
echo    4. Importe o repositorio
echo.
echo    Opcao 2 - CLI do Vercel:
echo    npm install -g vercel
echo    vercel login
echo    vercel --prod
echo.
echo ========================================
echo    DEPLOY PRONTO PARA EXECUTAR!
echo ========================================
pause
