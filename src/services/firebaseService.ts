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
  writeBatch,
  setDoc
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
    const usuarios = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let equipe = null;
        
        // Se o usuário tem equipe, buscar os dados da equipe
        if (data.idEquipe) {
          try {
            equipe = await equipeService.getById(data.idEquipe);
          } catch (error) {
            console.warn('Erro ao buscar equipe do usuário:', error);
          }
        }
        
        return {
          id: doc.id,
          ...data,
          dataCriacao: convertTimestamp(data.dataCriacao),
          equipe
        } as Usuario;
      })
    );
    
    return usuarios;
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
    // Se o usuário não for admin, criar equipe automaticamente
    if (usuario.tipo === 'usuario') {
      // Criar equipe com todos os dados fornecidos
      const equipeData = {
        nomeEquipe: usuario.nomeEquipe || usuario.nome,
        cidade: usuario.estado || 'A definir',
        tecnico: usuario.nome,
        telefone: '',
        email: '',
        observacoes: usuario.observacoes || '',
        dataCriacao: Timestamp.now()
      };
      
      // Criar a equipe primeiro
      const equipeRef = await addDoc(collection(db, 'equipes'), equipeData);
      const equipeId = equipeRef.id;
      
      // Criar o usuário com referência à equipe
      const usuarioData = {
        ...usuario,
        chefeEquipe: true,
        idEquipe: equipeId,
        dataCriacao: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'usuarios'), usuarioData);
      
      // Atualizar a equipe com o ID do chefe
      await updateDoc(equipeRef, { idChefe: docRef.id });
      
      return docRef.id;
    } else {
      // Para administradores, criar normalmente sem equipe
      const docRef = await addDoc(collection(db, 'usuarios'), {
        ...usuario,
        chefeEquipe: false,
        dataCriacao: Timestamp.now()
      });
      return docRef.id;
    }
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
    // Buscar o valor atual da anuidade de equipe
    const anuidadeEquipeAtiva = await anuidadeEquipeService.getAtivo();
    const valorAnuidadeEquipe = anuidadeEquipeAtiva?.valor || 0;
    
    const docRef = await addDoc(collection(db, 'equipes'), {
      ...equipe,
      valorAnuidadeEquipe: valorAnuidadeEquipe,
      dataCriacao: Timestamp.now()
    });
    
    console.log(`✅ Equipe ${equipe.nomeEquipe} criada com valor de anuidade: R$ ${valorAnuidadeEquipe}`);
    return docRef.id;
  },

  async update(id: string, equipe: Partial<Equipe>): Promise<void> {
    const docRef = doc(db, 'equipes', id);
    await updateDoc(docRef, equipe);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'equipes', id);
    await deleteDoc(docRef);
  },

  // Função para aprovar comprovante de inscrição
  async aprovarComprovanteInscricao(equipeId: string, competicaoId: string, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`✅ Aprovando comprovante de inscrição para equipe ${equipeId} na competição ${competicaoId}`);
      
      // 1. Atualizar status da equipe para PAGO
      const equipeRef = doc(db, 'equipes', equipeId);
      await updateDoc(equipeRef, {
        status: 'PAGO',
        dataAtualizacao: Timestamp.now()
      });
      console.log(`✅ Status da equipe ${equipeId} atualizado para PAGO no Firebase`);
      
      // 2. Atualizar status das inscrições da equipe para esta competição
      const inscricoesExistentes = await inscricaoService.getByCompeticao(competicaoId);
      const inscricoesEquipe = inscricoesExistentes.filter(insc => {
        // Buscar o atleta para verificar se pertence à equipe
        return insc.atleta && insc.atleta.idEquipe === equipeId;
      });
      
      // Atualizar status de todas as inscrições da equipe para esta competição
      for (const inscricao of inscricoesEquipe) {
        const inscricaoRef = doc(db, 'inscricoes_competicao', inscricao.id!);
        await updateDoc(inscricaoRef, {
          statusInscricao: 'INSCRITO',
          dataAprovacao: Timestamp.now(),
          aprovadoPor: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante de inscrição'
        });
      }
      
      console.log(`✅ Comprovante de inscrição aprovado com sucesso para equipe ${equipeId}`);
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante de inscrição:', error);
      throw error;
    }
  },

  // Função para rejeitar comprovante de inscrição
  async rejeitarComprovanteInscricao(equipeId: string, competicaoId: string, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`❌ Rejeitando comprovante de inscrição para equipe ${equipeId} na competição ${competicaoId}`);
      
      // 1. Atualizar status da equipe para PENDENTE
      const equipeRef = doc(db, 'equipes', equipeId);
      await updateDoc(equipeRef, {
        status: 'PENDENTE',
        dataAtualizacao: Timestamp.now()
      });
      console.log(`✅ Status da equipe ${equipeId} atualizado para PENDENTE no Firebase`);
      
      // 2. Registrar a rejeição das inscrições
      
      const inscricoesExistentes = await inscricaoService.getByCompeticao(competicaoId);
      const inscricoesEquipe = inscricoesExistentes.filter(insc => {
        // Buscar o atleta para verificar se pertence à equipe
        return insc.atleta && insc.atleta.idEquipe === equipeId;
      });
      
      // Atualizar status de todas as inscrições da equipe para esta competição
      for (const inscricao of inscricoesEquipe) {
        const inscricaoRef = doc(db, 'inscricoes_competicao', inscricao.id!);
        await updateDoc(inscricaoRef, {
          statusInscricao: 'CANCELADO',
          dataRejeicao: Timestamp.now(),
          rejeitadoPor: adminNome,
          observacoes: observacoes || 'Rejeitado via comprovante de inscrição'
        });
      }
      
      console.log(`❌ Comprovante de inscrição rejeitado com sucesso para equipe ${equipeId}`);
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante de inscrição:', error);
      throw error;
    }
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
          dataCriacao: convertTimestamp(data.dataCriacao),
          categoria,
          equipe
        } as Atleta;
      })
    );
    return atletas;
  },

  async create(atleta: Omit<Atleta, 'id'>): Promise<string> {
    // Verificar se CPF já existe no sistema
    const cpfLimpo = atleta.cpf.replace(/\D/g, '');
    const atletaExistente = await this.getByCpf(cpfLimpo);
    
    if (atletaExistente) {
      throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nomeEquipe || 'N/A'}). Entre em contato com o administrador.`);
    }
    
    const docRef = await addDoc(collection(db, 'atletas'), {
      ...atleta,
      cpf: cpfLimpo, // Salvar CPF limpo (apenas números)
      status: 'ATIVO', // Status padrão para novos atletas
      dataNascimento: convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: convertToTimestamp(atleta.dataFiliacao),
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, atleta: Partial<Atleta>): Promise<void> {
    // Se o CPF foi alterado, verificar se já existe no sistema
    if (atleta.cpf) {
      const cpfLimpo = atleta.cpf.replace(/\D/g, '');
      const atletaExistente = await this.getByCpf(cpfLimpo);
      
      // Se encontrou um atleta com o mesmo CPF e não é o mesmo atleta sendo editado
      if (atletaExistente && atletaExistente.id !== id) {
        throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nomeEquipe || 'N/A'}). Entre em contato com o administrador.`);
      }
    }
    
    const docRef = doc(db, 'atletas', id);
    const updateData = {
      ...atleta,
      cpf: atleta.cpf ? atleta.cpf.replace(/\D/g, '') : undefined, // Salvar CPF limpo
      dataNascimento: convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: convertToTimestamp(atleta.dataFiliacao),
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
  async getAll(): Promise<InscricaoCompeticao[]> {
    const querySnapshot = await getDocs(collection(db, 'inscricoes_competicao'));
    const inscricoes = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const atleta = await atletaService.getById(data.idAtleta);
        const competicao = await competicaoService.getById(data.idCompeticao);
        
        return {
          id: doc.id,
          ...data,
          dataInscricao: convertTimestamp(data.dataInscricao),
          dataAprovacao: convertTimestamp(data.dataAprovacao),
          dataRejeicao: convertTimestamp(data.dataRejeicao),
          atleta,
          competicao
        } as InscricaoCompeticao;
      })
    );
    return inscricoes;
  },

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
          dataAprovacao: convertTimestamp(data.dataAprovacao),
          dataRejeicao: convertTimestamp(data.dataRejeicao),
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
    try {
      console.log('📁 FileService: Iniciando upload para path:', path);
      console.log('📁 FileService: Tamanho do arquivo:', file.size, 'bytes');
      
      const storageRef = ref(storage, path);
      console.log('📁 FileService: Referência do storage criada');
      
      await uploadBytes(storageRef, file);
      console.log('📁 FileService: Upload de bytes concluído');
      
      const url = await getDownloadURL(storageRef);
      console.log('📁 FileService: URL de download obtida:', url);
      
      return url;
    } catch (error) {
      console.error('❌ FileService: Erro no upload:', error);
      throw error;
    }
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

    // Top 10 maiores totais por sexo
    const maioresTotaisMasculino = atletas
      .filter(a => a.maiorTotal && a.maiorTotal > 0 && a.sexo === 'M')
      .sort((a, b) => (b.maiorTotal || 0) - (a.maiorTotal || 0))
      .slice(0, 10)
      .map(a => ({
        atleta: a.nome,
        total: a.maiorTotal || 0
      }));

    const maioresTotaisFeminino = atletas
      .filter(a => a.maiorTotal && a.maiorTotal > 0 && a.sexo === 'F')
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
      maioresTotais,
      maioresTotaisMasculino,
      maioresTotaisFeminino
    };
  }
};

// Serviços Financeiros
export const anuidadeService = {
  async getAtivo(): Promise<any> {
    const q = query(
      collection(db, 'anuidades'), 
      where('ativo', '==', true)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Pegar o mais recente baseado na data de criação
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataCriacao: convertTimestamp(doc.data().dataCriacao),
        dataAtualizacao: convertTimestamp(doc.data().dataAtualizacao)
      }));
      
      // Ordenar por data de criação e pegar o mais recente
      docs.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
      return docs[0];
    }
    return null;
  },

  async create(anuidade: any): Promise<string> {
    // Desativar anuidades anteriores
    const q = query(collection(db, 'anuidades'), where('ativo', '==', true));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { ativo: false });
    });

    // Criar nova anuidade
    const docRef = await addDoc(collection(db, 'anuidades'), {
      ...anuidade,
      dataCriacao: Timestamp.now(),
      ativo: true
    });
    
    await batch.commit();
    return docRef.id;
  },

  async update(id: string, anuidade: any): Promise<void> {
    const docRef = doc(db, 'anuidades', id);
    await updateDoc(docRef, {
      ...anuidade,
      dataAtualizacao: Timestamp.now()
    });
  },

  async getAll(): Promise<any[]> {
    const q = query(collection(db, 'anuidades'), orderBy('dataCriacao', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCriacao: convertTimestamp(doc.data().dataCriacao),
      dataAtualizacao: convertTimestamp(doc.data().dataAtualizacao)
    }));
  }
};

export const pagamentoService = {
  async getAll(): Promise<any[]> {
    const querySnapshot = await getDocs(collection(db, 'pagamentos_anuidade'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPagamento: convertTimestamp(doc.data().dataPagamento),
      dataAprovacao: convertTimestamp(doc.data().dataAprovacao),
      dataRejeicao: convertTimestamp(doc.data().dataRejeicao)
    }));
  },

  async getByAtleta(idAtleta: string): Promise<any[]> {
    const q = query(collection(db, 'pagamentos_anuidade'), where('idAtleta', '==', idAtleta));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPagamento: convertTimestamp(doc.data().dataPagamento)
    }));
  },

  async getByEquipe(idEquipe: string): Promise<any[]> {
    const q = query(collection(db, 'pagamentos_anuidade'), where('idEquipe', '==', idEquipe));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPagamento: convertTimestamp(doc.data().dataPagamento)
    }));
  },

  async create(pagamento: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'pagamentos_anuidade'), {
      ...pagamento,
      dataPagamento: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, pagamento: any): Promise<void> {
    const docRef = doc(db, 'pagamentos_anuidade', id);
    await updateDoc(docRef, pagamento);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'pagamentos_anuidade', id);
    await deleteDoc(docRef);
  },

  // Função para aprovar comprovante de anuidade
  async aprovarComprovante(atletaId: string, valorAnuidade: number, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`✅ Aprovando comprovante para atleta ${atletaId}`);
      
      // 1. Atualizar status do atleta para ATIVO
      const atletaRef = doc(db, 'atletas', atletaId);
      await updateDoc(atletaRef, {
        status: 'ATIVO',
        dataAtualizacao: Timestamp.now()
      });
      
      // 2. Criar ou atualizar registro de pagamento
      const pagamentosExistentes = await this.getByAtleta(atletaId);
      const pagamentoAtual = pagamentosExistentes.find(p => p.ano === new Date().getFullYear());
      
      if (pagamentoAtual) {
        // Atualizar pagamento existente
        await this.update(pagamentoAtual.id, {
          status: 'PAGO',
          valor: valorAnuidade,
          dataAprovacao: Timestamp.now(),
          aprovadoPor: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante'
        });
      } else {
        // Criar novo pagamento
        const atleta = await atletaService.getById(atletaId);
        if (!atleta) {
          throw new Error('Atleta não encontrado');
        }
        
        await this.create({
          idAtleta: atletaId,
          idEquipe: atleta.idEquipe,
          nomeAtleta: atleta.nome,
          nomeEquipe: atleta.equipe?.nomeEquipe || 'N/A',
          valor: valorAnuidade,
          status: 'PAGO',
          ano: new Date().getFullYear(),
          dataAprovacao: Timestamp.now(),
          aprovadoPor: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante'
        });
      }
      
      console.log(`✅ Comprovante aprovado com sucesso para atleta ${atletaId}`);
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante:', error);
      throw error;
    }
  },

  // Função para rejeitar comprovante de anuidade
  async rejeitarComprovante(atletaId: string, adminNome: string, observacoes?: string): Promise<void> {
    try {
      console.log(`❌ Rejeitando comprovante para atleta ${atletaId}`);
      
      // Não alterar status do atleta (manter como está)
      // Apenas registrar a rejeição
      
      const pagamentosExistentes = await this.getByAtleta(atletaId);
      const pagamentoAtual = pagamentosExistentes.find(p => p.ano === new Date().getFullYear());
      
      if (pagamentoAtual) {
        // Atualizar pagamento existente
        await this.update(pagamentoAtual.id, {
          status: 'REJEITADO',
          dataRejeicao: Timestamp.now(),
          rejeitadoPor: adminNome,
          observacoes: observacoes || 'Rejeitado via comprovante'
        });
      } else {
        // Criar registro de rejeição
        const atleta = await atletaService.getById(atletaId);
        if (!atleta) {
          throw new Error('Atleta não encontrado');
        }
        
        await this.create({
          idAtleta: atletaId,
          idEquipe: atleta.idEquipe,
          nomeAtleta: atleta.nome,
          nomeEquipe: atleta.equipe?.nomeEquipe || 'N/A',
          valor: 0,
          status: 'REJEITADO',
          ano: new Date().getFullYear(),
          dataRejeicao: Timestamp.now(),
          rejeitadoPor: adminNome,
          observacoes: observacoes || 'Rejeitado via comprovante'
        });
      }
      
      console.log(`❌ Comprovante rejeitado com sucesso para atleta ${atletaId}`);
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante:', error);
      throw error;
    }
  },


};

// Serviço para renovação anual automática
export const renovacaoAnualService = {
  // Verificar se precisa fazer renovação anual
  async verificarRenovacaoAnual(): Promise<boolean> {
    try {
      const anoAtual = new Date().getFullYear();
      const ultimaRenovacao = localStorage.getItem('ultimaRenovacaoAnual');
      
      if (!ultimaRenovacao || parseInt(ultimaRenovacao) < anoAtual) {
        console.log(`🔄 Verificando renovação anual para ${anoAtual}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar renovação anual:', error);
      return false;
    }
  },

  // Executar renovação anual
  async executarRenovacaoAnual(): Promise<void> {
    try {
      const anoAtual = new Date().getFullYear();
      console.log(`🔄 Iniciando renovação anual para ${anoAtual}`);
      
      // Buscar todos os atletas
      const atletas = await atletaService.getAll();
      
      // Atualizar status de todos os atletas para INATIVO
      const batch = writeBatch(db);
      
      atletas.forEach(atleta => {
        if (atleta.id) {
          const atletaRef = doc(db, 'atletas', atleta.id);
          batch.update(atletaRef, {
            status: 'INATIVO',
            dataAtualizacao: Timestamp.now()
          });
        }
      });
      
      // Executar todas as atualizações
      await batch.commit();
      
      // Marcar renovação como executada
      localStorage.setItem('ultimaRenovacaoAnual', anoAtual.toString());
      
      console.log(`✅ Renovação anual executada com sucesso. ${atletas.length} atletas atualizados.`);
    } catch (error) {
      console.error('❌ Erro ao executar renovação anual:', error);
      throw error;
    }
  },

  // Verificar e executar renovação se necessário
  async verificarEExecutarRenovacao(): Promise<void> {
    try {
      const precisaRenovacao = await this.verificarRenovacaoAnual();
      
      if (precisaRenovacao) {
        await this.executarRenovacaoAnual();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar e executar renovação:', error);
      throw error;
    }
  }
};

export const documentoService = {
  async getAll(): Promise<any[]> {
    const q = query(collection(db, 'documentos_contabeis'), orderBy('dataUpload', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataUpload: convertTimestamp(doc.data().dataUpload)
    }));
  },

  async create(documento: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'documentos_contabeis'), {
      ...documento,
      dataUpload: Timestamp.now(),
      ativo: true
    });
    return docRef.id;
  },

  async update(id: string, documento: any): Promise<void> {
    const docRef = doc(db, 'documentos_contabeis', id);
    await updateDoc(docRef, documento);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'documentos_contabeis', id);
    await deleteDoc(docRef);
  },

  async uploadDocumento(file: File, tipo: string): Promise<string> {
    try {
      console.log('📁 Iniciando upload do documento:', file.name);
      const fileName = `documentos_contabeis/${Date.now()}_${file.name}`;
      console.log('📁 Nome do arquivo no storage:', fileName);
      
      const url = await fileService.uploadFile(file, fileName);
      console.log('✅ Upload concluído com sucesso. URL:', url);
      return url;
    } catch (error) {
      console.error('❌ Erro no upload do documento:', error);
      throw error;
    }
  }
};

// Serviços de Tipos de Competição
export const tipoCompeticaoService = {
  async getAll(): Promise<string[]> {
    const docRef = doc(db, 'configuracoes', 'tipos_competicao');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().tipos || [];
    }
    
    // Se não existir, retornar tipos padrão
    return ['S', 'AST', 'T'];
  },

  async update(tipos: string[]): Promise<void> {
    const docRef = doc(db, 'configuracoes', 'tipos_competicao');
    await updateDoc(docRef, { tipos });
  },

  async createDefault(): Promise<void> {
    const docRef = doc(db, 'configuracoes', 'tipos_competicao');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, { 
        tipos: ['S', 'AST', 'T'],
        dataCriacao: Timestamp.now()
      });
    }
  }
};

// Serviços de Anuidade de Equipe
export const anuidadeEquipeService = {
  async getAtivo(): Promise<any> {
    const q = query(
      collection(db, 'anuidades_equipe'), 
      where('ativo', '==', true)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Pegar o mais recente baseado na data de criação
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataCriacao: convertTimestamp(doc.data().dataCriacao),
        dataAtualizacao: convertTimestamp(doc.data().dataAtualizacao)
      }));
      
      // Ordenar por data de criação e pegar o mais recente
      docs.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
      return docs[0];
    }
    return null;
  },

  async create(anuidade: any): Promise<string> {
    // Desativar anuidades anteriores
    const q = query(collection(db, 'anuidades_equipe'), where('ativo', '==', true));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { ativo: false });
    });

    // Criar nova anuidade
    const docRef = await addDoc(collection(db, 'anuidades_equipe'), {
      ...anuidade,
      dataCriacao: Timestamp.now(),
      ativo: true
    });
    
    await batch.commit();
    
    // Atualizar valor da anuidade em todas as equipes existentes
    await this.atualizarValorAnuidadeEmTodasEquipes(anuidade.valor);
    
    return docRef.id;
  },

  async atualizarValorAnuidadeEmTodasEquipes(valor: number): Promise<void> {
    try {
      console.log(`🔄 Atualizando valor de anuidade para R$ ${valor} em todas as equipes...`);
      
      // Buscar todas as equipes
      const equipesSnapshot = await getDocs(collection(db, 'equipes'));
      const batch = writeBatch(db);
      
      let equipesAtualizadas = 0;
      equipesSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          valorAnuidadeEquipe: valor,
          dataAtualizacao: Timestamp.now()
        });
        equipesAtualizadas++;
      });
      
      await batch.commit();
      console.log(`✅ Valor de anuidade atualizado em ${equipesAtualizadas} equipes`);
    } catch (error) {
      console.error('❌ Erro ao atualizar valor de anuidade em todas as equipes:', error);
      throw error;
    }
  },

  async inicializarValorAnuidadeEmEquipesExistentes(): Promise<void> {
    try {
      console.log('🔄 Inicializando valor de anuidade em equipes existentes...');
      
      // Buscar anuidade ativa
      const anuidadeAtiva = await this.getAtivo();
      if (!anuidadeAtiva) {
        console.log('⚠️ Nenhuma anuidade de equipe ativa encontrada');
        return;
      }
      
      // Buscar equipes que não possuem valor de anuidade
      const equipesSnapshot = await getDocs(collection(db, 'equipes'));
      const batch = writeBatch(db);
      
      let equipesInicializadas = 0;
      equipesSnapshot.docs.forEach((doc) => {
        const equipeData = doc.data();
        if (equipeData.valorAnuidadeEquipe === undefined || equipeData.valorAnuidadeEquipe === null) {
          batch.update(doc.ref, {
            valorAnuidadeEquipe: anuidadeAtiva.valor,
            dataAtualizacao: Timestamp.now()
          });
          equipesInicializadas++;
        }
      });
      
      if (equipesInicializadas > 0) {
        await batch.commit();
        console.log(`✅ Valor de anuidade inicializado em ${equipesInicializadas} equipes existentes`);
      } else {
        console.log('✅ Todas as equipes já possuem valor de anuidade definido');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar valor de anuidade em equipes existentes:', error);
      throw error;
    }
  },

  async update(id: string, anuidade: any): Promise<void> {
    const docRef = doc(db, 'anuidades_equipe', id);
    await updateDoc(docRef, {
      ...anuidade,
      dataAtualizacao: Timestamp.now()
    });
    
    // Se o valor foi alterado, atualizar todas as equipes
    if (anuidade.valor !== undefined) {
      await this.atualizarValorAnuidadeEmTodasEquipes(anuidade.valor);
    }
  },

  async getAll(): Promise<any[]> {
    const q = query(collection(db, 'anuidades_equipe'), orderBy('dataCriacao', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCriacao: convertTimestamp(doc.data().dataCriacao),
      dataAtualizacao: convertTimestamp(doc.data().dataAtualizacao)
    }));
  }
};

// Serviços para atualizar status de equipe
export const equipeStatusService = {
  async atualizarStatusEquipe(equipeId: string, status: 'ATIVA' | 'INATIVA', adminNome: string): Promise<void> {
    try {
      console.log(`🔄 Atualizando status da equipe ${equipeId} para ${status}`);
      
      const equipeRef = doc(db, 'equipes', equipeId);
      await updateDoc(equipeRef, {
        status: status,
        dataAtualizacao: Timestamp.now()
      });
      
      console.log(`✅ Status da equipe ${equipeId} atualizado para ${status}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da equipe:', error);
      throw error;
    }
  },

  async atualizarValorAnuidadeEquipe(equipeId: string, valor: number, adminNome: string): Promise<void> {
    try {
      console.log(`💰 Atualizando valor de anuidade da equipe ${equipeId} para R$ ${valor}`);
      
      const equipeRef = doc(db, 'equipes', equipeId);
      await updateDoc(equipeRef, {
        valorAnuidadeEquipe: valor,
        dataAtualizacao: Timestamp.now()
      });
      
      console.log(`✅ Valor de anuidade da equipe ${equipeId} atualizado para R$ ${valor}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar valor de anuidade da equipe:', error);
      throw error;
    }
  }
};
