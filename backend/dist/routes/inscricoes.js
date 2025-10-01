"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inscricoesRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const firebaseService_1 = require("../services/firebaseService");
const router = (0, express_1.Router)();
exports.inscricoesRoutes = router;
/**
 * GET /api/inscricoes
 * Lista todas as inscrições
 */
router.get('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { page = 1, limit = 50, search, sortBy = 'dataInscricao', sortOrder = 'desc' } = req.query;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    const inscricoes = await firebaseService.getAllInscricoes();
    // Aplicar filtro de busca
    let filteredInscricoes = inscricoes;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredInscricoes = inscricoes.filter(inscricao => inscricao.atleta?.nome.toLowerCase().includes(searchLower) ||
            inscricao.competicao?.nomeCompeticao.toLowerCase().includes(searchLower) ||
            inscricao.statusInscricao.toLowerCase().includes(searchLower));
    }
    // Aplicar ordenação
    filteredInscricoes.sort((a, b) => {
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
    const paginatedInscricoes = filteredInscricoes.slice(startIndex, endIndex);
    const response = {
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
router.get('/competicao/:competicaoId', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { competicaoId } = req.params;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
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
router.get('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { id } = req.params;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
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
router.post('/', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const inscricaoData = req.body;
    // Validações básicas
    if (!inscricaoData.idAtleta || !inscricaoData.idCompeticao) {
        return res.status(400).json({
            success: false,
            error: 'Dados incompletos',
            message: 'ID do atleta e ID da competição são obrigatórios'
        });
    }
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        const inscricaoId = await firebaseService.createInscricao(inscricaoData);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Inscrição criada',
            detalhes: `Inscrição ${inscricaoId} criada`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Inscrição criada: ${inscricaoId} (${tenant.name})`);
        res.status(201).json({
            success: true,
            data: { id: inscricaoId },
            message: 'Inscrição criada com sucesso'
        });
    }
    catch (error) {
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
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const { id } = req.params;
    const inscricaoData = req.body;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        await firebaseService.updateInscricao(id, inscricaoData);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Inscrição atualizada',
            detalhes: `Inscrição ${id} atualizada`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Inscrição atualizada: ${id} (${tenant.name})`);
        res.json({
            success: true,
            message: 'Inscrição atualizada com sucesso'
        });
    }
    catch (error) {
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
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdminOrChefe, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const { id } = req.params;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        await firebaseService.deleteInscricao(id);
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Inscrição removida',
            detalhes: `Inscrição ${id} removida`,
            tipoUsuario: user.tipo
        });
        console.log(`✅ Inscrição removida: ${id} (${tenant.name})`);
        res.json({
            success: true,
            message: 'Inscrição removida com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao remover inscrição:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao remover inscrição',
            message: 'Erro interno'
        });
    }
}));
//# sourceMappingURL=inscricoes.js.map