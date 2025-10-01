"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competicoesRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const firebaseService_1 = require("../services/firebaseService");
const router = (0, express_1.Router)();
exports.competicoesRoutes = router;
/**
 * GET /api/competicoes
 * Lista todas as competições
 */
router.get('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { page = 1, limit = 50, search, sortBy = 'nomeCompeticao', sortOrder = 'desc' } = req.query;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    const competicoes = await firebaseService.getAllCompeticoes();
    // Aplicar filtro de busca
    let filteredCompeticoes = competicoes;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredCompeticoes = competicoes.filter(competicao => competicao.nomeCompeticao.toLowerCase().includes(searchLower) ||
            (competicao.local && competicao.local.toLowerCase().includes(searchLower)) ||
            competicao.status.toLowerCase().includes(searchLower));
    }
    // Aplicar ordenação
    filteredCompeticoes.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
    });
    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompeticoes = filteredCompeticoes.slice(startIndex, endIndex);
    const response = {
        data: paginatedCompeticoes,
        pagination: {
            page,
            limit,
            total: filteredCompeticoes.length,
            totalPages: Math.ceil(filteredCompeticoes.length / limit)
        }
    };
    res.json({
        success: true,
        data: response
    });
}));
/**
 * GET /api/competicoes/:id
 * Busca competição por ID
 */
router.get('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { id } = req.params;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    const competicao = await firebaseService.getCompeticaoById(id);
    if (!competicao) {
        return res.status(404).json({
            success: false,
            error: 'Competição não encontrada',
            message: 'Competição com o ID especificado não foi encontrada'
        });
    }
    res.json({
        success: true,
        data: competicao
    });
}));
/**
 * POST /api/competicoes
 * Cria nova competição
 */
router.post('/', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const competicaoData = req.body;
    // Validações básicas
    if (!competicaoData.nomeCompeticao || !competicaoData.dataCompeticao) {
        return res.status(400).json({
            success: false,
            error: 'Dados incompletos',
            message: 'Nome da competição e data são obrigatórios'
        });
    }
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        const competicaoId = await firebaseService.createCompeticao(competicaoData);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Competição criada',
            detalhes: `Competição ${competicaoData.nomeCompeticao} criada`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Competição criada: ${competicaoData.nomeCompeticao} (${tenant.name})`);
        res.status(201).json({
            success: true,
            data: { id: competicaoId },
            message: 'Competição criada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao criar competição:', error);
        res.status(400).json({
            success: false,
            error: 'Erro ao criar competição',
            message: error instanceof Error ? error.message : 'Erro interno'
        });
    }
}));
/**
 * PUT /api/competicoes/:id
 * Atualiza competição
 */
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const { id } = req.params;
    const competicaoData = req.body;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        await firebaseService.updateCompeticao(id, competicaoData);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Competição atualizada',
            detalhes: `Competição ${id} atualizada`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Competição atualizada: ${id} (${tenant.name})`);
        res.json({
            success: true,
            message: 'Competição atualizada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao atualizar competição:', error);
        res.status(400).json({
            success: false,
            error: 'Erro ao atualizar competição',
            message: error instanceof Error ? error.message : 'Erro interno'
        });
    }
}));
/**
 * DELETE /api/competicoes/:id
 * Remove competição
 */
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const { id } = req.params;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        await firebaseService.deleteCompeticao(id);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Competição removida',
            detalhes: `Competição ${id} removida`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Competição removida: ${id} (${tenant.name})`);
        res.json({
            success: true,
            message: 'Competição removida com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao remover competição:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao remover competição',
            message: 'Erro interno'
        });
    }
}));
//# sourceMappingURL=competicoes.js.map