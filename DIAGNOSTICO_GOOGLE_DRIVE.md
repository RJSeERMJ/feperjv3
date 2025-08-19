# 🔍 Diagnóstico do Problema - Google Drive

## 🚨 **Problema Atual**
Você está enfrentando erro de conexão com o Google Drive mesmo após as correções implementadas.

## 🧪 **Testes para Identificar o Problema**

### **1. Teste da API de Teste Principal**
```bash
curl https://seu-dominio.vercel.app/api/test
```

**Verificar:**
- Se retorna JSON (não HTML)
- Se `googleDrive.connected` é `true` ou `false`
- Se há erros específicos na resposta

### **2. Teste Simples (Novo)**
```bash
curl https://seu-dominio.vercel.app/api/test-simple
```

**Este teste é mais direto e mostra:**
- Se a autenticação básica funciona
- Qual erro específico está ocorrendo
- Detalhes completos do erro

### **3. Verificar Logs no Vercel**
```bash
vercel logs --follow
```

**Procurar por:**
- Logs de autenticação
- Erros específicos do Google Drive
- Códigos de erro HTTP

## 🔍 **Possíveis Causas e Soluções**

### **1. Problema de Autenticação**
**Sintomas:**
- Erro 401 (Unauthorized)
- Mensagem: "authentication" ou "unauthorized"

**Soluções:**
- Verificar se a service account existe
- Verificar se a chave privada está correta
- Verificar se a API está ativada

### **2. Problema de Permissões**
**Sintomas:**
- Erro 403 (Forbidden)
- Mensagem: "permission" ou "access"

**Soluções:**
- Verificar se a service account tem permissões no Google Drive
- Compartilhar pasta com a service account

### **3. Problema de API**
**Sintomas:**
- Erro 404 (Not Found)
- Mensagem: "API not enabled"

**Soluções:**
- Ativar Google Drive API no Google Cloud Console
- Verificar se o projeto está correto

### **4. Problema de Quota**
**Sintomas:**
- Erro 429 (Too Many Requests)
- Mensagem: "quota" ou "rate limit"

**Soluções:**
- Aguardar reset da quota
- Verificar limites do projeto

## 🔧 **Passos de Diagnóstico**

### **Passo 1: Verificar Service Account**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "IAM & Admin" > "Service Accounts"
3. Verifique se `feperj@feperj-2025-469423.iam.gserviceaccount.com` existe
4. Verifique se tem a role "Editor" ou "Owner"

### **Passo 2: Verificar API**
1. No Google Cloud Console, vá em "APIs & Services" > "Library"
2. Procure por "Google Drive API"
3. Verifique se está ativada
4. Se não estiver, clique em "Enable"

### **Passo 3: Verificar Permissões no Drive**
1. Abra o Google Drive
2. Crie uma pasta de teste
3. Compartilhe com: `feperj@feperj-2025-469423.iam.gserviceaccount.com`
4. Permissão: `Editor`

### **Passo 4: Testar Credenciais**
1. Baixe o arquivo JSON da service account
2. Verifique se as credenciais no código correspondem
3. Teste localmente se possível

## 📋 **Checklist de Verificação**

- [ ] Service account existe no Google Cloud Console
- [ ] Service account tem role "Editor" ou "Owner"
- [ ] Google Drive API está ativada
- [ ] Credenciais no código estão corretas
- [ ] Pasta compartilhada com service account
- [ ] API de teste retorna JSON (não HTML)
- [ ] Logs mostram detalhes do erro

## 🆘 **Comandos para Debug**

### **Verificar Variáveis de Ambiente**
```bash
vercel env ls
```

### **Ver Logs em Tempo Real**
```bash
vercel logs --follow
```

### **Deploy Forçado**
```bash
vercel --prod --force
```

### **Testar APIs**
```bash
# Teste principal
curl https://seu-dominio.vercel.app/api/test

# Teste simples
curl https://seu-dominio.vercel.app/api/test-simple
```

## 📞 **Próximos Passos**

1. **Execute os testes** acima
2. **Verifique os logs** no Vercel
3. **Teste a service account** no Google Cloud Console
4. **Reporte o erro específico** que aparece

**Com essas informações, posso identificar e corrigir o problema específico!** 🔧
