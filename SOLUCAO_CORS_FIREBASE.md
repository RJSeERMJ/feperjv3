# 🌐 Solução do Problema CORS - Firebase Storage

## ✅ Problema Identificado

**Erro CORS (Cross-Origin Resource Sharing):**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/feperj-2025.firebasestorage.app/o' 
from origin 'https://feperjv3-uany.vercel.app' has been blocked by CORS policy
```

## 🔧 Solução: Configurar CORS no Firebase Storage

### **1. Instalar Firebase CLI (se não tiver)**
```bash
npm install -g firebase-tools
```

### **2. Fazer Login no Firebase**
```bash
firebase login
```

### **3. Criar Arquivo de Configuração CORS**

Crie um arquivo chamado `cors.json` na raiz do projeto:

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

### **4. Aplicar Configuração CORS**
```bash
gsutil cors set cors.json gs://feperj-2025.firebasestorage.app
```

## 🚀 **Passo a Passo Detalhado**

### **Passo 1: Verificar se tem Firebase CLI**
```bash
firebase --version
```

Se não tiver, instale:
```bash
npm install -g firebase-tools
```

### **Passo 2: Fazer Login**
```bash
firebase login
```

### **Passo 3: Criar Arquivo CORS**
Crie o arquivo `cors.json` na raiz do projeto com o conteúdo acima.

### **Passo 4: Aplicar CORS**
```bash
gsutil cors set cors.json gs://feperj-2025.firebasestorage.app
```

### **Passo 5: Verificar Configuração**
```bash
gsutil cors get gs://feperj-2025.firebasestorage.app
```

## 🔍 **Alternativa: Usando Firebase Console**

Se não conseguir usar o CLI, você pode:

### **1. Acessar Firebase Console**
- Vá para [Firebase Console](https://console.firebase.google.com)
- Selecione o projeto "feperj-2025"
- Vá para **Storage** → **Rules**

### **2. Verificar Regras Atuais**
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

### **3. Atualizar Regras (se necessário)**
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

## 🛠️ **Solução Rápida via Terminal**

Execute estes comandos em sequência:

```bash
# 1. Instalar Firebase CLI (se necessário)
npm install -g firebase-tools

# 2. Fazer login
firebase login

# 3. Criar arquivo CORS
echo '[
  {
    "origin": ["https://feperjv3-uany.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]' > cors.json

# 4. Aplicar CORS
gsutil cors set cors.json gs://feperj-2025.firebasestorage.app

# 5. Verificar
gsutil cors get gs://feperj-2025.firebasestorage.app
```

## 📋 **Verificação**

### **1. Teste Local**
- Execute o comando CORS
- Teste upload no ambiente local

### **2. Teste Produção**
- Deploy no Vercel
- Teste upload no ambiente de produção

### **3. Logs Esperados**
Após aplicar CORS, você deve ver:
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

## 🚨 **Possíveis Problemas**

### **1. Erro: "gsutil not found"**
**Solução:** Instalar Google Cloud SDK
```bash
# Windows
# Baixar e instalar: https://cloud.google.com/sdk/docs/install

# Mac
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

### **2. Erro: "Permission denied"**
**Solução:** Verificar permissões do projeto
```bash
firebase projects:list
firebase use feperj-2025
```

### **3. Erro: "Bucket not found"**
**Solução:** Verificar nome do bucket
```bash
firebase projects:list
# Verificar o nome correto do bucket no Firebase Console
```

## 🎯 **Próximos Passos**

### **1. Aplicar CORS**
- Execute os comandos acima
- Verifique se a configuração foi aplicada

### **2. Testar Upload**
- Teste no ambiente local
- Teste no ambiente de produção

### **3. Verificar Firebase Console**
- Acesse Storage → Files
- Confirme que os arquivos estão sendo enviados

---

**Status**: 🔧 **SOLUÇÃO IDENTIFICADA**
**Problema**: 🌐 **CORS - Cross-Origin Resource Sharing**
**Solução**: ⚙️ **Configurar CORS no Firebase Storage**
**Próximo**: 📋 **Executar comandos de configuração**
