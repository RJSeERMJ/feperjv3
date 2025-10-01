import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/config
 * Retorna configurações do tenant (apenas dados públicos)
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  
  // Retornar apenas dados públicos da configuração
  const publicConfig = {
    id: tenant.id,
    name: tenant.name,
    branding: tenant.branding,
    firebase: {
      projectId: tenant.firebase.projectId,
      authDomain: tenant.firebase.authDomain
    }
  };
  
  res.json({
    success: true,
    data: publicConfig
  });
}));

/**
 * GET /api/config/health
 * Verifica saúde da configuração
 */
router.get('/health', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  
  try {
    // Verificar se as configurações estão válidas
    const configValid = !!(
      tenant.firebase.apiKey &&
      tenant.firebase.projectId &&
      tenant.admin.login &&
      tenant.admin.passwordHash
    );
    
    const health = {
      status: configValid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      tenant: {
        id: tenant.id,
        name: tenant.name
      },
      user: {
        login: user!.login,
        tipo: user!.tipo
      },
      firebase: {
        configured: !!tenant.firebase.apiKey,
        projectId: tenant.firebase.projectId
      },
      admin: {
        configured: !!tenant.admin.login
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Erro ao verificar saúde da configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao verificar configuração'
    });
  }
}));

/**
 * GET /api/config/admin
 * Retorna informações do admin (apenas para admins)
 */
router.get('/admin', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  
  const adminInfo = {
    login: tenant.admin.login,
    name: tenant.admin.name,
    createdAt: tenant.admin.createdAt,
    // Não retornar hash da senha por segurança
  };
  
  res.json({
    success: true,
    data: adminInfo
  });
}));

/**
 * POST /api/config/test-firebase
 * Testa conexão com Firebase
 */
router.post('/test-firebase', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  
  try {
    const { FirebaseService } = await import('../services/firebaseService');
    const firebaseService = new FirebaseService(tenant.firebase);
    
    // Tentar buscar usuários para testar conexão
    const usuarios = await firebaseService.getAllUsuarios();
    
    res.json({
      success: true,
      data: {
        connected: true,
        usuariosCount: usuarios.length,
        projectId: tenant.firebase.projectId
      },
      message: 'Conexão com Firebase estabelecida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao testar conexão Firebase:', error);
    res.status(500).json({
      success: false,
      error: 'Erro de conexão',
      message: 'Falha ao conectar com Firebase',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}));

/**
 * GET /api/config/tenants
 * Lista todos os tenants disponíveis (apenas para desenvolvimento)
 */
router.get('/tenants', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Esta funcionalidade não está disponível em produção'
    });
  }
  
  try {
    const { listAvailableTenants } = await import('../middleware/tenant');
    const tenants = listAvailableTenants();
    
    res.json({
      success: true,
      data: {
        tenants,
        current: req.tenantId
      }
    });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao listar tenants'
    });
  }
}));

export { router as configRoutes };
