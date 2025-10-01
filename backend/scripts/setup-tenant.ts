#!/usr/bin/env ts-node

import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import readline from 'readline';
import { TenantConfig } from '../src/types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('❌ CONFIG_ENCRYPTION_KEY não configurada!');
  console.error('Configure a variável de ambiente CONFIG_ENCRYPTION_KEY');
  process.exit(1);
}

/**
 * Criptografa configuração
 */
const encryptConfig = (config: TenantConfig): string => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(JSON.stringify(config, null, 2), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

/**
 * Gera configuração segura para um tenant
 */
const generateSecureConfig = async (
  tenantId: string,
  tenantName: string,
  adminLogin: string,
  adminPassword: string,
  firebaseConfig: any,
  branding: any
): Promise<TenantConfig> => {
  console.log(`🔐 Gerando configuração segura para: ${tenantName}`);
  
  // Gerar hash seguro da senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(adminPassword, salt);
  
  const config: TenantConfig = {
    id: tenantId,
    name: tenantName,
    domain: `${tenantId}.com.br`, // Exemplo de domínio
    firebase: firebaseConfig,
    admin: {
      login: adminLogin,
      passwordHash,
      name: `Administrador ${tenantName}`,
      salt,
      createdAt: new Date().toISOString()
    },
    branding: branding
  };
  
  return config;
};

/**
 * Salva configuração criptografada
 */
const saveEncryptedConfig = (tenantId: string, config: TenantConfig): void => {
  try {
    // Criar diretório configs se não existir
    if (!fs.existsSync('configs')) {
      fs.mkdirSync('configs', { recursive: true });
    }
    
    const encryptedConfig = encryptConfig(config);
    const configPath = `configs/${tenantId}.enc`;
    
    fs.writeFileSync(configPath, encryptedConfig);
    console.log(`✅ Configuração salva em: ${configPath}`);
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    throw error;
  }
};

/**
 * Pergunta para o usuário
 */
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * Setup interativo de tenant
 */
const setupTenantInteractively = async () => {
  console.log('🏗️  Configuração de Novo Tenant');
  console.log('================================');
  console.log('');
  
  try {
    // Dados básicos
    const tenantId = await question('ID do tenant (ex: feperj): ');
    const tenantName = await question('Nome do tenant: ');
    const domain = await question('Domínio (ex: feperj.com.br): ');
    
    // Dados do admin
    console.log('\n👤 Configuração do Administrador:');
    const adminLogin = await question('Login do admin: ');
    const adminPassword = await question('Senha do admin: ');
    const adminName = await question('Nome do admin: ');
    
    // Configuração do Firebase
    console.log('\n🔥 Configuração do Firebase:');
    const firebaseApiKey = await question('Firebase API Key: ');
    const firebaseAuthDomain = await question('Firebase Auth Domain: ');
    const firebaseProjectId = await question('Firebase Project ID: ');
    const firebaseStorageBucket = await question('Firebase Storage Bucket: ');
    const firebaseMessagingSenderId = await question('Firebase Messaging Sender ID: ');
    const firebaseAppId = await question('Firebase App ID: ');
    const firebaseMeasurementId = await question('Firebase Measurement ID (opcional): ');
    
    // Branding
    console.log('\n🎨 Configuração de Branding:');
    const brandingName = await question('Nome da marca: ');
    const brandingLogo = await question('URL do logo: ');
    const primaryColor = await question('Cor primária (ex: #007bff): ');
    const secondaryColor = await question('Cor secundária (ex: #6c757d): ');
    
    // Gerar configuração
    const firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId || undefined
    };
    
    const branding = {
      name: brandingName,
      logo: brandingLogo,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor
      }
    };
    
    const config = await generateSecureConfig(
      tenantId,
      tenantName,
      adminLogin,
      adminPassword,
      firebaseConfig,
      branding
    );
    
    // Salvar configuração
    saveEncryptedConfig(tenantId, config);
    
    console.log('\n✅ Configuração concluída com sucesso!');
    console.log('=====================================');
    console.log(`🏢 Tenant: ${tenantName} (${tenantId})`);
    console.log(`👤 Admin: ${adminLogin}`);
    console.log(`🔑 Senha: ${adminPassword}`);
    console.log(`🌐 Domínio: ${domain}`);
    console.log(`📁 Arquivo: configs/${tenantId}.enc`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Anote a senha do admin - ela não será exibida novamente');
    console.log('   - Mantenha o arquivo .enc seguro');
    console.log('   - Configure as variáveis de ambiente no servidor');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  } finally {
    rl.close();
  }
};

/**
 * Setup via argumentos de linha de comando
 */
const setupTenantFromArgs = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Uso: npm run setup-tenant <tenantId> <tenantName> <adminPassword>');
    console.log('Exemplo: npm run setup-tenant feperj "FEPERJ" "minhaSenha123"');
    process.exit(1);
  }
  
  const [tenantId, tenantName, adminPassword] = args;
  const adminLogin = 'admin';
  
  try {
    // Configuração padrão do Firebase (será substituída pelas variáveis de ambiente)
    const firebaseConfig = {
      apiKey: process.env[`${tenantId.toUpperCase()}_FIREBASE_API_KEY`] || '',
      authDomain: process.env[`${tenantId.toUpperCase()}_FIREBASE_AUTH_DOMAIN`] || '',
      projectId: process.env[`${tenantId.toUpperCase()}_FIREBASE_PROJECT_ID`] || '',
      storageBucket: process.env[`${tenantId.toUpperCase()}_FIREBASE_STORAGE_BUCKET`] || '',
      messagingSenderId: process.env[`${tenantId.toUpperCase()}_FIREBASE_MESSAGING_SENDER_ID`] || '',
      appId: process.env[`${tenantId.toUpperCase()}_FIREBASE_APP_ID`] || '',
      measurementId: process.env[`${tenantId.toUpperCase()}_FIREBASE_MEASUREMENT_ID`] || undefined
    };
    
    const branding = {
      name: tenantName,
      logo: '/logo.png',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d'
      }
    };
    
    const config = await generateSecureConfig(
      tenantId,
      tenantName,
      adminLogin,
      adminPassword,
      firebaseConfig,
      branding
    );
    
    saveEncryptedConfig(tenantId, config);
    
    console.log('✅ Tenant configurado com sucesso!');
    console.log(`🏢 Tenant: ${tenantName} (${tenantId})`);
    console.log(`👤 Admin: ${adminLogin}`);
    console.log(`🔑 Senha: ${adminPassword}`);
    console.log(`📁 Arquivo: configs/${tenantId}.enc`);
    
  } catch (error) {
    console.error('❌ Erro ao configurar tenant:', error);
    process.exit(1);
  }
};

// Executar script
if (process.argv.length > 2) {
  setupTenantFromArgs();
} else {
  setupTenantInteractively();
}
