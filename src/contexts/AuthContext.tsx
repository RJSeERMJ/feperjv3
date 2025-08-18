import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('feperj_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('feperj_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);

      // Verificar credenciais do administrador
      if (credentials.login === '15119236790' && credentials.senha === '49912170') {
        const adminUser: Usuario = {
          login: credentials.login,
          nome: 'Administrador',
          tipo: 'admin'
        };
        
        setUser(adminUser);
        localStorage.setItem('feperj_user', JSON.stringify(adminUser));
        
        // Registrar log de login
        await logService.create({
          dataHora: new Date(),
          usuario: adminUser.nome,
          acao: 'Login realizado',
          detalhes: 'Login como administrador',
          tipoUsuario: adminUser.tipo
        });
        
        return true;
      }

      // Verificar outros usuários no banco
      const usuario = await usuarioService.getByLogin(credentials.login);
      
      if (usuario && usuario.senha === credentials.senha) {
        const userWithoutPassword = { ...usuario };
        delete userWithoutPassword.senha;
        
        setUser(userWithoutPassword);
        localStorage.setItem('feperj_user', JSON.stringify(userWithoutPassword));
        
        // Registrar log de login
        await logService.create({
          dataHora: new Date(),
          usuario: usuario.nome,
          acao: 'Login realizado',
          detalhes: `Login do usuário ${usuario.nome}`,
          tipoUsuario: usuario.tipo
        });
        
        return true;
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
        await logService.create({
          dataHora: new Date(),
          usuario: user.nome,
          acao: 'Logout realizado',
          detalhes: `Logout do usuário ${user.nome}`,
          tipoUsuario: user.tipo
        });
      }
    } catch (error) {
      console.error('Erro ao registrar logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('feperj_user');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
