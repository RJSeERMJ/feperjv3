# 🔐 CONFIGURAÇÃO SEGURA - FIREBASE

## ✅ Solução: Variáveis de Ambiente no Vercel

### **Passo 1: Configurar no Vercel**

1. **Acesse o painel do Vercel**
   - Vá em [vercel.com](https://vercel.com)
   - Acesse seu projeto FEPERJ

2. **Configure as Variáveis de Ambiente**
   - Vá em **Settings** > **Environment Variables**
   - Clique em **Add New**
   - Adicione cada variável:

```
REACT_APP_FIREBASE_API_KEY=sua-api-key-real
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
REACT_APP_FIREBASE_APP_ID=seu-app-id
```

3. **Faça um novo deploy**
   - No painel do Vercel, clique em **Redeploy**

### **Passo 2: Testar o Sistema**

**Credenciais de Teste:**
- **Login**: `admin`
- **Senha**: `admin123`

**Credenciais Originais:**
- **Login**: `15119236790`
- **Senha**: `49912170`

## 🔧 Configuração Local (Opcional)

### **Para Desenvolvimento Local:**

1. **Crie um arquivo `.env.local` na raiz do projeto**
2. **Adicione suas credenciais:**
```
REACT_APP_FIREBASE_API_KEY=sua-api-key-real
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
REACT_APP_FIREBASE_APP_ID=seu-app-id
```

3. **O arquivo `.env.local` já está no .gitignore**
   - Não será enviado para o GitHub
   - Funciona apenas localmente

## 🚀 Como Testar

### **1. Teste no Vercel (Produção)**
1. Configure as variáveis no Vercel
2. Faça deploy
3. Teste o login

### **2. Teste Local (Desenvolvimento)**
```bash
npm start
```
Use as credenciais de teste

## 📋 Checklist de Segurança

- [ ] ✅ Credenciais configuradas no Vercel
- [ ] ✅ Arquivo .env.local criado (se necessário)
- [ ] ✅ .env.local no .gitignore
- [ ] ✅ Deploy realizado
- [ ] ✅ Login testado
- [ ] ✅ Nenhuma credencial no GitHub

## 🆘 Se Não Funcionar

### **1. Verificar Variáveis no Vercel**
- Vá em Settings > Environment Variables
- Certifique-se de que todas estão corretas

### **2. Verificar Console do Navegador**
- Abra F12 no navegador
- Vá na aba "Console"
- Procure por erros

### **3. Limpar Cache**
- No navegador, pressione Ctrl+Shift+R
- Ou limpe o cache do navegador

### **4. Usar Sistema Local**
Se o Firebase não estiver funcionando, use:
- **Login**: `admin`
- **Senha**: `admin123`

---
**🔒 Segurança**: Suas credenciais ficam seguras no Vercel e não são expostas no GitHub!
