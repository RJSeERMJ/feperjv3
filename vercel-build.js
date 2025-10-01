#!/usr/bin/env node

// Script de build personalizado para Vercel
// Resolve problemas de dependências e configurações

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Vercel...');

try {
  // 1. Limpar cache e instalar dependências
  console.log('🧹 Limpando cache do npm...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache:', error.message);
  }

  console.log('📦 Instalando dependências...');
  execSync('npm install --legacy-peer-deps --no-optional', { stdio: 'inherit' });

  // 2. Configurar variáveis de ambiente para build
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.NODE_ENV = 'production';

  // 3. Executar build
  console.log('🔨 Executando build...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. Verificar se build foi criado
  if (fs.existsSync('build')) {
    console.log('✅ Build concluído com sucesso!');
    console.log('📁 Diretório build criado');
  } else {
    throw new Error('❌ Build falhou - diretório build não foi criado');
  }

} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
