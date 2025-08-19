# 🧪 Teste da Conexão com Google Drive

## ✅ **Modificações Implementadas**

### **1. Autenticação Híbrida**
- ✅ `api/upload.js` - Atualizado com fallback para credenciais hardcoded
- ✅ `api/download.js` - Atualizado com fallback para credenciais hardcoded
- ✅ `api/folders.js` - Já estava usando credenciais hardcoded
- ✅ `api/googleAuth.js` - Novo arquivo centralizado de autenticação

### **2. Melhorias de Debug**
- ✅ Logs detalhados de autenticação
- ✅ Tratamento de erros específicos
- ✅ API de teste melhorada

## 🧪 **Como Testar**

### **1. Teste da API de Teste**
```bash
# Acesse no navegador ou use curl
curl https://seu-dominio.vercel.app/api/test
```

**Resposta esperada:**
```json
{
  "message": "API de teste funcionando!",
  "method": "GET",
  "timestamp": "2025-01-XX...",
  "env": {
    "hasGoogleServiceKey": false,
    "hasGoogleDriveFolderId": false
  },
  "googleDrive": {
    "connected": true,
    "serviceAccount": "feperj@feperj-2025-469423.iam.gserviceaccount.com",
    "projectId": "feperj-2025-469423"
  }
}
```

### **2. Teste de Upload**
1. Acesse o sistema
2. Vá em um atleta
3. Tente fazer upload de um arquivo pequeno (PDF ou imagem)
4. Verifique o console do navegador

### **3. Logs para Verificar**

#### **No Console do Navegador:**
```
🔍 Testando conexão com Google Drive...
📡 Resposta da API de teste: {status: 200, statusText: "OK", ok: true}
✅ Resultado do teste: {googleDrive: {connected: true}}
✅ Conexão com Google Drive estabelecida
🚀 Iniciando upload para Google Drive: {...}
📤 Enviando arquivo para API...
📥 Resposta da API: {status: 200, statusText: "OK", ok: true}
✅ Arquivo enviado para o Google Drive: {...}
```

#### **No Vercel Functions Logs:**
```
🧪 Test API chamada - Método: GET
🔑 Usando credenciais hardcoded da FEPERJ
✅ Conexão com Google Drive estabelecida
🚀 Upload API chamada - Método: POST
🔑 Usando credenciais hardcoded da FEPERJ
📁 Processando upload...
☁️ Fazendo upload para Google Drive...
✅ Upload concluído: {...}
```

## 🚨 **Possíveis Problemas e Soluções**

### **1. Erro de Autenticação**
```
❌ Erro de autenticação com Google Drive. Verifique as credenciais da service account.
```

**Solução:**
- Verificar se a service account tem permissões no Google Drive
- Verificar se a API está ativada no Google Cloud Console

### **2. Erro de Pasta**
```
❌ Erro na pasta do Google Drive. Verifique o GOOGLE_DRIVE_FOLDER_ID e permissões.
```

**Solução:**
- Configurar `GOOGLE_DRIVE_FOLDER_ID` no Vercel
- Compartilhar pasta com a service account

### **3. Erro de API**
```
❌ Erro na API do Google Drive. Verifique se a API está ativada e funcionando.
```

**Solução:**
- Ativar Google Drive API no Google Cloud Console
- Verificar quotas e limites

## 🔧 **Configuração Adicional (Opcional)**

### **Configurar Variáveis de Ambiente**
```bash
# No Vercel Dashboard ou via CLI
vercel env add GOOGLE_DRIVE_FOLDER_ID
# Valor: ID da pasta no Google Drive
```

### **Compartilhar Pasta com Service Account**
1. Abra a pasta no Google Drive
2. Clique em "Compartilhar"
3. Adicione: `feperj@feperj-2025-469423.iam.gserviceaccount.com`
4. Permissão: `Editor`

## 📋 **Checklist de Teste**

- [ ] API de teste retorna `connected: true`
- [ ] Upload de arquivo funciona
- [ ] Arquivo aparece no Google Drive
- [ ] Logs mostram autenticação bem-sucedida
- [ ] Sem erros de permissão

## 🆘 **Se Ainda Não Funcionar**

1. **Verifique os logs** no Vercel
2. **Teste a API** de teste primeiro
3. **Verifique permissões** no Google Drive
4. **Teste com arquivo pequeno** (< 1MB)
5. **Verifique se a API está ativada** no Google Cloud Console

---

**A autenticação deve estar funcionando agora! 🚀**
