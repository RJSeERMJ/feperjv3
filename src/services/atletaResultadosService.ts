import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ResultadoImportado } from './resultadoImportadoService';
import { atletaService } from './firebaseService';
import { Atleta } from '../types';

// Função auxiliar para converter Timestamp para Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return timestamp;
};

// Interface para resultado de atleta
export interface AtletaResultado {
  id: string;
  competitionName: string;
  competitionDate: Date;
  competitionCity: string;
  competitionCountry: string;
  atleta: Atleta;
  squat: number;
  bench: number;
  deadlift: number;
  total: number;
  points: number;
  position: number;
  weightClass: string;
  division: string;
  equipment: string;
  sex: 'M' | 'F';
  team: string;
}

// Serviço para buscar resultados de atletas a partir dos dados importados
export const atletaResultadosService = {
  // Buscar todos os resultados de um atleta específico
  async getResultadosByAtleta(atletaId: string): Promise<AtletaResultado[]> {
    try {
      console.log('🔍 Buscando resultados do atleta ID:', atletaId);
      
      // Buscar dados do atleta primeiro
      const atleta = await atletaService.getById(atletaId);
      if (!atleta) {
        console.log('❌ Atleta não encontrado');
        return [];
      }

      console.log('✅ Atleta encontrado:', atleta.nome);

      // Buscar todos os resultados importados
      const q = query(
        collection(db, 'resultados_importados'),
        orderBy('importDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 Competições encontradas:', querySnapshot.docs.length);

      const resultados: AtletaResultado[] = [];

      // Processar cada competição
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const resultadoImportado: ResultadoImportado = {
          id: doc.id,
          competitionName: data.competitionName || 'Competição',
          competitionDate: convertTimestamp(data.competitionDate),
          competitionCity: data.competitionCity || 'N/A',
          competitionCountry: data.competitionCountry || 'Brasil',
          importDate: convertTimestamp(data.importDate),
          totalAthletes: data.totalAthletes || 0,
          status: data.status || 'IMPORTADO',
          results: data.results
        };

        console.log('🏆 Processando competição:', resultadoImportado.competitionName);

        // Buscar o atleta nos resultados desta competição
        const atletaResultado = this.findAtletaInResults(atleta, resultadoImportado);
        
        if (atletaResultado) {
          console.log('✅ Resultado encontrado para o atleta:', atletaResultado);
          resultados.push(atletaResultado);
        }
      }

      console.log('📋 Total de resultados encontrados:', resultados.length);
      return resultados.sort((a, b) => b.competitionDate.getTime() - a.competitionDate.getTime());
    } catch (error) {
      console.error('❌ Erro ao buscar resultados do atleta:', error);
      return [];
    }
  },

  // Buscar o atleta nos resultados de uma competição específica
  findAtletaInResults(atleta: Atleta, resultadoImportado: ResultadoImportado): AtletaResultado | null {
    try {
      if (!resultadoImportado.results) {
        return null;
      }

      // Buscar nos resultados completos primeiro
      if (resultadoImportado.results.complete) {
        for (const category of resultadoImportado.results.complete) {
          if (category.results) {
            for (const result of category.results) {
              if (this.isAtletaMatch(atleta, result)) {
                return this.createAtletaResultado(atleta, resultadoImportado, result);
              }
            }
          }
        }
      }

      // Buscar nos resultados simplificados
      if (resultadoImportado.results.simplified) {
        for (const result of resultadoImportado.results.simplified) {
          if (this.isAtletaMatch(atleta, result)) {
            return this.createAtletaResultado(atleta, resultadoImportado, result);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar atleta nos resultados:', error);
      return null;
    }
  },

  // Verificar se o resultado corresponde ao atleta
  isAtletaMatch(atleta: Atleta, result: any): boolean {
    try {
      // Verificar por nome (mais confiável)
      if (result.entry && result.entry.name) {
        const nomeResultado = result.entry.name.toLowerCase().trim();
        const nomeAtleta = atleta.nome.toLowerCase().trim();
        
        if (nomeResultado === nomeAtleta) {
          return true;
        }
      }

      // Verificar por CPF se disponível
      if (result.entry && result.entry.cpf && atleta.cpf) {
        const cpfResultado = result.entry.cpf.replace(/\D/g, '');
        const cpfAtleta = atleta.cpf.replace(/\D/g, '');
        
        if (cpfResultado === cpfAtleta) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar match do atleta:', error);
      return false;
    }
  },

  // Criar objeto AtletaResultado
  createAtletaResultado(atleta: Atleta, resultadoImportado: ResultadoImportado, result: any): AtletaResultado {
    return {
      id: `${resultadoImportado.id}_${atleta.id}`,
      competitionName: resultadoImportado.competitionName,
      competitionDate: resultadoImportado.competitionDate,
      competitionCity: resultadoImportado.competitionCity,
      competitionCountry: resultadoImportado.competitionCountry,
      atleta: atleta,
      squat: result.squat || 0,
      bench: result.bench || 0,
      deadlift: result.deadlift || 0,
      total: result.total || 0,
      points: result.points || 0,
      position: result.positions?.total || 0,
      weightClass: result.entry?.weightClass || 'N/A',
      division: result.entry?.division || 'Open',
      equipment: result.entry?.equipment || 'Classica',
      sex: result.entry?.sex || atleta.sexo,
      team: result.entry?.team || atleta.equipe?.nomeEquipe || 'N/A'
    };
  },

  // Buscar melhores resultados de um atleta
  async getMelhoresResultados(atletaId: string): Promise<{
    melhorAgachamento: number;
    melhorSupino: number;
    melhorTerra: number;
    melhorTotal: number;
  }> {
    try {
      const resultados = await this.getResultadosByAtleta(atletaId);
      
      const melhores = {
        melhorAgachamento: 0,
        melhorSupino: 0,
        melhorTerra: 0,
        melhorTotal: 0
      };

      resultados.forEach(resultado => {
        if (resultado.squat > melhores.melhorAgachamento) {
          melhores.melhorAgachamento = resultado.squat;
        }
        if (resultado.bench > melhores.melhorSupino) {
          melhores.melhorSupino = resultado.bench;
        }
        if (resultado.deadlift > melhores.melhorTerra) {
          melhores.melhorTerra = resultado.deadlift;
        }
        if (resultado.total > melhores.melhorTotal) {
          melhores.melhorTotal = resultado.total;
        }
      });

      return melhores;
    } catch (error) {
      console.error('❌ Erro ao buscar melhores resultados:', error);
      return {
        melhorAgachamento: 0,
        melhorSupino: 0,
        melhorTerra: 0,
        melhorTotal: 0
      };
    }
  },

  // Buscar top 5 melhores classificações de um atleta
  async getTop5Classificacoes(atletaId: string): Promise<AtletaResultado[]> {
    try {
      const resultados = await this.getResultadosByAtleta(atletaId);
      
      // Filtrar apenas resultados com posição válida e ordenar por posição
      const resultadosComPosicao = resultados
        .filter(resultado => resultado.position > 0)
        .sort((a, b) => a.position - b.position)
        .slice(0, 5);

      return resultadosComPosicao;
    } catch (error) {
      console.error('❌ Erro ao buscar top 5 classificações:', error);
      return [];
    }
  }
};
