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

  useEffect(() => {
    // Sempre limpar dados de autenticação ao iniciar a aplicação
    // Força o usuário a fazer login manual a cada acesso
    console.log('🔄 [AUTH] Inicializando aplicação - Limpando dados de sessão anterior');
    localStorage.removeItem('feperj_user');
    sessionStorage.removeItem('feperj_user');
    
    // Garantir que o usuário seja null
    setUser(null);
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
  }, []);

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
      setUser(null);
      localStorage.removeItem('feperj_user');
      sessionStorage.removeItem('feperj_user');
    }
  };

  // Função para limpar dados de autenticação
  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('feperj_user');
    sessionStorage.removeItem('feperj_user');
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
