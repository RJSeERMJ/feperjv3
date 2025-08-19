// Utilitário para testar configuração do Google Drive
export const testGoogleDriveConfig = () => {
  console.log('🔍 Testando configuração do Google Drive...');
  
  const config = {
    apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
    clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
    folderId: process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID
  };

  console.log('📋 Configurações encontradas:');
  console.log('- API Key:', config.apiKey ? '✅ Configurada' : '❌ Não configurada');
  console.log('- Client ID:', config.clientId ? '✅ Configurada' : '❌ Não configurada');
  console.log('- Folder ID:', config.folderId ? '✅ Configurada' : '❌ Não configurada');

  if (!config.apiKey) {
    console.warn('⚠️  API Key não configurada (opcional, mas recomendada)');
  }

  if (!config.clientId) {
    console.error('❌ Client ID é obrigatório!');
    return false;
  }

  if (!config.folderId) {
    console.warn('⚠️  Folder ID não configurado (opcional)');
  }

  console.log('✅ Configuração básica OK');
  return true;
};

// Função para testar conexão com Google Drive
export const testGoogleDriveConnection = async () => {
  try {
    console.log('🔗 Testando conexão com Google Drive...');
    
    // Importar dinamicamente para evitar erros se não estiver configurado
    const { GoogleDriveService } = await import('../services/googleDriveService');
    
    const isConnected = await GoogleDriveService.testConnection();
    
    if (isConnected) {
      console.log('✅ Conexão com Google Drive estabelecida com sucesso!');
      return true;
    } else {
      console.error('❌ Falha na conexão com Google Drive');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
};

// Função para testar acesso à pasta
export const testFolderAccess = async () => {
  try {
    console.log('📁 Testando acesso à pasta do Google Drive...');
    
    const folderId = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.warn('⚠️  Folder ID não configurado');
      return false;
    }

    const { GoogleDriveService } = await import('../services/googleDriveService');
    
    // Tentar listar arquivos na pasta (mesmo que vazia)
    const files = await GoogleDriveService.listAtletaFiles('test');
    
    console.log('✅ Acesso à pasta OK');
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar pasta:', error);
    return false;
  }
};

// Teste completo
export const runFullTest = async () => {
  console.log('🚀 Iniciando teste completo do Google Drive...');
  console.log('=' .repeat(50));
  
  // Teste 1: Configuração
  const configOk = testGoogleDriveConfig();
  if (!configOk) {
    console.log('❌ Teste de configuração falhou');
    return false;
  }
  
  console.log('');
  
  // Teste 2: Conexão
  const connectionOk = await testGoogleDriveConnection();
  if (!connectionOk) {
    console.log('❌ Teste de conexão falhou');
    return false;
  }
  
  console.log('');
  
  // Teste 3: Acesso à pasta
  const folderOk = await testFolderAccess();
  if (!folderOk) {
    console.log('⚠️  Teste de pasta falhou (pode ser opcional)');
  }
  
  console.log('');
  console.log('=' .repeat(50));
  console.log('✅ Teste completo finalizado!');
  
  return connectionOk;
};
