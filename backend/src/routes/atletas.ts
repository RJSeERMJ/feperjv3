import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdminOrChefe } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { FirebaseService } from '../services/firebaseService';
import { Atleta, ApiResponse, PaginationParams, PaginatedResponse } from '../types';

const router = Router();

/**
 * GET /api/atletas
 * Lista todos os atletas
 */
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { page = 1, limit = 50, search, sortBy = 'nome', sortOrder = 'asc' } = req.query as PaginationParams;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const atletas = await firebaseService.getAllAtletas();
  
  // Aplicar filtro de busca
  let filteredAtletas = atletas;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredAtletas = atletas.filter(atleta => 
      atleta.nome.toLowerCase().includes(searchLower) ||
      atleta.cpf.includes(search) ||
      atleta.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Aplicar ordenação
  filteredAtletas.sort((a, b) => {
    const aValue = a[sortBy as keyof Atleta];
    const bValue = b[sortBy as keyof Atleta];
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
  
  // Aplicar paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAtletas = filteredAtletas.slice(startIndex, endIndex);
  
  const response: PaginatedResponse<Atleta> = {
    data: paginatedAtletas,
    pagination: {
      page,
      limit,
      total: filteredAtletas.length,
      totalPages: Math.ceil(filteredAtletas.length / limit)
    }
  };
  
  res.json({
    success: true,
    data: response
  });
}));

/**
 * GET /api/atletas/:id
 * Busca atleta por ID
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const atleta = await firebaseService.getAtletaById(id);
  
  if (!atleta) {
    return res.status(404).json({
      success: false,
      error: 'Atleta não encontrado',
      message: 'Atleta com o ID especificado não foi encontrado'
    });
  }
  
  res.json({
    success: true,
    data: atleta
  });
}));

/**
 * POST /api/atletas
 * Cria novo atleta
 */
router.post('/', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const atletaData: Omit<Atleta, 'id'> = req.body;
  
  // Validações básicas
  if (!atletaData.nome || !atletaData.cpf || !atletaData.email) {
    return res.status(400).json({
      success: false,
      error: 'Dados incompletos',
      message: 'Nome, CPF e email são obrigatórios'
    });
  }
  
  // Validar CPF
  const cpfLimpo = atletaData.cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({
      success: false,
      error: 'CPF inválido',
      message: 'CPF deve ter 11 dígitos'
    });
  }
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    const atletaId = await firebaseService.createAtleta(atletaData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Atleta criado',
      detalhes: `Atleta ${atletaData.nome} criado`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Atleta criado: ${atletaData.nome} (${tenant.name})`);
    
    res.status(201).json({
      success: true,
      data: { id: atletaId },
      message: 'Atleta criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar atleta:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar atleta',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * PUT /api/atletas/:id
 * Atualiza atleta
 */
router.put('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  const atletaData: Partial<Atleta> = req.body;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.updateAtleta(id, atletaData);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Atleta atualizado',
      detalhes: `Atleta ${id} atualizado`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Atleta atualizado: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Atleta atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar atleta',
      message: error instanceof Error ? error.message : 'Erro interno'
    });
  }
}));

/**
 * DELETE /api/atletas/:id
 * Remove atleta
 */
router.delete('/:id', authenticateToken, requireAdminOrChefe, asyncHandler(async (req: Request, res: Response) => {
  const { tenant, user } = req;
  const { id } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  
  try {
    await firebaseService.deleteAtleta(id);
    
    // Registrar log
    await firebaseService.createLog({
      dataHora: new Date(),
      usuario: user!.nome,
      acao: 'Atleta removido',
      detalhes: `Atleta ${id} removido`,
      tipoUsuario: user!.tipo
    });
    
    console.log(`✅ Atleta removido: ${id} (${tenant.name})`);
    
    res.json({
      success: true,
      message: 'Atleta removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover atleta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover atleta',
      message: 'Erro interno'
    });
  }
}));

/**
 * GET /api/atletas/cpf/:cpf
 * Busca atleta por CPF
 */
router.get('/cpf/:cpf', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenant } = req;
  const { cpf } = req.params;
  
  const firebaseService = new FirebaseService(tenant.firebase);
  const atleta = await firebaseService.getAtletaByCpf(cpf);
  
  if (!atleta) {
    return res.status(404).json({
      success: false,
      error: 'Atleta não encontrado',
      message: 'Atleta com o CPF especificado não foi encontrado'
    });
  }
  
  res.json({
    success: true,
    data: atleta
  });
}));

export { router as atletasRoutes };
