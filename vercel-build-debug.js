#!/usr/bin/env node

// Script de build de debug para Vercel
// Testa se o problema é com o build ou com a aplicação

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando build de debug para Vercel...');

try {
  // 1. Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Instalando dependências...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  }

  // 2. Configurar variáveis de ambiente para build
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.NODE_ENV = 'production';

  // 3. Criar backup do App.tsx original
  if (fs.existsSync('src/App.tsx')) {
    fs.copyFileSync('src/App.tsx', 'src/App-original.tsx');
    console.log('📋 Backup do App.tsx criado');
  }

  // 4. Usar App de debug temporariamente
  if (fs.existsSync('src/App-debug.tsx')) {
    fs.copyFileSync('src/App-debug.tsx', 'src/App.tsx');
    console.log('🔧 Usando App de debug');
  }

  // 5. Executar build
  console.log('🔨 Executando build de debug...');
  execSync('npm run build', { stdio: 'inherit' });

  // 6. Restaurar App original
  if (fs.existsSync('src/App-original.tsx')) {
    fs.copyFileSync('src/App-original.tsx', 'src/App.tsx');
    fs.unlinkSync('src/App-original.tsx');
    console.log('🔄 App original restaurado');
  }

  // 7. Verificar se build foi criado
  if (fs.existsSync('build')) {
    console.log('✅ Build de debug concluído com sucesso!');
    console.log('📁 Diretório build criado');
    
    // Verificar se index.html existe
    if (fs.existsSync('build/index.html')) {
      console.log('✅ index.html encontrado');
      
      // Verificar conteúdo do index.html
      const indexContent = fs.readFileSync('build/index.html', 'utf8');
      if (indexContent.includes('root')) {
        console.log('✅ div#root encontrado no index.html');
      } else {
        console.log('❌ div#root NÃO encontrado no index.html');
      }
    } else {
      console.log('❌ index.html NÃO encontrado');
    }
  } else {
    throw new Error('❌ Build falhou - diretório build não foi criado');
  }

} catch (error) {
  console.error('❌ Erro durante o build de debug:', error.message);
  process.exit(1);
}
