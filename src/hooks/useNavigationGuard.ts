import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para interceptar navegação e mostrar confirmação
 */
export const useNavigationGuard = (
  shouldBlock: boolean,
  onBlock: () => void,
  message: string = 'Você tem certeza que deseja sair? A competição pode ser perdida se não for salva.'
) => {
  const location = useLocation();

  useEffect(() => {
    if (!shouldBlock) return;

    // Interceptar cliques em links de navegação do navbar
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href], .nav-link');
      
      if (link) {
        const href = link.getAttribute('href');
        
        // Verificar se é um link interno (não externo) e não é a página atual
        if (href && href.startsWith('/') && href !== location.pathname && href !== '/barra-pronta') {
          event.preventDefault();
          event.stopPropagation();
          
          if (window.confirm(message)) {
            onBlock();
            // Permitir a navegação após confirmação
            window.location.href = href;
          }
        }
      }
    };

    // Adicionar listener com capture para interceptar antes de outros handlers
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [shouldBlock, onBlock, message, location.pathname]);
};
