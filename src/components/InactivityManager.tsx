import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import InactivityWarning from './InactivityWarning';
import { logService } from '../services/firebaseService';

const InactivityManager: React.FC = () => {
  const { user, logout } = useAuth();
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(60); // 1 minuto em segundos

  // Callback para aviso de inatividade
  const handleInactivityWarning = useCallback(() => {
    console.log('⚠️ [INATIVIDADE] Aviso: Usuário ficará inativo em breve');
    setShowInactivityWarning(true);
    setInactivityCountdown(60); // 1 minuto para o usuário responder
  }, []);

  // Callback para logout automático por inatividade
  const handleInactivityTimeout = useCallback(async () => {
    console.log('⏰ [INATIVIDADE] Timeout: Fazendo logout automático por inatividade');
    
    // Registrar log de logout por inatividade
    if (user) {
      try {
        await logService.create({
          dataHora: new Date(),
          usuario: user.nome,
          acao: 'Logout automático por inatividade',
          detalhes: `Logout automático após 5 minutos de inatividade`,
          tipoUsuario: user.tipo
        });
      } catch (logError) {
        console.warn('Erro ao registrar log de logout por inatividade:', logError);
      }
    }

    setShowInactivityWarning(false);
    await logout();
  }, [user, logout]);

  // Callback para usuário escolher continuar logado
  const handleStayLoggedIn = useCallback(() => {
    console.log('✅ [INATIVIDADE] Usuário escolheu continuar logado');
    setShowInactivityWarning(false);
    setInactivityCountdown(60);
  }, []);

  // Callback para usuário escolher fazer logout
  const handleLogoutByChoice = useCallback(async () => {
    console.log('🚪 [INATIVIDADE] Usuário escolheu fazer logout');
    setShowInactivityWarning(false);
    await logout();
  }, [logout]);

  // Configurar sistema de inatividade
  // CONFIGURAÇÃO FIXA: 5 minutos de timeout, 1 minuto de aviso
  useInactivityTimer({
    timeoutMinutes: 5,    // 5 minutos de timeout
    warningMinutes: 1,    // 1 minuto de aviso antes do logout
    onWarning: handleInactivityWarning,
    onTimeout: handleInactivityTimeout
  });

  // Gerenciar countdown do aviso de inatividade
  useEffect(() => {
    if (!showInactivityWarning || inactivityCountdown <= 0) return;

    const timer = setInterval(() => {
      setInactivityCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleInactivityTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInactivityWarning, inactivityCountdown, handleInactivityTimeout]);

  return (
    <InactivityWarning
      show={showInactivityWarning}
      remainingTime={inactivityCountdown}
      onStayLoggedIn={handleStayLoggedIn}
      onLogout={handleLogoutByChoice}
    />
  );
};

export default InactivityManager;
