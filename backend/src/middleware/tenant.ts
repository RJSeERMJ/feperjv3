import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { TenantConfig } from '../types';

// Cache de configurações para performance
const tenantCache = new Map<string, TenantConfig>();

/**
 * Carrega configuração criptografada de um tenant
 */
export const loadTenantConfig = (tenantId: string): TenantConfig => {
  // Verificar cache primeiro
  if (tenantCache.has(tenantId)) {
    return tenantCache.get(tenantId)!;
  }

  try {
    const configPath = `configs/${tenantId}.enc`;
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuração não encontrada para o tenant: ${tenantId}`);
    }

    const encryptedConfig = fs.readFileSync(configPath, 'utf8');
    const encryptionKey = process.env.CONFIG_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('CONFIG_ENCRYPTION_KEY não configurada');
    }

    // Descriptografar configuração
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedConfig, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const config: TenantConfig = JSON.parse(decrypted);
    
    // Armazenar no cache
    tenantCache.set(tenantId, config);
    
    return config;
  } catch (error) {
    console.error(`Erro ao carregar configuração do tenant ${tenantId}:`, error);
    throw new Error(`Erro ao carregar configuração do tenant: ${tenantId}`);
  }
};

/**
 * Detecta o tenant baseado no subdomínio ou header
 */
export const detectTenant = (req: Request): string => {
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

/**
 * Middleware para detectar e carregar configuração do tenant
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = detectTenant(req);
    
    // Adicionar tenant ID ao request
    req.tenantId = tenantId;
    
    // Carregar configuração do tenant
    const tenantConfig = loadTenantConfig(tenantId);
    req.tenant = tenantConfig;
    
    console.log(`🏢 Tenant detectado: ${tenantId} (${tenantConfig.name})`);
    
    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(404).json({
      success: false,
      error: 'Tenant não encontrado ou configuração inválida',
      message: 'Verifique se o tenant está configurado corretamente'
    });
  }
};

/**
 * Limpa cache de configurações (útil para desenvolvimento)
 */
export const clearTenantCache = () => {
  tenantCache.clear();
  console.log('🧹 Cache de configurações limpo');
};

/**
 * Lista todos os tenants disponíveis
 */
export const listAvailableTenants = (): string[] => {
  try {
    const configsDir = 'configs';
    if (!fs.existsSync(configsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(configsDir);
    return files
      .filter(file => file.endsWith('.enc'))
      .map(file => file.replace('.enc', ''));
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    return [];
  }
};

// Extender interface Request para incluir tenant
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: TenantConfig;
    }
  }
}
