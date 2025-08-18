# 🚨 CONFIGURAR CORS AGORA - URGENTE

## ✅ Problema Confirmado

**Erro CORS no Vercel:**
- `o?name=test-connection.txt` - Teste de conexão falhando
- `o?name=atletas%2FdE14cdjDwKaCZ3YclLrc%2Fcomprovant...` - Upload falhando
- `channel?gsessionid=...` - Canal de comunicação bloqueado

## 🔧 SOLUÇÃO IMEDIATA

### **Opção 1: Google Cloud Console (MAIS RÁPIDO)**

1. **Acesse:** [Google Cloud Console](https://console.cloud.google.com)
2. **Selecione projeto:** `feperj-2025`
3. **Vá para:** Cloud Storage → Buckets
4. **Clique no bucket:** `feperj-2025.firebasestorage.app`
5. **Vá para:** Permissions → CORS
6. **Adicione configuração:**

```json
[
  {
    "origin": ["https://feperjv3-uany.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

### **Opção 2: Firebase Console**

1. **Acesse:** [Firebase Console](https://console.firebase.google.com)
2. **Projeto:** `feperj-2025`
3. **Storage** → **Rules**
4. **Verifique se as regras estão corretas:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Opção 3: Google Cloud SDK (Windows)**

1. **Baixar:** [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. **Instalar** no Windows
3. **Executar comandos:**

```bash
gcloud auth login
gsutil cors set cors.json gs://feperj-2025.firebasestorage.app
```

## 🚀 **Passo a Passo Detalhado - Google Cloud Console**

### **1. Acessar Google Cloud Console**
- Vá para: https://console.cloud.google.com
- Faça login com a conta Google
- Selecione o projeto `feperj-2025`

### **2. Navegar para Cloud Storage**
- Menu lateral → **Cloud Storage** → **Buckets**
- Clique no bucket: `feperj-2025.firebasestorage.app`

### **3. Configurar CORS**
- Clique na aba **"Permissions"**
- Procure por **"CORS"** ou **"Cross-origin resource sharing"**
- Clique em **"Add CORS rule"** ou **"Edit CORS"**

### **4. Adicionar Configuração**
Cole esta configuração:

```json
[
  {
    "origin": ["https://feperjv3-uany.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

### **5. Salvar Configuração**
- Clique em **"Save"** ou **"Update"**
- Aguarde alguns minutos para propagar

## 🔍 **Verificação**

### **1. Teste Imediato**
- Após configurar CORS, aguarde 2-3 minutos
- Teste upload no Vercel novamente
- Verifique console do navegador

### **2. Logs Esperados (Após CORS)**
```
✅ Configurações do Firebase carregadas com sucesso!
Testando conexão com Firebase Storage...
🔐 Tentando autenticação anônima no Firebase...
✅ Autenticação anônima realizada: abc123...
✅ Usuário autenticado no Firebase: abc123...
✅ Conexão com Firebase Storage OK
Iniciando upload: {fileName: "documento.pdf", ...}
Arquivo validado com sucesso
Referência do storage criada: atletas/123/comprovanteResidencia/...
Iniciando upload para Firebase Storage...
Upload concluído, snapshot: {...}
URL de download obtida: https://...
Upload finalizado com sucesso: {...}
```

## 🚨 **Se Não Conseguir Acessar Google Cloud Console**

### **Alternativa: Contatar Suporte**
1. **Firebase Support:** https://firebase.google.com/support
2. **Google Cloud Support:** https://cloud.google.com/support
3. **Explicar:** "Preciso configurar CORS para Firebase Storage"

### **Informações para Suporte:**
- **Projeto:** feperj-2025
- **Bucket:** feperj-2025.firebasestorage.app
- **Domínio:** https://feperjv3-uany.vercel.app
- **Erro:** CORS policy blocking requests

## 🎯 **Próximos Passos**

### **Imediato:**
1. **Acesse Google Cloud Console**
2. **Configure CORS** no bucket
3. **Teste upload** no Vercel

### **Após Configurar CORS:**
1. **Teste upload** de arquivo
2. **Verifique logs** no console
3. **Confirme** que arquivos aparecem no Firebase Storage

---

**Status**: 🚨 **URGENTE - CONFIGURAR CORS**
**Problema**: 🌐 **CORS bloqueando upload no Vercel**
**Solução**: ⚙️ **Configurar CORS no Google Cloud Console**
**Próximo**: 📋 **Acessar Google Cloud Console e configurar**
