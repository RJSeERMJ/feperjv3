@echo off
echo ========================================
echo    DEPLOY FEPERJ WEB - VERCEL
echo ========================================
echo.

echo 1. Limpando cache e node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 2. Instalando dependencias...
npm install --legacy-peer-deps

echo.
echo 3. Testando build...
npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Build falhou! Verifique os erros acima.
    pause
    exit /b 1
)

echo.
echo 4. Build realizado com sucesso!
echo.
echo 5. Para fazer deploy no Vercel:
echo    - Opcao 1: Acesse vercel.com e conecte seu GitHub
echo    - Opcao 2: Execute: npm install -g vercel && vercel
echo.
echo ========================================
echo    DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
pause
