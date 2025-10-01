import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Middleware de tratamento de erros
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🚨 Erro capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    tenant: req.tenantId,
    timestamp: new Date().toISOString()
  });

  // Erro de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      message: error.message,
      details: error.stack
    });
  }

  // Erro de autenticação
  if (error.name === 'UnauthorizedError' || error.message.includes('Token')) {
    return res.status(401).json({
      success: false,
      error: 'Erro de autenticação',
      message: 'Token inválido ou expirado'
    });
  }

  // Erro de permissão
  if (error.message.includes('Acesso negado') || error.message.includes('permissão')) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: error.message
    });
  }

  // Erro de tenant
  if (error.message.includes('tenant') || error.message.includes('Tenant')) {
    return res.status(404).json({
      success: false,
      error: 'Tenant não encontrado',
      message: 'Configuração do tenant não encontrada'
    });
  }

  // Erro de Firebase
  if (error.message.includes('Firebase') || error.message.includes('firebase')) {
    return res.status(500).json({
      success: false,
      error: 'Erro de conexão com banco de dados',
      message: 'Erro interno do servidor'
    });
  }

  // Erro padrão
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    error: 'Erro interno',
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

/**
 * Middleware para capturar erros assíncronos
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`) as CustomError;
  error.statusCode = 404;
  next(error);
};
