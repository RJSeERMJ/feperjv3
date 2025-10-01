import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const db = getFirestore();

// Interface para entrada de competição
export interface Entrada {
  id?: string;
  nome: string;
  sexo: 'M' | 'F';
  division: string;
  flight: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
  day: number;
  platform: number;
  squat1?: number;
  squat2?: number;
  squat3?: number;
  bench1?: number;
  bench2?: number;
  bench3?: number;
  deadlift1?: number;
  deadlift2?: number;
  deadlift3?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para estado de levantamento
export interface LiftingState {
  day: number;
  platform: number;
  flight: string;
  lift: 'S' | 'B' | 'D';
  attemptOneIndexed: number;
  selectedEntryId?: number;
  selectedAttempt?: number;
  isAttemptActive: boolean;
}

// Interface para configuração de competição
export interface MeetConfig {
  squatBarAndCollarsWeightKg: number;
  benchBarAndCollarsWeightKg: number;
  deadliftBarAndCollarsWeightKg: number;
  plates: Array<{
    weightAny: number;
    color: string;
    isAlreadyLoaded?: boolean;
  }>;
}

// Serviço da Barra Pronta
export const barraProntaService = {
  // Buscar entradas com filtros
  async getEntradas(filters: {
    day?: number;
    platform?: number;
    flight?: string;
    search?: string;
  } = {}): Promise<Entrada[]> {
    try {
      let q = query(collection(db, 'barra_pronta_entradas'));

      // Aplicar filtros
      if (filters.day) {
        q = query(q, where('day', '==', filters.day));
      }

      if (filters.platform) {
        q = query(q, where('platform', '==', filters.platform));
      }

      if (filters.flight) {
        q = query(q, where('flight', '==', filters.flight));
      }

      // Ordenação por nome
      q = query(q, orderBy('nome', 'asc'));

      const querySnapshot = await getDocs(q);
      let entradas = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          sexo: data.sexo,
          division: data.division,
          flight: data.flight,
          day: data.day,
          platform: data.platform,
          squat1: data.squat1,
          squat2: data.squat2,
          squat3: data.squat3,
          bench1: data.bench1,
          bench2: data.bench2,
          bench3: data.bench3,
          deadlift1: data.deadlift1,
          deadlift2: data.deadlift2,
          deadlift3: data.deadlift3,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Entrada;
      });

      // Filtro por busca (se necessário)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        entradas = entradas.filter(entrada => 
          entrada.nome.toLowerCase().includes(searchTerm) ||
          entrada.division.toLowerCase().includes(searchTerm)
        );
      }

      return entradas;
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      throw error;
    }
  },

  // Buscar entrada por ID
  async getEntradaById(id: string): Promise<Entrada | null> {
    try {
      const docRef = doc(db, 'barra_pronta_entradas', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome,
        sexo: data.sexo,
        division: data.division,
        flight: data.flight,
        day: data.day,
        platform: data.platform,
        squat1: data.squat1,
        squat2: data.squat2,
        squat3: data.squat3,
        bench1: data.bench1,
        bench2: data.bench2,
        bench3: data.bench3,
        deadlift1: data.deadlift1,
        deadlift2: data.deadlift2,
        deadlift3: data.deadlift3,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Entrada;
    } catch (error) {
      console.error('Erro ao buscar entrada por ID:', error);
      throw error;
    }
  },

  // Criar entrada
  async createEntrada(entradaData: Omit<Entrada, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'barra_pronta_entradas'), {
        ...entradaData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      throw error;
    }
  },

  // Atualizar entrada
  async updateEntrada(id: string, entradaData: Partial<Entrada>): Promise<void> {
    try {
      const docRef = doc(db, 'barra_pronta_entradas', id);
      await updateDoc(docRef, {
        ...entradaData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      throw error;
    }
  },

  // Deletar entrada
  async deleteEntrada(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'barra_pronta_entradas', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      throw error;
    }
  },

  // Atualizar tentativa de levantamento
  async updateAttempt(entradaId: string, lift: 'S' | 'B' | 'D', attempt: 1 | 2 | 3, weight: number): Promise<void> {
    try {
      const docRef = doc(db, 'barra_pronta_entradas', entradaId);
      const fieldName = `${lift}${attempt}`;
      
      await updateDoc(docRef, {
        [fieldName]: weight,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar tentativa:', error);
      throw error;
    }
  },

  // Obter configuração da competição
  async getMeetConfig(): Promise<MeetConfig> {
    try {
      const docRef = doc(db, 'barra_pronta_config', 'meet');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Configuração padrão
        return {
          squatBarAndCollarsWeightKg: 25,
          benchBarAndCollarsWeightKg: 25,
          deadliftBarAndCollarsWeightKg: 25,
          plates: [
            { weightAny: 25, color: '#FF0000' },
            { weightAny: 20, color: '#0000FF' },
            { weightAny: 15, color: '#FFFF00' },
            { weightAny: 10, color: '#00FF00' },
            { weightAny: 5, color: '#FFFFFF' },
            { weightAny: 2.5, color: '#FF8000' },
            { weightAny: 1.25, color: '#800080' }
          ]
        };
      }

      const data = docSnap.data();
      return {
        squatBarAndCollarsWeightKg: data.squatBarAndCollarsWeightKg || 25,
        benchBarAndCollarsWeightKg: data.benchBarAndCollarsWeightKg || 25,
        deadliftBarAndCollarsWeightKg: data.deadliftBarAndCollarsWeightKg || 25,
        plates: data.plates || []
      };
    } catch (error) {
      console.error('Erro ao buscar configuração da competição:', error);
      throw error;
    }
  },

  // Salvar configuração da competição
  async saveMeetConfig(config: MeetConfig): Promise<void> {
    try {
      const docRef = doc(db, 'barra_pronta_config', 'meet');
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao salvar configuração da competição:', error);
      throw error;
    }
  },

  // Obter estado atual de levantamento
  async getLiftingState(): Promise<LiftingState | null> {
    try {
      const docRef = doc(db, 'barra_pronta_state', 'current');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        day: data.day || 1,
        platform: data.platform || 1,
        flight: data.flight || 'A',
        lift: data.lift || 'S',
        attemptOneIndexed: data.attemptOneIndexed || 1,
        selectedEntryId: data.selectedEntryId,
        selectedAttempt: data.selectedAttempt,
        isAttemptActive: data.isAttemptActive || false
      };
    } catch (error) {
      console.error('Erro ao buscar estado de levantamento:', error);
      throw error;
    }
  },

  // Salvar estado de levantamento
  async saveLiftingState(state: LiftingState): Promise<void> {
    try {
      const docRef = doc(db, 'barra_pronta_state', 'current');
      await setDoc(docRef, {
        ...state,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao salvar estado de levantamento:', error);
      throw error;
    }
  },

  // Calcular ordem de levantamentos
  async getLiftingOrder(state: LiftingState): Promise<Entrada[]> {
    try {
      const entradas = await this.getEntradas({
        day: state.day,
        platform: state.platform,
        flight: state.flight
      });

      // Ordenar por peso do movimento atual
      const getWeightForLift = (entrada: Entrada, lift: 'S' | 'B' | 'D'): number => {
        switch (lift) {
          case 'S':
            return entrada.squat1 || 0;
          case 'B':
            return entrada.bench1 || 0;
          case 'D':
            return entrada.deadlift1 || 0;
          default:
            return 0;
        }
      };

      return entradas.sort((a, b) => {
        const weightA = getWeightForLift(a, state.lift);
        const weightB = getWeightForLift(b, state.lift);
        return weightA - weightB; // Ordem crescente
      });
    } catch (error) {
      console.error('Erro ao calcular ordem de levantamentos:', error);
      throw error;
    }
  },

  // Calcular carregamento da barra
  calculateBarLoad(weightKg: number, barWeight: number, plates: Array<{weightAny: number; color: string}>): Array<{
    weightAny: number;
    color: string;
    isAlreadyLoaded?: boolean;
  }> {
    const targetWeight = weightKg - barWeight;
    const result: Array<{weightAny: number; color: string; isAlreadyLoaded?: boolean}> = [];
    
    // Ordenar anilhas por peso (maior para menor)
    const sortedPlates = [...plates].sort((a, b) => b.weightAny - a.weightAny);
    
    let remainingWeight = targetWeight;
    
    for (const plate of sortedPlates) {
      const count = Math.floor(remainingWeight / (plate.weightAny * 2)); // 2 anilhas por peso
      if (count > 0) {
        for (let i = 0; i < count * 2; i++) {
          result.push({ ...plate });
        }
        remainingWeight -= count * plate.weightAny * 2;
      }
    }
    
    // Se não conseguir atingir o peso exato, adicionar anilha de erro
    if (remainingWeight > 0.1) {
      result.push({
        weightAny: -remainingWeight, // Peso negativo indica erro
        color: '#FF0000'
      });
    }
    
    return result;
  },

  // Estatísticas da Barra Pronta
  async getStats(): Promise<{
    totalEntradas: number;
    porDia: Record<number, number>;
    porPlataforma: Record<number, number>;
    porFlight: Record<string, number>;
    porDivisao: Record<string, number>;
  }> {
    try {
      const entradas = await this.getEntradas();
      
      const stats = {
        totalEntradas: entradas.length,
        porDia: {} as Record<number, number>,
        porPlataforma: {} as Record<number, number>,
        porFlight: {} as Record<string, number>,
        porDivisao: {} as Record<string, number>
      };

      entradas.forEach(entrada => {
        stats.porDia[entrada.day] = (stats.porDia[entrada.day] || 0) + 1;
        stats.porPlataforma[entrada.platform] = (stats.porPlataforma[entrada.platform] || 0) + 1;
        stats.porFlight[entrada.flight] = (stats.porFlight[entrada.flight] || 0) + 1;
        stats.porDivisao[entrada.division] = (stats.porDivisao[entrada.division] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas da Barra Pronta:', error);
      throw error;
    }
  }
};

export default barraProntaService;


