# Configuração do Supabase para Upload de Documentos

## 🚀 Visão Geral

Este documento explica como configurar o Supabase para a funcionalidade de upload/download de documentos dos atletas.

## 📋 Pré-requisitos

1. Conta no Supabase (gratuita)
2. Projeto criado no Supabase
3. Configuração das variáveis de ambiente

## 🔧 Passo a Passo

### 1. Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou crie uma conta
4. Clique em "New Project"

### 2. Criar Projeto

1. **Nome do Projeto**: `sistema-atletas-documentos` (ou outro nome)
2. **Database Password**: Crie uma senha forte
3. **Region**: Escolha a região mais próxima (ex: São Paulo)
4. Clique em "Create new project"

### 3. Configurar Storage

1. No painel do Supabase, vá para **Storage** no menu lateral
2. Clique em **"Create a new bucket"**
3. Configure o bucket:
   - **Name**: `feperj-2025`
   - **Public bucket**: ❌ **NÃO** (mantenha privado)
   - Clique em **"Create bucket"**

### 4. Configurar Políticas de Segurança

1. No bucket criado, vá para **Policies**
2. Clique em **"New Policy"**
3. Configure as políticas:

#### Política para Upload:
```sql
-- Nome: Allow authenticated uploads
-- Operation: INSERT
-- Policy definition:
(auth.role() = 'authenticated')
```

#### Política para Download:
```sql
-- Nome: Allow authenticated downloads
-- Operation: SELECT
-- Policy definition:
(auth.role() = 'authenticated')
```

#### Política para Delete:
```sql
-- Nome: Allow authenticated deletes
-- Operation: DELETE
-- Policy definition:
(auth.role() = 'authenticated')
```

### 5. Obter Credenciais

1. No painel do Supabase, vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xyz.supabase.co`)
   - **anon public** key

### 6. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as seguintes variáveis:

```env
# Configurações do Supabase
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Configurações do Firebase (já existentes)
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=seu-app-id
```

### 7. Configurar CORS (se necessário)

1. No painel do Supabase, vá para **Settings** > **API**
2. Em **CORS Origins**, adicione:
   - `http://localhost:3000` (desenvolvimento)
   - `https://seu-dominio.vercel.app` (produção)

## 📁 Estrutura de Arquivos

Os documentos serão organizados da seguinte forma:

```
feprj-2025/
├── {atletaId}/
│   ├── comprovante-residencia/
│   │   └── {timestamp}.pdf
│   ├── foto-3x4/
│   │   └── {timestamp}.jpg
│   └── certificado-adel/
│       └── {timestamp}.pdf
```

## 🔒 Segurança

- **Bucket privado**: Apenas usuários autenticados podem acessar
- **Validação de extensões**: Apenas arquivos permitidos
- **Limite de tamanho**: Máximo 20MB por arquivo
- **Controle de acesso**: Apenas usuários da equipe do atleta + admin

## 🧪 Testando

1. Reinicie o servidor de desenvolvimento
2. Acesse a página de atletas
3. Clique em "Documentos" em qualquer atleta
4. Teste o upload de um arquivo
5. Teste o download do arquivo

## ⚠️ Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket `feperj-2025` foi criado
- Verifique se o nome está correto no código

### Erro: "Access denied"
- Verifique se as políticas de segurança estão configuradas
- Verifique se as credenciais estão corretas

### Erro: "CORS error"
- Adicione o domínio nas configurações de CORS do Supabase
- Verifique se está usando HTTPS em produção

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Verifique os logs do Supabase
3. Consulte a documentação oficial do Supabase
