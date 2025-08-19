import { GoogleDriveService } from './googleDriveService';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  fileId: string; // ID do arquivo no Google Drive
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

  // Teste de conexão com Google Drive
  static async testGoogleDriveConnection(): Promise<boolean> {
    try {
      console.log('Testando conexão com Google Drive...');
      const isConnected = await GoogleDriveService.testConnection();
      if (isConnected) {
        console.log('✅ Conexão com Google Drive OK');
        return true;
      } else {
        console.error('❌ Falha na conexão com Google Drive');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na conexão com Google Drive:', error);
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

  // Upload de arquivo para Google Drive
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

      console.log('Iniciando upload para Google Drive...');

      // Upload para Google Drive
      const result = await GoogleDriveService.uploadFile(
        file,
        atletaId,
        atletaNome,
        fileType,
        (progress) => {
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

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: result.webViewLink || result.webContentLink || '',
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        fileId: result.id
      };

      console.log('Upload finalizado com sucesso:', uploadedFile);
      return uploadedFile;

    } catch (error) {
      console.error('Erro no FileUploadService.uploadFile:', error);
      
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      });
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
      const files = await GoogleDriveService.listAtletaFiles(atletaId, atletaNome);
      
      // Converter para formato UploadedFile
      const convertToUploadedFile = (file: any): UploadedFile => ({
        name: file.name,
        url: file.webViewLink || file.webContentLink || '',
        type: file.mimeType,
        size: parseInt(file.size) || 0,
        uploadedAt: new Date(file.createdTime),
        fileId: file.id
      });

      return {
        comprovanteResidencia: files.comprovanteResidencia?.map(convertToUploadedFile) || [],
        foto3x4: files.foto3x4?.map(convertToUploadedFile) || [],
        identidade: files.identidade?.map(convertToUploadedFile) || [],
        certificadoAdel: files.certificadoAdel?.map(convertToUploadedFile) || []
      };
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return {
        comprovanteResidencia: [],
        foto3x4: [],
        identidade: [],
        certificadoAdel: []
      };
    }
  }

  // Deletar arquivo
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await GoogleDriveService.deleteFile(fileId);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  // Download de arquivo
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const downloadUrl = await GoogleDriveService.getDownloadUrl(fileId);
      
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      const downloadUrlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrlBlob;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrlBlob);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw error;
    }
  }

  // Formatar tamanho do arquivo
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obter extensão do arquivo
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Verificar se é imagem
  static isImage(fileType: string): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(fileType);
  }

  // Verificar se é PDF
  static isPDF(fileType: string): boolean {
    return this.ALLOWED_PDF_TYPES.includes(fileType);
  }
}
