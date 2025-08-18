# 🌐 Solução CORS - Passo a Passo Simples

## ✅ Problema Identificado

**Erro CORS no Firebase Storage:**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/feperj-2025.firebasestorage.app/o' 
from origin 'https://feperjv3-uany.vercel.app' has been blocked by CORS policy
```

## 🔧 Solução: Configurar CORS no Firebase Console

### **Opção 1: Firebase Console (Mais Fácil)**

1. **Acesse o Firebase Console:**
   - Vá para [Firebase Console](https://console.firebase.google.com)
   - Selecione o projeto **"feperj-2025"**

2. **Vá para Storage:**
   - Menu lateral → **Storage**
   - Clique na aba **"Rules"**

3. **Verifique as regras atuais:**
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

4. **Se as regras estiverem corretas, o problema é CORS**

### **Opção 2: Google Cloud Console**

1. **Acesse Google Cloud Console:**
   - Vá para [Google Cloud Console](https://console.cloud.google.com)
   - Selecione o projeto **"feperj-2025"**

2. **Vá para Cloud Storage:**
   - Menu lateral → **Cloud Storage** → **Buckets**
   - Clique no bucket **"feperj-2025.firebasestorage.app"**

3. **Configure CORS:**
   - Clique em **"Permissions"**
   - Procure por **"CORS"** ou **"Cross-origin resource sharing"**
   - Adicione a configuração CORS

### **Opção 3: Instalar Google Cloud SDK (Windows)**

1. **Baixar Google Cloud SDK:**
   - Vá para: https://cloud.google.com/sdk/docs/install
   - Baixe para Windows
   - Instale o SDK

2. **Após instalar, execute:**
   ```bash
   gcloud auth login
   gsutil cors set cors.json gs://feperj-2025.firebasestorage.app
   ```

## 🚀 **Solução Temporária: Teste Local**

Para testar se o upload funciona localmente:

1. **Execute o projeto localmente:**
   ```bash
   npm start
   ```

2. **Teste o upload em localhost:3000**
   - O CORS geralmente não é problema em desenvolvimento local

3. **Se funcionar localmente, confirma que é problema CORS**

## 🔍 **Verificação Rápida**

### **1. Teste Local:**
- Execute `npm start`
- Acesse `http://localhost:3000`
- Teste upload de arquivo
- Se funcionar, confirma que é CORS

### **2. Verifique Firebase Console:**
- Storage → Files
- Veja se há arquivos sendo enviados

### **3. Logs do Console:**
- Abra F12 no navegador
- Vá para Console
- Procure por erros CORS

## 🎯 **Próximos Passos**

### **Imediato:**
1. **Teste localmente** para confirmar que é CORS
2. **Acesse Firebase Console** para verificar configurações
3. **Configure CORS** usando uma das opções acima

### **Após Configurar CORS:**
1. **Teste upload** no ambiente de produção
2. **Verifique logs** no console
3. **Confirme** que arquivos aparecem no Firebase Storage

## 📋 **Configuração CORS Necessária**

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

---

**Status**: 🔧 **SOLUÇÃO IDENTIFICADA**
**Problema**: 🌐 **CORS - Cross-Origin Resource Sharing**
**Solução**: ⚙️ **Configurar CORS no Firebase/Google Cloud**
**Próximo**: 📋 **Aplicar configuração CORS**
