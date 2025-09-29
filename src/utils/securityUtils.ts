import CryptoJS from 'crypto-js';
import { sha256 } from 'js-sha256';

// Configurações de segurança
const JWT_SECRET = process.env.REACT_APP_JWT_SECRET || 'feperj-super-secret-key-2025';
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'feperj-encryption-key-2025';
const SALT_ROUNDS = 12;

// Interface para dados do usuário criptografados
interface EncryptedUserData {
  login: string;
  nome: string;
  tipo: 'admin' | 'usuario';
  token: string;
  expiresAt: number;
}

// Interface para payload JWT
interface JWTPayload {
  login: string;
  nome: string;
  tipo: 'admin' | 'usuario';
  iat: number;
  exp: number;
}

/**
 * Criptografa uma senha usando SHA-256 com salt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Gerar salt aleatório
    const salt = CryptoJS.lib.WordArray.random(32).toString();
    // Combinar senha + salt e fazer hash
    const hash = sha256(password + salt);
    // Retornar salt + hash para armazenamento
    return salt + ':' + hash;
  } catch (error) {
    console.error('Erro ao criptografar senha:', error);
    throw new Error('Erro interno de segurança');
  }
};

/**
 * Verifica se uma senha corresponde ao hash
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    // Separar salt e hash
    const [salt, hash] = hashedPassword.split(':');
    if (!salt || !hash) return false;
    
    // Verificar senha
    const testHash = sha256(password + salt);
    return testHash === hash;
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};

/**
 * Gera um token JWT simples para o usuário
 */
export const generateJWT = (user: { login: string; nome: string; tipo: 'admin' | 'usuario' }): string => {
  const payload: JWTPayload = {
    login: user.login,
    nome: user.nome,
    tipo: user.tipo,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };

  // Criar JWT simples com HMAC-SHA256
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = CryptoJS.HmacSHA256(encodedHeader + '.' + encodedPayload, JWT_SECRET).toString();

  return encodedHeader + '.' + encodedPayload + '.' + signature;
};

/**
 * Verifica e decodifica um token JWT
 */
export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verificar assinatura
    const expectedSignature = CryptoJS.HmacSHA256(encodedHeader + '.' + encodedPayload, JWT_SECRET).toString();
    if (signature !== expectedSignature) return null;

    // Decodificar payload
    const payload = JSON.parse(atob(encodedPayload)) as JWTPayload;
    
    // Verificar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token JWT inválido:', error);
    return null;
  }
};

/**
 * Criptografa dados sensíveis para armazenamento local
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    throw new Error('Erro interno de segurança');
  }
};

/**
 * Descriptografa dados do armazenamento local
 */
export const decryptData = <T>(encryptedData: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    return null;
  }
};

/**
 * Armazena dados do usuário de forma segura no localStorage
 */
export const storeSecureUserData = (user: { login: string; nome: string; tipo: 'admin' | 'usuario' }): void => {
  try {
    const token = generateJWT(user);
    const userData: EncryptedUserData = {
      login: user.login,
      nome: user.nome,
      tipo: user.tipo,
      token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };

    const encryptedData = encryptData(userData);
    localStorage.setItem('feperj_user_secure', encryptedData);
    
    // Manter compatibilidade com sistema antigo (temporário)
    localStorage.setItem('feperj_user', JSON.stringify({
      login: user.login,
      nome: user.nome,
      tipo: user.tipo
    }));
  } catch (error) {
    console.error('Erro ao armazenar dados do usuário:', error);
    throw new Error('Erro interno de segurança');
  }
};

/**
 * Recupera dados do usuário de forma segura do localStorage
 */
export const getSecureUserData = (): { login: string; nome: string; tipo: 'admin' | 'usuario' } | null => {
  try {
    const encryptedData = localStorage.getItem('feperj_user_secure');
    if (!encryptedData) {
      return null;
    }

    const userData = decryptData<EncryptedUserData>(encryptedData);
    if (!userData) {
      return null;
    }

    // Verificar se o token ainda é válido
    const tokenData = verifyJWT(userData.token);
    if (!tokenData) {
      // Token expirado ou inválido, limpar dados
      clearSecureUserData();
      return null;
    }

    // Verificar se não expirou
    if (Date.now() > userData.expiresAt) {
      clearSecureUserData();
      return null;
    }

    return {
      login: userData.login,
      nome: userData.nome,
      tipo: userData.tipo
    };
  } catch (error) {
    console.error('Erro ao recuperar dados do usuário:', error);
    return null;
  }
};

/**
 * Limpa dados seguros do usuário
 */
export const clearSecureUserData = (): void => {
  localStorage.removeItem('feperj_user_secure');
  localStorage.removeItem('feperj_user');
  sessionStorage.removeItem('feperj_user');
};

/**
 * Verifica se o usuário está autenticado e com token válido
 */
export const isUserAuthenticated = (): boolean => {
  const userData = getSecureUserData();
  return userData !== null;
};

/**
 * Gera uma senha segura aleatória
 */
export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Valida força da senha
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Verificar comprimento
  if (password.length < 8) {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  // Verificar se tem letras minúsculas
  if (!/[a-z]/.test(password)) {
    feedback.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  // Verificar se tem letras maiúsculas
  if (!/[A-Z]/.test(password)) {
    feedback.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  // Verificar se tem números
  if (!/\d/.test(password)) {
    feedback.push('Senha deve conter pelo menos um número');
  } else {
    score += 1;
  }

  // Verificar se tem caracteres especiais
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Senha deve conter pelo menos um caractere especial');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
};

/**
 * Sanitiza entrada de dados para prevenir XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Valida CPF com algoritmo oficial
 */
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Todos os dígitos iguais
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};
