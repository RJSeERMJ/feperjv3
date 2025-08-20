const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Vercel...');
console.log('📁 Diretório atual:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('🌍 Platform:', process.platform);

try {
  // Verificar se o package.json existe
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json não encontrado');
  }

  // Verificar variáveis de ambiente
  console.log('🔍 Verificando variáveis de ambiente...');
  console.log('CI:', process.env.CI);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);

  // Limpar cache do npm
  console.log('🧹 Limpando cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ Erro ao limpar cache (ignorado):', e.message);
  }

  // Remover node_modules se existir (apenas no Windows)
  if (fs.existsSync('node_modules') && process.platform === 'win32') {
    console.log('🗑️ Removendo node_modules...');
    try {
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
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
  
  console.log('⚙️ Variáveis de ambiente configuradas:');
  console.log('CI:', process.env.CI);
  console.log('GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);
  console.log('SKIP_PREFLIGHT_CHECK:', process.env.SKIP_PREFLIGHT_CHECK);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
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
  
  // Verificar se o index.html foi criado
  if (fs.existsSync('build/index.html')) {
    console.log('✅ index.html encontrado');
    const indexContent = fs.readFileSync('build/index.html', 'utf8');
    console.log('📄 Tamanho do index.html:', indexContent.length, 'caracteres');
  } else {
    console.warn('⚠️ index.html não encontrado na pasta build');
  }
  
  // Verificar se os arquivos estáticos foram criados
  if (fs.existsSync('build/static')) {
    console.log('✅ Pasta static encontrada');
    const staticContent = fs.readdirSync('build/static');
    console.log('📁 Conteúdo da pasta static:', staticContent);
  } else {
    console.warn('⚠️ Pasta static não encontrada');
  }
  
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  console.error('🔍 Stack trace:', error.stack);
  process.exit(1);
}
