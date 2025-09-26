import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseInactivityTimerOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
}

export const useInactivityTimer = ({
  timeoutMinutes = 5,
  warningMinutes = 1,
  onWarning,
  onTimeout
}: UseInactivityTimerOptions = {}) => {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWarningShownRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Converter minutos para milissegundos
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  // Função para resetar os timers
  const resetTimers = useCallback(() => {
    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Resetar flag de aviso
    isWarningShownRef.current = false;
    lastActivityRef.current = Date.now();

    // Configurar timer de aviso
    warningTimeoutRef.current = setTimeout(() => {
      if (onWarning && !isWarningShownRef.current) {
        isWarningShownRef.current = true;
        onWarning();
      }
    }, warningMs);

    // Configurar timer de logout
    timeoutRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);
  }, [timeoutMs, warningMs, onWarning, onTimeout]);

  // Função para detectar atividade
  const handleActivity = useCallback(() => {
    // Resetar timers apenas se passou tempo suficiente desde a última atividade
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Evitar resets muito frequentes (mínimo 3 segundos entre resets)
    if (timeSinceLastActivity > 3000) {
      resetTimers();
    }
  }, [resetTimers]);

  // Configurar listeners de eventos
  useEffect(() => {
    // Apenas aplicar para usuários comuns (não admin)
    if (!user || user.tipo === 'admin') {
      return;
    }

    console.log(`⏰ [INATIVIDADE] Configurando timer de ${timeoutMinutes} minutos para usuário: ${user.nome}`);

    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar os timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, handleActivity, resetTimers, timeoutMinutes]);

  // Limpar timers quando usuário fizer logout manual
  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
  }, [user]);

  return {
    resetTimers,
    isActive: !!user && user.tipo !== 'admin'
  };
};
