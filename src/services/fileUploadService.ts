import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage, auth } from '../config/firebase';

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

  // Teste de conexão com Firebase Storage
  static async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('Testando conexão com Firebase Storage...');
      
      // Verificar autenticação primeiro
      const isAuthenticated = await this.checkAuth();
      if (!isAuthenticated) {
        console.error('❌ Falha na autenticação para teste de conexão');
        return false;
      }
      
      const testRef = ref(storage, 'test-connection.txt');
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      await uploadBytes(testRef, testBlob);
      console.log('✅ Conexão com Firebase Storage OK');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com Firebase Storage:', error);
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

  // Verificar autenticação
  static async checkAuth(): Promise<boolean> {
    let user = auth.currentUser;
    
    // Se não há usuário autenticado no Firebase, tentar autenticação anônima
    if (!user) {
      try {
        console.log('🔐 Tentando autenticação anônima no Firebase...');
        const { signInAnonymously } = await import('firebase/auth');
        const result = await signInAnonymously(auth);
        user = result.user;
        console.log('✅ Autenticação anônima realizada:', user.uid);
      } catch (error) {
        console.error('❌ Erro na autenticação anônima:', error);
        return false;
      }
    }
    
    if (user) {
      console.log('✅ Usuário autenticado no Firebase:', user.uid);
      return true;
    }
    
    console.error('❌ Falha na autenticação Firebase');
    return false;
  }

  // Upload de arquivo
  static async uploadFile(
    file: File, 
    atletaId: string, 
    fileType: 'comprovanteResidencia' | 'foto3x4' | 'identidade' | 'certificadoAdel',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    console.log('FileUploadService.uploadFile iniciado:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      atletaId,
      documentType: fileType
    });

    // Verificar autenticação
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Usuário não está autenticado. Faça login novamente.');
    }

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

      // Criar referência no storage
      const fileName = `${atletaId}_${fileType}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `atletas/${atletaId}/${fileType}/${fileName}`);
      
      console.log('Referência do storage criada:', storageRef.fullPath);

      // Simular progresso (Firebase não fornece progresso nativo)
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'uploading'
      });

      console.log('Iniciando upload para Firebase Storage...');

      // Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file);
      
      console.log('Upload concluído, snapshot:', snapshot);
      
      onProgress?.({
        progress: 50,
        fileName: file.name,
        status: 'uploading'
      });

      console.log('Obtendo URL de download...');

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('URL de download obtida:', downloadURL);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      const result = {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      };

      console.log('Upload finalizado com sucesso:', result);
      return result;

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
  static async listAtletaFiles(atletaId: string): Promise<{
    comprovanteResidencia?: UploadedFile[];
    foto3x4?: UploadedFile[];
    identidade?: UploadedFile[];
    certificadoAdel?: UploadedFile[];
  }> {
    // Retornar arrays vazios por enquanto para evitar problemas
    // TODO: Implementar listagem real quando necessário
    return {
      comprovanteResidencia: [],
      foto3x4: [],
      identidade: [],
      certificadoAdel: []
    };
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
