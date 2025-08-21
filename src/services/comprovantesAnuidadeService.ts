import { supabase, COMPROVANTES_CONFIG } from '../config/supabase';
import { atletaService, equipeService, pagamentoService, anuidadeService } from './firebaseService';

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

// Função para buscar dados reais do atleta e equipe
const buscarDadosReais = async (atletaId: string, equipeId: string) => {
  try {
    console.log('🔍 Buscando dados reais do atleta e equipe...');
    
    // Buscar dados do atleta
    const atleta = await atletaService.getById(atletaId);
    if (!atleta) {
      throw new Error(`Atleta com ID ${atletaId} não encontrado`);
    }
    
    // Buscar dados da equipe
    const equipe = await equipeService.getById(equipeId);
    if (!equipe) {
      throw new Error(`Equipe com ID ${equipeId} não encontrada`);
    }
    
    console.log('✅ Dados encontrados:', {
      atleta: atleta.nome,
      equipe: equipe.nomeEquipe
    });
    
    return {
      nomeAtleta: atleta.nome,
      nomeEquipe: equipe.nomeEquipe
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados reais:', error);
    throw error;
  }
};

// Função para criar nome de pasta seguro (sem caracteres especiais)
const criarNomePastaSeguro = (nome: string): string => {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .toLowerCase();
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

  // Verificar se já existe comprovante para o atleta
  async verificarComprovanteExistente(atletaId: string, equipeId: string): Promise<ComprovanteAnuidade | null> {
    try {
      console.log('🔍 Verificando se já existe comprovante para o atleta:', atletaId);
      
      // Buscar dados reais do atleta e equipe
      const dadosReais = await buscarDadosReais(atletaId, equipeId);
      const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);
      
      const pastaNome = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}`;
      
      const { data, error } = await supabase.storage
        .from(COMPROVANTES_CONFIG.BUCKET_NAME)
        .list(pastaNome, {
          limit: 100,
          offset: 0
        });

      if (error) {
        if (error.message.includes('not found')) {
          console.log('📁 Pasta não encontrada, não há comprovantes existentes');
          return null;
        }
        throw new Error(`Erro ao verificar comprovantes existentes: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('📁 Nenhum comprovante encontrado');
        return null;
      }

      // Procurar por arquivo do atleta específico
      const comprovanteExistente = data.find(item => 
        item.name && item.name.includes(`_${atletaId}_`)
      );

      if (comprovanteExistente) {
        console.log('📁 Comprovante existente encontrado:', comprovanteExistente.name);
        
        // Extrair informações do arquivo existente
        const parts = comprovanteExistente.name.split('_');
        const timestamp = parts[0];
        const atletaIdFromFile = parts[1];
        const nomeOriginal = parts.slice(2).join('_');

        const filePath = `${pastaNome}/${comprovanteExistente.name}`;
        const { data: urlData } = supabase.storage
          .from(COMPROVANTES_CONFIG.BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          nome: nomeOriginal,
          nomeArquivoSalvo: comprovanteExistente.name,
          dataUpload: new Date(parseInt(timestamp)),
          status: 'PENDENTE',
          tamanho: comprovanteExistente.metadata?.size || 0,
          contentType: comprovanteExistente.metadata?.mimetype || 'application/octet-stream',
          url: urlData.publicUrl,
          atletaId: atletaIdFromFile,
          equipeId,
          nomeAtleta: dadosReais.nomeAtleta,
          nomeEquipe: dadosReais.nomeEquipe
        };
      }

      console.log('📁 Nenhum comprovante encontrado para este atleta');
      return null;
    } catch (error) {
      console.error('❌ Erro ao verificar comprovante existente:', error);
      throw error;
    }
  },

  // Deletar comprovante existente
  async deletarComprovanteExistente(atletaId: string, equipeId: string): Promise<void> {
    try {
      console.log('🗑️ Verificando e deletando comprovante existente...');
      
      const comprovanteExistente = await this.verificarComprovanteExistente(atletaId, equipeId);
      
      if (comprovanteExistente) {
        console.log('🗑️ Deletando comprovante existente:', comprovanteExistente.nomeArquivoSalvo);
        
        // Buscar dados reais para criar o caminho correto
        const dadosReais = await buscarDadosReais(atletaId, equipeId);
        const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);
        const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovanteExistente.nomeArquivoSalvo}`;
        
        const { error } = await supabase.storage
          .from(COMPROVANTES_CONFIG.BUCKET_NAME)
          .remove([filePath]);

        if (error) {
          throw new Error(`Erro ao deletar comprovante existente: ${error.message}`);
        }

        console.log('✅ Comprovante existente deletado com sucesso');
      } else {
        console.log('📁 Nenhum comprovante existente para deletar');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar comprovante existente:', error);
      throw error;
    }
  },

  // Upload de comprovante (com verificação de existente e substituição automática)
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

      // Buscar dados reais do atleta e equipe
      const dadosReais = await buscarDadosReais(atletaId, equipeId);
      const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);

      // Verificar se já existe comprovante para este atleta
      console.log('🔍 Verificando comprovante existente...');
      await this.deletarComprovanteExistente(atletaId, equipeId);

      // Gerar nome único para o arquivo (usando nome real do atleta)
      const timestamp = Date.now();
      const nomeArquivoSalvo = `${timestamp}_${atletaId}_${file.name}`;
      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${nomeArquivoSalvo}`;

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
        nomeAtleta: dadosReais.nomeAtleta,
        nomeEquipe: dadosReais.nomeEquipe
      };

      console.log('✅ Comprovante processado com sucesso:', {
        atleta: dadosReais.nomeAtleta,
        equipe: dadosReais.nomeEquipe,
        arquivo: file.name
      });

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

      // Buscar dados reais da equipe
      const equipe = await equipeService.getById(equipeId);
      if (!equipe) {
        console.warn('⚠️ Equipe não encontrada:', equipeId);
        return comprovantes;
      }

      const nomePastaEquipe = criarNomePastaSeguro(equipe.nomeEquipe);
      const pastaNome = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}`;
      
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

      // Processar cada arquivo encontrado
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
            const atletaIdFromFile = parts[1];
            const nomeOriginal = parts.slice(2).join('_');

            // Buscar dados reais do atleta
            const atleta = await atletaService.getById(atletaIdFromFile);
            const nomeAtleta = atleta ? atleta.nome : `Atleta ${atletaIdFromFile}`;

            const comprovante: ComprovanteAnuidade = {
              nome: nomeOriginal,
              nomeArquivoSalvo: item.name,
              dataUpload: new Date(parseInt(timestamp)),
              status: 'PENDENTE',
              tamanho: item.metadata?.size || 0,
              contentType: item.metadata?.mimetype || 'application/octet-stream',
              url: urlData.publicUrl,
              atletaId: atletaIdFromFile,
              equipeId,
              nomeAtleta,
              nomeEquipe: equipe.nomeEquipe
            };

            comprovantes.push(comprovante);
          } catch (itemError) {
            console.warn(`⚠️ Erro ao processar arquivo ${item.name}:`, itemError);
          }
        }
      }

      console.log(`✅ ${comprovantes.length} comprovantes encontrados para equipe ${equipe.nomeEquipe}`);
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
        if (equipeFolder.name && !equipeFolder.name.endsWith('/')) {
          try {
            // Tentar encontrar a equipe pelo nome da pasta
            const equipes = await equipeService.getAll();
            const equipe = equipes.find(eq => 
              criarNomePastaSeguro(eq.nomeEquipe) === equipeFolder.name
            );

            if (equipe) {
              const comprovantesEquipe = await this.listarComprovantesPorEquipe(equipe.id!);
              comprovantes.push(...comprovantesEquipe);
            } else {
              console.warn(`⚠️ Equipe não encontrada para pasta: ${equipeFolder.name}`);
            }
          } catch (equipeError) {
            console.warn(`⚠️ Erro ao listar comprovantes da pasta ${equipeFolder.name}:`, equipeError);
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
      const nomePastaEquipe = criarNomePastaSeguro(comprovante.nomeEquipe);
      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovante.nomeArquivoSalvo}`;

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

      const nomePastaEquipe = criarNomePastaSeguro(comprovante.nomeEquipe);
      const filePath = `${COMPROVANTES_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovante.nomeArquivoSalvo}`;

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

  // Funções de aprovação com integração completa ao Firebase
  async aprovarComprovante(comprovante: ComprovanteAnuidade, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`✅ Aprovando comprovante de ${comprovante.nomeAtleta} (${comprovante.nomeEquipe})`);
      
      // Buscar valor da anuidade configurada
      const anuidade = await anuidadeService.getAtivo();
      if (!anuidade) {
        throw new Error('Nenhuma anuidade ativa configurada no sistema');
      }
      
      const valorAnuidade = anuidade.valor || 0;
      console.log(`💰 Valor da anuidade: R$ ${valorAnuidade.toFixed(2)}`);
      
      // Aprovar comprovante no Firebase
      await pagamentoService.aprovarComprovante(
        comprovante.atletaId,
        valorAnuidade,
        adminNome,
        observacoes
      );
      
      // Atualizar o status do comprovante localmente
      comprovante.status = 'APROVADO';
      comprovante.valor = valorAnuidade;
      comprovante.dataPagamento = new Date();
      
      console.log(`✅ Comprovante aprovado com sucesso por ${adminNome}:`, comprovante.nome);
      console.log(`👤 Atleta: ${comprovante.nomeAtleta} (${comprovante.atletaId})`);
      console.log(`🏆 Equipe: ${comprovante.nomeEquipe} (${comprovante.equipeId})`);
      console.log(`💰 Valor: R$ ${valorAnuidade.toFixed(2)}`);
      
      if (observacoes) {
        console.log(`📝 Observações: ${observacoes}`);
      }
      
      console.log('✅ Status do atleta atualizado automaticamente para ATIVO');
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante:', error);
      throw error;
    }
  },

  async rejeitarComprovante(comprovante: ComprovanteAnuidade, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`❌ Rejeitando comprovante de ${comprovante.nomeAtleta} (${comprovante.nomeEquipe})`);
      
      // Rejeitar comprovante no Firebase
      await pagamentoService.rejeitarComprovante(
        comprovante.atletaId,
        adminNome,
        observacoes
      );
      
      // Atualizar o status do comprovante localmente
      comprovante.status = 'REJEITADO';
      
      console.log(`❌ Comprovante rejeitado com sucesso por ${adminNome}:`, comprovante.nome);
      console.log(`👤 Atleta: ${comprovante.nomeAtleta} (${comprovante.atletaId})`);
      console.log(`🏆 Equipe: ${comprovante.nomeEquipe} (${comprovante.equipeId})`);
      
      if (observacoes) {
        console.log(`📝 Observações: ${observacoes}`);
      }
      
      console.log('✅ Status do atleta mantido (não alterado)');
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante:', error);
      throw error;
    }
  }
};