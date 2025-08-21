import { supabase, COMPROVANTES_CONFIG } from '../config/supabase';

// Interface para log de aprovação (mantida para compatibilidade)
export interface LogAprovacao {
  id?: string;
  comprovanteId: string;
  atletaId: string;
  equipeId: string;
  adminId: string;
  adminNome: string;
  acao: 'APROVAR' | 'REJEITAR';
  dataAcao: Date;
  observacoes?: string;
}

// Interface para comprovante de anuidade (igual ao sistema de prestação de contas)
export interface ComprovanteAnuidade {
  id?: string;
  nome: string;
  nomeArquivoSalvo: string;
  dataUpload: Date;
  dataPagamento?: Date;
  valor?: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  observacoes?: string;
  aprovadoPor?: string;
  dataAprovacao?: Date;
  tamanho: number;
  contentType: string;
  url?: string;
  urlTemporaria?: string;
  // Metadados específicos para anuidade
  atletaId: string;
  equipeId: string;
  nomeAtleta: string;
  nomeEquipe: string;
}

// Validação de arquivo (igual ao sistema de prestação de contas)
const validateFile = (file: File): void => {
  // Verificar tamanho
  if (file.size > COMPROVANTES_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${COMPROVANTES_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verificar extensão
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!COMPROVANTES_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Extensão não permitida. Extensões aceitas: ${COMPROVANTES_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Verificar tipo MIME
  if (!COMPROVANTES_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
};

// Serviço de comprovantes de anuidade (replicando o sistema de prestação de contas)
export const comprovantesAnuidadeService = {
  // Gerar URL temporária com expiração (igual ao sistema de prestação de contas)
  async generateTemporaryUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
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

  // Upload de comprovante (adaptado do sistema de prestação de contas)
  async uploadComprovante(
    file: File,
    atletaId: string,
    equipeId: string,
    nomeAtleta: string,
    nomeEquipe: string,
    dataPagamento: Date,
    valor: number,
    observacoes?: string
  ): Promise<ComprovanteAnuidade> {
    try {
      console.log('📁 Validando arquivo...');
      validateFile(file);

      // Gerar nome único para o arquivo (igual ao sistema de prestação de contas)
      const timestamp = Date.now();
      const nomeArquivoSalvo = `${timestamp}_${equipeId}_${atletaId}_${file.name}`;
      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/equipe_${equipeId}/${nomeArquivoSalvo}`;

      console.log('📁 Fazendo upload para:', filePath);

      // Upload para Supabase Storage (igual ao sistema de prestação de contas)
      const { error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      console.log('✅ Upload realizado com sucesso');

      // Gerar URL pública para download (igual ao sistema de prestação de contas)
      const { data: urlData } = supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath);

      const comprovante: ComprovanteAnuidade = {
        nome: file.name,
        nomeArquivoSalvo,
        dataUpload: new Date(),
        dataPagamento,
        valor,
        status: 'PENDENTE',
        observacoes,
        tamanho: file.size,
        contentType: file.type,
        url: urlData.publicUrl,
        atletaId,
        equipeId,
        nomeAtleta,
        nomeEquipe
      };

      return comprovante;
    } catch (error) {
      console.error('❌ Erro no upload do comprovante:', error);
      throw error;
    }
  },

  // Listar comprovantes por equipe (adaptado do sistema de prestação de contas)
  async listarComprovantesPorEquipe(equipeId: string): Promise<ComprovanteAnuidade[]> {
    try {
      console.log('🔍 Listando comprovantes da equipe:', equipeId);
      const comprovantes: ComprovanteAnuidade[] = [];

      const pastaNome = `${COMPROVANTES_CONFIG.FOLDER_NAME}/equipe_${equipeId}`;
      
      console.log(`📁 Verificando pasta: ${pastaNome}`);
      
      const { data, error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .list(pastaNome, {
          limit: 100,
          offset: 0
        });

      if (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️ Pasta ${pastaNome} não encontrada, retornando lista vazia`);
          return comprovantes;
        }
        throw new Error(`Erro ao listar comprovantes: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`📁 Pasta ${pastaNome} está vazia`);
        return comprovantes;
      }

      // Processar cada arquivo encontrado (igual ao sistema de prestação de contas)
      for (const item of data) {
        if (item.name && !item.name.endsWith('/')) {
          try {
            const filePath = `${pastaNome}/${item.name}`;
            
            // Gerar URL pública
            const { data: urlData } = supabase.storage
              .from(COMPROVANTES_CONFIG.BUCKET_NAME)
              .getPublicUrl(filePath);

            // Extrair informações do nome do arquivo
            const parts = item.name.split('_');
            const timestamp = parts[0];
            const equipeIdFromFile = parts[1];
            const atletaIdFromFile = parts[2];
            const nomeOriginal = parts.slice(3).join('_');

            const comprovante: ComprovanteAnuidade = {
              nome: nomeOriginal,
              nomeArquivoSalvo: item.name,
              dataUpload: new Date(parseInt(timestamp)),
              status: 'PENDENTE', // Padrão, pode ser customizado
              tamanho: item.metadata?.size || 0,
              contentType: item.metadata?.mimetype || 'application/octet-stream',
              url: urlData.publicUrl,
              atletaId: atletaIdFromFile,
              equipeId: equipeIdFromFile,
              nomeAtleta: `Atleta ${atletaIdFromFile}`, // Seria obtido do Firebase em um caso real
              nomeEquipe: `Equipe ${equipeIdFromFile}` // Seria obtido do Firebase em um caso real
            };

            comprovantes.push(comprovante);
          } catch (itemError) {
            console.warn(`⚠️ Erro ao processar arquivo ${item.name}:`, itemError);
          }
        }
      }

      console.log(`✅ ${comprovantes.length} comprovantes encontrados para equipe ${equipeId}`);
      return comprovantes.sort((a, b) => b.dataUpload.getTime() - a.dataUpload.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar comprovantes:', error);
      throw error;
    }
  },

  // Listar todos os comprovantes (apenas para admin)
  async listarTodosComprovantes(): Promise<ComprovanteAnuidade[]> {
    try {
      console.log('🔍 Listando todos os comprovantes...');
      const comprovantes: ComprovanteAnuidade[] = [];

      const { data, error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .list(COMPROVANTES_CONFIG.FOLDER_NAME, {
          limit: 100,
          offset: 0
        });

      if (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️ Pasta ${COMPROVANTES_CONFIG.FOLDER_NAME} não encontrada`);
          return comprovantes;
        }
        throw new Error(`Erro ao listar comprovantes: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`📁 Pasta ${COMPROVANTES_CONFIG.FOLDER_NAME} está vazia`);
        return comprovantes;
      }

      // Processar cada equipe encontrada
      for (const equipeFolder of data) {
        if (equipeFolder.name && equipeFolder.name.startsWith('equipe_')) {
          const equipeId = equipeFolder.name.replace('equipe_', '');
          try {
            const comprovantesEquipe = await this.listarComprovantesPorEquipe(equipeId);
            comprovantes.push(...comprovantesEquipe);
          } catch (equipeError) {
            console.warn(`⚠️ Erro ao listar comprovantes da equipe ${equipeId}:`, equipeError);
          }
        }
      }

      console.log(`✅ ${comprovantes.length} comprovantes encontrados no total`);
      return comprovantes.sort((a, b) => b.dataUpload.getTime() - a.dataUpload.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar comprovantes:', error);
      throw error;
    }
  },

  // Download de comprovante (igual ao sistema de prestação de contas)
  async downloadComprovante(comprovante: ComprovanteAnuidade): Promise<void> {
    try {
      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/equipe_${comprovante.equipeId}/${comprovante.nomeArquivoSalvo}`;

      console.log('📥 Gerando URL de download para:', filePath);

      // Gerar URL temporária para download (30 minutos de expiração)
      const urlTemporaria = await this.generateTemporaryUrl(filePath, 1800);

      // Baixar arquivo (igual ao sistema de prestação de contas)
      const response = await fetch(urlTemporaria);
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = comprovante.nome;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Download do comprovante concluído!');
    } catch (error) {
      console.error('❌ Erro no download:', error);
      throw error;
    }
  },

  // Deletar comprovante (igual ao sistema de prestação de contas)
  async deletarComprovante(comprovante: ComprovanteAnuidade, isAdmin: boolean, equipeUsuario?: string): Promise<void> {
    try {
      // Verificar permissões (igual ao sistema de prestação de contas)
      if (!isAdmin && equipeUsuario !== comprovante.equipeId) {
        throw new Error('Você não tem permissão para excluir este comprovante');
      }

      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/equipe_${comprovante.equipeId}/${comprovante.nomeArquivoSalvo}`;

      console.log('🗑️ Deletando comprovante:', filePath);

      const { error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Erro ao deletar comprovante: ${error.message}`);
      }

      console.log('✅ Comprovante deletado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao deletar comprovante:', error);
      throw error;
    }
  },

  // Funções de aprovação simplificadas (sem banco, usando metadados do arquivo)
  async aprovarComprovante(comprovante: ComprovanteAnuidade, adminNome: string, observacoes?: string): Promise<void> {
    // Em um sistema real, estas informações seriam salvas no Firebase ou em metadados
    console.log(`✅ Comprovante aprovado por ${adminNome}:`, comprovante.nome);
    if (observacoes) {
      console.log(`📝 Observações: ${observacoes}`);
    }
  },

  async rejeitarComprovante(comprovante: ComprovanteAnuidade, adminNome: string, observacoes?: string): Promise<void> {
    // Em um sistema real, estas informações seriam salvas no Firebase ou em metadados
    console.log(`❌ Comprovante rejeitado por ${adminNome}:`, comprovante.nome);
    if (observacoes) {
      console.log(`📝 Observações: ${observacoes}`);
    }
  }
};