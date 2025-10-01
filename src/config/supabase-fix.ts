import { createClient } from '@supabase/supabase-js';

// Configuração temporária para resolver o erro de signature verification
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kamgocrdbdwjryvcavuo.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWdvY3JkYmR3anJ5dmNhdnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.placeholder';

// Verificar se a chave está válida
if (supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️ Chave do Supabase inválida detectada!');
  console.warn('📝 Configure REACT_APP_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações para upload de arquivos financeiros (bucket financeiro)
export const CONTABIL_CONFIG = {
  BUCKET_NAME: 'financeiro',
  FOLDER_NAME: 'documentos-contabeis',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB em bytes
  ALLOWED_EXTENSIONS: ['.pdf', '.csv'],
  ALLOWED_MIME_TYPES: ['application/pdf', 'text/csv', 'application/csv']
};

// Configurações para comprovantes de anuidade (bucket financeiro)
export const COMPROVANTES_CONFIG = {
  BUCKET_NAME: 'financeiro',
  FOLDER_NAME: 'comprovantes',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB em bytes
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg'],
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
};

// Configurações para upload de arquivos de atletas (bucket feperj-2025)
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'feperj-2025',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB em bytes
  ALLOWED_EXTENSIONS: {
    'comprovante-residencia': ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    'foto-3x4': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    'certificado-adel': ['.pdf', '.png', '.jpg', '.jpeg'],
    'matricula': ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp']
  }
};

// Configurações para modelos de carteirinhas (bucket feperj-2025)
export const MODELO_CARTEIRINHA_CONFIG = {
  BUCKET_NAME: 'feperj-2025',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB em bytes
  ALLOWED_EXTENSIONS: ['.pdf'],
  ALLOWED_MIME_TYPES: ['application/pdf']
};

// Função para testar conectividade com Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Tentar listar buckets para testar a conexão
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro na conexão com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    console.log('📦 Buckets disponíveis:', data?.map(b => b.name));
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão com Supabase:', error);
    return false;
  }
};

// Função para diagnosticar problemas de upload
export const diagnoseUploadIssue = async (bucketName: string): Promise<void> => {
  try {
    console.log(`🔍 Diagnosticando bucket: ${bucketName}`);
    
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.error(`❌ Bucket '${bucketName}' não encontrado!`);
      console.log('📦 Buckets disponíveis:', buckets?.map(b => b.name));
      return;
    }
    
    console.log(`✅ Bucket '${bucketName}' encontrado!`);
    
    // Tentar listar arquivos no bucket
    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error(`❌ Erro ao acessar bucket '${bucketName}':`, filesError);
    } else {
      console.log(`✅ Acesso ao bucket '${bucketName}' funcionando!`);
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
};
