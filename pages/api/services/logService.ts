import { getFirestore, collection, addDoc, query, orderBy, getDocs, limit, where, Timestamp } from 'firebase/firestore';

const db = getFirestore();

// Interface para log de atividade
export interface LogAtividade {
  id?: string;
  dataHora: Date;
  usuario: string;
  acao: string;
  detalhes: string;
  tipoUsuario: 'admin' | 'usuario';
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  metadata?: any;
}

// Interface para resposta de criação de log
interface CreateLogResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

// Serviço de logs
export const logService = {
  // Criar novo log
  async create(logData: Omit<LogAtividade, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'log_atividades'), {
        dataHora: Timestamp.fromDate(logData.dataHora),
        usuario: logData.usuario,
        acao: logData.acao,
        detalhes: logData.detalhes,
        tipoUsuario: logData.tipoUsuario,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        resource: logData.resource,
        resourceId: logData.resourceId,
        metadata: logData.metadata || {}
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar log:', error);
      throw error;
    }
  },

  // Buscar logs recentes
  async getRecentLogs(count: number = 100): Promise<LogAtividade[]> {
    try {
      const q = query(
        collection(db, 'log_atividades'),
        orderBy('dataHora', 'desc'),
        limit(count)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dataHora: data.dataHora.toDate(),
          usuario: data.usuario,
          acao: data.acao,
          detalhes: data.detalhes,
          tipoUsuario: data.tipoUsuario,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          resource: data.resource,
          resourceId: data.resourceId,
          metadata: data.metadata
        } as LogAtividade;
      });
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  },

  // Buscar logs por usuário
  async getLogsByUser(usuario: string, count: number = 50): Promise<LogAtividade[]> {
    try {
      const q = query(
        collection(db, 'log_atividades'),
        where('usuario', '==', usuario),
        orderBy('dataHora', 'desc'),
        limit(count)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dataHora: data.dataHora.toDate(),
          usuario: data.usuario,
          acao: data.acao,
          detalhes: data.detalhes,
          tipoUsuario: data.tipoUsuario,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          resource: data.resource,
          resourceId: data.resourceId,
          metadata: data.metadata
        } as LogAtividade;
      });
    } catch (error) {
      console.error('Erro ao buscar logs por usuário:', error);
      throw error;
    }
  },

  // Buscar logs por ação
  async getLogsByAction(acao: string, count: number = 50): Promise<LogAtividade[]> {
    try {
      const q = query(
        collection(db, 'log_atividades'),
        where('acao', '==', acao),
        orderBy('dataHora', 'desc'),
        limit(count)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dataHora: data.dataHora.toDate(),
          usuario: data.usuario,
          acao: data.acao,
          detalhes: data.detalhes,
          tipoUsuario: data.tipoUsuario,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          resource: data.resource,
          resourceId: data.resourceId,
          metadata: data.metadata
        } as LogAtividade;
      });
    } catch (error) {
      console.error('Erro ao buscar logs por ação:', error);
      throw error;
    }
  },

  // Buscar logs por recurso
  async getLogsByResource(resource: string, resourceId?: string, count: number = 50): Promise<LogAtividade[]> {
    try {
      let q;
      
      if (resourceId) {
        q = query(
          collection(db, 'log_atividades'),
          where('resource', '==', resource),
          where('resourceId', '==', resourceId),
          orderBy('dataHora', 'desc'),
          limit(count)
        );
      } else {
        q = query(
          collection(db, 'log_atividades'),
          where('resource', '==', resource),
          orderBy('dataHora', 'desc'),
          limit(count)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dataHora: data.dataHora.toDate(),
          usuario: data.usuario,
          acao: data.acao,
          detalhes: data.detalhes,
          tipoUsuario: data.tipoUsuario,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          resource: data.resource,
          resourceId: data.resourceId,
          metadata: data.metadata
        } as LogAtividade;
      });
    } catch (error) {
      console.error('Erro ao buscar logs por recurso:', error);
      throw error;
    }
  },

  // Log de segurança
  async logSecurityEvent(event: {
    type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCESS_DENIED' | 'SUSPICIOUS_ACTIVITY';
    user?: string;
    ip?: string;
    userAgent?: string;
    details: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.create({
        dataHora: new Date(),
        usuario: event.user || 'Sistema',
        acao: `SEGURANÇA: ${event.type}`,
        detalhes: event.details,
        tipoUsuario: 'admin',
        ipAddress: event.ip,
        userAgent: event.userAgent,
        resource: 'security',
        metadata: {
          eventType: event.type,
          ...event.metadata
        }
      });
    } catch (error) {
      console.error('Erro ao criar log de segurança:', error);
      // Não falhar se não conseguir logar
    }
  },

  // Log de auditoria
  async logAuditEvent(event: {
    user: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.create({
        dataHora: new Date(),
        usuario: event.user,
        acao: event.action,
        detalhes: event.details,
        tipoUsuario: 'admin',
        resource: event.resource,
        resourceId: event.resourceId,
        metadata: event.metadata
      });
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
      // Não falhar se não conseguir logar
    }
  },

  // Estatísticas de logs
  async getLogStats(): Promise<{
    totalLogs: number;
    logsByUser: Record<string, number>;
    logsByAction: Record<string, number>;
    recentActivity: LogAtividade[];
  }> {
    try {
      const recentLogs = await this.getRecentLogs(1000);
      
      const logsByUser: Record<string, number> = {};
      const logsByAction: Record<string, number> = {};
      
      recentLogs.forEach(log => {
        logsByUser[log.usuario] = (logsByUser[log.usuario] || 0) + 1;
        logsByAction[log.acao] = (logsByAction[log.acao] || 0) + 1;
      });

      return {
        totalLogs: recentLogs.length,
        logsByUser,
        logsByAction,
        recentActivity: recentLogs.slice(0, 10)
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de logs:', error);
      throw error;
    }
  }
};

export default logService;


