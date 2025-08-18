const { execSync } = require('child_process');

console.log('🚀 Iniciando build para Vercel...');

try {
  // Instalar dependências
  console.log('📦 Instalando dependências...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Configurar variáveis de ambiente
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  
  // Executar build
  console.log('🔨 Executando build...');
  execSync('npx react-scripts build', { stdio: 'inherit' });
  
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}
