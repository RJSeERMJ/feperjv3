"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = exports.verifyPassword = exports.requireAdminOrChefe = exports.requireAdmin = exports.authenticateToken = exports.verifyJWT = exports.generateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
/**
 * Gera token JWT para usuário
 */
const generateJWT = (payload) => {
    return jsonwebtoken_1.default.sign({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }, JWT_SECRET);
};
exports.generateJWT = generateJWT;
/**
 * Verifica e decodifica token JWT
 */
const verifyJWT = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('Token JWT inválido:', error);
        return null;
    }
};
exports.verifyJWT = verifyJWT;
/**
 * Middleware de autenticação
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acesso necessário',
            message: 'Faça login para acessar este recurso'
        });
    }
    try {
        const decoded = (0, exports.verifyJWT)(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                message: 'Token expirado ou inválido'
            });
        }
        // Verificar se o token pertence ao tenant correto
        if (req.tenant && decoded.tenant !== req.tenant.id) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido para este tenant',
                message: 'Token não corresponde ao tenant atual'
            });
        }
        // Adicionar dados do usuário ao request
        req.user = {
            login: decoded.login,
            nome: decoded.nome,
            tipo: decoded.tipo,
            tenant: decoded.tenant
        };
        next();
    }
    catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(401).json({
            success: false,
            error: 'Erro na autenticação',
            message: 'Token inválido ou expirado'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware para verificar se usuário é admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.tipo !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Apenas administradores podem acessar este recurso'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware para verificar se usuário é admin ou chefe de equipe
 */
const requireAdminOrChefe = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            message: 'Faça login para acessar este recurso'
        });
    }
    if (req.user.tipo !== 'admin' && !req.user.chefeEquipe) {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Apenas administradores ou chefes de equipe podem acessar este recurso'
        });
    }
    next();
};
exports.requireAdminOrChefe = requireAdminOrChefe;
/**
 * Verifica senha usando bcrypt
 */
const verifyPassword = async (password, hashedPassword) => {
    try {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    catch (error) {
        console.error('Erro ao verificar senha:', error);
        return false;
    }
};
exports.verifyPassword = verifyPassword;
/**
 * Gera hash de senha usando bcrypt
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
//# sourceMappingURL=auth.js.map