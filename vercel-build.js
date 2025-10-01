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
  execSync('npm install --legacy-peer-deps --no-optional --force', { stdio: 'inherit' });

  // 2. Configurar variáveis de ambiente para build
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.NODE_ENV = 'production';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';

  // 3. Verificar dependências críticas
  console.log('🔍 Verificando dependências críticas...');
  
  // Verificar html2canvas
  try {
    require.resolve('html2canvas');
    console.log('✅ html2canvas encontrado');
  } catch (error) {
    console.log('⚠️ html2canvas não encontrado, instalando...');
    execSync('npm install html2canvas@^1.4.1 --legacy-peer-deps', { stdio: 'inherit' });
  }
  
  // Verificar canvg
  try {
    require.resolve('canvg');
    console.log('✅ canvg encontrado');
  } catch (error) {
    console.log('⚠️ canvg não encontrado, instalando...');
    execSync('npm install canvg@^4.0.1 --legacy-peer-deps', { stdio: 'inherit' });
  }

  // 4. Executar build
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
