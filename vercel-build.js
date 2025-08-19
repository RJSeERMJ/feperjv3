const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Vercel...');
console.log('📁 Diretório atual:', process.cwd());

try {
  // Verificar se o package.json existe
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json não encontrado');
  }

  // Limpar cache do npm
  console.log('🧹 Limpando cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ Erro ao limpar cache (ignorado):', e.message);
  }

  // Remover node_modules se existir
  if (fs.existsSync('node_modules')) {
    console.log('🗑️ Removendo node_modules...');
    try {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️ Erro ao remover node_modules (ignorado):', e.message);
    }
  }

  // Instalar dependências
  console.log('📦 Instalando dependências...');
  execSync('npm install --legacy-peer-deps --no-audit', { stdio: 'inherit' });
  
  // Configurar variáveis de ambiente
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.NODE_ENV = 'production';
  
  // Executar build
  console.log('🔨 Executando build...');
  execSync('npx react-scripts build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      GENERATE_SOURCEMAP: 'false',
      SKIP_PREFLIGHT_CHECK: 'true',
      NODE_ENV: 'production'
    }
  });
  
  // Verificar se o build foi criado
  if (!fs.existsSync('build')) {
    throw new Error('Pasta build não foi criada');
  }
  
  console.log('✅ Build concluído com sucesso!');
  console.log('📁 Conteúdo da pasta build:', fs.readdirSync('build'));
  
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  console.error('🔍 Stack trace:', error.stack);
  process.exit(1);
}
