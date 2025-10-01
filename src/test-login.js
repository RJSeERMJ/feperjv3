// Teste simples para verificar se o React está funcionando
console.log('🔍 Teste de renderização iniciado...');

// Verificar se o DOM está carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado');
    testReactRendering();
  });
} else {
  console.log('✅ DOM já carregado');
  testReactRendering();
}

function testReactRendering() {
  console.log('🔍 Verificando elementos do React...');
  
  // Verificar se o root existe
  const root = document.getElementById('root');
  if (root) {
    console.log('✅ Elemento root encontrado');
    console.log('📊 Conteúdo do root:', root.innerHTML);
  } else {
    console.error('❌ Elemento root não encontrado');
  }
  
  // Verificar se há erros no console
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 Erro capturado:', args);
    originalError.apply(console, args);
  };
  
  console.log('🔍 Teste concluído');
}
