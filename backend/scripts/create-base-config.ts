#!/usr/bin/env ts-node

import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { TenantConfig } from '../src/types';

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('❌ CONFIG_ENCRYPTION_KEY não configurada!');
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
 * Cria arquivo base para venda
 */
const createBaseConfig = async (): Promise<void> => {
  console.log('🏗️  Criando arquivo base para venda...');
  
  try {
    // Configuração base (template)
    const baseConfig: TenantConfig = {
      id: 'base',
      name: 'Nova Federação',
      domain: 'exemplo.com.br',
      firebase: {
        apiKey: 'SUA_FIREBASE_API_KEY_AQUI',
        authDomain: 'seu-projeto.firebaseapp.com',
        projectId: 'seu-projeto-id',
        storageBucket: 'seu-projeto.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef123456',
        measurementId: 'G-XXXXXXXXXX'
      },
      admin: {
        login: 'admin',
        passwordHash: await bcrypt.hash('senha123', 12), // Senha padrão
        name: 'Administrador',
        salt: await bcrypt.genSalt(12),
        createdAt: new Date().toISOString()
      },
      branding: {
        name: 'Nova Federação',
        logo: '/logo.png',
        colors: {
          primary: '#007bff',
          secondary: '#6c757d'
        }
      }
    };
    
    // Criar diretório configs se não existir
    if (!fs.existsSync('configs')) {
      fs.mkdirSync('configs', { recursive: true });
    }
    
    // Criptografar e salvar configuração base
    const encryptedConfig = encryptConfig(baseConfig);
    const configPath = 'configs/base.enc';
    
    fs.writeFileSync(configPath, encryptedConfig);
    
    console.log('✅ Arquivo base criado com sucesso!');
    console.log(`📁 Localização: ${configPath}`);
    console.log('');
    console.log('📋 Configuração base inclui:');
    console.log('   - ID: base');
    console.log('   - Nome: Nova Federação');
    console.log('   - Admin: admin / senha123');
    console.log('   - Firebase: Configurações de exemplo');
    console.log('   - Branding: Configurações padrão');
    console.log('');
    console.log('🔧 Para usar este arquivo base:');
    console.log('   1. Copie base.enc para <tenant-id>.enc');
    console.log('   2. Use o script setup-tenant para personalizar');
    console.log('   3. Configure as variáveis de ambiente do Firebase');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo base:', error);
    process.exit(1);
  }
};

/**
 * Cria documentação para comercialização
 */
const createDocumentation = (): void => {
  const documentation = `# Sistema de Federações - Arquivo Base

## 📋 Sobre o Arquivo Base

O arquivo \`base.enc\` é um template para configuração de novos clientes (federações). Ele contém configurações padrão que devem ser personalizadas para cada cliente.

## 🔧 Como Usar

### 1. Configuração de Novo Cliente

\`\`\`bash
# Copiar arquivo base
cp configs/base.enc configs/novo-cliente.enc

# Configurar novo cliente
npm run setup-tenant novo-cliente "Nome da Federação" "senhaAdmin123"
\`\`\`

### 2. Configuração Manual

Se preferir configurar manualmente:

1. **Copie o arquivo base:**
   \`\`\`bash
   cp configs/base.enc configs/meu-cliente.enc
   \`\`\`

2. **Configure as variáveis de ambiente:**
   \`\`\`bash
   export MEU_CLIENTE_FIREBASE_API_KEY="sua-api-key"
   export MEU_CLIENTE_FIREBASE_PROJECT_ID="seu-projeto"
   # ... outras variáveis
   \`\`\`

3. **Use o script de descriptografia para editar:**
   \`\`\`bash
   npm run decrypt-config decrypt meu-cliente
   \`\`\`

### 3. Validação

Sempre valide a configuração antes de usar:

\`\`\`bash
npm run decrypt-config validate meu-cliente
\`\`\`

## 📁 Estrutura do Arquivo Base

O arquivo base contém:

- **ID**: base (será alterado para o ID do cliente)
- **Nome**: Nova Federação (será alterado para o nome da federação)
- **Admin**: admin / senha123 (será alterado para credenciais seguras)
- **Firebase**: Configurações de exemplo (serão substituídas pelas reais)
- **Branding**: Configurações padrão (serão personalizadas)

## 🔒 Segurança

- ✅ Senhas são hasheadas com bcrypt
- ✅ Configurações são criptografadas
- ✅ Nenhuma informação sensível em texto plano
- ✅ Salt único por cliente

## 🚀 Deploy

Após configurar um cliente:

1. **Configure as variáveis de ambiente no servidor**
2. **Faça deploy do backend**
3. **Configure o frontend para apontar para a API**
4. **Teste a conexão**

## 📞 Suporte

Para dúvidas sobre configuração, consulte a documentação completa ou entre em contato com o suporte técnico.
`;

  fs.writeFileSync('configs/README.md', documentation);
  console.log('📚 Documentação criada: configs/README.md');
};

// Executar script
const main = async () => {
  await createBaseConfig();
  createDocumentation();
};

main().catch(console.error);
