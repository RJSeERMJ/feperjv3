"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeiroRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const firebaseService_1 = require("../services/firebaseService");
const router = (0, express_1.Router)();
exports.financeiroRoutes = router;
/**
 * GET /api/financeiro/dashboard
 * Retorna dados do dashboard financeiro
 */
router.get('/dashboard', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        // Buscar dados para dashboard
        const [atletas, equipes, competicoes, inscricoes] = await Promise.all([
            firebaseService.getAllAtletas(),
            firebaseService.getAllEquipes(),
            firebaseService.getAllCompeticoes(),
            firebaseService.getAllInscricoes()
        ]);
        // Calcular estatísticas
        const atletasAtivos = atletas.filter(a => a.status === 'ATIVO').length;
        const atletasInativos = atletas.filter(a => a.status === 'INATIVO').length;
        const atletasMasculino = atletas.filter(a => a.sexo === 'M').length;
        const atletasFeminino = atletas.filter(a => a.sexo === 'F').length;
        // Agrupar atletas por equipe
        const atletasPorEquipe = equipes.map(equipe => ({
            equipe: equipe.nomeEquipe,
            quantidade: atletas.filter(a => a.idEquipe === equipe.id).length
        }));
        // Top 10 maiores totais
        const maioresTotais = atletas
            .filter(a => a.maiorTotal && a.maiorTotal > 0)
            .sort((a, b) => (b.maiorTotal || 0) - (a.maiorTotal || 0))
            .slice(0, 10)
            .map(a => ({
            atleta: a.nome,
            total: a.maiorTotal || 0
        }));
        const dashboard = {
            totalAtletas: atletas.length,
            totalEquipes: equipes.length,
            totalCompeticoes: competicoes.length,
            atletasAtivos,
            atletasInativos,
            atletasPorSexo: {
                masculino: atletasMasculino,
                feminino: atletasFeminino
            },
            atletasPorEquipe,
            maioresTotais
        };
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Erro ao buscar dashboard financeiro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao buscar dados do dashboard'
        });
    }
}));
/**
 * GET /api/financeiro/logs
 * Retorna logs de atividades
 */
router.get('/logs', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    const { page = 1, limit = 100 } = req.query;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        const logs = await firebaseService.getAllLogs();
        // Aplicar paginação
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedLogs = logs.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                logs: paginatedLogs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: logs.length,
                    totalPages: Math.ceil(logs.length / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao buscar logs'
        });
    }
}));
/**
 * DELETE /api/financeiro/logs
 * Limpa todos os logs
 */
router.delete('/logs', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
    try {
        await firebaseService.clearLogs();
        // Registrar log
        await firebaseService.createLog({
            dataHora: new Date(),
            usuario: user.nome,
            acao: 'Logs limpos',
            detalhes: 'Todos os logs foram limpos',
            tipoUsuario: user.tipo
        });
        console.log(`✅ Logs limpos por: ${user.nome} (${tenant.name})`);
        res.json({
            success: true,
            message: 'Logs limpos com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao limpar logs:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao limpar logs'
        });
    }
}));
//# sourceMappingURL=financeiro.js.map