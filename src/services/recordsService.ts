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
  writeBatch
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

      if (movement) {
        constraints.push(where('movement', '==', movement));
        console.log(`✅ Filtro movimento: ${movement}`);
      }
      if (division) {
        constraints.push(where('division', '==', division));
        console.log(`✅ Filtro divisão: ${division}`);
      }
      if (sex) {
        constraints.push(where('sex', '==', sex));
        console.log(`✅ Filtro sexo: ${sex}`);
      }
      if (equipment) {
        constraints.push(where('equipment', '==', equipment));
        console.log(`✅ Filtro equipamento: ${equipment}`);
      }

      let q;
      if (constraints.length > 0) {
        q = query(collection(db, 'records'), ...constraints);
        console.log('📋 Query com constraints:', constraints.length);
      } else {
        q = collection(db, 'records');
        console.log('📋 Query sem constraints - buscando todos os records');
      }

      const querySnapshot = await getDocs(q);
      console.log(`📊 Query retornou ${querySnapshot.docs.length} documentos`);
      
      const records = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Documento encontrado:', {
          id: doc.id,
          movement: data.movement,
          division: data.division,
          sex: data.sex,
          equipment: data.equipment,
          weightClass: data.weightClass,
          weight: data.weight,
          athleteName: data.athleteName
        });
        
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Record;
      });
      
      console.log('✅ Records processados:', records.length);
      return records;
    } catch (error) {
      console.error('❌ Erro ao buscar records filtrados:', error);
      throw error;
    }
  },

  // Função para verificar se um peso é record
  async checkRecordAttempt(
    weight: number,
    movement: 'squat' | 'bench' | 'deadlift',
    athleteData: {
      sex: 'M' | 'F';
      age: number;
      weightClass: string;
      division?: string;
      equipment?: string;
    },
    competitionType: string
  ): Promise<{
    isRecord: boolean;
    recordDivisions: string[];
    currentRecords: Record[];
  }> {
    try {
      console.log('🔍 Verificando tentativa de record:', {
        weight,
        movement,
        athleteData,
        competitionType
      });

      // Determinar categorias de idade baseadas na idade do atleta
      const ageDivisions = this.getAgeDivisions(athleteData.age);
      
      // Se o atleta tem uma divisão específica inscrita, incluir também
      const allDivisions = athleteData.division 
        ? [...ageDivisions, athleteData.division]
        : ageDivisions;

      // Remover duplicatas
      const uniqueDivisions = Array.from(new Set(allDivisions));

      console.log('📋 Divisões a verificar:', uniqueDivisions);

      const recordDivisions: string[] = [];
      const currentRecords: Record[] = [];

      // Verificar cada divisão
      for (const division of uniqueDivisions) {
        console.log(`🔍 Verificando divisão: ${division}`);
        
        // Normalizar equipamento
        const normalizedEquipment = this.normalizeEquipment(athleteData.equipment || 'CLASSICA');
        console.log(`🔧 Equipamento normalizado: "${athleteData.equipment}" → "${normalizedEquipment}"`);
        
        const records = await this.getRecordsByFilters(
          movement,
          division,
          athleteData.sex,
          normalizedEquipment
        );

        console.log(`📊 Records encontrados para ${division}:`, records.length);

        // Filtrar por categoria de peso - tentar diferentes formatos
        const weightClassRecords = records.filter(record => {
          const recordWeightClass = record.weightClass;
          const athleteWeightClass = athleteData.weightClass;
          
          console.log(`🔍 Comparando categorias de peso: "${recordWeightClass}" vs "${athleteWeightClass}"`);
          
          // Comparação exata
          if (recordWeightClass === athleteWeightClass) {
            console.log('✅ Match exato encontrado');
            return true;
          }
          
          // Tentar normalizar e comparar
          const normalizedRecord = recordWeightClass.replace(/[,\s]/g, '').toLowerCase();
          const normalizedAthlete = athleteWeightClass.replace(/[,\s]/g, '').toLowerCase();
          
          if (normalizedRecord === normalizedAthlete) {
            console.log('✅ Match normalizado encontrado');
            return true;
          }
          
          console.log('❌ Nenhum match encontrado');
          return false;
        });

        console.log(`📊 Records para categoria de peso ${athleteData.weightClass}:`, weightClassRecords.length);

        if (weightClassRecords.length > 0) {
          // Pegar o melhor record da categoria
          const bestRecord = weightClassRecords.reduce((best, current) => 
            current.weight > best.weight ? current : best
          );

          console.log(`📊 Record atual para ${division} - ${athleteData.weightClass}:`, bestRecord);

          // Se o peso da tentativa é maior que o record atual
          if (weight > bestRecord.weight) {
            recordDivisions.push(division);
            currentRecords.push(bestRecord);
            console.log(`🏆 NOVO RECORD! ${division}: ${bestRecord.weight}kg → ${weight}kg`);
          } else {
            console.log(`❌ Não é record. Record atual: ${bestRecord.weight}kg, Tentativa: ${weight}kg`);
          }
        } else {
          // MODIFICAÇÃO: Não considerar como record se não há records existentes
          // Isso evita marcar qualquer peso como record quando não há dados
          console.log(`⚠️ Nenhum record encontrado para ${division} - ${athleteData.weightClass}. Não marcando como record.`);
        }
      }

      const result = {
        isRecord: recordDivisions.length > 0,
        recordDivisions,
        currentRecords
      };

      console.log('✅ Resultado da verificação:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao verificar record:', error);
      return {
        isRecord: false,
        recordDivisions: [],
        currentRecords: []
      };
    }
  },

  // Função auxiliar para determinar divisões baseadas na idade
  getAgeDivisions(age: number): string[] {
    const divisions: string[] = [];
    
    if (age <= 18) {
      divisions.push('SUBJR');
    }
    if (age <= 23) {
      divisions.push('JUNIOR');
    }
    if (age >= 18) {
      divisions.push('OPEN');
    }
    if (age >= 40) {
      divisions.push('MASTER1');
    }
    if (age >= 50) {
      divisions.push('MASTER2');
    }
    if (age >= 60) {
      divisions.push('MASTER3');
    }
    if (age >= 70) {
      divisions.push('MASTER4');
    }

    return divisions;
  },

  // Função para normalizar equipamento
  normalizeEquipment(equipment: string): string {
    if (!equipment) return 'CLASSICA';
    
    const normalized = equipment.toUpperCase().trim();
    
    // Mapear variações para o formato padrão
    if (normalized.includes('CLASSIC') || normalized.includes('RAW')) {
      return 'CLASSICA';
    }
    if (normalized.includes('EQUIP') || normalized.includes('GEAR')) {
      return 'EQUIPADO';
    }
    
    return normalized;
  },

  // Função para criar records de teste
  async createTestRecords(): Promise<void> {
    try {
      console.log('🧪 Criando records de teste...');
      
      const testRecords = [
        // Records para teste - Agachamento Masculino 83kg
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
          movement: 'squat' as const,
          division: 'JUNIOR',
          sex: 'M' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '83,0 kg',
          weight: 180,
          athleteName: 'Carlos Junior',
          team: 'Equipe A',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        },
        // Records para teste - Supino Feminino 57kg
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
          movement: 'bench' as const,
          division: 'JUNIOR',
          sex: 'F' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '57,0 kg',
          weight: 75,
          athleteName: 'Ana Junior',
          team: 'Equipe B',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        },
        // Records para teste - Terra Masculino 93kg
        {
          movement: 'deadlift' as const,
          division: 'OPEN',
          sex: 'M' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '93,0 kg',
          weight: 250,
          athleteName: 'Pedro Costa',
          team: 'Equipe C',
          competition: 'Campeonato Estadual 2024',
          date: new Date('2024-01-15')
        },
        {
          movement: 'deadlift' as const,
          division: 'JUNIOR',
          sex: 'M' as const,
          equipment: 'CLASSICA' as const,
          weightClass: '93,0 kg',
          weight: 220,
          athleteName: 'Lucas Junior',
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
  },

  // Função para verificar se há records no banco
  async checkRecordsExist(): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(collection(db, 'records'));
      const hasRecords = querySnapshot.docs.length > 0;
      console.log(`📊 Verificação de records: ${querySnapshot.docs.length} records encontrados`);
      return hasRecords;
    } catch (error) {
      console.error('❌ Erro ao verificar records:', error);
      return false;
    }
  },

  // Função de debug para testar a verificação de records
  async debugRecordCheck(
    weight: number,
    movement: 'squat' | 'bench' | 'deadlift',
    athleteData: {
      sex: 'M' | 'F';
      age: number;
      weightClass: string;
      division?: string;
      equipment?: string;
    }
  ): Promise<void> {
    console.log('🔍 === DEBUG RECORD CHECK ===');
    console.log('Dados do atleta:', athleteData);
    console.log('Peso a verificar:', weight);
    console.log('Movimento:', movement);
    
    // Verificar se há records no banco
    const hasRecords = await this.checkRecordsExist();
    console.log('Há records no banco?', hasRecords);
    
    if (!hasRecords) {
      console.log('⚠️ ATENÇÃO: Não há records no banco de dados!');
      console.log('💡 Execute recordsService.createTestRecords() para criar records de teste');
      return;
    }
    
    // Executar verificação normal
    const result = await this.checkRecordAttempt(weight, movement, athleteData, 'AST');
    console.log('Resultado da verificação:', result);
    console.log('=== FIM DEBUG ===');
  },

  // Função para listar todos os records e verificar formatos
  async debugListAllRecords(): Promise<void> {
    console.log('🔍 === LISTANDO TODOS OS RECORDS ===');
    try {
      const querySnapshot = await getDocs(collection(db, 'records'));
      console.log(`📊 Total de records: ${querySnapshot.docs.length}`);
      
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📄 Record ${index + 1}:`, {
          id: doc.id,
          movement: data.movement,
          division: data.division,
          sex: data.sex,
          equipment: data.equipment,
          weightClass: data.weightClass,
          weight: data.weight,
          athleteName: data.athleteName
        });
      });
    } catch (error) {
      console.error('❌ Erro ao listar records:', error);
    }
    console.log('=== FIM LISTAGEM ===');
  },

  // Função para testar busca específica
  async debugSearchRecord(
    movement: string,
    division: string,
    sex: string,
    equipment: string,
    weightClass: string
  ): Promise<void> {
    console.log('🔍 === BUSCA ESPECÍFICA DE RECORD ===');
    console.log('Parâmetros de busca:', { movement, division, sex, equipment, weightClass });
    
    try {
      const records = await this.getRecordsByFilters(movement, division, sex, equipment);
      console.log(`📊 Records encontrados: ${records.length}`);
      
      if (records.length > 0) {
        console.log('📄 Records encontrados:');
        records.forEach((record, index) => {
          console.log(`  ${index + 1}.`, {
            movement: record.movement,
            division: record.division,
            sex: record.sex,
            equipment: record.equipment,
            weightClass: record.weightClass,
            weight: record.weight,
            athleteName: record.athleteName
          });
        });
        
        // Filtrar por categoria de peso
        const weightClassRecords = records.filter(record => 
          record.weightClass === weightClass
        );
        console.log(`📊 Records para categoria de peso "${weightClass}": ${weightClassRecords.length}`);
        
        if (weightClassRecords.length > 0) {
          const bestRecord = weightClassRecords.reduce((best, current) => 
            current.weight > best.weight ? current : best
          );
          console.log('🏆 Melhor record encontrado:', bestRecord);
        }
      }
    } catch (error) {
      console.error('❌ Erro na busca:', error);
    }
    console.log('=== FIM BUSCA ===');
  },

  // Função específica para testar o caso do usuário
  async testUserCase(): Promise<void> {
    console.log('🔍 === TESTE DO CASO DO USUÁRIO ===');
    console.log('Testando: Agachamento 303.5kg vs Record 303kg (OPEN, até 105kg, Clássico)');
    
    // Primeiro, listar todos os records para ver o que está no banco
    await this.debugListAllRecords();
    
    // Testar busca específica
    await this.debugSearchRecord(
      'squat',
      'OPEN', 
      'M',
      'CLASSICA',
      'até 105kg'
    );
    
    // Testar com diferentes formatos de categoria de peso
    const weightClassVariations = [
      'até 105kg',
      '105kg',
      '105,0 kg',
      '105.0 kg',
      '105 kg'
    ];
    
    for (const weightClass of weightClassVariations) {
      console.log(`\n🔍 Testando categoria: "${weightClass}"`);
      await this.debugSearchRecord(
        'squat',
        'OPEN',
        'M', 
        'CLASSICA',
        weightClass
      );
    }
    
    // Testar verificação completa
    console.log('\n🔍 Testando verificação completa:');
    await this.debugRecordCheck(303.5, 'squat', {
      sex: 'M',
      age: 25,
      weightClass: 'até 105kg',
      division: 'OPEN',
      equipment: 'CLASSICA'
    });
    
    console.log('=== FIM TESTE DO USUÁRIO ===');
  }
};
