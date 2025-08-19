// Google Drive API Service para upload/download de documentos
// Este serviço usa Vercel Functions para upload real

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface GoogleDriveUploadProgress {
  progress: number;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export class GoogleDriveService {
  private static readonly FOLDER_ID = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID || '1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh';
  private static readonly FOLDER_NAME = 'FEPERJ - Documentos';

  // Inicializar o serviço
  static async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Inicializando Google Drive Service com Vercel Functions...');
      
      if (!this.FOLDER_ID) {
        console.error('❌ FOLDER_ID não configurado');
        return false;
      }

      console.log('✅ Google Drive Service inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Drive Service:', error);
      return false;
    }
  }

  // Testar conexão
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testando conexão com Google Drive...');
      
      // Testar se a pasta principal existe
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'find',
          folderName: this.FOLDER_NAME,
          parentId: this.FOLDER_ID
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Conexão com Google Drive estabelecida');
        return true;
      } else {
        console.error('❌ Erro na conexão:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return false;
    }
  }

  // Criar pasta do atleta
  private static async createAtletaFolder(atletaId: string, atletaNome: string): Promise<string> {
    try {
      const atletaFolderName = `${atletaNome} (${atletaId})`;
      
      // Buscar pasta existente
      const findResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'find',
          folderName: atletaFolderName,
          parentId: this.FOLDER_ID
        })
      });

      const findResult = await findResponse.json();
      
      if (findResult.success && findResult.folders.length > 0) {
        console.log('📁 Pasta do atleta encontrada:', findResult.folders[0].id);
        return findResult.folders[0].id;
      }

      // Criar nova pasta
      const createResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          folderName: atletaFolderName,
          parentId: this.FOLDER_ID
        })
      });

      const createResult = await createResponse.json();
      
      if (createResult.success) {
        console.log('📁 Pasta do atleta criada:', createResult.folder.id);
        return createResult.folder.id;
      } else {
        throw new Error(createResult.error);
      }
    } catch (error) {
      console.error('❌ Erro ao criar pasta do atleta:', error);
      throw error;
    }
  }

  // Criar subpastas para tipos de documento
  private static async createDocumentFolders(atletaFolderId: string): Promise<{
    comprovanteResidencia: string;
    foto3x4: string;
    identidade: string;
    certificadoAdel: string;
  }> {
    const folderNames = {
      comprovanteResidencia: 'Comprovante de Residência',
      foto3x4: 'Foto 3x4',
      identidade: 'Identidade',
      certificadoAdel: 'Certificado ADEL'
    };

    const folders: any = {};

    for (const [key, name] of Object.entries(folderNames)) {
      try {
        // Buscar pasta existente
        const findResponse = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'find',
            folderName: name,
            parentId: atletaFolderId
          })
        });

        const findResult = await findResponse.json();
        
        if (findResult.success && findResult.folders.length > 0) {
          folders[key] = findResult.folders[0].id;
        } else {
          // Criar nova pasta
          const createResponse = await fetch('/api/folders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'create',
              folderName: name,
              parentId: atletaFolderId
            })
          });

          const createResult = await createResponse.json();
          
          if (createResult.success) {
            folders[key] = createResult.folder.id;
            console.log(`📁 Pasta criada: ${name} (${createResult.folder.id})`);
          } else {
            throw new Error(createResult.error);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao criar pasta ${name}:`, error);
        throw error;
      }
    }

    return folders;
  }

  // Upload de arquivo REAL para o Google Drive via Vercel Functions
  static async uploadFile(
    file: File,
    atletaId: string,
    atletaNome: string,
    fileType: 'comprovanteResidencia' | 'foto3x4' | 'identidade' | 'certificadoAdel',
    onProgress?: (progress: GoogleDriveUploadProgress) => void
  ): Promise<GoogleDriveFile> {
    try {
      onProgress?.({
        progress: 10,
        fileName: file.name,
        status: 'uploading'
      });

      // Fazer upload via API do Vercel usando FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro no upload:', errorData);
        throw new Error(`Erro no upload: ${errorData.error || response.statusText}`);
      }

      onProgress?.({
        progress: 90,
        fileName: file.name,
        status: 'uploading'
      });

      const result = await response.json();
      console.log('✅ Arquivo enviado para o Google Drive:', result.file.id);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return result.file;
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



  // Listar arquivos de um atleta (REAL)
  static async listAtletaFiles(atletaId: string, atletaNome: string): Promise<{
    comprovanteResidencia?: GoogleDriveFile[];
    foto3x4?: GoogleDriveFile[];
    identidade?: GoogleDriveFile[];
    certificadoAdel?: GoogleDriveFile[];
  }> {
    try {
      const atletaFolderName = `${atletaNome} (${atletaId})`;
      
      // Buscar pasta do atleta
      const findResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'find',
          folderName: atletaFolderName,
          parentId: this.FOLDER_ID
        })
      });

      const findResult = await findResponse.json();
      
      if (!findResult.success || findResult.folders.length === 0) {
        return {};
      }

      const atletaFolderId = findResult.folders[0].id;
      const folders = await this.createDocumentFolders(atletaFolderId);
      
      const result: any = {};

      // Listar arquivos de cada pasta
      for (const [key, folderId] of Object.entries(folders)) {
        const filesResponse = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'list',
            folderId
          })
        });

        const filesResult = await filesResponse.json();
        
        if (filesResult.success) {
          result[key] = filesResult.files || [];
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      return {};
    }
  }

  // Deletar arquivo (REAL)
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`/api/delete-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao deletar arquivo: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  // Download direto de arquivo (REAL)
  static async downloadFile(fileId: string, fileName?: string): Promise<void> {
    try {
      const url = `/api/download?fileId=${encodeURIComponent(fileId)}`;
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || fileId;
      link.target = '_blank';
      
      // Simular clique para iniciar download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw error;
    }
  }

  // Obter URL de download (mantido para compatibilidade)
  static async getDownloadUrl(fileId: string): Promise<string> {
    return `/api/download?fileId=${encodeURIComponent(fileId)}`;
  }
}
