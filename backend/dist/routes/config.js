"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.configRoutes = router;
/**
 * GET /api/config
 * Retorna configurações do tenant (apenas dados públicos)
 */
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.get('/health', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant, user } = req;
    try {
        // Verificar se as configurações estão válidas
        const configValid = !!(tenant.firebase.apiKey &&
            tenant.firebase.projectId &&
            tenant.admin.login &&
            tenant.admin.passwordHash);
        const health = {
            status: configValid ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            tenant: {
                id: tenant.id,
                name: tenant.name
            },
            user: {
                login: user.login,
                tipo: user.tipo
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
    }
    catch (error) {
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
router.get('/admin', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.post('/test-firebase', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tenant } = req;
    try {
        const { FirebaseService } = await Promise.resolve().then(() => __importStar(require('../services/firebaseService')));
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
    }
    catch (error) {
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
router.get('/tenants', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Esta funcionalidade não está disponível em produção'
        });
    }
    try {
        const { listAvailableTenants } = await Promise.resolve().then(() => __importStar(require('../middleware/tenant')));
        const tenants = listAvailableTenants();
        res.json({
            success: true,
            data: {
                tenants,
                current: req.tenantId
            }
        });
    }
    catch (error) {
        console.error('Erro ao listar tenants:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao listar tenants'
        });
    }
}));
//# sourceMappingURL=config.js.map