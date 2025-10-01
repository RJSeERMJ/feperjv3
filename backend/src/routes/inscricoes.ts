import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdminOrChefe } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { FirebaseService } from '../services/firebaseService';
import { InscricaoCompeticao, ApiResponse, PaginationParams, PaginatedResponse } from '../types';

const router = Router();

/**
 * GET /api/inscricoes
 * Lista todas as inscrições
 */
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { page = 1, limit = 50, search, sortBy = 'dataInscricao', sortOrder = 'desc' } = req.query as PaginationParams;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const inscricoes = await firebaseService.getAllInscricoes();
  
  // Aplicar filtro de busca
  let filteredInscricoes = inscricoes;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredInscricoes = inscricoes.filter(inscricao => 
      inscricao.atleta?.nome.toLowerCase().includes(searchLower) ||
      inscricao.competicao?.nomeCompeticao.toLowerCase().includes(searchLower) ||
      inscricao.statusInscricao.toLowerCase().includes(searchLower)
    );
  }
  
  // Aplicar ordenação
  filteredInscricoes.sort((a, b) => {
    const aValue = a[sortBy as keyof InscricaoCompeticao];
    const bValue = b[sortBy as keyof InscricaoCompeticao];
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
  
  // Aplicar paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedInscricoes = filteredInscricoes.slice(startIndex, endIndex);
  
  const response: PaginatedResponse<InscricaoCompeticao> = {
    data: paginatedInscricoes,
    pagination: {
      page,
      limit,
      total: filteredInscricoes.length,
      totalPages: Math.ceil(filteredInscricoes.length / limit)
    }
  };
  
  res.json({
    success: true,
    data: response
  });
}));

/**
 * GET /api/inscricoes/competicao/:competicaoId
 * Lista inscrições de uma competição
 */
router.get('/competicao/:competicaoId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { competicaoId } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const inscricoes = await firebaseService.getInscricoesByCompeticao(competicaoId);
  
  res.json({
    success: true,
    data: inscricoes
  });
}));

/**
 * GET /api/inscricoes/:id
 * Busca inscrição por ID
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const inscricoes = await firebaseService.getAllInscricoes();
  const inscricao = inscricoes.find(i => i.id === id);
  
  if (!inscricao) {
    return res.status(404).json({
      success: false,
      error: 'Inscrição não encontrada',
      message: 'Inscrição com o ID especificado não foi encontrada'
    });
  }
  
  res.json({
    success: true,
    data: inscricao
  });
}));

/**
 * POST /api/inscricoes
 * Cria nova inscrição
 */
router.post('/', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const inscricaoData: Omit<InscricaoCompeticao, 'id'> = req.body;
  
  // Validações básicas
  if (!inscricaoData.idAtleta || !inscricaoData.idCompeticao) {
    return res.status(400).json({
      success: false,
      error: 'Dados incompletos',
      message: 'ID do atleta e ID da competição são obrigatórios'
    });
  }
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    const inscricaoId = await firebaseService.createInscricao(inscricaoData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Inscrição criada',
      detalhes: `Inscrição ${inscricaoId} criada`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Inscrição criada: ${inscricaoId} (${tenant.name})`);
    
    res.status(201).json({
      success: true,
      data: { id: inscricaoId },
      message: 'Inscrição criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar inscrição:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar inscrição',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * PUT /api/inscricoes/:id
 * Atualiza inscrição
 */
router.put('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  const inscricaoData: Partial<InscricaoCompeticao> = req.body;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.updateInscricao(id, inscricaoData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Inscrição atualizada',
      detalhes: `Inscrição ${id} atualizada`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Inscrição atualizada: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Inscrição atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar inscrição:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar inscrição',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * DELETE /api/inscricoes/:id
 * Remove inscrição
 */
router.delete('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.deleteInscricao(id);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Inscrição removida',
      detalhes: `Inscrição ${id} removida`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Inscrição removida: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Inscrição removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover inscrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover inscrição',
      message: 'Erro interno'
    });
  }
}));

export { router as inscricoesRoutes };
