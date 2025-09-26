import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usuarioService, logService } from '../services/firebaseService';
import { Usuario, LoginCredentials, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Sistema de autenticação local como fallback
const LOCAL_USERS: Array<{
  login: string;
  senha: string;
  nome: string;
  tipo: 'admin' | 'usuario';
}> = [
  {
    login: '15119236790',
    senha: '49912170',
    nome: 'Administrador',
    tipo: 'admin'
  }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Verificar se é a primeira inicialização da aplicação
    if (!isInitialized) {
      console.log('🔄 [AUTH] Primeira inicialização - Limpando dados de sessão anterior');
      localStorage.removeItem('feperj_user');
      sessionStorage.removeItem('feperj_user');
      setUser(null);
      setIsInitialized(true);
    } else {
      // Durante navegação, verificar se há usuário válido no localStorage
      const savedUser = localStorage.getItem('feperj_user');
      if (savedUser && !user) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData && userData.login && userData.nome && userData.tipo) {
            console.log('🔄 [AUTH] Restaurando sessão do usuário:', userData.nome);
            setUser(userData);
          }
        } catch (error) {
          console.error('Erro ao restaurar usuário:', error);
          localStorage.removeItem('feperj_user');
        }
      }
    }
    
    setLoading(false);

    // Limpar dados ao fechar a aba/janela
    const handleBeforeUnload = () => {
      localStorage.removeItem('feperj_user');
      sessionStorage.removeItem('feperj_user');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized, user]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);

      // Primeiro, tentar autenticação local
      const localUser = LOCAL_USERS.find(u => 
        u.login === credentials.login && u.senha === credentials.senha
      );

      if (localUser) {
        const userData: Usuario = {
          login: localUser.login,
          nome: localUser.nome,
          tipo: localUser.tipo
        };
        
        console.log('👤 Usuário local encontrado:', userData);
        setUser(userData);
        localStorage.setItem('feperj_user', JSON.stringify(userData));
        
        console.log('✅ Login local realizado com sucesso');
        return true;
      }

      // Se não encontrar usuário local, tentar Firebase (se configurado)
      try {
        const usuario = await usuarioService.getByLogin(credentials.login);
        
        if (usuario && usuario.senha === credentials.senha) {
          const userWithoutPassword = { ...usuario };
          delete userWithoutPassword.senha;
          
          setUser(userWithoutPassword);
          localStorage.setItem('feperj_user', JSON.stringify(userWithoutPassword));
          
          // Registrar log de login
          try {
            await logService.create({
              dataHora: new Date(),
              usuario: usuario.nome,
              acao: 'Login realizado',
              detalhes: `Login do usuário ${usuario.nome}`,
              tipoUsuario: usuario.tipo
            });
          } catch (logError) {
            console.warn('Erro ao registrar log:', logError);
          }
          
          return true;
        }
      } catch (firebaseError) {
        console.warn('Erro ao conectar com Firebase:', firebaseError);
        console.log('📝 Usando sistema de autenticação local');
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Registrar log de logout
        try {
          await logService.create({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Logout realizado',
            detalhes: `Logout do usuário ${user.nome}`,
            tipoUsuario: user.tipo
          });
        } catch (logError) {
          console.warn('Erro ao registrar log de logout:', logError);
        }
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      clearAuthData();
    }
  };

  // Função para limpar dados de autenticação
  const clearAuthData = () => {
    console.log('🧹 [AUTH] Limpando dados de autenticação');
    setUser(null);
    localStorage.removeItem('feperj_user');
    sessionStorage.removeItem('feperj_user');
  };

  // Função para forçar nova inicialização (útil para logout manual)
  const forceReinitialize = () => {
    console.log('🔄 [AUTH] Forçando nova inicialização');
    setIsInitialized(false);
    clearAuthData();
  };


  const value: AuthContextType = {
    user,
    login,
    logout,
    clearAuthData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
