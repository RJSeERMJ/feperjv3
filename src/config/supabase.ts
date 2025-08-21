import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kamgocrdbdwjryvcavuo.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ REACT_APP_SUPABASE_ANON_KEY não configurada!');
  console.warn('Configure REACT_APP_SUPABASE_ANON_KEY no arquivo .env');
  console.warn('URL do Supabase:', supabaseUrl);
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
    'certificado-adel': ['.pdf', '.png', '.jpg', '.jpeg']
  }
};

// Função para validar extensão do arquivo financeiro
export const validateContabilFileExtension = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return CONTABIL_CONFIG.ALLOWED_EXTENSIONS.includes(extension);
};

// Função para validar extensão do arquivo de atletas
export const validateFileExtension = (fileName: string, documentType: keyof typeof STORAGE_CONFIG.ALLOWED_EXTENSIONS): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return STORAGE_CONFIG.ALLOWED_EXTENSIONS[documentType].includes(extension);
};

// Função para validar tamanho do arquivo financeiro
export const validateContabilFileSize = (fileSize: number): boolean => {
  return fileSize <= CONTABIL_CONFIG.MAX_FILE_SIZE;
};

// Função para validar tamanho do arquivo de atletas
export const validateFileSize = (fileSize: number): boolean => {
  return fileSize <= STORAGE_CONFIG.MAX_FILE_SIZE;
};

// Função para testar conectividade com Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testando conectividade com Supabase...');
    console.log('📡 URL:', supabaseUrl);
    console.log('🔑 Chave configurada:', supabaseAnonKey ? 'Sim' : 'Não');
    
    // Testar acesso direto ao bucket financeiro (sem listar buckets que precisa de service_role)
    console.log('🔍 Testando acesso ao bucket financeiro...');
    
    try {
      // Tentar listar arquivos da pasta documentos para verificar acesso
      const { error: listError } = await supabase.storage
        .from(CONTABIL_CONFIG.BUCKET_NAME)
        .list('documentos', { limit: 1 });
      
      if (listError) {
        console.warn('⚠️ Erro ao acessar bucket financeiro:', listError);
        
        // Se o erro for de permissão ou bucket não encontrado
        if (listError.message.includes('not found') || listError.message.includes('permission')) {
          return {
            success: false,
            error: `Bucket "${CONTABIL_CONFIG.BUCKET_NAME}" não acessível. Verifique se existe e se as políticas SQL foram aplicadas.`,
            financeiroAccess: false
          };
        }
        
        return {
          success: false,
          error: `Erro ao acessar bucket: ${listError.message}`,
          financeiroAccess: false
        };
      } else {
        console.log('✅ Acesso ao bucket financeiro confirmado');
        return {
          success: true,
          message: 'Conectividade OK! Bucket financeiro acessível.',
          financeiroAccess: true
        };
      }
    } catch (accessError) {
      console.error('❌ Erro ao testar acesso ao bucket financeiro:', accessError);
      return {
        success: false,
        error: `Erro de conectividade: ${accessError instanceof Error ? accessError.message : 'Erro desconhecido'}`,
        financeiroAccess: false
      };
    }
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      financeiroAccess: false
    };
  }
};

// Função para autenticar no Supabase (necessário para acessar buckets)
export const authenticateSupabase = async () => {
  try {
    console.log('🔐 Autenticando no Supabase...');
    
    // Verificar se já está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.warn('⚠️ Erro ao verificar usuário:', userError);
    }
    
    if (user) {
      console.log('✅ Usuário já autenticado no Supabase');
      return true;
    }
    
    // Se não estiver autenticado, fazer login anônimo
    console.log('🔐 Fazendo login anônimo no Supabase...');
    const { error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('❌ Erro no login anônimo:', error);
      throw new Error(`Erro de autenticação: ${error.message}`);
    }
    
    console.log('✅ Autenticação anônima realizada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    throw error;
  }
};

// Função para verificar e criar bucket se necessário
export const ensureBucketCreated = async () => {
  try {
    console.log('🔍 Verificando se o bucket financeiro existe...');
    
    // Autenticar primeiro
    await authenticateSupabase();
    
    // Listar buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error);
      throw new Error(`Erro ao listar buckets: ${error.message}`);
    }
    
    console.log('📋 Buckets encontrados:', buckets?.map(b => b.name));
    
    const bucketExists = buckets?.some(bucket => bucket.name === CONTABIL_CONFIG.BUCKET_NAME);
    
    if (bucketExists) {
      console.log('✅ Bucket "financeiro" já existe');
      return true;
    }
    
    console.log('⚠️ Bucket "financeiro" não encontrado. Criando...');
    
    // Tentar criar o bucket
    const { error: createError } = await supabase.storage.createBucket(CONTABIL_CONFIG.BUCKET_NAME, {
      public: false,
      allowedMimeTypes: CONTABIL_CONFIG.ALLOWED_MIME_TYPES,
      fileSizeLimit: CONTABIL_CONFIG.MAX_FILE_SIZE
    });
    
    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      throw new Error(`Erro ao criar bucket: ${createError.message}`);
    }
    
    console.log('✅ Bucket "financeiro" criado com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar/criar bucket:', error);
    throw error;
  }
};

// Função para diagnóstico detalhado do Supabase
export const diagnoseSupabaseIssues = async () => {
  const diagnosis = {
    connection: false,
    authentication: false,
    bucketExists: false,
    bucketAccess: false,
    policies: false,
    errors: [] as string[]
  };

  try {
    console.log('🔍 Iniciando diagnóstico detalhado do Supabase...');
    
    // 1. Testar conexão básica
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        diagnosis.errors.push(`Erro de conexão: ${error.message}`);
      } else {
        diagnosis.connection = true;
        console.log('✅ Conexão básica OK');
      }
    } catch (error) {
      diagnosis.errors.push(`Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    // 2. Testar autenticação
    try {
      await authenticateSupabase();
      diagnosis.authentication = true;
      console.log('✅ Autenticação: Usuário autenticado no Supabase');
    } catch (error) {
      diagnosis.errors.push(`Erro de autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    // 3. Verificar se o bucket existe
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error && buckets) {
        const bucketExists = buckets.some(bucket => bucket.name === CONTABIL_CONFIG.BUCKET_NAME);
        diagnosis.bucketExists = bucketExists;
        console.log(`✅ Bucket "${CONTABIL_CONFIG.BUCKET_NAME}" existe:`, bucketExists);
      }
    } catch (error) {
      diagnosis.errors.push(`Erro ao verificar bucket: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    // 4. Testar acesso ao bucket
    if (diagnosis.bucketExists) {
      try {
        const { error } = await supabase.storage
          .from(CONTABIL_CONFIG.BUCKET_NAME)
          .list(CONTABIL_CONFIG.FOLDER_NAME, { limit: 1 });
        
        if (!error) {
          diagnosis.bucketAccess = true;
          console.log('✅ Acesso ao bucket confirmado');
        } else {
          diagnosis.errors.push(`Erro de acesso ao bucket: ${error.message}`);
        }
      } catch (error) {
        diagnosis.errors.push(`Erro ao testar acesso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return diagnosis;
  } catch (error) {
    diagnosis.errors.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return diagnosis;
  }
};
