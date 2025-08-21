import { supabase, CONTABIL_CONFIG } from '../config/supabase';

// Interface para documento contábil
export interface DocumentoContabil {
  id?: string;
  nome: string;
  tipo: 'DEMONSTRATIVO' | 'BALANCETE';
  formato: 'PDF' | 'CSV';
  nomeArquivoSalvo?: string;
  dataUpload: Date;
  ativo: boolean;
  url?: string;
  urlTemporaria?: string;
  tamanho: number;
  contentType: string;
}

// Interface para log de download
export interface DownloadLog {
  id?: string;
  documentoId: string;
  nomeDocumento: string;
  usuarioId: string;
  usuarioEmail: string;
  dataDownload: Date;
  ipAddress?: string;
  userAgent?: string;
  sucesso: boolean;
  erro?: string;
}

// Interface para log de exclusão
export interface DeleteLog {
  id?: string;
  documentoId: string;
  nomeDocumento: string;
  usuarioId: string;
  usuarioTipo: string;
  dataExclusao: Date;
  tipoDocumento: string;
}

// Validação de arquivo
const validateFile = (file: File): void => {
  // Verificar tamanho
  if (file.size > CONTABIL_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${CONTABIL_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verificar extensão
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!CONTABIL_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Extensão não permitida. Extensões aceitas: ${CONTABIL_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Verificar tipo MIME
  if (!CONTABIL_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
};

// Função para registrar log de download
const registrarLogDownload = async (log: Omit<DownloadLog, 'id' | 'dataDownload'>): Promise<void> => {
  try {
    await supabase
      .from('download_logs')
      .insert({
        ...log,
        dataDownload: new Date().toISOString()
      });
  } catch (error) {
    console.warn('⚠️ Erro ao registrar log de download:', error);
    // Não falhar o download por causa do log
  }
};

// Função para obter informações do usuário
const obterInfoUsuario = () => {
  const userAgent = navigator.userAgent;
  const ipAddress = 'N/A'; // Em produção, seria obtido do servidor
  
  return { userAgent, ipAddress };
};

// Serviço de documentos contábeis
export const documentosContabeisService = {
  // Gerar URL temporária com expiração
  async generateTemporaryUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(CONTABIL_CONFIG.BUCKET_NAME)
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
  async uploadDocumento(file: File, tipo: 'DEMONSTRATIVO' | 'BALANCETE'): Promise<DocumentoContabil> {
    try {
      console.log('📁 Supabase: Validando arquivo...');
      validateFile(file);

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const nomeArquivoSalvo = `${timestamp}_${file.name}`;
      const filePath = `documentos/${nomeArquivoSalvo}`;

      console.log('📁 Supabase: Fazendo upload para:', filePath);

      // Upload para Supabase Storage
      const { error } = await supabase.storage
        .from(CONTABIL_CONFIG.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase: Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      console.log('✅ Supabase: Upload realizado com sucesso');

      // Gerar URL pública para download
      const { data: urlData } = supabase.storage
        .from(CONTABIL_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath);

      const documento: DocumentoContabil = {
        nome: file.name,
        tipo,
        formato: fileExtension === '.pdf' ? 'PDF' : 'CSV',
        nomeArquivoSalvo,
        dataUpload: new Date(),
        ativo: true,
        url: urlData.publicUrl,
        tamanho: file.size,
        contentType: file.type
      };

      return documento;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  },

  // Listar documentos
  async listarDocumentos(): Promise<DocumentoContabil[]> {
    try {
      console.log('🔍 Listando documentos contábeis...');
      const documentos: DocumentoContabil[] = [];

      // Listar todos os documentos na pasta documentos
      try {
        console.log(`📁 Verificando pasta: documentos`);
        
        const { data, error } = await supabase.storage
          .from(CONTABIL_CONFIG.BUCKET_NAME)
          .list('documentos', {
            limit: 100,
            offset: 0
          });

        if (error) {
          if (error.message.includes('not found')) {
            console.log(`⚠️ Pasta documentos não encontrada, continuando...`);
            return documentos;
          }
          console.warn(`❌ Erro ao listar documentos:`, error);
          return documentos;
        }

        console.log(`📋 Arquivos encontrados em documentos:`, data);

        if (data && data.length > 0) {
          for (const file of data) {
            // Extrair nome original do arquivo (remover timestamp)
            const originalFileName = file.name.replace(/^\d+_/, '');
            
            console.log(`📄 Processando arquivo: ${file.name} -> ${originalFileName}`);
            
            // Gerar URL pública
            const { data: urlData } = supabase.storage
              .from(CONTABIL_CONFIG.BUCKET_NAME)
              .getPublicUrl(`documentos/${file.name}`);

            const fileExtension = originalFileName.toLowerCase().substring(originalFileName.lastIndexOf('.'));
            
            // Determinar tipo baseado no nome do arquivo ou extensão
            let tipoDocumento: 'DEMONSTRATIVO' | 'BALANCETE' = 'DEMONSTRATIVO';
            if (originalFileName.toLowerCase().includes('balancete')) {
              tipoDocumento = 'BALANCETE';
            }
            
            documentos.push({
              id: file.id,
              nome: originalFileName,
              tipo: tipoDocumento,
              formato: fileExtension === '.pdf' ? 'PDF' : 'CSV',
              nomeArquivoSalvo: file.name,
              url: urlData.publicUrl,
              tamanho: file.metadata?.size || 0,
              dataUpload: new Date(file.created_at),
              ativo: true,
              contentType: file.metadata?.mimetype || ''
            });
          }
        }
      } catch (error) {
        console.warn(`❌ Erro ao processar documentos:`, error);
      }

      console.log('✅ Documentos contábeis listados:', documentos);
      return documentos.sort((a, b) => b.dataUpload.getTime() - a.dataUpload.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      throw error;
    }
  },

  // Download de documento com URL temporária e logs
  async downloadDocumento(
    documento: DocumentoContabil, 
    usuarioId: string, 
    usuarioEmail: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const { userAgent, ipAddress } = obterInfoUsuario();
    
    try {
      if (!documento.nomeArquivoSalvo) {
        throw new Error('Nome do arquivo não encontrado');
      }

      const filePath = `documentos/${documento.nomeArquivoSalvo}`;

      console.log('📥 Supabase: Gerando URL de download para:', filePath);

      // Gerar URL temporária para download (30 minutos de expiração)
      const temporaryUrl = await this.generateTemporaryUrl(filePath, 1800);
      
      console.log('✅ URL temporária gerada, iniciando download...');

      // Baixar arquivo da URL temporária com progresso
      const response = await fetch(temporaryUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;
      
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          loaded += value.length;
          
          if (onProgress && total > 0) {
            const progress = Math.round((loaded / total) * 100);
            onProgress(progress);
          }
        }
      }
      
      const blob = new Blob(chunks);
      
      // Determinar tipo MIME baseado na extensão
      const fileExtension = documento.nome.substring(documento.nome.lastIndexOf('.')).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (fileExtension === '.pdf') mimeType = 'application/pdf';
      else if (fileExtension === '.csv') mimeType = 'text/csv';
      
      // Tentar usar showSaveFilePicker (navegadores modernos)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: documento.nome,
            types: [{
              description: "Documento Contábil",
              accept: { [mimeType]: [fileExtension] }
            }]
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          console.log('✅ Download concluído com showSaveFilePicker!');
          
          // Registrar log de sucesso
          await registrarLogDownload({
            documentoId: documento.id || documento.nomeArquivoSalvo,
            nomeDocumento: documento.nome,
            usuarioId,
            usuarioEmail,
            ipAddress,
            userAgent,
            sucesso: true
          });
          
          return;
        } catch (error) {
          console.warn('⚠️ showSaveFilePicker falhou, usando fallback:', error);
        }
      }
      
      // Fallback: Download tradicional com link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.nome;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download concluído com fallback!');
      
      // Registrar log de sucesso
      await registrarLogDownload({
        documentoId: documento.id || documento.nomeArquivoSalvo,
        nomeDocumento: documento.nome,
        usuarioId,
        usuarioEmail,
        ipAddress,
        userAgent,
        sucesso: true
      });
      
    } catch (error) {
      console.error('❌ Erro no download:', error);
      
      // Registrar log de erro
      await registrarLogDownload({
        documentoId: documento.id || documento.nomeArquivoSalvo || 'unknown',
        nomeDocumento: documento.nome,
        usuarioId,
        usuarioEmail,
        ipAddress,
        userAgent,
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      throw error;
    }
  },

  // Obter logs de download (apenas para admins)
  async obterLogsDownload(limit: number = 50): Promise<DownloadLog[]> {
    try {
      const { data, error } = await supabase
        .from('download_logs')
        .select('*')
        .order('dataDownload', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao obter logs: ${error.message}`);
      }

      return data?.map(log => ({
        ...log,
        dataDownload: new Date(log.dataDownload)
      })) || [];
    } catch (error) {
      console.error('❌ Erro ao obter logs de download:', error);
      throw error;
    }
  },

  // Obter logs de exclusão (apenas para admins)
  async obterLogsExclusao(limit: number = 50): Promise<DeleteLog[]> {
    try {
      const { data, error } = await supabase
        .from('delete_logs')
        .select('*')
        .order('data_exclusao', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao obter logs de exclusão: ${error.message}`);
      }

      return data?.map(log => ({
        id: log.id,
        documentoId: log.documento_id,
        nomeDocumento: log.nome_documento,
        usuarioId: log.usuario_id,
        usuarioTipo: log.usuario_tipo,
        dataExclusao: new Date(log.data_exclusao),
        tipoDocumento: log.tipo_documento
      })) || [];
    } catch (error) {
      console.error('❌ Erro ao obter logs de exclusão:', error);
      throw error;
    }
  },

  // Deletar documento (apenas para administradores)
  async deletarDocumento(
    nomeArquivoSalvo: string, 
    tipo: 'DEMONSTRATIVO' | 'BALANCETE',
    usuarioId?: string,
    usuarioTipo?: string
  ): Promise<void> {
    try {
      // Verificar se o usuário é administrador
      if (usuarioTipo && usuarioTipo !== 'admin') {
        throw new Error('Apenas administradores podem excluir documentos');
      }

      console.log('🗑️ Supabase: Deletando arquivo:', nomeArquivoSalvo);

      const filePath = `documentos/${nomeArquivoSalvo}`;
      
      const { error: storageError } = await supabase.storage
        .from(CONTABIL_CONFIG.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Supabase: Erro ao deletar arquivo:', storageError);
        throw new Error(`Erro ao deletar arquivo: ${storageError.message}`);
      }

      console.log('✅ Documento deletado com sucesso');

      // Registrar log de exclusão
      try {
        await supabase
          .from('delete_logs')
          .insert({
            documento_id: nomeArquivoSalvo,
            nome_documento: nomeArquivoSalvo.replace(/^\d+_/, ''), // Remove timestamp
            usuario_id: usuarioId || 'unknown',
            usuario_tipo: usuarioTipo || 'unknown',
            data_exclusao: new Date().toISOString(),
            tipo_documento: tipo
          });
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar log de exclusão:', logError);
        // Não falhar a exclusão por causa do log
      }
    } catch (error) {
      console.error('❌ Erro ao deletar documento:', error);
      throw error;
    }
  },
};
