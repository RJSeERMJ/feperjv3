"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAvailableTenants = exports.clearTenantCache = exports.tenantMiddleware = exports.detectTenant = exports.loadTenantConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// Cache de configurações para performance
const tenantCache = new Map();
/**
 * Carrega configuração criptografada de um tenant
 */
const loadTenantConfig = (tenantId) => {
    // Verificar cache primeiro
    if (tenantCache.has(tenantId)) {
        return tenantCache.get(tenantId);
    }
    try {
        const configPath = `configs/${tenantId}.enc`;
        if (!fs_1.default.existsSync(configPath)) {
            throw new Error(`Configuração não encontrada para o tenant: ${tenantId}`);
        }
        const encryptedConfig = fs_1.default.readFileSync(configPath, 'utf8');
        const encryptionKey = process.env.CONFIG_ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('CONFIG_ENCRYPTION_KEY não configurada');
        }
        // Descriptografar configuração
        const decipher = crypto_1.default.createDecipher('aes-256-cbc', encryptionKey);
        let decrypted = decipher.update(encryptedConfig, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        const config = JSON.parse(decrypted);
        // Armazenar no cache
        tenantCache.set(tenantId, config);
        return config;
    }
    catch (error) {
        console.error(`Erro ao carregar configuração do tenant ${tenantId}:`, error);
        throw new Error(`Erro ao carregar configuração do tenant: ${tenantId}`);
    }
};
exports.loadTenantConfig = loadTenantConfig;
/**
 * Detecta o tenant baseado no subdomínio ou header
 */
const detectTenant = (req) => {
    // 1. Tentar detectar por header X-Tenant-ID
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) {
        return tenantHeader;
    }
    // 2. Tentar detectar por subdomínio
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    // Ignorar subdomínios comuns
    const commonSubdomains = ['www', 'api', 'admin', 'app'];
    if (!commonSubdomains.includes(subdomain)) {
        return subdomain;
    }
    // 3. Fallback para FEPERJ (desenvolvimento)
    return 'feperj';
};
exports.detectTenant = detectTenant;
/**
 * Middleware para detectar e carregar configuração do tenant
 */
const tenantMiddleware = (req, res, next) => {
    try {
        const tenantId = (0, exports.detectTenant)(req);
        // Adicionar tenant ID ao request
        req.tenantId = tenantId;
        // Carregar configuração do tenant
        const tenantConfig = (0, exports.loadTenantConfig)(tenantId);
        req.tenant = tenantConfig;
        console.log(`🏢 Tenant detectado: ${tenantId} (${tenantConfig.name})`);
        next();
    }
    catch (error) {
        console.error('Erro no middleware de tenant:', error);
        res.status(404).json({
            success: false,
            error: 'Tenant não encontrado ou configuração inválida',
            message: 'Verifique se o tenant está configurado corretamente'
        });
    }
};
exports.tenantMiddleware = tenantMiddleware;
/**
 * Limpa cache de configurações (útil para desenvolvimento)
 */
const clearTenantCache = () => {
    tenantCache.clear();
    console.log('🧹 Cache de configurações limpo');
};
exports.clearTenantCache = clearTenantCache;
/**
 * Lista todos os tenants disponíveis
 */
const listAvailableTenants = () => {
    try {
        const configsDir = 'configs';
        if (!fs_1.default.existsSync(configsDir)) {
            return [];
        }
        const files = fs_1.default.readdirSync(configsDir);
        return files
            .filter(file => file.endsWith('.enc'))
            .map(file => file.replace('.enc', ''));
    }
    catch (error) {
        console.error('Erro ao listar tenants:', error);
        return [];
    }
};
exports.listAvailableTenants = listAvailableTenants;
//# sourceMappingURL=tenant.js.map