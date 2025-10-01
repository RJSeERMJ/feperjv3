import { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import { withSecurity, AuthenticatedRequest } from '../_middleware';
import { atletaService } from '../services/atletaService';
import { logService } from '../services/logService';

// Schema de validação para criação/atualização de atleta
const atletaSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  cpf: Joi.string().pattern(/^\d{11}$/).required(),
  matricula: Joi.string().max(50).optional(),
  sexo: Joi.string().valid('M', 'F').required(),
  email: Joi.string().email().optional(),
  telefone: Joi.string().max(20).optional(),
  dataNascimento: Joi.date().max('now').required(),
  dataFiliacao: Joi.date().max('now').required(),
  maiorTotal: Joi.number().min(0).optional(),
  status: Joi.string().valid('ATIVO', 'INATIVO').default('ATIVO'),
  idEquipe: Joi.string().optional(),
  idCategoria: Joi.string().optional(),
  endereco: Joi.string().max(200).optional(),
  observacoes: Joi.string().max(500).optional()
});

// Interface para resposta de atletas
interface AtletasResponse {
  success: boolean;
  atletas?: any[];
  total?: number;
  error?: string;
}

interface AtletaResponse {
  success: boolean;
  atleta?: any;
  error?: string;
}

// GET /api/atletas - Listar atletas
const getAtletasHandler = async (req: AuthenticatedRequest, res: NextApiResponse<AtletasResponse>) => {
  try {
    const { search, equipe, status, page = 1, limit = 50 } = req.query;
    
    // Verificar permissões
    const user = req.user!;
    if (user.tipo !== 'admin' && equipe && equipe !== user.idEquipe) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Você só pode visualizar atletas da sua equipe.'
      });
    }

    const atletas = await atletaService.getAll({
      search: search as string,
      equipe: equipe as string,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    // Log da consulta
    await logService.logAuditEvent({
      user: user.nome,
      action: 'CONSULTA_ATLETAS',
      resource: 'atletas',
      details: `Consulta realizada com filtros: ${JSON.stringify({ search, equipe, status })}`,
      metadata: { total: atletas.length }
    });

    return res.status(200).json({
      success: true,
      atletas,
      total: atletas.length
    });

  } catch (error) {
    console.error('🚨 Erro ao buscar atletas:', error);
    
    await logService.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      user: req.user?.nome,
      details: `Erro ao buscar atletas: ${error.message}`,
      metadata: { error: error.message }
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/atletas - Criar atleta
const createAtletaHandler = async (req: AuthenticatedRequest, res: NextApiResponse<AtletaResponse>) => {
  try {
    const user = req.user!;
    
    // Verificar permissões
    if (user.tipo !== 'admin') {
      // Usuário comum só pode criar atletas para sua equipe
      if (req.body.idEquipe && req.body.idEquipe !== user.idEquipe) {
        return res.status(403).json({
          success: false,
          error: 'Você só pode criar atletas para sua própria equipe.'
        });
      }
      
      // Forçar equipe do usuário
      req.body.idEquipe = user.idEquipe;
    }

    const atletaData = {
      ...req.body,
      dataNascimento: new Date(req.body.dataNascimento),
      dataFiliacao: new Date(req.body.dataFiliacao)
    };

    const atletaId = await atletaService.create(atletaData);

    // Log da criação
    await logService.logAuditEvent({
      user: user.nome,
      action: 'CRIAR_ATLETA',
      resource: 'atletas',
      resourceId: atletaId,
      details: `Atleta ${req.body.nome} criado com sucesso`,
      metadata: { cpf: req.body.cpf, equipe: req.body.idEquipe }
    });

    return res.status(201).json({
      success: true,
      atleta: { id: atletaId, ...atletaData }
    });

  } catch (error) {
    console.error('🚨 Erro ao criar atleta:', error);
    
    await logService.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      user: req.user?.nome,
      details: `Erro ao criar atleta: ${error.message}`,
      metadata: { error: error.message, data: req.body }
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
};

// Handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return getAtletasHandler(req, res);
    case 'POST':
      return createAtletaHandler(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
};

export default withSecurity(handler, {
  requireAuth: true,
  validate: Joi.object({
    body: atletaSchema.when('$method', {
      is: 'POST',
      then: atletaSchema.required(),
      otherwise: Joi.any()
    })
  })
});


