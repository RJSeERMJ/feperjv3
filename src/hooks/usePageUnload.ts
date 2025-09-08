import { useEffect } from 'react';

/**
 * Hook para detectar quando o usuário está saindo da página
 * e executar uma função de callback
 */
export const usePageUnload = (callback: () => void, showConfirmation: boolean = false) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      callback();
      
      if (showConfirmation) {
        // Mostrar confirmação ao usuário
        event.preventDefault();
        event.returnValue = 'Você tem certeza que deseja sair? A competição pode ser perdida se não for salva.';
        return 'Você tem certeza que deseja sair? A competição pode ser perdida se não for salva.';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        callback();
      }
    };

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback, showConfirmation]);
};
