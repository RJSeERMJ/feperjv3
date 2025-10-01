import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types';
/**
 * Gera token JWT para usuário
 */
export declare const generateJWT: (payload: Omit<JWTPayload, 'iat' | 'exp'>) => string;
/**
 * Verifica e decodifica token JWT
 */
export declare const verifyJWT: (token: string) => JWTPayload | null;
/**
 * Middleware de autenticação
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para verificar se usuário é admin
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para verificar se usuário é admin ou chefe de equipe
 */
export declare const requireAdminOrChefe: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Verifica senha usando bcrypt
 */
export declare const verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
/**
 * Gera hash de senha usando bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
declare global {
    namespace Express {
        interface Request {
            user?: {
                login: string;
                nome: string;
                tipo: 'admin' | 'usuario';
                tenant: string;
                chefeEquipe?: boolean;
            };
        }
    }
}
//# sourceMappingURL=auth.d.ts.map