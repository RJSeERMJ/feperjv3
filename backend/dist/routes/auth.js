"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_2 = require("../middleware/auth");
const firebaseService_1 = require("../services/firebaseService");
const router = (0, express_1.Router)();
exports.authRoutes = router;
/**
 * POST /api/auth/login
 * Realiza login do usuário
 */
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { login, senha } = req.body;
    const { tenant } = req;
    if (!login || !senha) {
        return res.status(400).json({
            success: false,
            error: 'Dados incompletos',
            message: 'Login e senha são obrigatórios'
        });
    }
    try {
        // 1. Verificar usuário admin local
        if (login === tenant.admin.login) {
            const isValidPassword = await (0, auth_1.verifyPassword)(senha, tenant.admin.passwordHash);
            if (isValidPassword) {
                const token = (0, auth_1.generateJWT)({
                    login: tenant.admin.login,
                    nome: tenant.admin.name,
                    tipo: 'admin',
                    tenant: tenant.id
                });
                const response = {
                    token,
                    user: {
                        login: tenant.admin.login,
                        nome: tenant.admin.name,
                        tipo: 'admin'
                    }
                };
                console.log(`✅ Login admin realizado: ${tenant.admin.login} (${tenant.name})`);
                return res.json({
                    success: true,
                    data: response,
                    message: 'Login realizado com sucesso'
                });
            }
        }
        // 2. Verificar usuário no Firebase
        const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
        const usuario = await firebaseService.getUsuarioByLogin(login);
        if (usuario && usuario.senha) {
            let isValidPassword = false;
            // Verificar se senha está criptografada ou em texto plano
            if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
                // Senha já está criptografada
                isValidPassword = await (0, auth_1.verifyPassword)(senha, usuario.senha);
            }
            else {
                // Senha em texto plano - verificar diretamente
                isValidPassword = senha === usuario.senha;
                // Migrar senha para hash (opcional)
                if (isValidPassword) {
                    console.log('🔄 Migrando senha para hash seguro...');
                    try {
                        const hashedPassword = await bcryptjs_1.default.hash(senha, 12);
                        await firebaseService.updateUsuarioPassword(usuario.id, hashedPassword);
                    }
                    catch (hashError) {
                        console.warn('Erro ao migrar senha:', hashError);
                    }
                }
            }
            if (isValidPassword) {
                const token = (0, auth_1.generateJWT)({
                    login: usuario.login,
                    nome: usuario.nome,
                    tipo: usuario.tipo,
                    tenant: tenant.id
                });
                const response = {
                    token,
                    user: {
                        login: usuario.login,
                        nome: usuario.nome,
                        tipo: usuario.tipo
                    }
                };
                // Registrar log de login
                try {
                    await firebaseService.createLog({
                        dataHora: new Date(),
                        usuario: usuario.nome,
                        acao: 'Login realizado',
                        detalhes: `Login do usuário ${usuario.nome}`,
                        tipoUsuario: usuario.tipo
                    });
                }
                catch (logError) {
                    console.warn('Erro ao registrar log:', logError);
                }
                console.log(`✅ Login Firebase realizado: ${usuario.login} (${tenant.name})`);
                return res.json({
                    success: true,
                    data: response,
                    message: 'Login realizado com sucesso'
                });
            }
        }
        // 3. Credenciais inválidas
        console.log(`❌ Tentativa de login inválida: ${login} (${tenant.name})`);
        return res.status(401).json({
            success: false,
            error: 'Credenciais inválidas',
            message: 'Login ou senha incorretos'
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao processar login'
        });
    }
}));
/**
 * POST /api/auth/logout
 * Realiza logout do usuário
 */
router.post('/logout', auth_2.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { user, tenant } = req;
    try {
        // Registrar log de logout
        if (user) {
            const firebaseService = new firebaseService_1.FirebaseService(tenant.firebase);
            await firebaseService.createLog({
                dataHora: new Date(),
                usuario: user.nome,
                acao: 'Logout realizado',
                detalhes: `Logout do usuário ${user.nome}`,
                tipoUsuario: user.tipo
            });
        }
        console.log(`✅ Logout realizado: ${user?.login} (${tenant.name})`);
        return res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro no logout:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao processar logout'
        });
    }
}));
/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', auth_2.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { user, tenant } = req;
    return res.json({
        success: true,
        data: {
            user: {
                login: user.login,
                nome: user.nome,
                tipo: user.tipo,
                tenant: tenant.name
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                branding: tenant.branding
            }
        }
    });
}));
/**
 * POST /api/auth/refresh
 * Renova token de autenticação
 */
router.post('/refresh', auth_2.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { user, tenant } = req;
    try {
        const newToken = (0, auth_1.generateJWT)({
            login: user.login,
            nome: user.nome,
            tipo: user.tipo,
            tenant: tenant.id
        });
        return res.json({
            success: true,
            data: {
                token: newToken
            },
            message: 'Token renovado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao renovar token:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao renovar token'
        });
    }
}));
//# sourceMappingURL=auth.js.map