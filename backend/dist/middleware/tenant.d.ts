import { Request, Response, NextFunction } from 'express';
import { TenantConfig } from '../types';
/**
 * Carrega configuração criptografada de um tenant
 */
export declare const loadTenantConfig: (tenantId: string) => TenantConfig;
/**
 * Detecta o tenant baseado no subdomínio ou header
 */
export declare const detectTenant: (req: Request) => string;
/**
 * Middleware para detectar e carregar configuração do tenant
 */
export declare const tenantMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Limpa cache de configurações (útil para desenvolvimento)
 */
export declare const clearTenantCache: () => void;
/**
 * Lista todos os tenants disponíveis
 */
export declare const listAvailableTenants: () => string[];
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            tenant?: TenantConfig;
        }
    }
}
//# sourceMappingURL=tenant.d.ts.map