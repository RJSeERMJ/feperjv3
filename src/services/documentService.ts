import { supabase, STORAGE_CONFIG, validateFileExtension, validateFileSize } from '../config/supabase';
import { notificacoesService } from './notificacoesService';
import { atletaService, equipeService } from './firebaseService';

export interface Documento {
  id?: string;
  idAtleta: string;
  tipo: 'comprovante-residencia' | 'foto-3x4' | 'certificado-adel' | 'matricula';
  nomeArquivo: string;
  nomeArquivoSalvo?: string; // Nome do arquivo salvo no Supabase
  url?: string;
  urlTemporaria?: string; // Nova propriedade para URL temporária
  tamanho: number;
  dataUpload: Date;
  contentType: string;
}

// Função para buscar dados do atleta e equipe
const buscarDadosAtletaEquipe = async (atletaId: string) => {
  try {
    const atleta = await atletaService.getById(atletaId);
    if (!atleta) {
      throw new Error(`Atleta com ID ${atletaId} não encontrado`);
    }
    
    if (!atleta.idEquipe) {
      throw new Error(`Atleta ${atleta.nome} não possui equipe associada`);
    }
    
    const equipe = await equipeService.getById(atleta.idEquipe);
    if (!equipe) {
      throw new Error(`Equipe com ID ${atleta.idEquipe} não encontrada`);
    }
    
    return {
      nomeAtleta: atleta.nome,
      nomeEquipe: equipe.nomeEquipe,
      idEquipe: equipe.id
    };
  } catch (error) {
    console.error('Erro ao buscar dados do atleta/equipe:', error);
    throw error;
  }
};

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

      // Criar notificação automática no mural
      try {
        const dadosAtletaEquipe = await buscarDadosAtletaEquipe(atletaId);
        
        // Mapear tipo de documento para o tipo de notificação
        let tipoNotificacao: 'COMPROVANTE_RESIDENCIA' | 'FOTO_3X4' | 'CERTIFICADO_ADEL' | 'COMPROVANTE_INSCRICAO';
        
        switch (documentType) {
          case 'comprovante-residencia':
            tipoNotificacao = 'COMPROVANTE_RESIDENCIA';
            break;
          case 'foto-3x4':
            tipoNotificacao = 'FOTO_3X4';
            break;
          case 'certificado-adel':
            tipoNotificacao = 'CERTIFICADO_ADEL';
            break;
          case 'matricula':
            tipoNotificacao = 'COMPROVANTE_INSCRICAO';
            break;
          default:
            tipoNotificacao = 'COMPROVANTE_RESIDENCIA';
        }

        await notificacoesService.criarNotificacaoAutomatica(
          dadosAtletaEquipe.idEquipe!,
          dadosAtletaEquipe.nomeEquipe,
          tipoNotificacao,
          `${dadosAtletaEquipe.nomeAtleta} - ${file.name}`
        );
        
        console.log('✅ Notificação criada automaticamente para documento do atleta');
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        // Não falhar o upload se a notificação falhar
      }

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

      // Baixar arquivo da URL temporária
      const response = await fetch(temporaryUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Determinar tipo MIME baseado na extensão
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (fileExtension === '.pdf') mimeType = 'application/pdf';
      else if (['.jpg', '.jpeg'].includes(fileExtension)) mimeType = 'image/jpeg';
      else if (fileExtension === '.png') mimeType = 'image/png';
      else if (fileExtension === '.gif') mimeType = 'image/gif';
      else if (fileExtension === '.bmp') mimeType = 'image/bmp';
      
      // Tentar usar showSaveFilePicker (navegadores modernos)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: "Documento",
              accept: { [mimeType]: [fileExtension] }
            }]
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          console.log('✅ Download concluído com showSaveFilePicker!');
          return;
        } catch (error) {
          console.warn('⚠️ showSaveFilePicker falhou, usando fallback:', error);
        }
      }
      
      // Fallback: Download tradicional com link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download concluído com fallback!');
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

      // Baixar arquivo da URL temporária
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Determinar tipo MIME baseado na extensão
      const fileExtension = documento.nomeArquivo.substring(documento.nomeArquivo.lastIndexOf('.')).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (fileExtension === '.pdf') mimeType = 'application/pdf';
      else if (['.jpg', '.jpeg'].includes(fileExtension)) mimeType = 'image/jpeg';
      else if (fileExtension === '.png') mimeType = 'image/png';
      else if (fileExtension === '.gif') mimeType = 'image/gif';
      else if (fileExtension === '.bmp') mimeType = 'image/bmp';
      
      // Tentar usar showSaveFilePicker (navegadores modernos)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: documento.nomeArquivo,
            types: [{
              description: "Documento",
              accept: { [mimeType]: [fileExtension] }
            }]
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          console.log('✅ Download concluído com showSaveFilePicker!');
          return;
        } catch (error) {
          console.warn('⚠️ showSaveFilePicker falhou, usando fallback:', error);
        }
      }
      
      // Fallback: Download tradicional com link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.nomeArquivo;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download concluído com fallback!');
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
      const documentTypes: Documento['tipo'][] = ['comprovante-residencia', 'foto-3x4', 'certificado-adel', 'matricula'];

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
