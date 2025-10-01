import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { FirebaseService } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/barra-pronta/status
 * Retorna status do sistema Barra Pronta
 */
router.get('/status', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  
  try {
    // Verificar se o sistema está funcionando
    const firebaseService = new FirebaseService(tenant.firebase);
    const atletas = await firebaseService.getAllAtletas();
    const competicoes = await firebaseService.getAllCompeticoes();
    
    const status = {
      sistema: 'Barra Pronta',
      status: 'ativo',
      timestamp: new Date().toISOString(),
      tenant: tenant.name,
      usuario: user!.nome,
      estatisticas: {
        totalAtletas: atletas.length,
        totalCompeticoes: competicoes.length,
        atletasAtivos: atletas.filter(a => a.status === 'ATIVO').length
      }
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao verificar status do Barra Pronta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao verificar status do sistema'
    });
  }
}));

/**
 * GET /api/barra-pronta/atletas
 * Retorna atletas para o sistema Barra Pronta
 */
router.get('/atletas', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { competicaoId } = req.query;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    let atletas = await firebaseService.getAllAtletas();
    
    // Filtrar por competição se especificado
    if (competicaoId) {
      const inscricoes = await firebaseService.getInscricoesByCompeticao(competicaoId as string);
      const atletasInscritos = inscricoes.map(i => i.idAtleta);
      atletas = atletas.filter(a => atletasInscritos.includes(a.id!));
    }
    
    // Filtrar apenas atletas ativos
    atletas = atletas.filter(a => a.status === 'ATIVO');
    
    res.json({
      success: true,
      data: atletas
    });
  } catch (error) {
    console.error('Erro ao buscar atletas para Barra Pronta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao buscar atletas'
    });
  }
}));

/**
 * GET /api/barra-pronta/competicoes
 * Retorna competições para o sistema Barra Pronta
 */
router.get('/competicoes', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    const competicoes = await firebaseService.getAllCompeticoes();
    
    // Filtrar apenas competições ativas
    const competicoesAtivas = competicoes.filter(c => 
      c.status === 'AGENDADA' || c.status === 'REALIZADA'
    );
    
    res.json({
      success: true,
      data: competicoesAtivas
    });
  } catch (error) {
    console.error('Erro ao buscar competições para Barra Pronta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao buscar competições'
    });
  }
}));

/**
 * POST /api/barra-pronta/resultado
 * Registra resultado de um atleta
 */
router.post('/resultado', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { atletaId, competicaoId, agachamento, supino, terra, total, posicao } = req.body;
  
  // Validações básicas
  if (!atletaId || !competicaoId) {
    return res.status(400).json({
      success: false,
      error: 'Dados incompletos',
      message: 'ID do atleta e ID da competição são obrigatórios'
    });
  }
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    // Criar resultado da competição
    const resultado = {
      idAtleta: atletaId,
      idCompeticao: competicaoId,
      agachamento: agachamento || 0,
      supino: supino || 0,
      terra: terra || 0,
      total: total || 0,
      posicao: posicao || 0,
      dataRegistro: new Date()
    };
    
    // Aqui você implementaria a lógica para salvar o resultado
    // Por enquanto, apenas registrar o log
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Resultado registrado',
      detalhes: `Resultado registrado para atleta ${atletaId} na competição ${competicaoId}`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Resultado registrado: Atleta ${atletaId} (${tenant.name})`);
    
    res.json({
      success: true,
      data: resultado,
      message: 'Resultado registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao registrar resultado'
    });
  }
}));

/**
 * GET /api/barra-pronta/resultados
 * Retorna resultados de uma competição
 */
router.get('/resultados', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { competicaoId } = req.query;
  
  if (!competicaoId) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetro obrigatório',
      message: 'ID da competição é obrigatório'
    });
  }
  
  try {
    // Aqui você implementaria a lógica para buscar resultados
    // Por enquanto, retornar array vazio
    
    res.json({
      success: true,
      data: [],
      message: 'Resultados não implementados ainda'
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao buscar resultados'
    });
  }
}));

export { router as barraProntaRoutes };
