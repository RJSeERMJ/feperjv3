import React, { useState, useEffect, useCallback } from "react";

interface TimerProps {
  duration: number; // duração em segundos
  onExpire: () => void;
  onTick?: (timeLeft: number) => void; // callback opcional para cada tick
  autoStart?: boolean; // se deve iniciar automaticamente
  className?: string; // classe CSS opcional
  showControls?: boolean; // se deve mostrar botões de controle
}

const Timer: React.FC<TimerProps> = ({ 
  duration, 
  onExpire, 
  onTick, 
  autoStart = false,
  className = "",
  showControls = false
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [active, setActive] = useState(autoStart);

  useEffect(() => {
    if (!active) return;
    
    if (timeLeft <= 0) {
      onExpire();
      setActive(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        const newTime = t - 1;
        onTick?.(newTime); // chamar callback se fornecido
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, active, onExpire, onTick]);

  const start = useCallback(() => {
    setTimeLeft(duration);
    setActive(true);
  }, [duration]);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setActive(false);
  }, [duration]);

  // Determinar classe CSS baseada no tempo restante
  const getTimerClass = () => {
    if (timeLeft <= 10) return "timer-urgent";
    if (timeLeft <= 30) return "timer-warning";
    return "timer-normal";
  };

  return (
    <div className={`timer-component ${getTimerClass()} ${className}`}>
      <div className="timer-display">
        ⏰ {timeLeft}s
      </div>
      
      {showControls && (
        <div className="timer-controls">
          {!active && (
            <button onClick={start} className="timer-btn timer-start">
              Iniciar
            </button>
          )}
          {active && (
            <button onClick={stop} className="timer-btn timer-stop">
              Parar
            </button>
          )}
          <button onClick={reset} className="timer-btn timer-reset">
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default Timer;
