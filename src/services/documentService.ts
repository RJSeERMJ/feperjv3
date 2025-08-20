import { supabase, STORAGE_CONFIG, validateFileExtension, validateFileSize } from '../config/supabase';

export interface Documento {
  id?: string;
  idAtleta: string;
  tipo: 'comprovante-residencia' | 'foto-3x4' | 'certificado-adel';
  nomeArquivo: string;
  nomeArquivoSalvo?: string; // Nome do arquivo salvo no Supabase
  url?: string;
  urlTemporaria?: string; // Nova propriedade para URL temporária
  tamanho: number;
  dataUpload: Date;
  contentType: string;
}

export const documentService = {
  // Gerar URL temporária com expiração
  async generateTemporaryUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Erro ao gerar URL temporária: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('URL temporária não foi gerada');
      }

      console.log('🔗 URL temporária gerada com sucesso');
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erro ao gerar URL temporária:', error);
      throw error;
    }
  },

  // Upload de documento
  async uploadDocument(
    atletaId: string,
    file: File,
    documentType: Documento['tipo']
  ): Promise<Documento> {
    try {
      // Validar extensão do arquivo
      if (!validateFileExtension(file.name, documentType)) {
        throw new Error(`Extensão não permitida para ${documentType}. Extensões permitidas: ${STORAGE_CONFIG.ALLOWED_EXTENSIONS[documentType].join(', ')}`);
      }

      // Validar tamanho do arquivo
      if (!validateFileSize(file.size)) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Gerar nome único para o arquivo (usar nome original)
      const timestamp = Date.now();
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      const fileName = `${atletaId}/${documentType}/${timestamp}_${file.name}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Gerar URL pública para download (mantém como estava)
      const { data: urlData } = supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .getPublicUrl(fileName);

      const documento: Documento = {
        idAtleta: atletaId,
        tipo: documentType,
        nomeArquivo: file.name,
        nomeArquivoSalvo: `${timestamp}_${file.name}`,
        url: urlData.publicUrl,
        tamanho: file.size,
        dataUpload: new Date(),
        contentType: file.type
      };

      return documento;
    } catch (error) {
      console.error('Erro no upload do documento:', error);
      throw error;
    }
  },

  // Download de documento com URL temporária
  async downloadDocument(filePath: string, fileName: string): Promise<void> {
    try {
      console.log('🔍 Tentando baixar arquivo:', filePath);
      console.log('📁 Bucket:', STORAGE_CONFIG.BUCKET_NAME);
      console.log('📄 Nome do arquivo:', fileName);
      
      // Gerar URL temporária para download (30 minutos de expiração)
      const temporaryUrl = await this.generateTemporaryUrl(filePath, 1800);
      
      console.log('✅ URL temporária gerada, iniciando download...');

      // Criar link para download usando URL temporária
      const link = document.createElement('a');
      link.href = temporaryUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro no download do documento:', error);
      throw error;
    }
  },

  // Download usando URL temporária
  async downloadWithTemporaryUrl(documento: Documento): Promise<void> {
    try {
      // Sempre gerar nova URL temporária para download (30 minutos de expiração)
      const savedFileName = documento.nomeArquivoSalvo || documento.nomeArquivo;
      const filePath = `${documento.idAtleta}/${documento.tipo}/${savedFileName}`;
      const downloadUrl = await this.generateTemporaryUrl(filePath, 1800); // 30 minutos
      console.log('🔗 URL temporária gerada para download');

      // Criar link para download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = documento.nomeArquivo;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro no download do documento:', error);
      throw error;
    }
  },

  // Listar documentos de um atleta
  async listDocuments(atletaId: string): Promise<Documento[]> {
    try {
      console.log('🔍 Listando documentos para atleta:', atletaId);
      const documentos: Documento[] = [];

      // Listar documentos de cada tipo
      const documentTypes: Documento['tipo'][] = ['comprovante-residencia', 'foto-3x4', 'certificado-adel'];

      for (const documentType of documentTypes) {
        try {
          console.log(`📁 Verificando pasta: ${atletaId}/${documentType}`);
          
          const { data, error } = await supabase.storage
            .from(STORAGE_CONFIG.BUCKET_NAME)
            .list(`${atletaId}/${documentType}`, {
              limit: 100,
              offset: 0
            });

          if (error) {
            // Se não encontrar a pasta do tipo de documento, continuar para o próximo
            if (error.message.includes('not found')) {
              console.log(`⚠️ Pasta ${documentType} não encontrada, continuando...`);
              continue;
            }
            console.warn(`❌ Erro ao listar ${documentType}:`, error);
            continue;
          }

          console.log(`📋 Arquivos encontrados em ${documentType}:`, data);

          if (data && data.length > 0) {
            for (const file of data) {
              // Extrair nome original do arquivo (remover timestamp)
              const originalFileName = file.name.replace(/^\d+_/, '');
              
              console.log(`📄 Processando arquivo: ${file.name} -> ${originalFileName}`);
              
                             // Gerar URL pública (mantém como estava)
               const { data: urlData } = supabase.storage
                 .from(STORAGE_CONFIG.BUCKET_NAME)
                 .getPublicUrl(`${atletaId}/${documentType}/${file.name}`);

               documentos.push({
                 id: file.id,
                 idAtleta: atletaId,
                 tipo: documentType,
                 nomeArquivo: originalFileName,
                 nomeArquivoSalvo: file.name,
                 url: urlData.publicUrl,
                 tamanho: file.metadata?.size || 0,
                 dataUpload: new Date(file.created_at),
                 contentType: file.metadata?.mimetype || ''
               });
            }
          }
        } catch (error) {
          console.warn(`❌ Erro ao processar ${documentType}:`, error);
          continue;
        }
      }

      console.log('✅ Documentos listados:', documentos);
      return documentos;
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      throw error;
    }
  },

  // Deletar documento
  async deleteDocument(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Erro ao deletar documento: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  },

  // Verificar se bucket existe, se não, criar
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_CONFIG.BUCKET_NAME);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(STORAGE_CONFIG.BUCKET_NAME, {
          public: false,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: STORAGE_CONFIG.MAX_FILE_SIZE
        });

        if (error) {
          console.warn('Erro ao criar bucket:', error);
        }
      }
    } catch (error) {
      console.warn('Erro ao verificar/criar bucket:', error);
    }
  }
};
