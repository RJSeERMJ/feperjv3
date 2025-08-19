# 🔧 Configuração Conta de Serviço Google Drive

## ✅ Sistema Reconfigurado com Conta de Serviço

O sistema foi reconfigurado para usar autenticação por conta de serviço, que é mais estável e não requer interação do usuário.

### 📋 Informações da Conta de Serviço:

- **Email**: `feperj@feperj-2025-469423.iam.gserviceaccount.com`
- **Project ID**: `feperj-2025-469423`
- **Pasta Destino**: `1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh`

## 🔐 Passo 1: Compartilhar Pasta do Google Drive

**IMPORTANTE**: A conta de serviço precisa ter acesso à pasta!

1. **Acesse o Google Drive**
2. **Localize a pasta**: "FEPERJ - Documentos" (ID: 1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh)
3. **Clique com botão direito** na pasta
4. **Selecione "Compartilhar"**
5. **Adicione o email**: `feperj@feperj-2025-469423.iam.gserviceaccount.com`
6. **Defina permissão**: "Editor"
7. **Clique em "Enviar"**

## 🔧 Passo 2: Verificar Configuração

O sistema agora usa:
- ✅ **Autenticação automática** (sem popup)
- ✅ **Token JWT** para acesso
- ✅ **Renovação automática** de token
- ✅ **Sem necessidade de OAuth 2.0** interativo

## 🚀 Passo 3: Testar Sistema

1. **Inicie o servidor**: `npm start`
2. **Acesse**: `http://localhost:3000`
3. **Faça login** no sistema
4. **Vá para Atletas** → **Anexar Documentos**
5. **Teste upload** de arquivo

## 📁 Estrutura que será criada:

```
FEPERJ - Documentos/
├── João Silva (ID123)/
│   ├── Comprovante de Residência/
│   ├── Foto 3x4/
│   ├── Identidade/
│   └── Certificado ADEL/
└── Maria Santos (ID456)/
    ├── Comprovante de Residência/
    ├── Foto 3x4/
    ├── Identidade/
    └── Certificado ADEL/
```

## 🔍 Logs de Debug:

O sistema mostra logs detalhados no console:

```
🔧 Inicializando Google Drive Service com conta de serviço...
🔐 Gerando novo token de acesso...
✅ Token de acesso obtido com sucesso
✅ Google Drive Service inicializado com sucesso
📁 Pasta do atleta criada: [ID]
📁 Pasta do atleta encontrada: [ID]
```

## ❌ Possíveis Erros:

### Erro: "Access Denied"
- **Causa**: Pasta não compartilhada com a conta de serviço
- **Solução**: Compartilhe a pasta com `feperj@feperj-2025-469423.iam.gserviceaccount.com`

### Erro: "Invalid JWT"
- **Causa**: Problema na assinatura JWT
- **Solução**: Verifique se as credenciais estão corretas

### Erro: "Token Expired"
- **Causa**: Token expirou
- **Solução**: Sistema renova automaticamente

## 🚀 Para Deploy no Vercel:

1. **Adicione variável**: `REACT_APP_GOOGLE_DRIVE_FOLDER_ID`
2. **Configure pasta** no Google Drive
3. **Deploy automático**

## ✅ Vantagens da Conta de Serviço:

- ✅ **Sem popup de login** para usuários
- ✅ **Funciona em produção** sem problemas
- ✅ **Mais estável** e confiável
- ✅ **Autenticação automática**
- ✅ **Sem necessidade de configurar domínios** no Google Cloud Console
