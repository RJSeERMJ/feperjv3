# 🚀 Teste do Upload com Vercel Functions

## ✅ **Sistema Atualizado para Upload Real**

O sistema foi completamente refatorado para usar **Vercel Functions** em vez de autenticação direta no navegador.

### **🔧 O que foi implementado:**

1. **✅ API `/api/upload.js`** - Upload real para Google Drive
2. **✅ API `/api/folders.js`** - Gerenciamento de pastas
3. **✅ API `/api/delete-file.js`** - Exclusão de arquivos
4. **✅ API `/api/download-url.js`** - URLs de download
5. **✅ GoogleDriveService atualizado** - Usa APIs do Vercel

## 🧪 **Como Testar**

### **Passo 1: Verificar se as APIs estão funcionando**

Abra o console do navegador (F12) e teste:

```javascript
// Testar conexão
fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'find',
    folderName: 'FEPERJ - Documentos',
    parentId: '1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh'
  })
}).then(r => r.json()).then(console.log);
```

### **Passo 2: Testar Upload**

1. **Acesse** a página de atletas
2. **Clique** em "Anexar Documentos" para um atleta
3. **Selecione** um arquivo (PDF, JPG, PNG)
4. **Observe** o progresso do upload

### **Passo 3: Verificar Logs**

No console, você deve ver:

```
🔧 Inicializando Google Drive Service com Vercel Functions...
✅ Google Drive Service inicializado com sucesso
🔍 Testando conexão com Google Drive...
✅ Conexão com Google Drive estabelecida
📁 Pasta do atleta criada: [ID_DA_PASTA]
📁 Pasta criada: Comprovante de Residência ([ID_SUBPASTA])
✅ Arquivo enviado para o Google Drive: [ID_DO_ARQUIVO]
```

## 🔍 **Verificar se Funcionou**

### **1. No Google Drive:**
- Acesse: [drive.google.com](https://drive.google.com)
- Procure pela pasta: "FEPERJ - Documentos"
- Verifique se foi criada a estrutura:
  ```
  FEPERJ - Documentos/
  ├── João Silva (ID123)/
  │   ├── Comprovante de Residência/
  │   │   └── comprovanteResidencia_[timestamp]_arquivo.pdf
  │   ├── Foto 3x4/
  │   ├── Identidade/
  │   └── Certificado ADEL/
  ```

### **2. No Console do Navegador:**
- **Sucesso**: Logs verdes com ✅
- **Erro**: Logs vermelhos com ❌

### **3. Na Interface:**
- **ProgressBar** mostra progresso
- **Toast** mostra mensagem de sucesso
- **Lista** de arquivos é atualizada

## 🚨 **Possíveis Problemas**

### **Problema 1: "Failed to fetch"**
- **Causa**: APIs do Vercel não estão funcionando
- **Solução**: Verificar se o projeto está no Vercel

### **Problema 2: "Access Denied"**
- **Causa**: Pasta não compartilhada com conta de serviço
- **Solução**: Compartilhar pasta com `feperj@feperj-2025-469423.iam.gserviceaccount.com`

### **Problema 3: "Invalid credentials"**
- **Causa**: Credenciais incorretas
- **Solução**: Verificar se as credenciais estão corretas nas APIs

## 📋 **Checklist de Teste**

- [ ] **APIs respondem** sem erro 404
- [ ] **Conexão estabelecida** com Google Drive
- [ ] **Pastas criadas** automaticamente
- [ ] **Upload funciona** sem erro
- [ ] **Arquivos aparecem** no Google Drive
- [ ] **Interface atualiza** após upload
- [ ] **Download funciona** corretamente
- [ ] **Delete funciona** corretamente

## 🎯 **Próximo Passo**

**Teste o upload agora e me diga:**

1. **Aparece algum erro** no console?
2. **Os arquivos aparecem** na pasta do Google Drive?
3. **A estrutura de pastas** foi criada?
4. **O progresso** é mostrado corretamente?

**Se tudo funcionar, o sistema está 100% operacional!** 🚀

**Se houver problemas, me envie os logs do console para eu ajudar!** 🔧
