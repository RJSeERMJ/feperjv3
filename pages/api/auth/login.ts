import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { withSecurity } from '../_middleware';
import { adminService } from '../services/adminService';
import { logService } from '../services/logService';

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'feperj-super-secret-key-2025-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Interface para dados de login
interface LoginRequest {
  login: string;
  senha: string;
}

// Interface para resposta de login
interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    login: string;
    nome: string;
    tipo: 'admin' | 'usuario';
    idEquipe?: string;
  };
  expiresIn?: number;
}

const loginHandler = async (req: NextApiRequest, res: NextApiResponse<LoginResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    } as any);
  }

  try {
    const { login, senha }: LoginRequest = req.body;

    // Validação básica
    if (!login || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Login e senha são obrigatórios'
      } as any);
    }

    // Buscar usuário no banco de dados
    const user = await adminService.findUserByLogin(login);
    
    if (!user) {
      // Log de tentativa de login com usuário inexistente
      await logService.create({
        dataHora: new Date(),
        usuario: 'Sistema',
        acao: 'Tentativa de login - usuário não encontrado',
        detalhes: `Tentativa de login com usuário: ${login}`,
        tipoUsuario: 'admin'
      });

      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      } as any);
    }

    // Verificar senha
    let isPasswordValid = false;
    
    if (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$')) {
      // Senha já está criptografada com bcrypt
      isPasswordValid = await bcrypt.compare(senha, user.senha);
    } else if (user.senha.includes(':')) {
      // Senha com hash customizado (SHA-256 + salt)
      isPasswordValid = await verifyCustomHash(senha, user.senha);
    } else {
      // Senha em texto plano (migração)
      isPasswordValid = senha === user.senha;
      
      // Migrar para hash seguro
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(senha, 12);
        await adminService.updateUserPassword(user.id, hashedPassword);
      }
    }

    if (!isPasswordValid) {
      // Log de tentativa de login com senha incorreta
      await logService.create({
        dataHora: new Date(),
        usuario: user.nome,
        acao: 'Tentativa de login - senha incorreta',
        detalhes: `Tentativa de login com senha incorreta para usuário: ${user.nome}`,
        tipoUsuario: user.tipo
      });

      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      } as any);
    }

    // Gerar tokens
    const tokenPayload = {
      id: user.id,
      login: user.login,
      nome: user.nome,
      tipo: user.tipo,
      idEquipe: user.idEquipe,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Log de login bem-sucedido
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome,
      acao: 'Login realizado',
      detalhes: `Login bem-sucedido do usuário ${user.nome}`,
      tipoUsuario: user.tipo
    });

    // Calcular expiração
    const expiresIn = JWT_EXPIRES_IN === '24h' ? 24 * 60 * 60 : 60 * 60; // em segundos

    return res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        login: user.login,
        nome: user.nome,
        tipo: user.tipo,
        idEquipe: user.idEquipe
      },
      expiresIn
    });

  } catch (error) {
    console.error('🚨 Erro no login:', error);
    
    await logService.create({
      dataHora: new Date(),
      usuario: 'Sistema',
      acao: 'Erro no sistema de login',
      detalhes: `Erro: ${error.message}`,
      tipoUsuario: 'admin'
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    } as any);
  }
};

// Função para verificar hash customizado (SHA-256 + salt)
async function verifyCustomHash(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':');
    if (!salt || !hash) return false;
    
    const crypto = require('crypto');
    const testHash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return testHash === hash;
  } catch (error) {
    return false;
  }
}

export default withSecurity(loginHandler, {
  requireAuth: false,
  rateLimit: true
});


