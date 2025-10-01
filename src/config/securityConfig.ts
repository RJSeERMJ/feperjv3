// =====================================================
// CONFIGURAÇÕES DE SEGURANÇA - FEPERJ
// =====================================================

// Configurações de JWT
export const JWT_CONFIG = {
  SECRET: process.env.REACT_APP_JWT_SECRET || 'feperj-super-secret-key-2025-change-in-production',
  EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '7d'
};

// Configurações de criptografia
export const ENCRYPTION_CONFIG = {
  KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'feperj-encryption-key-2025-change-in-production',
  ALGORITHM: 'AES',
  MODE: 'CBC'
};

// Configurações de senha
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SALT_ROUNDS: 12
};

// Configurações de rate limiting
export const RATE_LIMIT_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  RESET_ATTEMPTS_AFTER: 60 * 60 * 1000 // 1 hora
};

// Configurações de sessão
export const SESSION_CONFIG = {
  MAX_IDLE_TIME: 30 * 60 * 1000, // 30 minutos
  WARNING_TIME: 5 * 60 * 1000, // 5 minutos antes do timeout
  MAX_SESSION_DURATION: 5 * 60 * 60 * 1000 // 5 horas
};

// Headers de segurança
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Configurações de validação
export const VALIDATION_CONFIG = {
  MAX_INPUT_LENGTH: 255,
  ALLOWED_FILE_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.gif'],
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  SANITIZE_HTML: true
};

// Configurações de logging
export const LOGGING_CONFIG = {
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  LOG_SECURITY_EVENTS: true,
  LOG_USER_ACTIONS: true,
  LOG_ERRORS: true
};

// Configurações de backup e recuperação
export const BACKUP_CONFIG = {
  AUTO_BACKUP: true,
  BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
  MAX_BACKUPS: 7,
  ENCRYPT_BACKUPS: true
};

// Função para validar configurações de segurança
export const validateSecurityConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar JWT secret
  if (!process.env.REACT_APP_JWT_SECRET || process.env.REACT_APP_JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  // Verificar encryption key
  if (!process.env.REACT_APP_ENCRYPTION_KEY || process.env.REACT_APP_ENCRYPTION_KEY.length < 32) {
    errors.push('ENCRYPTION_KEY deve ter pelo menos 32 caracteres');
  }

  // Verificar se está usando chaves padrão (perigoso em produção)
  if (process.env.NODE_ENV === 'production') {
    if (JWT_CONFIG.SECRET.includes('change-in-production')) {
      errors.push('JWT_SECRET não pode usar valor padrão em produção');
    }
    if (ENCRYPTION_CONFIG.KEY.includes('change-in-production')) {
      errors.push('ENCRYPTION_KEY não pode usar valor padrão em produção');
    }
  } else {
    if (JWT_CONFIG.SECRET.includes('change-in-production')) {
      warnings.push('JWT_SECRET usando valor padrão - configure variável de ambiente');
    }
    if (ENCRYPTION_CONFIG.KEY.includes('change-in-production')) {
      warnings.push('ENCRYPTION_KEY usando valor padrão - configure variável de ambiente');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Função para gerar chaves seguras
export const generateSecureKeys = (): {
  jwtSecret: string;
  encryptionKey: string;
} => {
  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return {
    jwtSecret: generateRandomString(64),
    encryptionKey: generateRandomString(64)
  };
};
