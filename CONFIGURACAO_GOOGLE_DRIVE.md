# 🔧 Configuração Google Drive - Resolução de Erros

## ❌ Erro de Autorização - Solução Completa

### Passo 1: Configurar Google Cloud Console

1. **Acesse**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Selecione seu projeto**: `feperj-2025` (ou o projeto que você criou)
3. **Vá para**: APIs & Services → Credentials
4. **Clique no OAuth 2.0 Client ID** que você criou

### Passo 2: Configurar Domínios Autorizados

Na seção **"Authorized JavaScript origins"**, adicione:

```
http://localhost
http://localhost:3000
http://localhost:3001
http://127.0.0.1
http://127.0.0.1:3000
http://127.0.0.1:3001
```

### Passo 3: Configurar URIs de Redirecionamento

Na seção **"Authorized redirect URIs"**, adicione:

```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
http://127.0.0.1:3001
```

### Passo 4: Verificar APIs Habilitadas

Certifique-se de que estas APIs estão habilitadas:
- ✅ Google Drive API
- ✅ Google+ API (se disponível)

### Passo 5: Verificar Scopes

O sistema usa este scope:
```
https://www.googleapis.com/auth/drive.file
```

Este scope permite:
- ✅ Criar/editar arquivos criados pelo app
- ✅ Não acessa arquivos existentes do usuário
- ✅ Mais seguro para aplicações

### Passo 6: Testar Configuração

1. **Limpe cache do navegador**
2. **Reinicie o servidor**: `npm start`
3. **Acesse**: `http://localhost:3000`
4. **Teste upload** de documento

### 🔍 Debug - Logs Detalhados

O sistema agora mostra logs detalhados no console:

```
🔧 Inicializando Google Drive Service...
🔐 Iniciando autenticação Google Drive...
✅ Instância de autenticação obtida
🔑 Usuário não autenticado, solicitando login...
✅ Usuário autenticado: [Nome do Usuário]
✅ Token de acesso obtido
✅ Usando pasta principal: 1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh
✅ Google Drive Service inicializado com sucesso
```

### ❌ Erros Comuns e Soluções

#### Erro: "popup_closed_by_user"
- **Causa**: Usuário fechou a janela de login
- **Solução**: Tente novamente, não feche a janela

#### Erro: "access_denied"
- **Causa**: Usuário negou permissões
- **Solução**: Clique em "Permitir" na janela de autorização

#### Erro: "redirect_uri_mismatch"
- **Causa**: Domínio não autorizado
- **Solução**: Adicione o domínio no Google Cloud Console

#### Erro: "invalid_client"
- **Causa**: Client ID incorreto
- **Solução**: Verifique o CLIENT_ID no .env.local

### 🚀 Para Deploy no Vercel

Adicione estas variáveis no Vercel:
- `REACT_APP_GOOGLE_DRIVE_API_KEY`
- `REACT_APP_GOOGLE_DRIVE_CLIENT_ID`
- `REACT_APP_GOOGLE_DRIVE_FOLDER_ID`

E adicione seu domínio do Vercel nos domínios autorizados:
```
https://seu-app.vercel.app
```

### 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs no console do navegador (F12)
2. Confirme que as APIs estão habilitadas
3. Verifique se o projeto está ativo no Google Cloud Console
