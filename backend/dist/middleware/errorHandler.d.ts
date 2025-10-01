import { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
/**
 * Middleware de tratamento de erros
 */
export declare const errorHandler: (error: CustomError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para capturar erros assíncronos
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware para rotas não encontradas
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map