// Google Drive API Service para upload/download de documentos
// Este serviço substitui o Firebase Storage apenas para documentos

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
  private static readonly API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
  private static readonly CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
  private static readonly FOLDER_ID = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID;
  private static readonly FOLDER_NAME = 'FEPERJ - Documentos';
  private static accessToken: string | null = null;
  private static mainFolderId: string | null = null;

  // Inicializar o serviço
  static async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Inicializando Google Drive Service...');
      
      if (!this.API_KEY || !this.CLIENT_ID || !this.FOLDER_ID) {
        console.error('❌ Chaves do Google Drive não configuradas');
        return false;
      }

      // Carregar Google API
      await this.loadGoogleAPI();
      
      // Autenticar
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.error('❌ Falha na autenticação Google Drive');
        return false;
      }

      // Usar pasta principal fornecida
      this.mainFolderId = this.FOLDER_ID;
      console.log('✅ Usando pasta principal:', this.mainFolderId);

      console.log('✅ Google Drive Service inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Drive Service:', error);
      return false;
    }
  }

  // Carregar Google API
  private static async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: this.API_KEY,
            clientId: this.CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file'
          }).then(() => {
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Autenticar
  private static async authenticate(): Promise<boolean> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      
      this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return false;
    }
  }

  // Obter token válido
  private static async getValidToken(): Promise<string> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Falha na autenticação');
      }
    }
    return this.accessToken!;
  }

  // Testar conexão
  static async testConnection(): Promise<boolean> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }

      // Tentar listar arquivos da pasta principal
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${this.mainFolderId}'+in+parents&key=${this.API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.ok;
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
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${atletaFolderName}'+and+'${this.mainFolderId}'+in+parents&key=${this.API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        console.log('📁 Pasta do atleta encontrada:', data.files[0].id);
        return data.files[0].id;
      }

      // Criar nova pasta
      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: atletaFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [this.mainFolderId!]
          })
        }
      );

      const folderData = await createResponse.json();
      console.log('📁 Pasta do atleta criada:', folderData.id);
      return folderData.id;
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
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${name}'+and+'${atletaFolderId}'+in+parents&key=${this.API_KEY}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          }
        );

        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
          folders[key] = data.files[0].id;
        } else {
          // Criar nova pasta
          const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [atletaFolderId]
              })
            }
          );

          const folderData = await createResponse.json();
          folders[key] = folderData.id;
        }
      } catch (error) {
        console.error(`❌ Erro ao criar pasta ${name}:`, error);
        throw error;
      }
    }

    return folders;
  }

  // Upload de arquivo
  static async uploadFile(
    file: File,
    atletaId: string,
    atletaNome: string,
    fileType: 'comprovanteResidencia' | 'foto3x4' | 'identidade' | 'certificadoAdel',
    onProgress?: (progress: GoogleDriveUploadProgress) => void
  ): Promise<GoogleDriveFile> {
    try {
      // Inicializar se necessário
      if (!this.mainFolderId) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Falha ao inicializar Google Drive Service');
        }
      }

      onProgress?.({
        progress: 10,
        fileName: file.name,
        status: 'uploading'
      });

      // Criar pasta do atleta
      const atletaFolderId = await this.createAtletaFolder(atletaId, atletaNome);
      
      onProgress?.({
        progress: 30,
        fileName: file.name,
        status: 'uploading'
      });

      // Criar subpastas
      const documentFolders = await this.createDocumentFolders(atletaFolderId);
      
      onProgress?.({
        progress: 50,
        fileName: file.name,
        status: 'uploading'
      });

      // Preparar metadados do arquivo
      const fileName = `${fileType}_${Date.now()}_${file.name}`;
      const metadata = {
        name: fileName,
        parents: [documentFolders[fileType]]
      };

      // Criar FormData para upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      onProgress?.({
        progress: 70,
        fileName: file.name,
        status: 'uploading'
      });

      // Fazer upload
      const token = await this.getValidToken();
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: form
        }
      );

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      onProgress?.({
        progress: 90,
        fileName: file.name,
        status: 'uploading'
      });

      const result = await response.json();

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return result;
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

  // Listar arquivos de um atleta
  static async listAtletaFiles(atletaId: string, atletaNome: string): Promise<{
    comprovanteResidencia?: GoogleDriveFile[];
    foto3x4?: GoogleDriveFile[];
    identidade?: GoogleDriveFile[];
    certificadoAdel?: GoogleDriveFile[];
  }> {
    try {
      // Inicializar se necessário
      if (!this.mainFolderId) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Falha ao inicializar Google Drive Service');
        }
      }

      const atletaFolderName = `${atletaNome} (${atletaId})`;
      
      // Buscar pasta do atleta
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${atletaFolderName}'+and+'${this.mainFolderId}'+in+parents&key=${this.API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      
      if (!data.files || data.files.length === 0) {
        return {};
      }

      const atletaFolderId = data.files[0].id;
      const folders = await this.createDocumentFolders(atletaFolderId);
      
      const result: any = {};

      // Listar arquivos de cada pasta
      for (const [key, folderId] of Object.entries(folders)) {
        const filesResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${this.API_KEY}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          }
        );

        const filesData = await filesResponse.json();
        result[key] = filesData.files || [];
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      return {};
    }
  }

  // Deletar arquivo
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const token = await this.getValidToken();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao deletar arquivo: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  // Obter URL de download
  static async getDownloadUrl(fileId: string): Promise<string> {
    try {
      const token = await this.getValidToken();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao obter URL de download: ${response.statusText}`);
      }

      return response.url;
    } catch (error) {
      console.error('❌ Erro ao obter URL de download:', error);
      throw error;
    }
  }
}

// Declaração global para TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}
