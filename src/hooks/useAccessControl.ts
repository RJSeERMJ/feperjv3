import { useAuth } from '../contexts/AuthContext';

export const useAccessControl = () => {
  const { user } = useAuth();

  // Verifica se o usuário é administrador
  const isAdmin = () => {
    return user?.tipo === 'admin';
  };

  // Verifica se o usuário é usuário comum
  const isUser = () => {
    return user?.tipo === 'usuario';
  };

  // Verifica se o usuário é chefe de equipe
  const isTeamLeader = () => {
    return user?.chefeEquipe === true;
  };

  // Obtém o ID da equipe do usuário
  const getUserTeamId = () => {
    return user?.idEquipe;
  };

  // Obtém o nome da equipe do usuário
  const getUserTeamName = () => {
    return user?.equipe?.nomeEquipe || user?.nomeEquipe;
  };

  // Verifica se o usuário pode acessar dados de uma equipe específica
  const canAccessTeam = (teamId: string) => {
    if (isAdmin()) return true;
    return user?.idEquipe === teamId;
  };

  // Verifica se o usuário pode acessar dados de um atleta específico
  const canAccessAthlete = (athleteTeamId?: string) => {
    if (isAdmin()) return true;
    if (!athleteTeamId) return false;
    return user?.idEquipe === athleteTeamId;
  };

  // Verifica se o usuário pode modificar dados
  const canModify = (teamId?: string) => {
    if (isAdmin()) return true;
    if (!teamId) return false;
    return user?.idEquipe === teamId;
  };

  // Verifica se o usuário pode criar novos registros
  const canCreate = () => {
    return isAdmin() || isUser();
  };

  // Verifica se o usuário pode excluir registros
  const canDelete = (teamId?: string) => {
    if (isAdmin()) return true;
    if (!teamId) return false;
    return user?.idEquipe === teamId;
  };

  // Obtém informações de acesso para exibição
  const getAccessInfo = () => {
    if (isAdmin()) {
      return {
        type: 'admin',
        label: 'Administrador',
        description: 'Acesso total ao sistema',
        color: 'danger'
      };
    }

    if (isTeamLeader()) {
      return {
        type: 'team_leader',
        label: 'Chefe de Equipe',
        description: `Equipe: ${getUserTeamName()}`,
        color: 'warning'
      };
    }

    return {
      type: 'user',
      label: 'Usuário',
      description: `Equipe: ${getUserTeamName()}`,
      color: 'primary'
    };
  };

  return {
    isAdmin,
    isUser,
    isTeamLeader,
    getUserTeamId,
    getUserTeamName,
    canAccessTeam,
    canAccessAthlete,
    canModify,
    canCreate,
    canDelete,
    getAccessInfo
  };
};
