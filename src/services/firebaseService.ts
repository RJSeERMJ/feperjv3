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
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import {
  Usuario,
  Equipe,
  Categoria,
  Atleta,
  Competicao,
  InscricaoCompeticao,
  ResultadoCompeticao,
  LogAtividade,
  CategoriaInscricao,
  HistoricoTotal
} from '../types';

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

// Serviços de Usuários
export const usuarioService = {
  async getAll(): Promise<Usuario[]> {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCriacao: convertTimestamp(doc.data().dataCriacao)
    })) as Usuario[];
  },

  async getById(id: string): Promise<Usuario | null> {
    const docRef = doc(db, 'usuarios', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        dataCriacao: convertTimestamp(docSnap.data().dataCriacao)
      } as Usuario;
    }
    return null;
  },

  async getByLogin(login: string): Promise<Usuario | null> {
    const q = query(collection(db, 'usuarios'), where('login', '==', login));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        dataCriacao: convertTimestamp(doc.data().dataCriacao)
      } as Usuario;
    }
    return null;
  },

  async create(usuario: Omit<Usuario, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'usuarios'), {
      ...usuario,
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, usuario: Partial<Usuario>): Promise<void> {
    const docRef = doc(db, 'usuarios', id);
    await updateDoc(docRef, usuario);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'usuarios', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Equipes
export const equipeService = {
  async getAll(): Promise<Equipe[]> {
    const querySnapshot = await getDocs(collection(db, 'equipes'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCriacao: convertTimestamp(doc.data().dataCriacao)
    })) as Equipe[];
  },

  async getById(id: string): Promise<Equipe | null> {
    const docRef = doc(db, 'equipes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        dataCriacao: convertTimestamp(docSnap.data().dataCriacao)
      } as Equipe;
    }
    return null;
  },

  async create(equipe: Omit<Equipe, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'equipes'), {
      ...equipe,
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, equipe: Partial<Equipe>): Promise<void> {
    const docRef = doc(db, 'equipes', id);
    await updateDoc(docRef, equipe);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'equipes', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Categorias
export const categoriaService = {
  async getAll(): Promise<Categoria[]> {
    const querySnapshot = await getDocs(collection(db, 'categorias'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Categoria[];
  },

  async getBySexo(sexo: 'M' | 'F'): Promise<Categoria[]> {
    const q = query(collection(db, 'categorias'), where('sexo', '==', sexo));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Categoria[];
  },

  async getById(id: string): Promise<Categoria | null> {
    const docRef = doc(db, 'categorias', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Categoria;
    }
    return null;
  },

  async create(categoria: Omit<Categoria, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'categorias'), categoria);
    return docRef.id;
  },

  async update(id: string, categoria: Partial<Categoria>): Promise<void> {
    const docRef = doc(db, 'categorias', id);
    await updateDoc(docRef, categoria);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'categorias', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Atletas
export const atletaService = {
  async getAll(): Promise<Atleta[]> {
    const querySnapshot = await getDocs(collection(db, 'atletas'));
    const atletas = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const categoria = data.idCategoria ? await categoriaService.getById(data.idCategoria) : null;
        const equipe = data.idEquipe ? await equipeService.getById(data.idEquipe) : null;
        
        return {
          id: doc.id,
          ...data,
          dataNascimento: convertTimestamp(data.dataNascimento),
          dataFiliacao: convertTimestamp(data.dataFiliacao),
          dataDesfiliacao: convertTimestamp(data.dataDesfiliacao),
          dataCriacao: convertTimestamp(data.dataCriacao),
          categoria,
          equipe
        } as Atleta;
      })
    );
    return atletas;
  },

  async getById(id: string): Promise<Atleta | null> {
    const docRef = doc(db, 'atletas', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const categoria = data.idCategoria ? await categoriaService.getById(data.idCategoria) : null;
      const equipe = data.idEquipe ? await equipeService.getById(data.idEquipe) : null;
      
      return {
        id: docSnap.id,
        ...data,
        dataNascimento: convertTimestamp(data.dataNascimento),
        dataFiliacao: convertTimestamp(data.dataFiliacao),
        dataDesfiliacao: convertTimestamp(data.dataDesfiliacao),
        dataCriacao: convertTimestamp(data.dataCriacao),
        categoria,
        equipe
      } as Atleta;
    }
    return null;
  },

  async getByCpf(cpf: string): Promise<Atleta | null> {
    const q = query(collection(db, 'atletas'), where('cpf', '==', cpf));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const categoria = data.idCategoria ? await categoriaService.getById(data.idCategoria) : null;
      const equipe = data.idEquipe ? await equipeService.getById(data.idEquipe) : null;
      
      return {
        id: doc.id,
        ...data,
        dataNascimento: convertTimestamp(data.dataNascimento),
        dataFiliacao: convertTimestamp(data.dataFiliacao),
        dataDesfiliacao: convertTimestamp(data.dataDesfiliacao),
        dataCriacao: convertTimestamp(data.dataCriacao),
        categoria,
        equipe
      } as Atleta;
    }
    return null;
  },

  async search(searchTerm: string): Promise<Atleta[]> {
    const q = query(
      collection(db, 'atletas'),
      where('nome', '>=', searchTerm),
      where('nome', '<=', searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    const atletas = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const categoria = data.idCategoria ? await categoriaService.getById(data.idCategoria) : null;
        const equipe = data.idEquipe ? await equipeService.getById(data.idEquipe) : null;
        
        return {
          id: doc.id,
          ...data,
          dataNascimento: convertTimestamp(data.dataNascimento),
          dataFiliacao: convertTimestamp(data.dataFiliacao),
          dataDesfiliacao: convertTimestamp(data.dataDesfiliacao),
          dataCriacao: convertTimestamp(data.dataCriacao),
          categoria,
          equipe
        } as Atleta;
      })
    );
    return atletas;
  },

  async create(atleta: Omit<Atleta, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'atletas'), {
      ...atleta,
      dataNascimento: convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: convertToTimestamp(atleta.dataFiliacao),
      dataDesfiliacao: convertToTimestamp(atleta.dataDesfiliacao),
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, atleta: Partial<Atleta>): Promise<void> {
    const docRef = doc(db, 'atletas', id);
    const updateData = {
      ...atleta,
      dataNascimento: convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: convertToTimestamp(atleta.dataFiliacao),
      dataDesfiliacao: convertToTimestamp(atleta.dataDesfiliacao)
    };
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'atletas', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Competições
export const competicaoService = {
  async getAll(): Promise<Competicao[]> {
    const querySnapshot = await getDocs(collection(db, 'competicoes'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCompeticao: convertTimestamp(doc.data().dataCompeticao),
      dataInicioInscricao: convertTimestamp(doc.data().dataInicioInscricao),
      dataFimInscricao: convertTimestamp(doc.data().dataFimInscricao),
      dataNominacaoPreliminar: convertTimestamp(doc.data().dataNominacaoPreliminar),
      dataNominacaoFinal: convertTimestamp(doc.data().dataNominacaoFinal),
      dataCriacao: convertTimestamp(doc.data().dataCriacao)
    })) as Competicao[];
  },

  async getById(id: string): Promise<Competicao | null> {
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
  },

  async create(competicao: Omit<Competicao, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'competicoes'), {
      ...competicao,
      dataCompeticao: convertToTimestamp(competicao.dataCompeticao),
      dataInicioInscricao: convertToTimestamp(competicao.dataInicioInscricao),
      dataFimInscricao: convertToTimestamp(competicao.dataFimInscricao),
      dataNominacaoPreliminar: convertToTimestamp(competicao.dataNominacaoPreliminar),
      dataNominacaoFinal: convertToTimestamp(competicao.dataNominacaoFinal),
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, competicao: Partial<Competicao>): Promise<void> {
    const docRef = doc(db, 'competicoes', id);
    const updateData = {
      ...competicao,
      dataCompeticao: convertToTimestamp(competicao.dataCompeticao),
      dataInicioInscricao: convertToTimestamp(competicao.dataInicioInscricao),
      dataFimInscricao: convertToTimestamp(competicao.dataFimInscricao),
      dataNominacaoPreliminar: convertToTimestamp(competicao.dataNominacaoPreliminar),
      dataNominacaoFinal: convertToTimestamp(competicao.dataNominacaoFinal)
    };
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'competicoes', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Inscrições
export const inscricaoService = {
  async getByCompeticao(competicaoId: string): Promise<InscricaoCompeticao[]> {
    const q = query(
      collection(db, 'inscricoes_competicao'),
      where('idCompeticao', '==', competicaoId)
    );
    const querySnapshot = await getDocs(q);
    const inscricoes = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const atleta = await atletaService.getById(data.idAtleta);
        const competicao = await competicaoService.getById(data.idCompeticao);
        
        return {
          id: doc.id,
          ...data,
          dataInscricao: convertTimestamp(data.dataInscricao),
          atleta,
          competicao
        } as InscricaoCompeticao;
      })
    );
    return inscricoes;
  },

  async create(inscricao: Omit<InscricaoCompeticao, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'inscricoes_competicao'), {
      ...inscricao,
      dataInscricao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, inscricao: Partial<InscricaoCompeticao>): Promise<void> {
    const docRef = doc(db, 'inscricoes_competicao', id);
    await updateDoc(docRef, inscricao);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'inscricoes_competicao', id);
    await deleteDoc(docRef);
  }
};

// Serviços de Log
export const logService = {
  async getAll(): Promise<LogAtividade[]> {
    const q = query(collection(db, 'log_atividades'), orderBy('dataHora', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataHora: convertTimestamp(doc.data().dataHora)
    })) as LogAtividade[];
  },

  async create(log: Omit<LogAtividade, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'log_atividades'), {
      ...log,
      dataHora: Timestamp.now()
    });
    return docRef.id;
  },

  async clear(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, 'log_atividades'));
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
};

// Serviços de Upload de Arquivos
export const fileService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
};

// Serviços de Dashboard
export const dashboardService = {
  async getStats(): Promise<any> {
    const [atletas, equipes, competicoes, log] = await Promise.all([
      atletaService.getAll(),
      equipeService.getAll(),
      competicaoService.getAll(),
      logService.getAll()
    ]);

    const atletasAtivos = atletas.filter(a => a.status === 'ATIVO').length;
    const atletasInativos = atletas.filter(a => a.status === 'INATIVO').length;
    const atletasMasculino = atletas.filter(a => a.sexo === 'M').length;
    const atletasFeminino = atletas.filter(a => a.sexo === 'F').length;

    // Agrupar atletas por equipe
    const atletasPorEquipe = equipes.map(equipe => ({
      equipe: equipe.nomeEquipe,
      quantidade: atletas.filter(a => a.idEquipe === equipe.id).length
    }));

    // Top 10 maiores totais
    const maioresTotais = atletas
      .filter(a => a.maiorTotal && a.maiorTotal > 0)
      .sort((a, b) => (b.maiorTotal || 0) - (a.maiorTotal || 0))
      .slice(0, 10)
      .map(a => ({
        atleta: a.nome,
        total: a.maiorTotal || 0
      }));

    return {
      totalAtletas: atletas.length,
      totalEquipes: equipes.length,
      totalCompeticoes: competicoes.length,
      atletasAtivos,
      atletasInativos,
      atletasPorSexo: {
        masculino: atletasMasculino,
        feminino: atletasFeminino
      },
      atletasPorEquipe,
      maioresTotais
    };
  }
};
