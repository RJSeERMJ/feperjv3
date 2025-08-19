import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kamgocrdbdwjryvcavuo.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ Chave do Supabase não configurada');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações do Storage
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'feperj-documents',
  ALLOWED_FILE_TYPES: {
    'comprovanteResidencia': ['application/pdf'],
    'foto3x4': ['image/jpeg', 'image/jpg', 'image/png'],
    'identidade': ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    'certificadoAdel': ['application/pdf']
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  FOLDERS: {
    COMPROVANTE_RESIDENCIA: 'comprovantes-residencia',
    FOTO_3X4: 'fotos-3x4',
    IDENTIDADE: 'identidades',
    CERTIFICADO_ADEL: 'certificados-adel'
  }
};

// Tipos para o Supabase
export interface SupabaseFile {
  id: string;
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

export interface UploadResult {
  success: boolean;
  file?: SupabaseFile;
  error?: string;
  path?: string;
}
