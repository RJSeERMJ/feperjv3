import { useEffect } from 'react';
import { SECURITY_HEADERS } from '../config/securityConfig';

/**
 * Componente para aplicar headers de segurança
 * Deve ser usado no componente raiz da aplicação
 */
export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Aplicar headers de segurança via meta tags
    const applySecurityHeaders = () => {
      // Content Security Policy
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        cspMeta.setAttribute('content', SECURITY_HEADERS['Content-Security-Policy']);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Security-Policy');
        meta.setAttribute('content', SECURITY_HEADERS['Content-Security-Policy']);
        document.head.appendChild(meta);
      }

      // X-Content-Type-Options
      const contentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      if (contentTypeMeta) {
        contentTypeMeta.setAttribute('content', SECURITY_HEADERS['X-Content-Type-Options']);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'X-Content-Type-Options');
        meta.setAttribute('content', SECURITY_HEADERS['X-Content-Type-Options']);
        document.head.appendChild(meta);
      }

      // X-Frame-Options
      const frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
      if (frameOptionsMeta) {
        frameOptionsMeta.setAttribute('content', SECURITY_HEADERS['X-Frame-Options']);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'X-Frame-Options');
        meta.setAttribute('content', SECURITY_HEADERS['X-Frame-Options']);
        document.head.appendChild(meta);
      }

      // X-XSS-Protection
      const xssMeta = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
      if (xssMeta) {
        xssMeta.setAttribute('content', SECURITY_HEADERS['X-XSS-Protection']);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'X-XSS-Protection');
        meta.setAttribute('content', SECURITY_HEADERS['X-XSS-Protection']);
        document.head.appendChild(meta);
      }

      // Referrer Policy
      const referrerMeta = document.querySelector('meta[name="referrer"]');
      if (referrerMeta) {
        referrerMeta.setAttribute('content', SECURITY_HEADERS['Referrer-Policy']);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'referrer');
        meta.setAttribute('content', SECURITY_HEADERS['Referrer-Policy']);
        document.head.appendChild(meta);
      }
    };

    applySecurityHeaders();

    // Aplicar HTTPS enforcement
    const enforceHTTPS = () => {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Aplicação deve ser executada em HTTPS em produção');
        // Em produção, redirecionar para HTTPS
        // window.location.replace(window.location.href.replace('http:', 'https:'));
      }
    };

    enforceHTTPS();

    // Configurar CSP para inline scripts (necessário para React)
    const configureCSP = () => {
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        const currentCSP = cspMeta.getAttribute('content') || '';
        if (!currentCSP.includes('unsafe-inline')) {
          const updatedCSP = currentCSP.replace(
            "script-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
          );
          cspMeta.setAttribute('content', updatedCSP);
        }
      }
    };

    configureCSP();

  }, []);

  return null; // Este componente não renderiza nada
};

export default SecurityHeaders;
