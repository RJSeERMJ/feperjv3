import { useAuth } from '../contexts/AuthContext';

export const useAccessControl = () => {
  const { user } = useAuth();

  const isAdmin = user?.tipo === 'admin';
  const isUser = user?.tipo === 'usuario';
  const isChefeEquipe = user?.chefeEquipe === true;
  
  const canAccessEquipe = (equipeId: string) => {
    if (isAdmin) return true;
    if (isChefeEquipe && user?.idEquipe === equipeId) return true;
    return false;
  };

  const canAccessAtleta = (atletaEquipeId: string) => {
    if (isAdmin) return true;
    if (user?.idEquipe === atletaEquipeId) return true;
    return false;
  };

  const canEditAtleta = (atletaEquipeId: string) => {
    if (isAdmin) return true;
    if (isChefeEquipe && user?.idEquipe === atletaEquipeId) return true;
    return false;
  };

  const canDeleteAtleta = (atletaEquipeId: string) => {
    if (isAdmin) return true;
    if (isChefeEquipe && user?.idEquipe === atletaEquipeId) return true;
    return false;
  };

  const canManageEquipe = (equipeId: string) => {
    if (isAdmin) return true;
    if (isChefeEquipe && user?.idEquipe === equipeId) return true;
    return false;
  };

  const canViewLogs = () => {
    return isAdmin;
  };

  const canManageUsers = () => {
    return isAdmin;
  };

  const canExportData = () => {
    return isAdmin;
  };

  const canManageFinanceiro = () => {
    return isAdmin;
  };

  const canViewRelatorios = () => {
    return isAdmin;
  };

  return {
    isAdmin,
    isUser,
    isChefeEquipe,
    canAccessEquipe,
    canAccessAtleta,
    canEditAtleta,
    canDeleteAtleta,
    canManageEquipe,
    canViewLogs,
    canManageUsers,
    canExportData,
    canManageFinanceiro,
    canViewRelatorios
  };
};
