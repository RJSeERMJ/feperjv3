import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdminOrChefe } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { FirebaseService } from '../services/firebaseService';
import { Equipe, ApiResponse, PaginationParams, PaginatedResponse } from '../types';

const router = Router();

/**
 * GET /api/equipes
 * Lista todas as equipes
 */
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { page = 1, limit = 50, search, sortBy = 'nomeEquipe', sortOrder = 'asc' } = req.query as PaginationParams;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const equipes = await firebaseService.getAllEquipes();
  
  // Aplicar filtro de busca
  let filteredEquipes = equipes;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredEquipes = equipes.filter(equipe => 
      equipe.nomeEquipe.toLowerCase().includes(searchLower) ||
      equipe.cidade.toLowerCase().includes(searchLower) ||
      (equipe.tecnico && equipe.tecnico.toLowerCase().includes(searchLower))
    );
  }
  
  // Aplicar ordenação
  filteredEquipes.sort((a, b) => {
    const aValue = a[sortBy as keyof Equipe];
    const bValue = b[sortBy as keyof Equipe];
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
  
  // Aplicar paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEquipes = filteredEquipes.slice(startIndex, endIndex);
  
  const response: PaginatedResponse<Equipe> = {
    data: paginatedEquipes,
    pagination: {
      page,
      limit,
      total: filteredEquipes.length,
      totalPages: Math.ceil(filteredEquipes.length / limit)
    }
  };
  
  res.json({
    success: true,
    data: response
  });
}));

/**
 * GET /api/equipes/:id
 * Busca equipe por ID
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const equipe = await firebaseService.getEquipeById(id);
  
  if (!equipe) {
    return res.status(404).json({
      success: false,
      error: 'Equipe não encontrada',
      message: 'Equipe com o ID especificado não foi encontrada'
    });
  }
  
  res.json({
    success: true,
    data: equipe
  });
}));

/**
 * POST /api/equipes
 * Cria nova equipe
 */
router.post('/', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const equipeData: Omit<Equipe, 'id'> = req.body;
  
  // Validações básicas
  if (!equipeData.nomeEquipe || !equipeData.cidade) {
    return res.status(400).json({
      success: false,
      error: 'Dados incompletos',
      message: 'Nome da equipe e cidade são obrigatórios'
    });
  }
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    const equipeId = await firebaseService.createEquipe(equipeData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Equipe criada',
      detalhes: `Equipe ${equipeData.nomeEquipe} criada`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Equipe criada: ${equipeData.nomeEquipe} (${tenant.name})`);
    
    res.status(201).json({
      success: true,
      data: { id: equipeId },
      message: 'Equipe criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar equipe',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * PUT /api/equipes/:id
 * Atualiza equipe
 */
router.put('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  const equipeData: Partial<Equipe> = req.body;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.updateEquipe(id, equipeData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Equipe atualizada',
      detalhes: `Equipe ${id} atualizada`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Equipe atualizada: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Equipe atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar equipe',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * DELETE /api/equipes/:id
 * Remove equipe
 */
router.delete('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.deleteEquipe(id);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Equipe removida',
      detalhes: `Equipe ${id} removida`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Equipe removida: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Equipe removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover equipe:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover equipe',
      message: 'Erro interno'
    });
  }
}));

export { router as equipesRoutes };
