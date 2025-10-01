import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, writeBatch, startAfter, DocumentSnapshot } from 'firebase/firestore';

const db = getFirestore();

// Interface para atleta
export interface Atleta {
  id?: string;
  nome: string;
  cpf: string;
  matricula?: string;
  sexo: 'M' | 'F';
  email?: string;
  telefone?: string;
  dataNascimento: Date;
  dataFiliacao: Date;
  maiorTotal?: number;
  status: 'ATIVO' | 'INATIVO';
  idEquipe?: string;
  idCategoria?: string;
  endereco?: string;
  observacoes?: string;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
  equipe?: any;
  categoria?: any;
}

// Interface para filtros de busca
export interface AtletaFilters {
  search?: string;
  equipe?: string;
  status?: string;
  sexo?: 'M' | 'F';
  categoria?: string;
  page?: number;
  limit?: number;
}

// Serviço de atletas
export const atletaService = {
  // Buscar todos os atletas com filtros
  async getAll(filters: AtletaFilters = {}): Promise<Atleta[]> {
    try {
      let q = query(collection(db, 'atletas'));

      // Aplicar filtros
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.sexo) {
        q = query(q, where('sexo', '==', filters.sexo));
      }

      if (filters.equipe) {
        q = query(q, where('idEquipe', '==', filters.equipe));
      }

      if (filters.categoria) {
        q = query(q, where('idCategoria', '==', filters.categoria));
      }

      // Ordenação
      q = query(q, orderBy('nome', 'asc'));

      // Paginação
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      let atletas = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          cpf: data.cpf,
          matricula: data.matricula,
          sexo: data.sexo,
          email: data.email,
          telefone: data.telefone,
          dataNascimento: data.dataNascimento?.toDate(),
          dataFiliacao: data.dataFiliacao?.toDate(),
          maiorTotal: data.maiorTotal,
          status: data.status,
          idEquipe: data.idEquipe,
          idCategoria: data.idCategoria,
          endereco: data.endereco,
          observacoes: data.observacoes,
          dataCriacao: data.dataCriacao?.toDate(),
          dataAtualizacao: data.dataAtualizacao?.toDate()
        } as Atleta;
      });

      // Filtro por busca (se necessário)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        atletas = atletas.filter(atleta => 
          atleta.nome.toLowerCase().includes(searchTerm) ||
          atleta.cpf.includes(searchTerm) ||
          atleta.matricula?.toLowerCase().includes(searchTerm)
        );
      }

      // Buscar dados relacionados (equipe e categoria)
      const atletasWithRelations = await Promise.all(
        atletas.map(async (atleta) => {
          const equipe = atleta.idEquipe ? await this.getEquipe(atleta.idEquipe) : null;
          const categoria = atleta.idCategoria ? await this.getCategoria(atleta.idCategoria) : null;
          
          return {
            ...atleta,
            equipe,
            categoria
          };
        })
      );

      return atletasWithRelations;
    } catch (error) {
      console.error('Erro ao buscar atletas:', error);
      throw error;
    }
  },

  // Buscar atleta por ID
  async getById(id: string): Promise<Atleta | null> {
    try {
      const docRef = doc(db, 'atletas', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const atleta = {
        id: docSnap.id,
        nome: data.nome,
        cpf: data.cpf,
        matricula: data.matricula,
        sexo: data.sexo,
        email: data.email,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento?.toDate(),
        dataFiliacao: data.dataFiliacao?.toDate(),
        maiorTotal: data.maiorTotal,
        status: data.status,
        idEquipe: data.idEquipe,
        idCategoria: data.idCategoria,
        endereco: data.endereco,
        observacoes: data.observacoes,
        dataCriacao: data.dataCriacao?.toDate(),
        dataAtualizacao: data.dataAtualizacao?.toDate()
      } as Atleta;

      // Buscar dados relacionados
      if (atleta.idEquipe) {
        atleta.equipe = await this.getEquipe(atleta.idEquipe);
      }
      if (atleta.idCategoria) {
        atleta.categoria = await this.getCategoria(atleta.idCategoria);
      }

      return atleta;
    } catch (error) {
      console.error('Erro ao buscar atleta por ID:', error);
      throw error;
    }
  },

  // Buscar atleta por CPF
  async getByCpf(cpf: string): Promise<Atleta | null> {
    try {
      const q = query(collection(db, 'atletas'), where('cpf', '==', cpf));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        nome: data.nome,
        cpf: data.cpf,
        matricula: data.matricula,
        sexo: data.sexo,
        email: data.email,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento?.toDate(),
        dataFiliacao: data.dataFiliacao?.toDate(),
        maiorTotal: data.maiorTotal,
        status: data.status,
        idEquipe: data.idEquipe,
        idCategoria: data.idCategoria,
        endereco: data.endereco,
        observacoes: data.observacoes,
        dataCriacao: data.dataCriacao?.toDate(),
        dataAtualizacao: data.dataAtualizacao?.toDate()
      } as Atleta;
    } catch (error) {
      console.error('Erro ao buscar atleta por CPF:', error);
      throw error;
    }
  },

  // Criar atleta
  async create(atletaData: Omit<Atleta, 'id'>): Promise<string> {
    try {
      // Verificar se CPF já existe
      const cpfLimpo = atletaData.cpf.replace(/\D/g, '');
      const atletaExistente = await this.getByCpf(cpfLimpo);
      
      if (atletaExistente) {
        throw new Error(`CPF ${atletaData.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome}`);
      }

      // Gerar matrícula se não fornecida
      if (!atletaData.matricula) {
        atletaData.matricula = this.gerarMatricula(atletaData.cpf);
      }

      const docRef = await addDoc(collection(db, 'atletas'), {
        ...atletaData,
        cpf: cpfLimpo, // Salvar CPF limpo
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar atleta:', error);
      throw error;
    }
  },

  // Atualizar atleta
  async update(id: string, atletaData: Partial<Atleta>): Promise<void> {
    try {
      // Se o CPF foi alterado, verificar se já existe
      if (atletaData.cpf) {
        const cpfLimpo = atletaData.cpf.replace(/\D/g, '');
        const atletaExistente = await this.getByCpf(cpfLimpo);
        
        if (atletaExistente && atletaExistente.id !== id) {
          throw new Error(`CPF ${atletaData.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome}`);
        }
        
        atletaData.cpf = cpfLimpo; // Salvar CPF limpo
      }

      const docRef = doc(db, 'atletas', id);
      await updateDoc(docRef, {
        ...atletaData,
        dataAtualizacao: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar atleta:', error);
      throw error;
    }
  },

  // Deletar atleta
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'atletas', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar atleta:', error);
      throw error;
    }
  },

  // Buscar atletas por equipe
  async getByEquipe(equipeId: string): Promise<Atleta[]> {
    try {
      const q = query(
        collection(db, 'atletas'),
        where('idEquipe', '==', equipeId),
        orderBy('nome', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          cpf: data.cpf,
          matricula: data.matricula,
          sexo: data.sexo,
          email: data.email,
          telefone: data.telefone,
          dataNascimento: data.dataNascimento?.toDate(),
          dataFiliacao: data.dataFiliacao?.toDate(),
          maiorTotal: data.maiorTotal,
          status: data.status,
          idEquipe: data.idEquipe,
          idCategoria: data.idCategoria,
          endereco: data.endereco,
          observacoes: data.observacoes,
          dataCriacao: data.dataCriacao?.toDate(),
          dataAtualizacao: data.dataAtualizacao?.toDate()
        } as Atleta;
      });
    } catch (error) {
      console.error('Erro ao buscar atletas por equipe:', error);
      throw error;
    }
  },

  // Atualizar status de atleta
  async updateStatus(id: string, status: 'ATIVO' | 'INATIVO'): Promise<void> {
    try {
      const docRef = doc(db, 'atletas', id);
      await updateDoc(docRef, {
        status,
        dataAtualizacao: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar status do atleta:', error);
      throw error;
    }
  },

  // Gerar matrícula baseada no CPF e ano atual
  gerarMatricula(cpf: string): string {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const primeirosDigitos = cpfLimpo.substring(0, 5);
    const anoAtual = new Date().getFullYear();
    return `FEPERJ - ${primeirosDigitos}${anoAtual}`;
  },

  // Buscar equipe por ID (método auxiliar)
  async getEquipe(id: string): Promise<any> {
    try {
      const docRef = doc(db, 'equipes', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        nomeEquipe: data.nomeEquipe,
        cidade: data.cidade,
        tecnico: data.tecnico,
        status: data.status
      };
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      return null;
    }
  },

  // Buscar categoria por ID (método auxiliar)
  async getCategoria(id: string): Promise<any> {
    try {
      const docRef = doc(db, 'categorias', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome,
        idadeMin: data.idadeMin,
        idadeMax: data.idadeMax,
        pesoMin: data.pesoMin,
        pesoMax: data.pesoMax,
        sexo: data.sexo
      };
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return null;
    }
  },

  // Estatísticas de atletas
  async getStats(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    porSexo: { masculino: number; feminino: number };
    porEquipe: Record<string, number>;
  }> {
    try {
      const atletas = await this.getAll();
      
      const stats = {
        total: atletas.length,
        ativos: atletas.filter(a => a.status === 'ATIVO').length,
        inativos: atletas.filter(a => a.status === 'INATIVO').length,
        porSexo: {
          masculino: atletas.filter(a => a.sexo === 'M').length,
          feminino: atletas.filter(a => a.sexo === 'F').length
        },
        porEquipe: {} as Record<string, number>
      };

      // Contar por equipe
      atletas.forEach(atleta => {
        if (atleta.idEquipe && atleta.equipe) {
          const nomeEquipe = atleta.equipe.nomeEquipe || 'Sem equipe';
          stats.porEquipe[nomeEquipe] = (stats.porEquipe[nomeEquipe] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de atletas:', error);
      throw error;
    }
  }
};

export default atletaService;


