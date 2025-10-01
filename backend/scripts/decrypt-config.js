#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    console.error('❌ CONFIG_ENCRYPTION_KEY não configurada!');
    process.exit(1);
}
/**
 * Descriptografa configuração
 */
const decryptConfig = (encryptedConfig) => {
    const decipher = crypto_1.default.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedConfig, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};
/**
 * Lista todos os tenants disponíveis
 */
const listTenants = () => {
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
/**
 * Descriptografa e exibe configuração de um tenant
 */
const decryptTenantConfig = (tenantId) => {
    try {
        const configPath = `configs/${tenantId}.enc`;
        if (!fs_1.default.existsSync(configPath)) {
            console.error(`❌ Configuração não encontrada: ${configPath}`);
            return;
        }
        const encryptedConfig = fs_1.default.readFileSync(configPath, 'utf8');
        const config = decryptConfig(encryptedConfig);
        console.log(`🔓 Configuração descriptografada para: ${config.name}`);
        console.log('=====================================');
        console.log(JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('❌ Erro ao descriptografar configuração:', error);
    }
};
/**
 * Exibe informações básicas de um tenant (sem dados sensíveis)
 */
const showTenantInfo = (tenantId) => {
    try {
        const configPath = `configs/${tenantId}.enc`;
        if (!fs_1.default.existsSync(configPath)) {
            console.error(`❌ Configuração não encontrada: ${configPath}`);
            return;
        }
        const encryptedConfig = fs_1.default.readFileSync(configPath, 'utf8');
        const config = decryptConfig(encryptedConfig);
        console.log(`📋 Informações do Tenant: ${config.name}`);
        console.log('=====================================');
        console.log(`ID: ${config.id}`);
        console.log(`Nome: ${config.name}`);
        console.log(`Domínio: ${config.domain || 'Não configurado'}`);
        console.log(`Admin Login: ${config.admin.login}`);
        console.log(`Admin Nome: ${config.admin.name}`);
        console.log(`Criado em: ${config.admin.createdAt}`);
        console.log(`Firebase Project: ${config.firebase.projectId}`);
        console.log(`Branding: ${config.branding.name}`);
        console.log(`Logo: ${config.branding.logo}`);
        console.log(`Cor Primária: ${config.branding.colors.primary}`);
        console.log(`Cor Secundária: ${config.branding.colors.secondary}`);
    }
    catch (error) {
        console.error('❌ Erro ao exibir informações:', error);
    }
};
/**
 * Valida configuração de um tenant
 */
const validateTenantConfig = (tenantId) => {
    try {
        const configPath = `configs/${tenantId}.enc`;
        if (!fs_1.default.existsSync(configPath)) {
            console.error(`❌ Configuração não encontrada: ${configPath}`);
            return;
        }
        const encryptedConfig = fs_1.default.readFileSync(configPath, 'utf8');
        const config = decryptConfig(encryptedConfig);
        console.log(`🔍 Validando configuração: ${config.name}`);
        console.log('=====================================');
        const validations = [
            { name: 'ID do Tenant', value: config.id, valid: !!config.id },
            { name: 'Nome do Tenant', value: config.name, valid: !!config.name },
            { name: 'Firebase API Key', value: config.firebase.apiKey, valid: !!config.firebase.apiKey },
            { name: 'Firebase Project ID', value: config.firebase.projectId, valid: !!config.firebase.projectId },
            { name: 'Admin Login', value: config.admin.login, valid: !!config.admin.login },
            { name: 'Admin Password Hash', value: config.admin.passwordHash, valid: !!config.admin.passwordHash },
            { name: 'Admin Salt', value: config.admin.salt, valid: !!config.admin.salt },
            { name: 'Branding Nome', value: config.branding.name, valid: !!config.branding.name }
        ];
        let allValid = true;
        validations.forEach(validation => {
            const status = validation.valid ? '✅' : '❌';
            console.log(`${status} ${validation.name}: ${validation.valid ? 'OK' : 'FALTANDO'}`);
            if (!validation.valid)
                allValid = false;
        });
        console.log('');
        if (allValid) {
            console.log('✅ Configuração válida!');
        }
        else {
            console.log('❌ Configuração inválida! Corrija os itens marcados.');
        }
    }
    catch (error) {
        console.error('❌ Erro ao validar configuração:', error);
    }
};
// Executar script baseado nos argumentos
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('🔓 Script de Descriptografia de Configurações');
    console.log('=============================================');
    console.log('');
    console.log('Uso:');
    console.log('  npm run decrypt-config list                    - Lista todos os tenants');
    console.log('  npm run decrypt-config info <tenantId>          - Mostra informações básicas');
    console.log('  npm run decrypt-config validate <tenantId>      - Valida configuração');
    console.log('  npm run decrypt-config decrypt <tenantId>      - Descriptografa configuração completa');
    console.log('');
}
else if (args[0] === 'list') {
    const tenants = listTenants();
    console.log('📋 Tenants disponíveis:');
    console.log('======================');
    if (tenants.length === 0) {
        console.log('Nenhum tenant encontrado.');
    }
    else {
        tenants.forEach(tenant => console.log(`- ${tenant}`));
    }
}
else if (args[0] === 'info' && args[1]) {
    showTenantInfo(args[1]);
}
else if (args[0] === 'validate' && args[1]) {
    validateTenantConfig(args[1]);
}
else if (args[0] === 'decrypt' && args[1]) {
    decryptTenantConfig(args[1]);
}
else {
    console.error('❌ Argumentos inválidos');
    console.log('Use: npm run decrypt-config --help para ver as opções');
}
//# sourceMappingURL=decrypt-config.js.map