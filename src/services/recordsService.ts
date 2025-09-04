import { db } from '../config/firebase';
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
  writeBatch,
  Timestamp 
} from 'firebase/firestore';

// Tipos para os records
export interface Record {
  id?: string;
  movement: 'squat' | 'bench' | 'bench_solo' | 'deadlift' | 'total';
  division: string; // OPEN, JUNIOR, SUBJR, MASTER1, MASTER2, MASTER3, MASTER4
  sex: 'M' | 'F';
  equipment: 'CLASSICA' | 'EQUIPADO';
  weightClass: string; // 59kg, 66kg, etc.
  weight: number; // peso em kg
  athleteName: string;
  team?: string;
  competition: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para importação CSV
export interface CSVRecord {
  movement: string;
  division: string;
  sex: string;
  equipment: string;
  weightClass: string;
  weight: number;
  athleteName: string;
  team?: string;
  competition: string;
  date: string;
}

// Serviço para gerenciar records
export const recordsService = {
  // Buscar todos os records
  async getAll(): Promise<Record[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'records'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Record[];
    } catch (error) {
      console.error('❌ Erro ao buscar records:', error);
      throw error;
    }
  },

  // Buscar records por movimento
  async getByMovement(movement: string): Promise<Record[]> {
    try {
      const q = query(
        collection(db, 'records'),
        where('movement', '==', movement),
        orderBy('weight', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Record[];
    } catch (error) {
      console.error('❌ Erro ao buscar records por movimento:', error);
      throw error;
    }
  },

  // Buscar records por divisão, gênero e modalidade
  async getByCategory(division: string, sex: string, equipment: string): Promise<Record[]> {
    try {
      const q = query(
        collection(db, 'records'),
        where('division', '==', division),
        where('sex', '==', sex),
        where('equipment', '==', equipment),
        orderBy('weight', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Record[];
    } catch (error) {
      console.error('❌ Erro ao buscar records por categoria:', error);
      throw error;
    }
  },

  // Buscar record específico
  async getById(id: string): Promise<Record | null> {
    try {
      const docRef = doc(db, 'records', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Record;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar record:', error);
      throw error;
    }
  },

  // Criar novo record
  async create(record: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, 'records'), {
        ...record,
        createdAt: now,
        updatedAt: now
      });
      console.log('✅ Record criado com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar record:', error);
      throw error;
    }
  },

  // Atualizar record
  async update(id: string, updates: Partial<Record>): Promise<void> {
    try {
      const docRef = doc(db, 'records', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Record atualizado:', id);
    } catch (error) {
      console.error('❌ Erro ao atualizar record:', error);
      throw error;
    }
  },

  // Deletar record
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'records', id);
      await deleteDoc(docRef);
      console.log('✅ Record deletado:', id);
    } catch (error) {
      console.error('❌ Erro ao deletar record:', error);
      throw error;
    }
  },

  // Importar records via CSV (manter melhores, atualizar se superior)
  async importFromCSV(csvData: CSVRecord[]): Promise<{ success: number; errors: number }> {
    try {
      console.log('🔄 Iniciando importação inteligente...');
      
      let successCount = 0;
      let errorCount = 0;
      const batch = writeBatch(db);

      for (const record of csvData) {
        try {
          // Validar dados
          if (!record.movement || !record.division || !record.sex || !record.equipment || 
              !record.weightClass || !record.weight || !record.athleteName) {
            console.warn('⚠️ Dados inválidos:', record);
            errorCount++;
            continue;
          }

          // Normalizar dados
          const normalizedRecord: Omit<Record, 'id' | 'createdAt' | 'updatedAt'> = {
            movement: record.movement.toLowerCase() as any,
            division: record.division.toUpperCase(),
            sex: record.sex.toUpperCase() as 'M' | 'F',
            equipment: record.equipment.toUpperCase() as 'CLASSICA' | 'EQUIPADO',
            weightClass: record.weightClass,
            weight: Number(record.weight),
            athleteName: record.athleteName.trim(),
            team: record.team?.trim(),
            competition: record.competition.trim(),
            date: new Date(record.date)
          };

          // Verificar se já existe um record para esta combinação
          const existingRecords = await this.getRecordsByFilters(
            normalizedRecord.movement,
            normalizedRecord.division,
            normalizedRecord.sex,
            normalizedRecord.equipment
          );

          const existingRecord = existingRecords.find(r => r.weightClass === normalizedRecord.weightClass);

          if (existingRecord) {
            // Se existe, verificar se o novo é melhor
            if (normalizedRecord.weight > existingRecord.weight) {
              console.log(`🔄 Atualizando record existente: ${existingRecord.athleteName} (${existingRecord.weight}kg) → ${normalizedRecord.athleteName} (${normalizedRecord.weight}kg)`);
              
              // Atualizar record existente
              batch.update(doc(db, 'records', existingRecord.id!), {
                ...normalizedRecord,
                updatedAt: new Date()
              });
              successCount++;
            } else {
              console.log(`⏭️ Mantendo record existente: ${existingRecord.athleteName} (${existingRecord.weight}kg) é melhor que ${normalizedRecord.athleteName} (${normalizedRecord.weight}kg)`);
            }
          } else {
            // Se não existe, criar novo
            console.log(`➕ Criando novo record: ${normalizedRecord.athleteName} (${normalizedRecord.weight}kg)`);
            
            const docRef = doc(collection(db, 'records'));
            batch.set(docRef, {
              ...normalizedRecord,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            successCount++;
          }

        } catch (error) {
          console.error('❌ Erro ao processar record:', record, error);
          errorCount++;
        }
      }

      // Executar batch
      if (successCount > 0) {
        await batch.commit();
        console.log(`✅ Importação concluída: ${successCount} records processados, ${errorCount} erros`);
      }

      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error('❌ Erro na importação CSV:', error);
      throw error;
    }
  },

  // Buscar melhores records por categoria
  async getBestRecords(): Promise<{
    squat: Record[];
    bench: Record[];
    deadlift: Record[];
    total: Record[];
  }> {
    try {
      const [squat, bench, deadlift, total] = await Promise.all([
        this.getByMovement('squat'),
        this.getByMovement('bench'),
        this.getByMovement('deadlift'),
        this.getByMovement('total')
      ]);

      return { squat, bench, deadlift, total };
    } catch (error) {
      console.error('❌ Erro ao buscar melhores records:', error);
      throw error;
    }
  },

  // Função para obter records filtrados
  async getRecordsByFilters(
    movement?: string,
    division?: string,
    sex?: string,
    equipment?: string
  ): Promise<Record[]> {
    try {
      console.log('🔍 Buscando records com filtros:', { movement, division, sex, equipment });
      
      const constraints = [];

      if (movement) constraints.push(where('movement', '==', movement));
      if (division) constraints.push(where('division', '==', division));
      if (sex) constraints.push(where('sex', '==', sex));
      if (equipment) constraints.push(where('equipment', '==', equipment));

      let q;
      if (constraints.length > 0) {
        q = query(collection(db, 'records'), ...constraints);
        console.log('📋 Query com constraints:', constraints);
      } else {
        q = collection(db, 'records');
        console.log('📋 Query sem constraints');
      }

      const querySnapshot = await getDocs(q);
      console.log(`📊 Query retornou ${querySnapshot.docs.length} documentos`);
      
      const records = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Documento:', doc.id, data);
        
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Record;
      });
      
      console.log('✅ Records processados:', records);
      return records;
    } catch (error) {
      console.error('❌ Erro ao buscar records filtrados:', error);
      throw error;
    }
  },

  // Função para criar records de teste
  async createTestRecords(): Promise<void> {
    try {
      console.log('🧪 Criando records de teste...');
      
      const testRecords = [
        {
          movement: 'squat' as const,
          division: 'OPEN',
          sex: 'M' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '83,0 kg',
          weight: 200,
          athleteName: 'João Silva',
          team: 'Equipe A',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        },
        {
          movement: 'bench' as const,
          division: 'OPEN',
          sex: 'F' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '57,0 kg',
          weight: 85,
          athleteName: 'Maria Santos',
          team: 'Equipe B',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        },
        {
          movement: 'deadlift' as const,
          division: 'JUNIOR',
          sex: 'M' as const,
          equipment: 'EQUIPADO' as const,
          weightClass: '93,0 kg',
          weight: 250,
          athleteName: 'Pedro Costa',
          team: 'Equipe C',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        }
      ];

      for (const record of testRecords) {
        await this.create(record);
      }
      
      console.log('✅ Records de teste criados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar records de teste:', error);
      throw error;
    }
  }
};
