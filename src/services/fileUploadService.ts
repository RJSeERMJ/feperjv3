import { SupabaseService } from './supabaseService';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  fileId: string;
}

export interface FileUploadProgress {
  progress: number;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export class FileUploadService {
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly ALLOWED_PDF_TYPES = ['application/pdf'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Teste de conexão com Supabase
  static async testSupabaseConnection(): Promise<boolean> {
    try {
      console.log('Testando conexão com Supabase...');
      const isConnected = await SupabaseService.testConnection();
      if (isConnected) {
        console.log('✅ Conexão com Supabase OK');
        return true;
      } else {
        console.error('❌ Falha na conexão com Supabase');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na conexão com Supabase:', error);
      return false;
    }
  }

  // Validar tipo de arquivo
  static validateFile(file: File, allowedTypes: string[]): string | null {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  }

  // Upload de arquivo para Supabase
  static async uploadFile(
    file: File, 
    atletaId: string,
    atletaNome: string,
    fileType: 'comprovanteResidencia' | 'foto3x4' | 'identidade' | 'certificadoAdel',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    console.log('FileUploadService.uploadFile iniciado:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      atletaId,
      atletaNome,
      documentType: fileType
    });

    try {
      // Validar arquivo
      const allowedTypes = (fileType === 'comprovanteResidencia' || fileType === 'identidade' || fileType === 'certificadoAdel')
        ? this.ALLOWED_PDF_TYPES 
        : this.ALLOWED_IMAGE_TYPES;

      console.log('Tipos permitidos para', fileType, ':', allowedTypes);

      const validationError = this.validateFile(file, allowedTypes);
      if (validationError) {
        console.error('Erro de validação:', validationError);
        throw new Error(validationError);
      }

      console.log('Arquivo validado com sucesso');

      // Simular progresso inicial
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'uploading'
      });

      console.log('Iniciando upload para Supabase...');

      // Upload para Supabase
      const result = await SupabaseService.uploadFile(
        file,
        atletaId,
        atletaNome,
        fileType,
        (progress: FileUploadProgress) => {
          console.log('Progresso do upload:', progress);
          onProgress?.({
            progress: progress.progress,
            fileName: progress.fileName,
            status: progress.status === 'error' ? 'error' : 'uploading',
            error: progress.error
          });
        }
      );

      console.log('Upload concluído com sucesso:', result);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return result;
    } catch (error) {
      console.error('Erro no upload:', error);
      
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      });
      
      throw error;
    }
  }

  // Download de arquivo do Supabase
  static async downloadFile(filePath: string, fileName: string): Promise<void> {
    try {
      console.log('Iniciando download:', filePath);

      const blob = await SupabaseService.downloadFile(filePath);
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Download concluído com sucesso');
    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  }

  // Listar arquivos de um atleta
  static async listAtletaFiles(atletaId: string, atletaNome: string): Promise<{
    comprovanteResidencia?: UploadedFile[];
    foto3x4?: UploadedFile[];
    identidade?: UploadedFile[];
    certificadoAdel?: UploadedFile[];
  }> {
    try {
      console.log('Listando arquivos do atleta:', atletaId);
      
      const files = await SupabaseService.listAtletaFiles(atletaId, atletaNome);
      
      console.log('Arquivos encontrados:', files);
      return files;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // Excluir arquivo do Supabase
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      console.log('Excluindo arquivo:', filePath);
      
      const result = await SupabaseService.deleteFile(filePath);
      
      console.log('Arquivo excluído com sucesso');
      return result;
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  // Inicializar serviço
  static async initialize(): Promise<boolean> {
    try {
      console.log('Inicializando FileUploadService...');
      
      const initialized = await SupabaseService.initialize();
      
      if (initialized) {
        console.log('✅ FileUploadService inicializado com sucesso');
        return true;
      } else {
        console.error('❌ Falha ao inicializar FileUploadService');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar FileUploadService:', error);
      return false;
    }
  }

  // Métodos utilitários
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  static isImage(fileType: string): boolean {
    return ['image/jpeg', 'image/jpg', 'image/png'].includes(fileType);
  }

  static isPDF(fileType: string): boolean {
    return fileType === 'application/pdf';
  }
}
