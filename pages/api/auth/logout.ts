import { NextApiRequest, NextApiResponse } from 'next';
import { withSecurity, AuthenticatedRequest } from '../_middleware';
import { logService } from '../services/logService';

// Interface para resposta de logout
interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const logoutHandler = async (req: AuthenticatedRequest, res: NextApiResponse<LogoutResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Log de logout
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome,
      acao: 'Logout realizado',
      detalhes: `Logout do usuário ${user.nome}`,
      tipoUsuario: user.tipo
    });

    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('🚨 Erro no logout:', error);
    
    await logService.create({
      dataHora: new Date(),
      usuario: 'Sistema',
      acao: 'Erro no logout',
      detalhes: `Erro: ${error.message}`,
      tipoUsuario: 'admin'
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export default withSecurity(logoutHandler, {
  requireAuth: true,
  rateLimit: true
});


