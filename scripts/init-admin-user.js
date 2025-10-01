#!/usr/bin/env node

/**
 * Script de Inicialização do Usuário Admin Local
 * 
 * Este script cria o usuário administrador local para o sistema.
 */

const crypto = require('crypto');

// Função para gerar hash SHA-256 com salt
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Gerar salt aleatório
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

// Dados do usuário admin
const adminUser = {
  login: '15119236790',
  password: '49912170',
  nome: 'Administrador',
  tipo: 'admin'
};

// Gerar hash da senha
const salt = generateSalt();
const hashedPassword = hashPassword(adminUser.password, salt);
const passwordHash = salt + ':' + hashedPassword;

console.log('🔐 Inicializando usuário administrador local...');
console.log('');
console.log('📋 Dados do usuário:');
console.log(`   Login: ${adminUser.login}`);
console.log(`   Senha: ${adminUser.password}`);
console.log(`   Nome: ${adminUser.nome}`);
console.log(`   Tipo: ${adminUser.tipo}`);
console.log('');
console.log('🔑 Hash da senha gerado:');
console.log(`   ${passwordHash}`);
console.log('');
console.log('✅ Usuário administrador configurado com sucesso!');
console.log('');
console.log('🚀 Para usar o sistema:');
console.log('   1. Acesse a página de login');
console.log('   2. Use as credenciais acima');
console.log('   3. O sistema Barra Pronta estará disponível');
console.log('');
console.log('⚠️ IMPORTANTE:');
console.log('   • Altere a senha após o primeiro login');
console.log('   • Configure usuários adicionais se necessário');
console.log('   • Mantenha as credenciais seguras');
