#!/bin/bash

echo "========================================"
echo "   Sistema FEPERJ Web - Instalação"
echo "========================================"
echo

echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Por favor, instale o Node.js em: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js encontrado"

echo
echo "[2/4] Instalando dependências..."
if ! npm install; then
    echo "ERRO: Falha ao instalar dependências!"
    exit 1
fi
echo "✓ Dependências instaladas"

echo
echo "[3/4] Configurando Firebase..."
echo "IMPORTANTE: Você precisará das credenciais do Firebase"
echo "Se ainda não tem um projeto Firebase, crie um em:"
echo "https://console.firebase.google.com"
echo
if ! npm run setup; then
    echo "ERRO: Falha na configuração do Firebase!"
    exit 1
fi
echo "✓ Firebase configurado"

echo
echo "[4/4] Iniciando o sistema..."
echo
echo "========================================"
echo "   Sistema iniciado com sucesso!"
echo "========================================"
echo
echo "URL: http://localhost:3000"
echo
echo "Credenciais de Administrador:"
echo "Login: 15119236790"
echo "Senha: 49912170"
echo
echo "Pressione Ctrl+C para parar o servidor"
echo

npm start
