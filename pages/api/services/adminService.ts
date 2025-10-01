import { admin } from 'firebase-admin';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc, addDoc, orderBy, limit } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase Admin
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// Interfaces
export interface Usuario {
  id: string;
  login: string;
  senha: string;
  nome: string;
  tipo: 'admin' | 'usuario';
  idEquipe?: string;
  chefeEquipe?: boolean;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
  equipe?: any;
}

export interface Equipe {
  id: string;
  nomeEquipe: string;
  cidade: string;
  tecnico: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  status?: 'ATIVA' | 'INATIVA';
  valorAnuidadeEquipe?: number;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
  idChefe?: string;
}

// Serviço de administração
export const adminService = {
  // Buscar usuário por login
  async findUserByLogin(login: string): Promise<Usuario | null> {
    try {
      const q = query(collection(db, 'usuarios'), where('login', '==', login));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        login: data.login,
        senha: data.senha,
        nome: data.nome,
        tipo: data.tipo,
        idEquipe: data.idEquipe,
        chefeEquipe: data.chefeEquipe,
        dataCriacao: data.dataCriacao?.toDate(),
        dataAtualizacao: data.dataAtualizacao?.toDate()
      } as Usuario;
    } catch (error) {
      console.error('Erro ao buscar usuário por login:', error);
      throw error;
    }
  },

  // Buscar usuário por ID
  async findUserById(id: string): Promise<Usuario | null> {
    try {
      const docRef = doc(db, 'usuarios', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        login: data.login,
        senha: data.senha,
        nome: data.nome,
        tipo: data.tipo,
        idEquipe: data.idEquipe,
        chefeEquipe: data.chefeEquipe,
        dataCriacao: data.dataCriacao?.toDate(),
        dataAtualizacao: data.dataAtualizacao?.toDate()
      } as Usuario;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  },

  // Buscar todos os usuários
  async getAllUsers(): Promise<Usuario[]> {
    try {
      const q = query(collection(db, 'usuarios'), orderBy('dataCriacao', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          login: data.login,
          senha: '', // Não retornar senha
          nome: data.nome,
          tipo: data.tipo,
          idEquipe: data.idEquipe,
          chefeEquipe: data.chefeEquipe,
          dataCriacao: data.dataCriacao?.toDate(),
          dataAtualizacao: data.dataAtualizacao?.toDate()
        } as Usuario;
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // Criar usuário
  async createUser(userData: Omit<Usuario, 'id'>): Promise<string> {
    try {
      // Verificar se login já existe
      const existingUser = await this.findUserByLogin(userData.login);
      if (existingUser) {
        throw new Error('Login já existe');
      }

      const docRef = await addDoc(collection(db, 'usuarios'), {
        ...userData,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  // Atualizar usuário
  async updateUser(id: string, userData: Partial<Usuario>): Promise<void> {
    try {
      const docRef = doc(db, 'usuarios', id);
      await updateDoc(docRef, {
        ...userData,
        dataAtualizacao: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Atualizar senha do usuário
  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    try {
      const docRef = doc(db, 'usuarios', id);
      await updateDoc(docRef, {
        senha: hashedPassword,
        dataAtualizacao: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  },

  // Deletar usuário
  async deleteUser(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'usuarios', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  // Buscar equipe por ID
  async findTeamById(id: string): Promise<Equipe | null> {
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
        telefone: data.telefone,
        email: data.email,
        observacoes: data.observacoes,
        status: data.status || 'ATIVA',
        valorAnuidadeEquipe: data.valorAnuidadeEquipe,
        dataCriacao: data.dataCriacao?.toDate(),
        dataAtualizacao: data.dataAtualizacao?.toDate(),
        idChefe: data.idChefe
      } as Equipe;
    } catch (error) {
      console.error('Erro ao buscar equipe por ID:', error);
      throw error;
    }
  },

  // Buscar todas as equipes
  async getAllTeams(): Promise<Equipe[]> {
    try {
      const q = query(collection(db, 'equipes'), orderBy('dataCriacao', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nomeEquipe: data.nomeEquipe,
          cidade: data.cidade,
          tecnico: data.tecnico,
          telefone: data.telefone,
          email: data.email,
          observacoes: data.observacoes,
          status: data.status || 'ATIVA',
          valorAnuidadeEquipe: data.valorAnuidadeEquipe,
          dataCriacao: data.dataCriacao?.toDate(),
          dataAtualizacao: data.dataAtualizacao?.toDate(),
          idChefe: data.idChefe
        } as Equipe;
      });
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      throw error;
    }
  },

  // Verificar permissões do usuário
  async checkUserPermissions(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId);
      if (!user) return false;

      // Admin tem acesso total
      if (user.tipo === 'admin') return true;

      // Usuário comum tem acesso limitado
      if (user.tipo === 'usuario') {
        // Implementar lógica específica de permissões
        switch (resource) {
          case 'atletas':
            return action === 'read' || action === 'create' || action === 'update';
          case 'equipes':
            return action === 'read' || action === 'update';
          case 'competicoes':
            return action === 'read';
          case 'financeiro':
            return action === 'read';
          default:
            return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }
};

export default adminService;


