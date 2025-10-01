import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { withSecurity, AuthenticatedRequest } from '../_middleware';
import { adminService } from '../services/adminService';
import { logService } from '../services/logService';

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'feperj-super-secret-key-2025-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Interface para resposta de refresh
interface RefreshResponse {
  success: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
}

const refreshHandler = async (req: NextApiRequest, res: NextApiResponse<RefreshResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token é obrigatório'
      });
    }

    // Verificar refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido ou expirado'
      });
    }

    // Verificar se é um refresh token válido
    if (decoded.type !== 'refresh' || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido'
      });
    }

    // Buscar usuário no banco
    const user = await adminService.findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Gerar novo token
    const tokenPayload = {
      id: user.id,
      login: user.login,
      nome: user.nome,
      tipo: user.tipo,
      idEquipe: user.idEquipe,
      iat: Math.floor(Date.now() / 1000)
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });

    // Calcular expiração
    const expiresIn = JWT_EXPIRES_IN === '24h' ? 24 * 60 * 60 : 60 * 60; // em segundos

    // Log de refresh bem-sucedido
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome,
      acao: 'Token renovado',
      detalhes: `Refresh token usado com sucesso para ${user.nome}`,
      tipoUsuario: user.tipo
    });

    return res.status(200).json({
      success: true,
      token: newToken,
      expiresIn
    });

  } catch (error) {
    console.error('🚨 Erro no refresh token:', error);
    
    await logService.create({
      dataHora: new Date(),
      usuario: 'Sistema',
      acao: 'Erro no refresh token',
      detalhes: `Erro: ${error.message}`,
      tipoUsuario: 'admin'
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export default withSecurity(refreshHandler, {
  requireAuth: false,
  rateLimit: true
});


