import { competicaoService, inscricaoService } from './firebaseService';
import { Competicao, InscricaoCompeticao } from '../types';

export interface AtletasPorCategoria {
  categoriaPeso: string;
  atletas: InscricaoCompeticao[];
}

export interface NominacaoData {
  competicao: Competicao;
  inscricoes: InscricaoCompeticao[];
  atletasPorCategoria: AtletasPorCategoria[];
  totalInscritos: number;
  totalAprovados: number;
}

export const nominacaoService = {
  // Função para organizar atletas por categoria de peso
  organizarAtletasPorCategoria(inscricoes: InscricaoCompeticao[]): AtletasPorCategoria[] {
    const categoriasMap = new Map<string, InscricaoCompeticao[]>();
    
    // Filtrar apenas atletas que NÃO estão cancelados
    const inscricoesAtivas = inscricoes.filter(inscricao => 
      inscricao.statusInscricao !== 'CANCELADO'
    );
    
    console.log(`📊 [NOMINAÇÃO] Total de inscrições: ${inscricoes.length}, Ativas (não canceladas): ${inscricoesAtivas.length}`);
    
    inscricoesAtivas.forEach(inscricao => {
      const categoriaPeso = inscricao.categoriaPeso?.nome || 'Sem Categoria';
      
      if (!categoriasMap.has(categoriaPeso)) {
        categoriasMap.set(categoriaPeso, []);
      }
      categoriasMap.get(categoriaPeso)!.push(inscricao);
    });
    
    // Converter para array e ordenar por nome da categoria
    return Array.from(categoriasMap.entries())
      .map(([categoriaPeso, atletas]) => ({
        categoriaPeso,
        atletas: atletas.sort((a, b) => (a.atleta?.nome || '').localeCompare(b.atleta?.nome || ''))
      }))
      .sort((a, b) => a.categoriaPeso.localeCompare(b.categoriaPeso));
  },

  async getAllNominacoes(): Promise<NominacaoData[]> {
    try {
      console.log('🔄 [NOMINAÇÃO] Iniciando busca de competições...');
      
      // Buscar apenas competições agendadas
      const todasCompeticoes = await competicaoService.getAll();
      const competicoes = todasCompeticoes.filter(competicao => competicao.status === 'AGENDADA');
      console.log('📊 [NOMINAÇÃO] Competições encontradas:', todasCompeticoes.length);
      console.log('📊 [NOMINAÇÃO] Competições agendadas:', competicoes.length);

      const nominacoes: NominacaoData[] = [];

      // Para cada competição, buscar as inscrições
      for (const competicao of competicoes) {
        try {
          console.log(`🔍 [NOMINAÇÃO] Buscando inscrições para: ${competicao.nomeCompeticao}`);
          
          // Buscar inscrições da competição
          const inscricoes = await inscricaoService.getByCompeticao(competicao.id!);
          console.log(`📝 [NOMINAÇÃO] Inscrições encontradas para ${competicao.nomeCompeticao}:`, inscricoes.length);

          // Contar inscrições aprovadas (INSCRITO = aprovado) - excluindo cancelados
          const totalAprovados = inscricoes.filter((inscricao: InscricaoCompeticao) => 
            inscricao.statusInscricao === 'INSCRITO'
          ).length;

          // Organizar atletas por categoria de peso
          const atletasPorCategoria = this.organizarAtletasPorCategoria(inscricoes);

          const nominacao: NominacaoData = {
            competicao,
            inscricoes,
            atletasPorCategoria,
            totalInscritos: inscricoes.length,
            totalAprovados
          };

          nominacoes.push(nominacao);
          console.log(`✅ [NOMINAÇÃO] Processada: ${competicao.nomeCompeticao} - ${totalAprovados} aprovados de ${inscricoes.length} inscritos`);

        } catch (error) {
          console.error(`❌ [NOMINAÇÃO] Erro ao processar competição ${competicao.nomeCompeticao}:`, error);
          
          // Adicionar competição mesmo sem inscrições
          const nominacao: NominacaoData = {
            competicao,
            inscricoes: [],
            atletasPorCategoria: [],
            totalInscritos: 0,
            totalAprovados: 0
          };
          nominacoes.push(nominacao);
        }
      }

      console.log('✅ [NOMINAÇÃO] Total de nominações processadas:', nominacoes.length);
      return nominacoes;

    } catch (error) {
      console.error('❌ [NOMINAÇÃO] Erro ao buscar nominações:', error);
      throw error;
    }
  },

  async getNominacaoByCompeticaoId(competicaoId: string): Promise<NominacaoData | null> {
    try {
      console.log(`🔍 [NOMINAÇÃO] Buscando nominação para competição: ${competicaoId}`);
      
      // Buscar competição
      const competicao = await competicaoService.getById(competicaoId);
      if (!competicao) {
        console.log(`❌ [NOMINAÇÃO] Competição não encontrada: ${competicaoId}`);
        return null;
      }

      // Buscar inscrições
      const inscricoes = await inscricaoService.getByCompeticao(competicaoId);
      console.log(`📝 [NOMINAÇÃO] Inscrições encontradas:`, inscricoes.length);

      // Contar aprovados (INSCRITO = aprovado) - excluindo cancelados
      const totalAprovados = inscricoes.filter((inscricao: InscricaoCompeticao) => 
        inscricao.statusInscricao === 'INSCRITO'
      ).length;

      // Organizar atletas por categoria de peso
      const atletasPorCategoria = this.organizarAtletasPorCategoria(inscricoes);

      const nominacao: NominacaoData = {
        competicao,
        inscricoes,
        atletasPorCategoria,
        totalInscritos: inscricoes.length,
        totalAprovados
      };

      console.log(`✅ [NOMINAÇÃO] Nominação encontrada: ${competicao.nomeCompeticao}`);
      return nominacao;

    } catch (error) {
      console.error(`❌ [NOMINAÇÃO] Erro ao buscar nominação para competição ${competicaoId}:`, error);
      throw error;
    }
  }
};
