import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { promisify } from 'util';

// Configurações de segurança
const JWT_SECRET = process.env.JWT_SECRET || 'feperj-super-secret-key-2025-change-in-production';
const API_RATE_LIMIT = process.env.API_RATE_LIMIT || '100'; // requests por minuto

// Interface para usuário autenticado
export interface AuthenticatedUser {
  id: string;
  login: string;
  nome: string;
  tipo: 'admin' | 'usuario';
  idEquipe?: string;
}

// Interface para request autenticado
export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthenticatedUser;
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: parseInt(API_RATE_LIMIT),
  message: {
    error: 'Muitas tentativas. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de rate limiting
export const rateLimitMiddleware = (req: NextApiRequest, res: NextApiResponse) => {
  return new Promise((resolve, reject) => {
    limiter(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Middleware de autenticação JWT
export const authenticateToken = async (req: AuthenticatedRequest, res: NextApiResponse): Promise<boolean> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
      return false;
    }

    const decoded = await promisify(jwt.verify)(token, JWT_SECRET) as any;
    
    // Validar estrutura do token
    if (!decoded.login || !decoded.nome || !decoded.tipo) {
      res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
      return false;
    }

    req.user = {
      id: decoded.id || decoded.login,
      login: decoded.login,
      nome: decoded.nome,
      tipo: decoded.tipo,
      idEquipe: decoded.idEquipe
    };

    return true;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    return false;
  }
};

// Middleware para verificar permissões de admin
export const requireAdmin = async (req: AuthenticatedRequest, res: NextApiResponse): Promise<boolean> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return false;
  }

  if (req.user.tipo !== 'admin') {
    res.status(403).json({
      error: 'Acesso negado. Apenas administradores.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
    return false;
  }

  return true;
};

// Middleware para verificar se usuário pertence à equipe
export const requireTeamAccess = async (req: AuthenticatedRequest, res: NextApiResponse, targetTeamId: string): Promise<boolean> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return false;
  }

  // Admin pode acessar qualquer equipe
  if (req.user.tipo === 'admin') {
    return true;
  }

  // Usuário comum só pode acessar sua própria equipe
  if (req.user.idEquipe !== targetTeamId) {
    res.status(403).json({
      error: 'Acesso negado. Você só pode acessar dados da sua equipe.',
      code: 'TEAM_ACCESS_DENIED'
    });
    return false;
  }

  return true;
};

// Middleware para validação de entrada
export const validateInput = (req: NextApiRequest, res: NextApiResponse, schema: any): boolean => {
  try {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map((d: any) => d.message),
        code: 'VALIDATION_ERROR'
      });
      return false;
    }
    return true;
  } catch (error) {
    res.status(400).json({
      error: 'Erro na validação dos dados',
      code: 'VALIDATION_ERROR'
    });
    return false;
  }
};

// Middleware para sanitização de dados
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  
  return data;
};

// Middleware para logging de segurança
export const securityLogger = (req: NextApiRequest, res: NextApiResponse, action: string, details?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.url,
    action,
    details,
    userId: (req as AuthenticatedRequest).user?.id,
    userType: (req as AuthenticatedRequest).user?.tipo
  };

  // Em produção, enviar para serviço de logging
  console.log('🔒 Security Log:', JSON.stringify(logData, null, 2));
};

// Middleware principal para todas as rotas
export const withSecurity = (handler: Function, options: {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: boolean;
  validate?: any;
} = {}) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Rate limiting
      if (options.rateLimit !== false) {
        await rateLimitMiddleware(req, res);
      }

      // Sanitização de entrada
      if (req.body) {
        req.body = sanitizeInput(req.body);
      }

      // Validação de entrada
      if (options.validate && !validateInput(req, res, options.validate)) {
        return;
      }

      // Autenticação
      if (options.requireAuth) {
        if (!await authenticateToken(req, res)) {
          securityLogger(req, res, 'AUTHENTICATION_FAILED');
          return;
        }
      }

      // Verificação de admin
      if (options.requireAdmin) {
        if (!await requireAdmin(req, res)) {
          securityLogger(req, res, 'ADMIN_ACCESS_DENIED');
          return;
        }
      }

      // Log de acesso bem-sucedido
      if (options.requireAuth) {
        securityLogger(req, res, 'ACCESS_GRANTED');
      }

      // Executar handler
      return await handler(req, res);

    } catch (error) {
      console.error('🚨 Security Middleware Error:', error);
      securityLogger(req, res, 'MIDDLEWARE_ERROR', { error: error.message });
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

export default withSecurity;


