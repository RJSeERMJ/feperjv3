import { supabase, STORAGE_CONFIG, SupabaseFile, UploadResult } from '../config/supabase';

export interface FileUploadProgress {
  progress: number;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  fileId: string;
}

export class SupabaseService {
  private static readonly BUCKET_NAME = STORAGE_CONFIG.BUCKET_NAME;

  /**
   * Inicializar o serviço e criar bucket se necessário
   */
  static async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Inicializando Supabase Service...');
      
      // Verificar se o bucket existe
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Erro ao listar buckets:', error);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        console.log('📦 Criando bucket:', this.BUCKET_NAME);
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
          fileSizeLimit: STORAGE_CONFIG.MAX_FILE_SIZE
        });

        if (createError) {
          console.error('❌ Erro ao criar bucket:', createError);
          return false;
        }
      }

      console.log('✅ Supabase Service inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase Service:', error);
      return false;
    }
  }

  /**
   * Testar conexão com Supabase
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testando conexão com Supabase...');
      
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Erro na conexão:', error);
        return false;
      }

      console.log('✅ Conexão com Supabase estabelecida');
      return true;
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return false;
    }
  }

  /**
   * Upload de arquivo para Supabase Storage
   */
  static async uploadFile(
    file: File,
    atletaId: string,
    atletaNome: string,
    fileType: 'comprovanteResidencia' | 'foto3x4' | 'identidade' | 'certificadoAdel',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    try {
      console.log('🚀 Iniciando upload para Supabase:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        atletaId,
        atletaNome,
        documentType: fileType
      });

      // Validar arquivo
      const allowedTypes = STORAGE_CONFIG.ALLOWED_FILE_TYPES[fileType];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
      }

      if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      onProgress?.({
        progress: 10,
        fileName: file.name,
        status: 'uploading'
      });

      // Criar caminho do arquivo
      const folder = this.getFolderPath(fileType);
      const fileName = this.generateFileName(file, atletaId, atletaNome);
      const filePath = `${folder}/${fileName}`;

      console.log('📁 Caminho do arquivo:', filePath);

      onProgress?.({
        progress: 30,
        fileName: file.name,
        status: 'uploading'
      });

      // Upload para Supabase
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      onProgress?.({
        progress: 80,
        fileName: file.name,
        status: 'uploading'
      });

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log('✅ Upload concluído:', data.path);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        fileId: data.path || filePath
      };

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      });
      
      throw error;
    }
  }

  /**
   * Download de arquivo do Supabase Storage
   */
  static async downloadFile(filePath: string): Promise<Blob> {
    try {
      console.log('📥 Iniciando download:', filePath);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        console.error('❌ Erro no download:', error);
        throw new Error(`Erro no download: ${error.message}`);
      }

      console.log('✅ Download concluído');
      return data;
    } catch (error) {
      console.error('❌ Erro no download:', error);
      throw error;
    }
  }

  /**
   * Listar arquivos de um atleta
   */
  static async listAtletaFiles(atletaId: string, atletaNome: string): Promise<{
    comprovanteResidencia?: UploadedFile[];
    foto3x4?: UploadedFile[];
    identidade?: UploadedFile[];
    certificadoAdel?: UploadedFile[];
  }> {
    try {
      console.log('📋 Listando arquivos do atleta:', atletaId);

      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        throw error;
      }

      const atletaFiles: any = {};
      const atletaPrefix = `${atletaNome} (${atletaId})`;

      files?.forEach(file => {
        if (file.name.includes(atletaPrefix)) {
          const fileType = this.getFileTypeFromPath(file.name);
          if (fileType) {
            if (!atletaFiles[fileType]) {
              atletaFiles[fileType] = [];
            }

            const { data: urlData } = supabase.storage
              .from(this.BUCKET_NAME)
              .getPublicUrl(file.name);

            atletaFiles[fileType].push({
              name: file.name,
              url: urlData.publicUrl,
              type: this.getMimeTypeFromName(file.name),
              size: file.metadata?.size || 0,
              uploadedAt: new Date(file.created_at || Date.now()),
              fileId: file.name
            });
          }
        }
      });

      console.log('✅ Arquivos listados:', atletaFiles);
      return atletaFiles;

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      throw error;
    }
  }

  /**
   * Excluir arquivo do Supabase Storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      console.log('🗑️ Excluindo arquivo:', filePath);

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('❌ Erro ao excluir arquivo:', error);
        throw new Error(`Erro ao excluir arquivo: ${error.message}`);
      }

      console.log('✅ Arquivo excluído com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  /**
   * Gerar nome único para o arquivo
   */
  private static generateFileName(file: File, atletaId: string, atletaNome: string): string {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const sanitizedName = atletaNome.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${sanitizedName}_${atletaId}_${timestamp}.${extension}`;
  }

  /**
   * Obter caminho da pasta baseado no tipo de arquivo
   */
  private static getFolderPath(fileType: string): string {
    switch (fileType) {
      case 'comprovanteResidencia':
        return STORAGE_CONFIG.FOLDERS.COMPROVANTE_RESIDENCIA;
      case 'foto3x4':
        return STORAGE_CONFIG.FOLDERS.FOTO_3X4;
      case 'identidade':
        return STORAGE_CONFIG.FOLDERS.IDENTIDADE;
      case 'certificadoAdel':
        return STORAGE_CONFIG.FOLDERS.CERTIFICADO_ADEL;
      default:
        return 'outros';
    }
  }

  /**
   * Obter tipo de arquivo baseado no caminho
   */
  private static getFileTypeFromPath(fileName: string): string | null {
    if (fileName.includes(STORAGE_CONFIG.FOLDERS.COMPROVANTE_RESIDENCIA)) {
      return 'comprovanteResidencia';
    } else if (fileName.includes(STORAGE_CONFIG.FOLDERS.FOTO_3X4)) {
      return 'foto3x4';
    } else if (fileName.includes(STORAGE_CONFIG.FOLDERS.IDENTIDADE)) {
      return 'identidade';
    } else if (fileName.includes(STORAGE_CONFIG.FOLDERS.CERTIFICADO_ADEL)) {
      return 'certificadoAdel';
    }
    return null;
  }

  /**
   * Obter MIME type baseado no nome do arquivo
   */
  private static getMimeTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }
}
