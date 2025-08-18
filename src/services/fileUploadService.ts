import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
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

  // Upload de arquivo
  static async uploadFile(
    file: File, 
    atletaId: string, 
    fileType: 'comprovanteResidencia' | 'foto3x4',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    try {
      // Validar arquivo
      const allowedTypes = fileType === 'comprovanteResidencia' 
        ? this.ALLOWED_PDF_TYPES 
        : this.ALLOWED_IMAGE_TYPES;

      const validationError = this.validateFile(file, allowedTypes);
      if (validationError) {
        throw new Error(validationError);
      }

      // Criar referência no storage
      const fileName = `${atletaId}_${fileType}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `atletas/${atletaId}/${fileType}/${fileName}`);

      // Simular progresso (Firebase não fornece progresso nativo)
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'uploading'
      });

      // Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file);
      
      onProgress?.({
        progress: 50,
        fileName: file.name,
        status: 'uploading'
      });

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      };

    } catch (error) {
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
  static async listAtletaFiles(atletaId: string): Promise<{
    comprovanteResidencia?: UploadedFile[];
    foto3x4?: UploadedFile[];
  }> {
    try {
      const result = {
        comprovanteResidencia: [] as UploadedFile[],
        foto3x4: [] as UploadedFile[]
      };

      // Listar comprovantes de residência
      try {
        const comprovantesRef = ref(storage, `atletas/${atletaId}/comprovanteResidencia`);
        const comprovantesList = await listAll(comprovantesRef);
        
        for (const item of comprovantesList.items) {
          const url = await getDownloadURL(item);
          
          result.comprovanteResidencia.push({
            name: item.name,
            url,
            type: 'application/pdf',
            size: 0, // Firebase Storage não fornece metadata facilmente
            uploadedAt: new Date()
          });
        }
      } catch (error) {
        console.log('Nenhum comprovante de residência encontrado');
      }

      // Listar fotos 3x4
      try {
        const fotosRef = ref(storage, `atletas/${atletaId}/foto3x4`);
        const fotosList = await listAll(fotosRef);
        
        for (const item of fotosList.items) {
          const url = await getDownloadURL(item);
          
          result.foto3x4.push({
            name: item.name,
            url,
            type: 'image/jpeg',
            size: 0, // Firebase Storage não fornece metadata facilmente
            uploadedAt: new Date()
          });
        }
      } catch (error) {
        console.log('Nenhuma foto 3x4 encontrada');
      }

      return result;

    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // Deletar arquivo
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  // Download de arquivo
  static async downloadFile(url: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
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
