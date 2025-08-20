import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas!');
  console.warn('Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações para upload de arquivos
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'feperj-2025',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB em bytes
  ALLOWED_EXTENSIONS: {
    'comprovante-residencia': ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    'foto-3x4': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    'certificado-adel': ['.pdf', '.png', '.jpg', '.jpeg']
  }
};

// Função para validar extensão do arquivo
export const validateFileExtension = (fileName: string, documentType: keyof typeof STORAGE_CONFIG.ALLOWED_EXTENSIONS): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return STORAGE_CONFIG.ALLOWED_EXTENSIONS[documentType].includes(extension);
};

// Função para validar tamanho do arquivo
export const validateFileSize = (fileSize: number): boolean => {
  return fileSize <= STORAGE_CONFIG.MAX_FILE_SIZE;
};

// Função para testar conectividade com Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testando conectividade com Supabase...');
    console.log('📡 URL:', supabaseUrl);
    console.log('🔑 Chave configurada:', supabaseAnonKey ? 'Sim' : 'Não');
    
    // Testar listagem de buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return false;
    }
    
    console.log('✅ Buckets encontrados:', buckets?.map(b => b.name));
    
    // Verificar se o bucket específico existe
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_CONFIG.BUCKET_NAME);
    console.log(`📦 Bucket '${STORAGE_CONFIG.BUCKET_NAME}' existe:`, bucketExists);
    
    return bucketExists;
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error);
    return false;
  }
};
