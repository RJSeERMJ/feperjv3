#!/usr/bin/env node

/**
 * Script para gerar chaves seguras para o sistema FEPERJ
 * Uso: node scripts/generate-keys.js
 */

const crypto = require('crypto');

// Função para gerar string aleatória segura
const generateSecureString = (length = 64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Função para gerar chave usando crypto
const generateCryptoKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

console.log('🔐 GERADOR DE CHAVES SEGURAS - FEPERJ');
console.log('=====================================\n');

// Gerar chaves
const jwtSecret = generateCryptoKey(32);
const encryptionKey = generateCryptoKey(32);

console.log('📋 CHAVES GERADAS:');
console.log('==================\n');

console.log('🔑 JWT Secret (32 bytes):');
console.log(jwtSecret);
console.log('');

console.log('🔒 Encryption Key (32 bytes):');
console.log(encryptionKey);
console.log('');

console.log('📝 ARQUIVO .env:');
console.log('================');
console.log('# Segurança - FEPERJ');
console.log(`REACT_APP_JWT_SECRET=${jwtSecret}`);
console.log(`REACT_APP_ENCRYPTION_KEY=${encryptionKey}`);
console.log('');

console.log('⚠️  INSTRUÇÕES:');
console.log('===============');
console.log('1. Copie as chaves acima para seu arquivo .env');
console.log('2. NUNCA commite o arquivo .env para o repositório');
console.log('3. Use chaves diferentes para desenvolvimento e produção');
console.log('4. Mantenha as chaves em local seguro');
console.log('5. Rotacione as chaves regularmente');
console.log('');

console.log('✅ Chaves geradas com sucesso!');
console.log('🚀 Sistema pronto para uso seguro!');
