import { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import { withSecurity, AuthenticatedRequest } from '../_middleware';
import { barraProntaService } from '../services/barraProntaService';
import { logService } from '../services/logService';

// Schema de validação para entrada de competição
const entradaSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  sexo: Joi.string().valid('M', 'F').required(),
  division: Joi.string().max(50).required(),
  flight: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J').required(),
  day: Joi.number().min(1).max(7).required(),
  platform: Joi.number().min(1).max(10).required(),
  squat1: Joi.number().min(0).optional(),
  squat2: Joi.number().min(0).optional(),
  squat3: Joi.number().min(0).optional(),
  bench1: Joi.number().min(0).optional(),
  bench2: Joi.number().min(0).optional(),
  bench3: Joi.number().min(0).optional(),
  deadlift1: Joi.number().min(0).optional(),
  deadlift2: Joi.number().min(0).optional(),
  deadlift3: Joi.number().min(0).optional()
});

// Interface para resposta de entrada
interface EntradaResponse {
  success: boolean;
  entrada?: any;
  error?: string;
}

interface EntradasResponse {
  success: boolean;
  entradas?: any[];
  total?: number;
  error?: string;
}

// GET /api/barra-pronta - Listar entradas
const getEntradasHandler = async (req: AuthenticatedRequest, res: NextApiResponse<EntradasResponse>) => {
  try {
    const { day, platform, flight, search } = req.query;
    
    const entradas = await barraProntaService.getEntradas({
      day: day ? parseInt(day as string) : undefined,
      platform: platform ? parseInt(platform as string) : undefined,
      flight: flight as string,
      search: search as string
    });

    // Log da consulta
    await logService.logAuditEvent({
      user: req.user!.nome,
      action: 'CONSULTA_BARRA_PRONTA',
      resource: 'barra-pronta',
      details: `Consulta realizada com filtros: ${JSON.stringify({ day, platform, flight, search })}`,
      metadata: { total: entradas.length }
    });

    return res.status(200).json({
      success: true,
      entradas,
      total: entradas.length
    });

  } catch (error) {
    console.error('🚨 Erro ao buscar entradas:', error);
    
    await logService.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      user: req.user?.nome,
      details: `Erro ao buscar entradas: ${error.message}`,
      metadata: { error: error.message }
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/barra-pronta - Criar entrada
const createEntradaHandler = async (req: AuthenticatedRequest, res: NextApiResponse<EntradaResponse>) => {
  try {
    const entradaData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const entradaId = await barraProntaService.createEntrada(entradaData);

    // Log da criação
    await logService.logAuditEvent({
      user: req.user!.nome,
      action: 'CRIAR_ENTRADA',
      resource: 'barra-pronta',
      resourceId: entradaId,
      details: `Entrada ${req.body.nome} criada com sucesso`,
      metadata: { 
        atleta: req.body.nome,
        flight: req.body.flight,
        day: req.body.day,
        platform: req.body.platform
      }
    });

    return res.status(201).json({
      success: true,
      entrada: { id: entradaId, ...entradaData }
    });

  } catch (error) {
    console.error('🚨 Erro ao criar entrada:', error);
    
    await logService.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      user: req.user?.nome,
      details: `Erro ao criar entrada: ${error.message}`,
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
      return getEntradasHandler(req, res);
    case 'POST':
      return createEntradaHandler(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
  }
};

export default withSecurity(handler, {
  requireAuth: true,
  requireAdmin: true, // Apenas admins podem gerenciar barra pronta
  validate: Joi.object({
    body: entradaSchema.when('$method', {
      is: 'POST',
      then: entradaSchema.required(),
      otherwise: Joi.any()
    })
  })
});


