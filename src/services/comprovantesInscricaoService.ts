import { supabase } from '../config/supabase';
import { atletaService, equipeService, competicaoService, inscricaoService } from './firebaseService';
import { notificacoesService } from './notificacoesService';

// Interface para comprovante de inscrição
export interface ComprovanteInscricao {
  id?: string;
  nome: string;
  nomeArquivoSalvo: string;
  dataUpload: Date;
  dataAprovacao?: Date;
  valor: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  observacoes?: string;
  tamanho: number;
  contentType: string;
  url: string;
  atletaId: string;
  equipeId: string;
  competicaoId: string;
  inscricaoId: string;
  nomeAtleta: string;
  nomeEquipe: string;
  nomeCompeticao: string;
}

// Interface para log de aprovação
export interface LogAprovacaoInscricao {
  id: string;
  comprovanteId: string;
  atletaId: string;
  equipeId: string;
  competicaoId: string;
  adminId: string;
  adminNome: string;
  acao: 'APROVAR' | 'REJEITAR';
  dataAcao: Date;
  observacoes?: string;
}

// Configurações específicas para comprovantes de inscrição
const COMPROVANTES_INSCRICAO_CONFIG = {
  BUCKET_NAME: 'financeiro',
  FOLDER_NAME: 'comprovantes-inscricao',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB em bytes
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'],
  ALLOWED_MIME_TYPES: [
    'application/pdf', 
    'image/png', 
    'image/jpeg', 
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
  ]
};

// Função para validar arquivo
const validateFile = (file: File): void => {
  if (file.size > COMPROVANTES_INSCRICAO_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${COMPROVANTES_INSCRICAO_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!COMPROVANTES_INSCRICAO_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Tipo de arquivo não permitido. Extensões aceitas: ${COMPROVANTES_INSCRICAO_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
  }

  if (!COMPROVANTES_INSCRICAO_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Tipo MIME não permitido. Tipos aceitos: ${COMPROVANTES_INSCRICAO_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`);
  }
};

// Função para buscar dados reais da equipe e competição
const buscarDadosReais = async (equipeId: string, competicaoId: string) => {
  const [equipe, competicao] = await Promise.all([
    equipeService.getById(equipeId),
    competicaoService.getById(competicaoId)
  ]);

  if (!equipe) throw new Error('Equipe não encontrada');
  if (!competicao) throw new Error('Competição não encontrada');

  return {
    nomeEquipe: equipe.nomeEquipe,
    nomeCompeticao: competicao.nomeCompeticao
  };
};

// Função para criar nome de pasta seguro
const criarNomePastaSeguro = (nome: string): string => {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const comprovantesInscricaoService = {
  // Gerar URL temporária com expiração
  async generateTemporaryUrl(filePath: string, expiresIn: number = 1800): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Erro ao gerar URL temporária: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erro ao gerar URL temporária:', error);
      throw error;
    }
  },

  // Verificar se já existe comprovante para esta inscrição
  async verificarComprovanteExistente(equipeId: string, competicaoId: string): Promise<ComprovanteInscricao | null> {
    try {
      const dadosReais = await buscarDadosReais(equipeId, competicaoId);
      const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);
      const pastaNome = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}`;

      const { data, error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
        .list(pastaNome, {
          limit: 100,
          offset: 0
        });

      if (error) {
        if (error.message.includes('not found')) {
          return null;
        }
        throw new Error(`Erro ao verificar comprovante existente: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Procurar por arquivo que contenha equipeId e competicaoId
      for (const item of data) {
        if (item.name && !item.name.endsWith('/')) {
          const parts = item.name.split('_');
          const equipeIdFromFile = parts[1];
          const competicaoIdFromFile = parts[2];

          if (equipeIdFromFile === equipeId && competicaoIdFromFile === competicaoId) {
            const filePath = `${pastaNome}/${item.name}`;
            const { data: urlData } = supabase.storage
              .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
              .getPublicUrl(filePath);

            const nomeOriginal = parts.slice(3).join('_');

            // Buscar status real do Firebase baseado nas inscrições
            const inscricoesEquipe = await inscricaoService.getByCompeticao(competicaoId);
            const inscricoesFiltradas = inscricoesEquipe.filter(insc => 
              insc.atleta && insc.atleta.idEquipe === equipeId
            );
            
            // Determinar status baseado nas inscrições
            let statusComprovante: 'PENDENTE' | 'APROVADO' | 'REJEITADO' = 'PENDENTE';
            if (inscricoesFiltradas.length > 0) {
              const inscricao = inscricoesFiltradas[0];
              if (inscricao.statusInscricao === 'INSCRITO' && inscricao.dataAprovacao) {
                statusComprovante = 'APROVADO';
              } else if (inscricao.statusInscricao === 'CANCELADO' && inscricao.dataRejeicao) {
                statusComprovante = 'REJEITADO';
              }
            }

            // Buscar valor da competição
            const competicao = await competicaoService.getById(competicaoId);
            const valorCompeticao = competicao ? competicao.valorInscricao : 0;

            return {
              nome: nomeOriginal,
              nomeArquivoSalvo: item.name,
              dataUpload: new Date(parseInt(parts[0])),
              status: statusComprovante,
              tamanho: item.metadata?.size || 0,
              contentType: item.metadata?.mimetype || 'application/octet-stream',
              url: urlData.publicUrl,
              atletaId: '', // Não é específico de atleta
              equipeId,
              competicaoId,
              inscricaoId: '', // Será preenchido depois
              nomeAtleta: 'Equipe', // Genérico para equipe
              nomeEquipe: dadosReais.nomeEquipe,
              nomeCompeticao: dadosReais.nomeCompeticao,
              valor: valorCompeticao // Valor da competição
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao verificar comprovante existente:', error);
      throw error;
    }
  },

  // Deletar comprovante existente
  async deletarComprovanteExistente(equipeId: string, competicaoId: string): Promise<void> {
    try {
      console.log('🗑️ Verificando e deletando comprovante existente...');
      
      const comprovanteExistente = await this.verificarComprovanteExistente(equipeId, competicaoId);
      
      if (comprovanteExistente) {
        console.log('🗑️ Deletando comprovante existente:', comprovanteExistente.nomeArquivoSalvo);
        
        const dadosReais = await buscarDadosReais(equipeId, competicaoId);
        const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);
        const filePath = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovanteExistente.nomeArquivoSalvo}`;
        
        const { error } = await supabase.storage
          .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
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

  // Upload de comprovante de inscrição
  async uploadComprovante(
    file: File,
    equipeId: string,
    competicaoId: string,
    nomeEquipe: string,
    nomeCompeticao: string,
    valor: number,
    observacoes?: string
  ): Promise<ComprovanteInscricao> {
    try {
      console.log('📁 Validando arquivo...');
      validateFile(file);

      // Buscar dados reais da equipe e competição
      const dadosReais = await buscarDadosReais(equipeId, competicaoId);
      const nomePastaEquipe = criarNomePastaSeguro(dadosReais.nomeEquipe);

      // Verificar se já existe comprovante para esta inscrição
      console.log('🔍 Verificando comprovante existente...');
      await this.deletarComprovanteExistente(equipeId, competicaoId);

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const nomeArquivoSalvo = `${timestamp}_${equipeId}_${competicaoId}_${file.name}`;
      const filePath = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${nomeArquivoSalvo}`;

      console.log('📁 Fazendo upload para:', filePath);

      // Upload para Supabase Storage
      const { error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      console.log('✅ Upload realizado com sucesso');

      // Gerar URL pública para download
      const { data: urlData } = supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath);

      const comprovante: ComprovanteInscricao = {
        nome: file.name,
        nomeArquivoSalvo,
        dataUpload: new Date(),
        valor,
        status: 'PENDENTE',
        observacoes,
        tamanho: file.size,
        contentType: file.type,
        url: urlData.publicUrl,
        atletaId: '', // Não é específico de atleta
        equipeId,
        competicaoId,
        inscricaoId: '', // Será preenchido depois se necessário
        nomeAtleta: 'Equipe', // Genérico para equipe
        nomeEquipe: dadosReais.nomeEquipe,
        nomeCompeticao: dadosReais.nomeCompeticao
      };

      console.log('✅ Comprovante processado com sucesso:', {
        equipe: dadosReais.nomeEquipe,
        competicao: dadosReais.nomeCompeticao,
        arquivo: file.name
      });

      // Criar notificação automática no mural
      try {
        await notificacoesService.criarNotificacaoAutomatica(
          equipeId,
          dadosReais.nomeEquipe,
          'COMPROVANTE_INSCRICAO',
          file.name
        );
        console.log('✅ Notificação criada automaticamente');
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        // Não falhar o upload se a notificação falhar
      }

      return comprovante;
    } catch (error) {
      console.error('❌ Erro no upload do comprovante:', error);
      throw error;
    }
  },

  // Listar comprovantes por equipe
  async listarComprovantesPorEquipe(equipeId: string): Promise<ComprovanteInscricao[]> {
    try {
      console.log('🔍 Listando comprovantes de inscrição da equipe:', equipeId);
      const comprovantes: ComprovanteInscricao[] = [];

      // Buscar dados reais da equipe
      const equipe = await equipeService.getById(equipeId);
      if (!equipe) {
        console.warn('⚠️ Equipe não encontrada:', equipeId);
        return comprovantes;
      }

      const nomePastaEquipe = criarNomePastaSeguro(equipe.nomeEquipe);
      const pastaNome = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}`;
      
      console.log(`📁 Verificando pasta: ${pastaNome}`);
      
      const { data, error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
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
              .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
              .getPublicUrl(filePath);

            // Extrair informações do nome do arquivo
            const parts = item.name.split('_');
            const timestamp = parts[0];
            const atletaIdFromFile = parts[1];
            const competicaoIdFromFile = parts[2];
            const nomeOriginal = parts.slice(3).join('_');

            // Buscar dados reais do atleta e competição
            const [atleta, competicao] = await Promise.all([
              atletaService.getById(atletaIdFromFile),
              competicaoService.getById(competicaoIdFromFile)
            ]);

            const nomeAtleta = atleta ? atleta.nome : `Atleta ${atletaIdFromFile}`;
            const nomeCompeticao = competicao ? competicao.nomeCompeticao : `Competição ${competicaoIdFromFile}`;

            // Buscar status real do Firebase baseado nas inscrições
            const inscricoesEquipe = await inscricaoService.getByCompeticao(competicaoIdFromFile);
            const inscricoesFiltradas = inscricoesEquipe.filter(insc => 
              insc.atleta && insc.atleta.idEquipe === equipeId
            );
            
            // Determinar status baseado nas inscrições
            let statusComprovante: 'PENDENTE' | 'APROVADO' | 'REJEITADO' = 'PENDENTE';
            if (inscricoesFiltradas.length > 0) {
              const inscricao = inscricoesFiltradas[0];
              if (inscricao.statusInscricao === 'INSCRITO' && inscricao.dataAprovacao) {
                statusComprovante = 'APROVADO';
              } else if (inscricao.statusInscricao === 'CANCELADO' && inscricao.dataRejeicao) {
                statusComprovante = 'REJEITADO';
              }
            }

            // Buscar valor da competição
            const valorCompeticao = competicao ? competicao.valorInscricao : 0;

            const comprovante: ComprovanteInscricao = {
              nome: nomeOriginal,
              nomeArquivoSalvo: item.name,
              dataUpload: new Date(parseInt(timestamp)),
              status: statusComprovante,
              tamanho: item.metadata?.size || 0,
              contentType: item.metadata?.mimetype || 'application/octet-stream',
              url: urlData.publicUrl,
              atletaId: atletaIdFromFile,
              equipeId,
              competicaoId: competicaoIdFromFile,
              inscricaoId: '', // Será preenchido depois
              nomeAtleta,
              nomeEquipe: equipe.nomeEquipe,
              nomeCompeticao,
              valor: valorCompeticao // Valor da competição
            };

            comprovantes.push(comprovante);
          } catch (itemError) {
            console.warn(`⚠️ Erro ao processar arquivo ${item.name}:`, itemError);
          }
        }
      }

      console.log(`✅ ${comprovantes.length} comprovantes de inscrição encontrados para equipe ${equipe.nomeEquipe}`);
      return comprovantes.sort((a, b) => b.dataUpload.getTime() - a.dataUpload.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar comprovantes de inscrição:', error);
      throw error;
    }
  },

  // Listar todos os comprovantes (apenas para admin)
  async listarTodosComprovantes(): Promise<ComprovanteInscricao[]> {
    try {
      console.log('🔍 Listando todos os comprovantes de inscrição...');
      const comprovantes: ComprovanteInscricao[] = [];

      const { data, error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
        .list(COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME, {
          limit: 100,
          offset: 0
        });

      if (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️ Pasta ${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME} não encontrada`);
          return comprovantes;
        }
        throw new Error(`Erro ao listar comprovantes: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`📁 Pasta ${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME} está vazia`);
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

      console.log(`✅ ${comprovantes.length} comprovantes de inscrição encontrados no total`);
      return comprovantes.sort((a, b) => b.dataUpload.getTime() - a.dataUpload.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar comprovantes de inscrição:', error);
      throw error;
    }
  },

  // Download de comprovante
  async downloadComprovante(comprovante: ComprovanteInscricao): Promise<void> {
    try {
      const nomePastaEquipe = criarNomePastaSeguro(comprovante.nomeEquipe);
      const filePath = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovante.nomeArquivoSalvo}`;

      console.log('📥 Gerando URL de download para:', filePath);

      // Gerar URL temporária para download (30 minutos de expiração)
      const urlTemporaria = await this.generateTemporaryUrl(filePath, 1800);

      // Baixar arquivo
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

  // Deletar comprovante
  async deletarComprovante(comprovante: ComprovanteInscricao, isAdmin: boolean, equipeUsuario?: string): Promise<void> {
    try {
      // Verificar permissões
      if (!isAdmin && equipeUsuario !== comprovante.equipeId) {
        throw new Error('Você não tem permissão para excluir este comprovante');
      }

      const nomePastaEquipe = criarNomePastaSeguro(comprovante.nomeEquipe);
      const filePath = `${COMPROVANTES_INSCRICAO_CONFIG.FOLDER_NAME}/${nomePastaEquipe}/${comprovante.nomeArquivoSalvo}`;

      console.log('🗑️ Deletando comprovante:', filePath);

      const { error } = await supabase.storage
        .from(COMPROVANTES_INSCRICAO_CONFIG.BUCKET_NAME)
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

  // Funções de aprovação
  async aprovarComprovante(comprovante: ComprovanteInscricao, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`✅ Aprovando comprovante de inscrição da equipe ${comprovante.nomeEquipe} para ${comprovante.nomeCompeticao}`);
      
      // Atualizar o status do comprovante localmente
      comprovante.status = 'APROVADO';
      comprovante.dataAprovacao = new Date();
      
      // Atualizar status da equipe e inscrições no Firebase
      await equipeService.aprovarComprovanteInscricao(
        comprovante.equipeId,
        comprovante.competicaoId,
        adminNome,
        observacoes
      );
      
      console.log(`✅ Comprovante de inscrição aprovado com sucesso por ${adminNome}:`, comprovante.nome);
      console.log(`🏆 Equipe: ${comprovante.nomeEquipe} (${comprovante.equipeId})`);
      console.log(`🏁 Competição: ${comprovante.nomeCompeticao} (${comprovante.competicaoId})`);
      
      if (observacoes) {
        console.log(`📝 Observações: ${observacoes}`);
      }
      
      console.log('✅ Status do comprovante e equipe atualizados para APROVADO');
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante de inscrição:', error);
      throw error;
    }
  },

  async rejeitarComprovante(comprovante: ComprovanteInscricao, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`❌ Rejeitando comprovante de inscrição da equipe ${comprovante.nomeEquipe} para ${comprovante.nomeCompeticao}`);
      
      // Atualizar o status do comprovante localmente
      comprovante.status = 'REJEITADO';
      
      // Atualizar status das inscrições no Firebase
      await equipeService.rejeitarComprovanteInscricao(
        comprovante.equipeId,
        comprovante.competicaoId,
        adminNome,
        observacoes
      );
      
      console.log(`❌ Comprovante de inscrição rejeitado com sucesso por ${adminNome}:`, comprovante.nome);
      console.log(`🏆 Equipe: ${comprovante.nomeEquipe} (${comprovante.equipeId})`);
      console.log(`🏁 Competição: ${comprovante.nomeCompeticao} (${comprovante.competicaoId})`);
      
      if (observacoes) {
        console.log(`📝 Observações: ${observacoes}`);
      }
      
      console.log('✅ Status do comprovante e inscrições atualizados para REJEITADO');
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante de inscrição:', error);
      throw error;
    }
  }
};
