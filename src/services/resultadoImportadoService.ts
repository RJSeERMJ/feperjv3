import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Função auxiliar para converter Timestamp para Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

// Interface para Resultado Importado
export interface ResultadoImportado {
  id?: string;
  competitionName: string;
  competitionDate: Date;
  competitionCity: string;
  competitionCountry: string;
  importDate: Date;
  totalAthletes: number;
  status: string;
  results?: {
    complete: any[];
    simplified: any[];
    teams: any;
  };
}

// Serviço para Resultados Importados do Barra Pronta
export const resultadoImportadoService = {
  async getAll(): Promise<ResultadoImportado[]> {
    try {
      const q = query(
        collection(db, 'resultados_importados'), 
        orderBy('importDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        competitionDate: convertTimestamp(doc.data().competitionDate),
        importDate: convertTimestamp(doc.data().importDate)
      })) as ResultadoImportado[];
    } catch (error) {
      console.error('❌ Erro ao buscar resultados importados:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<ResultadoImportado | null> {
    try {
      const docRef = doc(db, 'resultados_importados', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          competitionDate: convertTimestamp(data.competitionDate),
          importDate: convertTimestamp(data.importDate)
        } as ResultadoImportado;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar resultado importado:', error);
      throw error;
    }
  },

  async create(resultado: Omit<ResultadoImportado, 'id' | 'importDate'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'resultados_importados'), {
        ...resultado,
        importDate: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar resultado importado:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'resultados_importados', id);
      await deleteDoc(docRef);
      console.log('✅ Resultado importado excluído com sucesso:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir resultado importado:', error);
      throw error;
    }
  }
};
