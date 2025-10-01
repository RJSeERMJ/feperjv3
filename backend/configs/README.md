# Sistema de Federações - Arquivo Base

## 📋 Sobre o Arquivo Base

O arquivo `base.enc` é um template para configuração de novos clientes (federações). Ele contém configurações padrão que devem ser personalizadas para cada cliente.

## 🔧 Como Usar

### 1. Configuração de Novo Cliente

```bash
# Copiar arquivo base
cp configs/base.enc configs/novo-cliente.enc

# Configurar novo cliente
npm run setup-tenant novo-cliente "Nome da Federação" "senhaAdmin123"
```

### 2. Configuração Manual

Se preferir configurar manualmente:

1. **Copie o arquivo base:**
   ```bash
   cp configs/base.enc configs/meu-cliente.enc
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   export MEU_CLIENTE_FIREBASE_API_KEY="sua-api-key"
   export MEU_CLIENTE_FIREBASE_PROJECT_ID="seu-projeto"
   # ... outras variáveis
   ```

3. **Use o script de descriptografia para editar:**
   ```bash
   npm run decrypt-config decrypt meu-cliente
   ```

### 3. Validação

Sempre valide a configuração antes de usar:

```bash
npm run decrypt-config validate meu-cliente
```

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

## 🛠️ Scripts Disponíveis

- `npm run setup-tenant` - Configuração interativa de novo tenant
- `npm run decrypt-config` - Descriptografar e visualizar configurações
- `npm run create-base-config` - Criar arquivo base (já executado)

## 📋 Exemplo de Uso

```bash
# 1. Criar novo cliente
npm run setup-tenant feperj "FEPERJ" "minhaSenha123"

# 2. Validar configuração
npm run decrypt-config validate feperj

# 3. Ver informações básicas
npm run decrypt-config info feperj

# 4. Listar todos os tenants
npm run decrypt-config list
```
