import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
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
import { User, Atleta, Equipe, Competicao, InscricaoCompeticao, LogAtividade } from '../types';

export class FirebaseService {
  private app: FirebaseApp;
  private db: Firestore;
  private auth: Auth;
  private storage: FirebaseStorage;

  constructor(firebaseConfig: any) {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);
  }

  // Função auxiliar para converter Timestamp para Date
  private convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  };

  // Função auxiliar para converter Date para Timestamp
  private convertToTimestamp = (date: Date | undefined): Timestamp | undefined => {
    if (date) {
      return Timestamp.fromDate(date);
    }
    return undefined;
  };

  // ===== SERVIÇOS DE USUÁRIOS =====
  async getAllUsuarios(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(this.db, 'usuarios'));
    const usuarios = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let equipe = null;
        
        if (data.idEquipe) {
          try {
            equipe = await this.getEquipeById(data.idEquipe);
          } catch (error) {
            console.warn('Erro ao buscar equipe do usuário:', error);
          }
        }
        
        return {
          id: doc.id,
          ...data,
          dataCriacao: this.convertTimestamp(data.dataCriacao),
          equipe
        } as User;
      })
    );
    
    return usuarios;
  }

  async getUsuarioById(id: string): Promise<User | null> {
    const docRef = doc(this.db, 'usuarios', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        dataCriacao: this.convertTimestamp(docSnap.data().dataCriacao)
      } as User;
    }
    return null;
  }

  async getUsuarioByLogin(login: string): Promise<User | null> {
    const q = query(collection(this.db, 'usuarios'), where('login', '==', login));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
      } as User;
    }
    return null;
  }

  async createUsuario(usuario: Omit<User, 'id'>): Promise<string> {
    if (usuario.tipo === 'usuario') {
      // Criar equipe automaticamente
      const equipeData = {
        nomeEquipe: usuario.nomeEquipe || usuario.nome,
        cidade: usuario.estado || 'A definir',
        tecnico: usuario.nome,
        telefone: '',
        email: '',
        observacoes: usuario.observacoes || '',
        dataCriacao: Timestamp.now()
      };
      
      const equipeRef = await addDoc(collection(this.db, 'equipes'), equipeData);
      const equipeId = equipeRef.id;
      
      const usuarioData = {
        ...usuario,
        chefeEquipe: true,
        idEquipe: equipeId,
        dataCriacao: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(this.db, 'usuarios'), usuarioData);
      await updateDoc(equipeRef, { idChefe: docRef.id });
      
      return docRef.id;
    } else {
      const docRef = await addDoc(collection(this.db, 'usuarios'), {
        ...usuario,
        chefeEquipe: false,
        dataCriacao: Timestamp.now()
      });
      return docRef.id;
    }
  }

  async updateUsuario(id: string, usuario: Partial<User>): Promise<void> {
    const docRef = doc(this.db, 'usuarios', id);
    await updateDoc(docRef, usuario);
  }

  async updateUsuarioPassword(id: string, hashedPassword: string): Promise<void> {
    const docRef = doc(this.db, 'usuarios', id);
    await updateDoc(docRef, { senha: hashedPassword });
  }

  async deleteUsuario(id: string): Promise<void> {
    const docRef = doc(this.db, 'usuarios', id);
    await deleteDoc(docRef);
  }

  // ===== SERVIÇOS DE EQUIPES =====
  async getAllEquipes(): Promise<Equipe[]> {
    const querySnapshot = await getDocs(collection(this.db, 'equipes'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
    })) as Equipe[];
  }

  async getEquipeById(id: string): Promise<Equipe | null> {
    const docRef = doc(this.db, 'equipes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        dataCriacao: this.convertTimestamp(docSnap.data().dataCriacao)
      } as Equipe;
    }
    return null;
  }

  async createEquipe(equipe: Omit<Equipe, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'equipes'), {
      ...equipe,
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  }

  async updateEquipe(id: string, equipe: Partial<Equipe>): Promise<void> {
    const docRef = doc(this.db, 'equipes', id);
    await updateDoc(docRef, equipe);
  }

  async deleteEquipe(id: string): Promise<void> {
    const docRef = doc(this.db, 'equipes', id);
    await deleteDoc(docRef);
  }

  // ===== SERVIÇOS DE ATLETAS =====
  async getAllAtletas(): Promise<Atleta[]> {
    const querySnapshot = await getDocs(collection(this.db, 'atletas'));
    const atletas = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
        
        return {
          id: doc.id,
          ...data,
          dataNascimento: this.convertTimestamp(data.dataNascimento),
          dataFiliacao: this.convertTimestamp(data.dataFiliacao),
          dataCriacao: this.convertTimestamp(data.dataCriacao),
          equipe
        } as Atleta;
      })
    );
    return atletas;
  }

  async getAtletaById(id: string): Promise<Atleta | null> {
    const docRef = doc(this.db, 'atletas', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
      
      return {
        id: docSnap.id,
        ...data,
        dataNascimento: this.convertTimestamp(data.dataNascimento),
        dataFiliacao: this.convertTimestamp(data.dataFiliacao),
        dataCriacao: this.convertTimestamp(data.dataCriacao),
        equipe
      } as Atleta;
    }
    return null;
  }

  async getAtletaByCpf(cpf: string): Promise<Atleta | null> {
    const q = query(collection(this.db, 'atletas'), where('cpf', '==', cpf));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const equipe = data.idEquipe ? await this.getEquipeById(data.idEquipe) : null;
      
      return {
        id: doc.id,
        ...data,
        dataNascimento: this.convertTimestamp(data.dataNascimento),
        dataFiliacao: this.convertTimestamp(data.dataFiliacao),
        dataCriacao: this.convertTimestamp(data.dataCriacao),
        equipe
      } as Atleta;
    }
    return null;
  }

  async createAtleta(atleta: Omit<Atleta, 'id'>): Promise<string> {
    const cpfLimpo = atleta.cpf.replace(/\D/g, '');
    const atletaExistente = await this.getAtletaByCpf(cpfLimpo);
    
    if (atletaExistente) {
      throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema.`);
    }
    
    const docRef = await addDoc(collection(this.db, 'atletas'), {
      ...atleta,
      cpf: cpfLimpo,
      status: 'ATIVO',
      dataNascimento: this.convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: this.convertToTimestamp(atleta.dataFiliacao),
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  }

  async updateAtleta(id: string, atleta: Partial<Atleta>): Promise<void> {
    if (atleta.cpf) {
      const cpfLimpo = atleta.cpf.replace(/\D/g, '');
      const atletaExistente = await this.getAtletaByCpf(cpfLimpo);
      
      if (atletaExistente && atletaExistente.id !== id) {
        throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema.`);
      }
    }
    
    const docRef = doc(this.db, 'atletas', id);
    const updateData = {
      ...atleta,
      cpf: atleta.cpf ? atleta.cpf.replace(/\D/g, '') : undefined,
      dataNascimento: this.convertToTimestamp(atleta.dataNascimento),
      dataFiliacao: this.convertToTimestamp(atleta.dataFiliacao),
    };
    await updateDoc(docRef, updateData);
  }

  async deleteAtleta(id: string): Promise<void> {
    const docRef = doc(this.db, 'atletas', id);
    await deleteDoc(docRef);
  }

  // ===== SERVIÇOS DE COMPETIÇÕES =====
  async getAllCompeticoes(): Promise<Competicao[]> {
    const querySnapshot = await getDocs(collection(this.db, 'competicoes'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCompeticao: this.convertTimestamp(doc.data().dataCompeticao),
      dataInicioInscricao: this.convertTimestamp(doc.data().dataInicioInscricao),
      dataFimInscricao: this.convertTimestamp(doc.data().dataFimInscricao),
      dataNominacaoPreliminar: this.convertTimestamp(doc.data().dataNominacaoPreliminar),
      dataNominacaoFinal: this.convertTimestamp(doc.data().dataNominacaoFinal),
      dataCriacao: this.convertTimestamp(doc.data().dataCriacao)
    })) as Competicao[];
  }

  async getCompeticaoById(id: string): Promise<Competicao | null> {
    const docRef = doc(this.db, 'competicoes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataCompeticao: this.convertTimestamp(data.dataCompeticao),
        dataInicioInscricao: this.convertTimestamp(data.dataInicioInscricao),
        dataFimInscricao: this.convertTimestamp(data.dataFimInscricao),
        dataNominacaoPreliminar: this.convertTimestamp(data.dataNominacaoPreliminar),
        dataNominacaoFinal: this.convertTimestamp(data.dataNominacaoFinal),
        dataCriacao: this.convertTimestamp(data.dataCriacao)
      } as Competicao;
    }
    return null;
  }

  async createCompeticao(competicao: Omit<Competicao, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'competicoes'), {
      ...competicao,
      dataCompeticao: this.convertToTimestamp(competicao.dataCompeticao),
      dataInicioInscricao: this.convertToTimestamp(competicao.dataInicioInscricao),
      dataFimInscricao: this.convertToTimestamp(competicao.dataFimInscricao),
      dataNominacaoPreliminar: this.convertToTimestamp(competicao.dataNominacaoPreliminar),
      dataNominacaoFinal: this.convertToTimestamp(competicao.dataNominacaoFinal),
      dataCriacao: Timestamp.now()
    });
    return docRef.id;
  }

  async updateCompeticao(id: string, competicao: Partial<Competicao>): Promise<void> {
    const docRef = doc(this.db, 'competicoes', id);
    const updateData = {
      ...competicao,
      dataCompeticao: this.convertToTimestamp(competicao.dataCompeticao),
      dataInicioInscricao: this.convertToTimestamp(competicao.dataInicioInscricao),
      dataFimInscricao: this.convertToTimestamp(competicao.dataFimInscricao),
      dataNominacaoPreliminar: this.convertToTimestamp(competicao.dataNominacaoPreliminar),
      dataNominacaoFinal: this.convertToTimestamp(competicao.dataNominacaoFinal)
    };
    await updateDoc(docRef, updateData);
  }

  async deleteCompeticao(id: string): Promise<void> {
    const docRef = doc(this.db, 'competicoes', id);
    await deleteDoc(docRef);
  }

  // ===== SERVIÇOS DE INSCRIÇÕES =====
  async getAllInscricoes(): Promise<InscricaoCompeticao[]> {
    const querySnapshot = await getDocs(collection(this.db, 'inscricoes_competicao'));
    const inscricoes = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const atleta = await this.getAtletaById(data.idAtleta);
        const competicao = await this.getCompeticaoById(data.idCompeticao);
        
        return {
          id: doc.id,
          ...data,
          dataInscricao: this.convertTimestamp(data.dataInscricao),
          dataAprovacao: this.convertTimestamp(data.dataAprovacao),
          dataRejeicao: this.convertTimestamp(data.dataRejeicao),
          atleta,
          competicao
        } as InscricaoCompeticao;
      })
    );
    return inscricoes;
  }

  async getInscricoesByCompeticao(competicaoId: string): Promise<InscricaoCompeticao[]> {
    const q = query(
      collection(this.db, 'inscricoes_competicao'),
      where('idCompeticao', '==', competicaoId)
    );
    const querySnapshot = await getDocs(q);
    const inscricoes = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const atleta = await this.getAtletaById(data.idAtleta);
        const competicao = await this.getCompeticaoById(data.idCompeticao);
        
        return {
          id: doc.id,
          ...data,
          dataInscricao: this.convertTimestamp(data.dataInscricao),
          dataAprovacao: this.convertTimestamp(data.dataAprovacao),
          dataRejeicao: this.convertTimestamp(data.dataRejeicao),
          atleta,
          competicao
        } as InscricaoCompeticao;
      })
    );
    return inscricoes;
  }

  async createInscricao(inscricao: Omit<InscricaoCompeticao, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'inscricoes_competicao'), {
      ...inscricao,
      dataInscricao: Timestamp.now()
    });
    return docRef.id;
  }

  async updateInscricao(id: string, inscricao: Partial<InscricaoCompeticao>): Promise<void> {
    const docRef = doc(this.db, 'inscricoes_competicao', id);
    await updateDoc(docRef, inscricao);
  }

  async deleteInscricao(id: string): Promise<void> {
    const docRef = doc(this.db, 'inscricoes_competicao', id);
    await deleteDoc(docRef);
  }

  // ===== SERVIÇOS DE LOG =====
  async getAllLogs(): Promise<LogAtividade[]> {
    const q = query(collection(this.db, 'log_atividades'), orderBy('dataHora', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataHora: this.convertTimestamp(doc.data().dataHora)
    })) as LogAtividade[];
  }

  async createLog(log: Omit<LogAtividade, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'log_atividades'), {
      ...log,
      dataHora: Timestamp.now()
    });
    return docRef.id;
  }

  async clearLogs(): Promise<void> {
    const querySnapshot = await getDocs(collection(this.db, 'log_atividades'));
    const batch = writeBatch(this.db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // ===== SERVIÇOS DE UPLOAD =====
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      console.log('📁 FirebaseService: Iniciando upload para path:', path);
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log('✅ FirebaseService: Upload concluído:', url);
      return url;
    } catch (error) {
      console.error('❌ FirebaseService: Erro no upload:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }
}
