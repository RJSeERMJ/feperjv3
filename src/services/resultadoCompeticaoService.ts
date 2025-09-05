import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ResultadoCompeticao, Competicao, Atleta } from '../types';

// Função auxiliar para converter Timestamp para Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

// Função auxiliar para converter Date para Timestamp
const convertToTimestamp = (date: Date | undefined): Timestamp | undefined => {
  if (date) {
    return Timestamp.fromDate(date);
  }
  return undefined;
};

// Serviço para Resultados de Competições
export const resultadoCompeticaoService = {
  // Buscar todos os resultados
  async getAll(): Promise<ResultadoCompeticao[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'resultados_competicoes'));
      const resultados = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const competicao = data.idCompeticao ? await this.getCompeticaoById(data.idCompeticao) : null;
          const atleta = data.idAtleta ? await this.getAtletaById(data.idAtleta) : null;
          
          return {
            id: doc.id,
            ...data,
            dataRegistro: convertTimestamp(data.dataRegistro),
            competicao,
            atleta
          } as ResultadoCompeticao;
        })
      );
      return resultados;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados de competições:', error);
      throw error;
    }
  },

  // Buscar resultados por atleta
  async getByAtleta(idAtleta: string): Promise<ResultadoCompeticao[]> {
    try {
      console.log('🔍 Buscando resultados para atleta ID:', idAtleta);
      
      const q = query(
        collection(db, 'resultados_competicoes'),
        where('idAtleta', '==', idAtleta),
        orderBy('dataRegistro', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 Documentos encontrados:', querySnapshot.docs.length);
      
      if (querySnapshot.docs.length === 0) {
        console.log('ℹ️ Nenhum resultado encontrado para este atleta');
        return [];
      }
      
      const resultados = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log('📄 Processando resultado:', doc.id, data);
          
          const competicao = data.idCompeticao ? await this.getCompeticaoById(data.idCompeticao) : null;
          const atleta = data.idAtleta ? await this.getAtletaById(data.idAtleta) : null;
          
          return {
            id: doc.id,
            ...data,
            dataRegistro: convertTimestamp(data.dataRegistro),
            competicao,
            atleta
          } as ResultadoCompeticao;
        })
      );
      
      console.log('✅ Resultados processados:', resultados);
      return resultados;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados do atleta:', error);
      // Se não houver dados, retornar array vazio em vez de lançar erro
      if (error instanceof Error && error.message.includes('No index exists')) {
        console.log('ℹ️ Índice não existe, retornando array vazio');
        return [];
      }
      throw error;
    }
  },

  // Buscar resultados por competição
  async getByCompeticao(idCompeticao: string): Promise<ResultadoCompeticao[]> {
    try {
      const q = query(
        collection(db, 'resultados_competicoes'),
        where('idCompeticao', '==', idCompeticao),
        orderBy('posicao', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const resultados = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const competicao = data.idCompeticao ? await this.getCompeticaoById(data.idCompeticao) : null;
          const atleta = data.idAtleta ? await this.getAtletaById(data.idAtleta) : null;
          
          return {
            id: doc.id,
            ...data,
            dataRegistro: convertTimestamp(data.dataRegistro),
            competicao,
            atleta
          } as ResultadoCompeticao;
        })
      );
      return resultados;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados da competição:', error);
      throw error;
    }
  },

  // Buscar resultado específico
  async getById(id: string): Promise<ResultadoCompeticao | null> {
    try {
      const docRef = doc(db, 'resultados_competicoes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const competicao = data.idCompeticao ? await this.getCompeticaoById(data.idCompeticao) : null;
        const atleta = data.idAtleta ? await this.getAtletaById(data.idAtleta) : null;
        
        return {
          id: docSnap.id,
          ...data,
          dataRegistro: convertTimestamp(data.dataRegistro),
          competicao,
          atleta
        } as ResultadoCompeticao;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar resultado:', error);
      throw error;
    }
  },

  // Criar resultado
  async create(resultado: Omit<ResultadoCompeticao, 'id' | 'dataRegistro'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'resultados_competicoes'), {
        ...resultado,
        dataRegistro: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar resultado:', error);
      throw error;
    }
  },

  // Atualizar resultado
  async update(id: string, resultado: Partial<ResultadoCompeticao>): Promise<void> {
    try {
      const docRef = doc(db, 'resultados_competicoes', id);
      await updateDoc(docRef, resultado);
    } catch (error) {
      console.error('❌ Erro ao atualizar resultado:', error);
      throw error;
    }
  },

  // Deletar resultado
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'resultados_competicoes', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('❌ Erro ao deletar resultado:', error);
      throw error;
    }
  },

  // Funções auxiliares para buscar dados relacionados
  async getCompeticaoById(id: string): Promise<Competicao | null> {
    try {
      const docRef = doc(db, 'competicoes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataCompeticao: convertTimestamp(data.dataCompeticao),
          dataInicioInscricao: convertTimestamp(data.dataInicioInscricao),
          dataFimInscricao: convertTimestamp(data.dataFimInscricao),
          dataNominacaoPreliminar: convertTimestamp(data.dataNominacaoPreliminar),
          dataNominacaoFinal: convertTimestamp(data.dataNominacaoFinal),
          dataCriacao: convertTimestamp(data.dataCriacao)
        } as Competicao;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar competição:', error);
      return null;
    }
  },

  async getAtletaById(id: string): Promise<Atleta | null> {
    try {
      const docRef = doc(db, 'atletas', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataNascimento: convertTimestamp(data.dataNascimento),
          dataFiliacao: convertTimestamp(data.dataFiliacao),
          dataCriacao: convertTimestamp(data.dataCriacao)
        } as Atleta;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar atleta:', error);
      return null;
    }
  },

  // Buscar melhores resultados de um atleta
  async getMelhoresResultados(idAtleta: string): Promise<{
    melhorAgachamento: number;
    melhorSupino: number;
    melhorTerra: number;
    melhorTotal: number;
  }> {
    try {
      console.log('🏆 Buscando melhores resultados para atleta ID:', idAtleta);
      const resultados = await this.getByAtleta(idAtleta);
      
      const melhores = {
        melhorAgachamento: 0,
        melhorSupino: 0,
        melhorTerra: 0,
        melhorTotal: 0
      };

      resultados.forEach(resultado => {
        if (resultado.agachamento && resultado.agachamento > melhores.melhorAgachamento) {
          melhores.melhorAgachamento = resultado.agachamento;
        }
        if (resultado.supino && resultado.supino > melhores.melhorSupino) {
          melhores.melhorSupino = resultado.supino;
        }
        if (resultado.terra && resultado.terra > melhores.melhorTerra) {
          melhores.melhorTerra = resultado.terra;
        }
        if (resultado.total && resultado.total > melhores.melhorTotal) {
          melhores.melhorTotal = resultado.total;
        }
      });

      console.log('✅ Melhores resultados calculados:', melhores);
      return melhores;
    } catch (error) {
      console.error('❌ Erro ao buscar melhores resultados:', error);
      // Retornar valores padrão em caso de erro
      return {
        melhorAgachamento: 0,
        melhorSupino: 0,
        melhorTerra: 0,
        melhorTotal: 0
      };
    }
  },

  // Buscar top 5 melhores classificações de um atleta
  async getTop5Classificacoes(idAtleta: string): Promise<ResultadoCompeticao[]> {
    try {
      console.log('🥇 Buscando top 5 classificações para atleta ID:', idAtleta);
      const resultados = await this.getByAtleta(idAtleta);
      
      // Filtrar apenas resultados com posição válida e ordenar por posição
      const resultadosComPosicao = resultados
        .filter(resultado => resultado.posicao && resultado.posicao > 0)
        .sort((a, b) => (a.posicao || 0) - (b.posicao || 0))
        .slice(0, 5);

      console.log('✅ Top 5 classificações encontradas:', resultadosComPosicao.length);
      return resultadosComPosicao;
    } catch (error) {
      console.error('❌ Erro ao buscar top 5 classificações:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  }
};
