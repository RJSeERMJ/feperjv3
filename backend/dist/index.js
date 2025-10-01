"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
const atletas_1 = require("./routes/atletas");
const equipes_1 = require("./routes/equipes");
const competicoes_1 = require("./routes/competicoes");
const inscricoes_1 = require("./routes/inscricoes");
const financeiro_1 = require("./routes/financeiro");
const barraPronta_1 = require("./routes/barraPronta");
const config_1 = require("./routes/config");
const errorHandler_1 = require("./middleware/errorHandler");
const tenant_1 = require("./middleware/tenant");
// Carregar variáveis de ambiente
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware de segurança
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Middleware para parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Middleware de tenant (detecta cliente baseado no subdomínio ou header)
app.use(tenant_1.tenantMiddleware);
// Rotas
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/atletas', atletas_1.atletasRoutes);
app.use('/api/equipes', equipes_1.equipesRoutes);
app.use('/api/competicoes', competicoes_1.competicoesRoutes);
app.use('/api/inscricoes', inscricoes_1.inscricoesRoutes);
app.use('/api/financeiro', financeiro_1.financeiroRoutes);
app.use('/api/barra-pronta', barraPronta_1.barraProntaRoutes);
app.use('/api/config', config_1.configRoutes);
// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Middleware de tratamento de erros
app.use(errorHandler_1.errorHandler);
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map