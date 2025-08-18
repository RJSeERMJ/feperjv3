# 🔥 CONFIGURAÇÃO DO FIREBASE

## ❌ Problema Atual
O sistema não está fazendo login porque as configurações do Firebase estão com valores de exemplo.

## ✅ Solução Implementada
Criei um sistema de autenticação local como fallback, mas você deve configurar o Firebase para funcionalidade completa.

## 🔧 Como Configurar o Firebase

### 1. **Criar Projeto no Firebase**
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Criar projeto"
3. Digite o nome: `feperj-web`
4. Siga os passos de configuração

### 2. **Configurar Firestore Database**
1. No painel do Firebase, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste"
4. Selecione a localização mais próxima

### 3. **Configurar Storage**
1. No painel do Firebase, vá em "Storage"
2. Clique em "Começar"
3. Escolha "Iniciar no modo de teste"

### 4. **Obter Configurações**
1. No painel do Firebase, clique na engrenagem (⚙️)
2. Selecione "Configurações do projeto"
3. Role para baixo até "Seus aplicativos"
4. Clique em "Adicionar app" > "Web"
5. Copie as configurações

### 5. **Configurar no Vercel (Recomendado)**
1. No painel do Vercel, vá em "Settings" > "Environment Variables"
2. Adicione as seguintes variáveis:
   ```
   REACT_APP_FIREBASE_API_KEY=sua-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=feperj-web.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=feperj-web
   REACT_APP_FIREBASE_STORAGE_BUCKET=feperj-web.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

### 6. **Configurar Localmente (Alternativa)**
Edite o arquivo `src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "sua-api-key-real",
  authDomain: "feperj-web.firebaseapp.com",
  projectId: "feperj-web",
  storageBucket: "feperj-web.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 🔑 Credenciais de Teste

### Sistema Local (Funciona sem Firebase)
- **Login**: `admin`
- **Senha**: `admin123`

### Sistema Original
- **Login**: `15119236790`
- **Senha**: `49912170`

## 🚀 Como Testar

### 1. **Teste Local**
```bash
npm start
```
Use as credenciais de teste acima.

### 2. **Teste no Vercel**
1. Configure as variáveis de ambiente no Vercel
2. Faça deploy
3. Teste o login

## 📋 Checklist de Configuração

- [ ] ✅ Projeto Firebase criado
- [ ] ✅ Firestore Database configurado
- [ ] ✅ Storage configurado
- [ ] ✅ Configurações copiadas
- [ ] ✅ Variáveis de ambiente configuradas no Vercel
- [ ] ✅ Deploy realizado
- [ ] ✅ Login testado

## 🆘 Se Ainda Não Funcionar

### 1. **Verificar Console do Navegador**
- Abra F12 no navegador
- Vá na aba "Console"
- Procure por erros relacionados ao Firebase

### 2. **Verificar Variáveis de Ambiente**
- No Vercel, vá em "Settings" > "Environment Variables"
- Certifique-se de que todas as variáveis estão corretas

### 3. **Limpar Cache**
- No navegador, pressione Ctrl+Shift+R
- Ou limpe o cache do navegador

### 4. **Usar Sistema Local**
Se o Firebase não estiver funcionando, use:
- **Login**: `admin`
- **Senha**: `admin123`

---
**💡 Dica**: O sistema local funciona mesmo sem Firebase configurado!
