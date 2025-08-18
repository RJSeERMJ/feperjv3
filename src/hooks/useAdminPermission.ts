import { useAuth } from '../contexts/AuthContext';

export const useAdminPermission = () => {
  const { user } = useAuth();

  const isAdmin = user?.tipo === 'admin';
  
  const requireAdmin = (action: string) => {
    if (!isAdmin) {
      throw new Error(`Apenas administradores podem ${action}`);
    }
  };

  const checkAdminPermission = (action: string): boolean => {
    if (!isAdmin) {
      console.warn(`Tentativa de ${action} por usuário não-admin:`, user?.nome);
      return false;
    }
    return true;
  };

  return {
    isAdmin,
    requireAdmin,
    checkAdminPermission
  };
};
