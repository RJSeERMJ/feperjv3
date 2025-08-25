import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  isExpired: boolean;
}

interface UseTimerProps {
  duration: number; // duração em segundos
  onExpire?: () => void; // callback quando expira
  autoStart?: boolean; // se deve iniciar automaticamente
}

export const useTimer = ({ duration, onExpire, autoStart = false }: UseTimerProps) => {
  const [state, setState] = useState<TimerState>({
    timeLeft: duration,
    isActive: autoStart,
    isExpired: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para iniciar o timer
  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeLeft: duration,
      isActive: true,
      isExpired: false
    }));
  }, [duration]);

  // Função para parar o timer
  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  // Função para resetar o timer
  const reset = useCallback(() => {
    setState({
      timeLeft: duration,
      isActive: false,
      isExpired: false
    });
  }, [duration]);

  // Função para pausar o timer
  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  // Função para continuar o timer
  const resume = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true
    }));
  }, []);

  // Efeito para gerenciar o intervalo do timer
  useEffect(() => {
    if (!state.isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (state.timeLeft <= 0) {
      setState(prev => ({
        ...prev,
        isActive: false,
        isExpired: true
      }));
      onExpire?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeLeft: prev.timeLeft - 1
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isActive, state.timeLeft, onExpire]);

  // Limpar intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Determinar classe CSS baseada no tempo restante
  const getTimerClass = useCallback(() => {
    if (state.isExpired) return "timer-expired";
    if (state.timeLeft <= 10) return "timer-urgent";
    if (state.timeLeft <= 30) return "timer-warning";
    return "timer-normal";
  }, [state.timeLeft, state.isExpired]);

  return {
    // Estado
    timeLeft: state.timeLeft,
    isActive: state.isActive,
    isExpired: state.isExpired,
    
    // Ações
    start,
    stop,
    reset,
    pause,
    resume,
    
    // Utilitários
    getTimerClass,
    
    // Formatação
    formattedTime: `${state.timeLeft}s`,
    percentage: ((state.timeLeft / duration) * 100).toFixed(1)
  };
};
