@echo off
echo ========================================
echo    Sistema FEPERJ Web - Instalacao
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/4] Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas

echo.
echo [3/4] Configurando Firebase...
echo IMPORTANTE: Voce precisara das credenciais do Firebase
echo Se ainda nao tem um projeto Firebase, crie um em:
echo https://console.firebase.google.com
echo.
npm run setup
if %errorlevel% neq 0 (
    echo ERRO: Falha na configuracao do Firebase!
    pause
    exit /b 1
)
echo ✓ Firebase configurado

echo.
echo [4/4] Iniciando o sistema...
echo.
echo ========================================
echo    Sistema iniciado com sucesso!
echo ========================================
echo.
echo URL: http://localhost:3000
echo.
echo Credenciais de Administrador:
echo Login: 15119236790
echo Senha: 49912170
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm start
