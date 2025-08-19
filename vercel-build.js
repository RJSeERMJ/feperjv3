const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando build para Vercel...');
console.log('📁 Diretório atual:', process.cwd());

try {
  // Verificar se o package.json existe
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json não encontrado');
  }

  // Configurar variáveis de ambiente
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.NODE_ENV = 'production';
  
  // Executar build diretamente (o Vercel já instala as dependências)
  console.log('🔨 Executando build...');
  execSync('npx react-scripts build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      GENERATE_SOURCEMAP: 'false',
      SKIP_PREFLIGHT_CHECK: 'true',
      NODE_ENV: 'production'
    },
    timeout: 600000 // 10 minutos de timeout
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
