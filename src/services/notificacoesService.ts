import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NotificacaoDocumento } from '../types';

const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

export const notificacoesService = {
  // Criar nova notificação
  async create(notificacao: Omit<NotificacaoDocumento, 'id' | 'dataEnvio'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notificacoes_documentos'), {
      ...notificacao,
      dataEnvio: Timestamp.now(),
      status: 'PENDENTE'
    });
    return docRef.id;
  },

  // Buscar últimas 10 notificações para admin (todas as equipes)
  async getUltimasNotificacoes(): Promise<NotificacaoDocumento[]> {
    try {
      const q = query(
        collection(db, 'notificacoes_documentos'),
        orderBy('dataEnvio', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const notificacoes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataEnvio: convertTimestamp(doc.data().dataEnvio),
        dataAprovacao: doc.data().dataAprovacao ? convertTimestamp(doc.data().dataAprovacao) : undefined,
        dataExclusao: doc.data().dataExclusao ? convertTimestamp(doc.data().dataExclusao) : undefined
      })) as NotificacaoDocumento[];
      
      // Filtrar notificações excluídas
      return notificacoes.filter(notificacao => notificacao.status !== 'EXCLUIDO');
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  },

  // Buscar notificações de uma equipe específica
  async getNotificacoesEquipe(idEquipe: string): Promise<NotificacaoDocumento[]> {
    try {
      const q = query(
        collection(db, 'notificacoes_documentos'),
        where('idEquipe', '==', idEquipe),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const notificacoes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataEnvio: convertTimestamp(doc.data().dataEnvio),
        dataAprovacao: doc.data().dataAprovacao ? convertTimestamp(doc.data().dataAprovacao) : undefined,
        dataExclusao: doc.data().dataExclusao ? convertTimestamp(doc.data().dataExclusao) : undefined
      })) as NotificacaoDocumento[];
      
      // Filtrar notificações excluídas e ordenar no cliente
      return notificacoes
        .filter(notificacao => notificacao.status !== 'EXCLUIDO')
        .sort((a, b) => b.dataEnvio.getTime() - a.dataEnvio.getTime());
    } catch (error) {
      console.error('Erro ao buscar notificações da equipe:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  },

  // Aprovar documento
  async aprovarDocumento(id: string, aprovadoPor: string, observacoes?: string): Promise<void> {
    const docRef = doc(db, 'notificacoes_documentos', id);
    await updateDoc(docRef, {
      status: 'APROVADO',
      aprovadoPor,
      dataAprovacao: Timestamp.now(),
      observacoes: observacoes || ''
    });
  },

  // Recusar documento
  async recusarDocumento(id: string, aprovadoPor: string, observacoes: string): Promise<void> {
    const docRef = doc(db, 'notificacoes_documentos', id);
    await updateDoc(docRef, {
      status: 'RECUSADO',
      aprovadoPor,
      dataAprovacao: Timestamp.now(),
      observacoes
    });
  },

  // Excluir notificação (apenas admin)
  async excluirNotificacao(id: string): Promise<void> {
    const docRef = doc(db, 'notificacoes_documentos', id);
    await updateDoc(docRef, {
      status: 'EXCLUIDO',
      dataExclusao: Timestamp.now()
    });
  },

  // Função para criar notificação automaticamente quando documento é enviado
  async criarNotificacaoAutomatica(
    idEquipe: string, 
    nomeEquipe: string, 
    tipoDocumento: NotificacaoDocumento['tipoDocumento'],
    nomeDocumento: string
  ): Promise<void> {
    await this.create({
      idEquipe,
      nomeEquipe,
      tipoDocumento,
      nomeDocumento,
      status: 'PENDENTE'
    });
  }
};
