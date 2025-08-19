// Google Drive API Service para upload/download de documentos
// Este serviço substitui o Firebase Storage apenas para documentos

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  modifiedTime: string;
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
  private static readonly SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  
  private static accessToken: string | null = null;
  private static tokenExpiry: number | null = null;

  // Inicializar o serviço
  static async initialize(): Promise<boolean> {
    try {
      if (!this.API_KEY || !this.CLIENT_ID) {
        console.error('❌ Google Drive API não configurada. Verifique as variáveis de ambiente.');
        return false;
      }

      // Carregar a API do Google
      await this.loadGoogleAPI();
      
      // Autenticar usuário
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.error('❌ Falha na autenticação com Google Drive');
        return false;
      }

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
            scope: this.SCOPES.join(' ')
          }).then(() => {
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Autenticar com Google
  private static async authenticate(): Promise<boolean> {
    try {
      const auth2 = window.gapi.auth2.getAuthInstance();
      if (!auth2.isSignedIn.get()) {
        await auth2.signIn();
      }
      
      const user = auth2.currentUser.get();
      this.accessToken = user.getAuthResponse().access_token;
      this.tokenExpiry = user.getAuthResponse().expires_at;
      
      return true;
    } catch (error) {
      console.error('Erro na autenticação Google:', error);
      return false;
    }
  }

  // Verificar se o token ainda é válido
  private static isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    return Date.now() < this.tokenExpiry * 1000;
  }

  // Obter token de acesso válido
  private static async getValidToken(): Promise<string> {
    if (!this.isTokenValid()) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  // Criar pasta para um atleta se não existir
  private static async createAtletaFolder(atletaId: string, atletaNome: string): Promise<string> {
    const token = await this.getValidToken();
    
    // Verificar se a pasta já existe
    const existingFolders = await this.listFolders(atletaId);
    if (existingFolders.length > 0) {
      return existingFolders[0].id;
    }

    // Criar nova pasta
    const folderMetadata = {
      name: `${atletaId}_${atletaNome}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: this.FOLDER_ID ? [this.FOLDER_ID] : undefined
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderMetadata)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar pasta: ${response.statusText}`);
    }

    const folder = await response.json();
    return folder.id;
  }

  // Listar pastas por nome
  private static async listFolders(folderName: string): Promise<GoogleDriveFile[]> {
    const token = await this.getValidToken();
    
    const query = `name contains '${folderName}' and mimeType='application/vnd.google-apps.folder'`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao listar pastas: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files || [];
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
      if (!this.accessToken) {
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
      const folderId = await this.createAtletaFolder(atletaId, atletaNome);
      
      onProgress?.({
        progress: 30,
        fileName: file.name,
        status: 'uploading'
      });

      // Preparar metadados do arquivo
      const fileName = `${fileType}_${Date.now()}_${file.name}`;
      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      // Criar FormData para upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      onProgress?.({
        progress: 50,
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

      const uploadedFile = await response.json();
      
      // Tornar o arquivo público para visualização
      await this.makeFilePublic(uploadedFile.id);

      onProgress?.({
        progress: 100,
        fileName: file.name,
        status: 'success'
      });

      return {
        id: uploadedFile.id,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink,
        createdTime: uploadedFile.createdTime,
        modifiedTime: uploadedFile.modifiedTime
      };

    } catch (error) {
      console.error('Erro no upload para Google Drive:', error);
      
      onProgress?.({
        progress: 0,
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      });
      
      throw error;
    }
  }

  // Tornar arquivo público para visualização
  private static async makeFilePublic(fileId: string): Promise<void> {
    const token = await this.getValidToken();
    
    const permission = {
      type: 'anyone',
      role: 'reader'
    };

    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permission)
    });
  }

  // Listar arquivos de um atleta
  static async listAtletaFiles(atletaId: string): Promise<{
    comprovanteResidencia?: GoogleDriveFile[];
    foto3x4?: GoogleDriveFile[];
    identidade?: GoogleDriveFile[];
    certificadoAdel?: GoogleDriveFile[];
  }> {
    try {
      if (!this.accessToken) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {};
        }
      }

      const token = await this.getValidToken();
      
      // Buscar pasta do atleta
      const folders = await this.listFolders(atletaId);
      if (folders.length === 0) {
        return {};
      }

      const folderId = folders[0].id;
      
      // Listar arquivos na pasta
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao listar arquivos: ${response.statusText}`);
      }

      const result = await response.json();
      const files = result.files || [];

      // Organizar por tipo
      const organizedFiles: any = {};
      
      files.forEach((file: GoogleDriveFile) => {
        const fileName = file.name;
        let fileType: string | null = null;

        if (fileName.includes('comprovanteResidencia')) {
          fileType = 'comprovanteResidencia';
        } else if (fileName.includes('foto3x4')) {
          fileType = 'foto3x4';
        } else if (fileName.includes('identidade')) {
          fileType = 'identidade';
        } else if (fileName.includes('certificadoAdel')) {
          fileType = 'certificadoAdel';
        }

        if (fileType) {
          if (!organizedFiles[fileType]) {
            organizedFiles[fileType] = [];
          }
          organizedFiles[fileType].push(file);
        }
      });

      return organizedFiles;

    } catch (error) {
      console.error('Erro ao listar arquivos do atleta:', error);
      return {};
    }
  }

  // Deletar arquivo
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const token = await this.getValidToken();
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar arquivo: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  // Download de arquivo
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
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
        throw new Error(`Erro ao fazer download: ${response.statusText}`);
      }

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

  // Teste de conexão
  static async testConnection(): Promise<boolean> {
    try {
      return await this.initialize();
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return false;
    }
  }
}

// Declaração global para Google API
declare global {
  interface Window {
    gapi: any;
  }
}
