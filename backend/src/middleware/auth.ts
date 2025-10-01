import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Gera token JWT para usuário
 */
export const generateJWT = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    },
    JWT_SECRET
  );
};

/**
 * Verifica e decodifica token JWT
 */
export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token JWT inválido:', error);
    return null;
  }
};

/**
 * Middleware de autenticação
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso necessário',
      message: 'Faça login para acessar este recurso'
    });
  }

  try {
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Token expirado ou inválido'
      });
    }

    // Verificar se o token pertence ao tenant correto
    if (req.tenant && decoded.tenant !== req.tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido para este tenant',
        message: 'Token não corresponde ao tenant atual'
      });
    }

    // Adicionar dados do usuário ao request
    req.user = {
      login: decoded.login,
      nome: decoded.nome,
      tipo: decoded.tipo,
      tenant: decoded.tenant
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      success: false,
      error: 'Erro na autenticação',
      message: 'Token inválido ou expirado'
    });
  }
};

/**
 * Middleware para verificar se usuário é admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.tipo !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar este recurso'
    });
  }
  next();
};

/**
 * Middleware para verificar se usuário é admin ou chefe de equipe
 */
export const requireAdminOrChefe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
      message: 'Faça login para acessar este recurso'
    });
  }

  if (req.user.tipo !== 'admin' && !req.user.chefeEquipe) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Apenas administradores ou chefes de equipe podem acessar este recurso'
    });
  }

  next();
};

/**
 * Verifica senha usando bcrypt
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};

/**
 * Gera hash de senha usando bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Extender interface Request para incluir usuário
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
