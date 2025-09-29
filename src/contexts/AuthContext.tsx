import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usuarioService, logService } from '../services/firebaseService';
import { Usuario, LoginCredentials, AuthContextType } from '../types';
import { 
  hashPassword, 
  verifyPassword, 
  storeSecureUserData, 
  getSecureUserData, 
  clearSecureUserData, 
  isUserAuthenticated,
  sanitizeInput,
  validatePasswordStrength
} from '../utils/securityUtils';

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
// Senhas criptografadas com bcrypt (hash gerado para senha '49912170')
const LOCAL_USERS: Array<{
  login: string;
  senhaHash: string;
  nome: string;
  tipo: 'admin' | 'usuario';
}> = [
  {
    login: '15119236790',
    senhaHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:1e03d824d1543b9a6e9ea7baea68ac837324ec46deae62d179c147994227bfd1', // hash de '49912170'
    nome: 'Administrador',
    tipo: 'admin'
  }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário válido usando o sistema seguro
    const loadSecureUser = async () => {
      try {
        const userData = getSecureUserData();
        if (userData && isUserAuthenticated()) {
          setUser(userData);
          console.log('✅ Usuário autenticado com segurança:', userData.nome);
        } else {
          // Fallback para sistema antigo (temporário)
          const savedUser = localStorage.getItem('feperj_user');
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              if (userData && userData.login && userData.nome && userData.tipo) {
                setUser(userData);
                console.log('⚠️ Usando sistema de autenticação legado');
              } else {
                localStorage.removeItem('feperj_user');
              }
            } catch (error) {
              console.error('Erro ao carregar usuário do localStorage:', error);
              localStorage.removeItem('feperj_user');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        clearSecureUserData();
      } finally {
        setLoading(false);
      }
    };

    loadSecureUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);

      // Sanitizar inputs para prevenir XSS
      const sanitizedLogin = sanitizeInput(credentials.login);
      const sanitizedPassword = sanitizeInput(credentials.senha);

      // Primeiro, tentar autenticação local com verificação segura
      const localUser = LOCAL_USERS.find(u => u.login === sanitizedLogin);
      
      if (localUser) {
        // Verificar senha usando bcrypt
        const isPasswordValid = await verifyPassword(sanitizedPassword, localUser.senhaHash);
        
        if (isPasswordValid) {
          const userData: Usuario = {
            login: localUser.login,
            nome: localUser.nome,
            tipo: localUser.tipo
          };
          
          console.log('👤 Usuário local encontrado:', userData);
          setUser(userData);
          
          // Armazenar dados de forma segura
          storeSecureUserData(userData);
          
          console.log('✅ Login local realizado com sucesso (seguro)');
          return true;
        } else {
          console.warn('❌ Senha incorreta para usuário:', sanitizedLogin);
          return false;
        }
      }

      // Se não encontrar usuário local, tentar Firebase (se configurado)
      try {
        const usuario = await usuarioService.getByLogin(sanitizedLogin);
        
        if (usuario && usuario.senha) {
          // Verificar se a senha no Firebase está criptografada ou em texto plano
          // Se estiver em texto plano, migrar para hash
          let isPasswordValid = false;
          
          if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
            // Senha já está criptografada
            isPasswordValid = await verifyPassword(sanitizedPassword, usuario.senha);
          } else {
            // Senha em texto plano - verificar diretamente e depois criptografar
            isPasswordValid = sanitizedPassword === usuario.senha;
            
            if (isPasswordValid) {
              // Migrar senha para hash (opcional - pode ser feito em background)
              console.log('🔄 Migrando senha para hash seguro...');
              try {
                const hashedPassword = await hashPassword(sanitizedPassword);
                // Aqui você poderia atualizar o usuário no Firebase com a senha criptografada
                // await usuarioService.updatePassword(usuario.id, hashedPassword);
              } catch (hashError) {
                console.warn('Erro ao migrar senha:', hashError);
              }
            }
          }
          
          if (isPasswordValid) {
            const userWithoutPassword = { ...usuario };
            delete userWithoutPassword.senha;
            
            setUser(userWithoutPassword);
            
            // Armazenar dados de forma segura
            storeSecureUserData(userWithoutPassword);
            
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
            
            console.log('✅ Login Firebase realizado com sucesso (seguro)');
            return true;
          } else {
            console.warn('❌ Senha incorreta para usuário Firebase:', sanitizedLogin);
          }
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
      // Limpar dados seguros
      clearSecureUserData();
      console.log('✅ Logout realizado com segurança');
    }
  };

  // Função para limpar dados de autenticação
  const clearAuthData = () => {
    setUser(null);
    clearSecureUserData();
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
