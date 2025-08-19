# 🚀 Configuração Vercel - Google Drive

## ✅ Sistema Configurado para Desenvolvimento

O sistema foi configurado para funcionar em desenvolvimento com simulação de upload. Para produção no Vercel, você precisa configurar as variáveis de ambiente.

## 🔧 Configuração no Vercel

### Passo 1: Acessar Painel do Vercel

1. **Acesse**: [vercel.com](https://vercel.com)
2. **Faça login** na sua conta
3. **Selecione seu projeto** FEPERJ

### Passo 2: Configurar Variáveis de Ambiente

1. **Vá para**: Settings → Environment Variables
2. **Adicione as seguintes variáveis**:

```
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh
```

### Passo 3: Configurar Domínios Autorizados

1. **Vá para**: Google Cloud Console → APIs & Services → Credentials
2. **Clique no OAuth 2.0 Client ID**
3. **Adicione seu domínio do Vercel** em "Authorized JavaScript origins":

```
https://seu-app.vercel.app
https://seu-app.vercel.app/
```

### Passo 4: Deploy

1. **Faça commit** das alterações
2. **Push para o GitHub**
3. **Vercel fará deploy automático**

## 🔍 Status Atual

### ✅ Funcionando em Desenvolvimento:
- ✅ **Conexão com Google Drive** testada
- ✅ **Upload simulado** funcionando
- ✅ **Interface** completa
- ✅ **Logs detalhados** no console

### ⚠️ Para Produção no Vercel:
- ⚠️ **Necessário configurar** variáveis de ambiente
- ⚠️ **Necessário configurar** domínios autorizados
- ⚠️ **Upload real** precisa de autenticação OAuth 2.0

## 📋 Checklist para Vercel

- [ ] **Variável de ambiente** `REACT_APP_GOOGLE_DRIVE_FOLDER_ID` configurada
- [ ] **Domínio do Vercel** adicionado no Google Cloud Console
- [ ] **Deploy realizado** com sucesso
- [ ] **Teste de upload** funcionando

## 🔧 Solução para Upload Real

Para upload real funcionar no Vercel, você tem duas opções:

### Opção 1: OAuth 2.0 (Recomendado)
- Configure OAuth 2.0 no Google Cloud Console
- Adicione domínios autorizados
- Implemente autenticação interativa

### Opção 2: Conta de Serviço (Mais Complexo)
- Configure conta de serviço
- Implemente autenticação JWT
- Configure permissões da pasta

## 🎯 Próximos Passos

1. **Configure as variáveis** no Vercel
2. **Teste o deploy**
3. **Me informe se funcionou**
4. **Implementaremos upload real** se necessário

## 📞 Suporte

Se houver problemas:
1. Verifique os logs no Vercel
2. Confirme as variáveis de ambiente
3. Teste a conexão com Google Drive
