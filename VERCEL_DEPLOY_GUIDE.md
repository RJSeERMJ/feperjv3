# 🚀 Guia de Deploy no Vercel - Sistema FEPERJ

## ⚠️ **IMPORTANTE: Problemas Identificados**

O sistema atual **NÃO funcionará** no Vercel sem as correções abaixo. Identifiquei problemas críticos que precisam ser resolvidos.

---

## 🔧 **Correções Necessárias**

### **1. Configuração do Vercel Corrigida**

✅ **vercel.json** já foi corrigido para:
- Usar `create-react-app` framework
- Build command correto
- Output directory correto
- Rotas SPA configuradas

### **2. Variáveis de Ambiente**

Configure as seguintes variáveis no Vercel:

```bash
# Firebase (mantém funcionamento atual)
REACT_APP_FIREBASE_API_KEY=AIzaSyBS9GFGozx63RbbvjddDCpLa2URaLAgDuw
REACT_APP_FIREBASE_AUTH_DOMAIN=feperj-2025.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=feperj-2025
REACT_APP_FIREBASE_STORAGE_BUCKET=feperj-2025.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=721836250240
REACT_APP_FIREBASE_APP_ID=1:721836250240:web:58130a417da4d0ebee0265
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ET67R4Q4Y4

# Supabase
REACT_APP_SUPABASE_URL=https://kamgocrdbdwjryvcavuo.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-supabase

# Segurança
REACT_APP_JWT_SECRET=feperj-super-secret-key-2025
REACT_APP_ENCRYPTION_KEY=feperj-encryption-key-2025
```

### **3. Build Scripts**

✅ **package.json** já tem os scripts corretos:
- `vercel-build`: Para deploy no Vercel
- `build:vercel`: Para build local
- `build:prod`: Para produção

---

## 🚀 **Processo de Deploy**

### **1. Preparação**

```bash
# 1. Verificar se está na branch main
git status

# 2. Fazer commit das alterações
git add .
git commit -m "Configuração para Vercel"
git push origin main
```

### **2. Deploy no Vercel**

#### **Opção A: Via Vercel CLI**
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel --prod
```

#### **Opção B: Via GitHub (Recomendado)**
1. Acesse [vercel.com](https://vercel.com)
2. Conecte com GitHub
3. Importe o repositório
4. Configure as variáveis de ambiente
5. Deploy automático

### **3. Configuração no Vercel Dashboard**

1. **Project Settings** → **Environment Variables**
2. Adicionar todas as variáveis listadas acima
3. **Deployments** → **Redeploy**

---

## ⚠️ **Problemas Conhecidos**

### **1. Sistema Atual vs Nova Arquitetura**

**PROBLEMA**: O sistema atual ainda usa Firebase diretamente, não a API REST que criamos.

**SOLUÇÃO**: 
- ✅ **Funcionará** com Firebase direto (sistema atual)
- 🔄 **Migração futura** para API REST (quando necessário)

### **2. Configurações Hardcoded**

**PROBLEMA**: Algumas configurações estão hardcoded no código.

**SOLUÇÃO**: 
- ✅ **Funcionará** com as configurações atuais
- 🔧 **Personalização** via variáveis de ambiente

### **3. Build Size**

**PROBLEMA**: O build pode ser grande devido às dependências.

**SOLUÇÃO**:
- ✅ **Vercel otimiza** automaticamente
- 📦 **Code splitting** já implementado

---

## 🧪 **Testes de Deploy**

### **1. Teste Local**

```bash
# 1. Build local
npm run build:vercel

# 2. Testar build
npx serve -s build

# 3. Verificar se funciona
# Acesse http://localhost:3000
```

### **2. Teste no Vercel**

```bash
# 1. Deploy preview
vercel

# 2. Testar preview
# Acesse a URL fornecida

# 3. Deploy produção
vercel --prod
```

### **3. Verificações**

- ✅ **Login funciona** (admin: 15119236790 / 49912170)
- ✅ **Firebase conecta** corretamente
- ✅ **Todas as páginas** carregam
- ✅ **Upload de arquivos** funciona
- ✅ **Responsivo** em mobile

---

## 📊 **Monitoramento**

### **1. Vercel Analytics**

```bash
# Instalar Vercel Analytics
npm install @vercel/analytics

# Adicionar ao App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### **2. Logs de Deploy**

```bash
# Ver logs de deploy
vercel logs

# Ver logs em tempo real
vercel logs --follow
```

---

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Build Falha**
```bash
# Verificar logs
vercel logs

# Rebuild local
npm run build:vercel

# Verificar dependências
npm install
```

#### **2. Variáveis de Ambiente**
```bash
# Verificar variáveis
vercel env ls

# Adicionar variável
vercel env add REACT_APP_FIREBASE_API_KEY
```

#### **3. Firebase Connection**
```bash
# Verificar configuração
# Acesse console do Firebase
# Verifique se o projeto está ativo
```

---

## ✅ **Checklist de Deploy**

### **Antes do Deploy**
- [ ] Configuração do `vercel.json` correta
- [ ] Variáveis de ambiente configuradas
- [ ] Build local funcionando
- [ ] Testes passando

### **Durante o Deploy**
- [ ] Deploy sem erros
- [ ] Build completo
- [ ] Variáveis carregadas
- [ ] Domínio configurado

### **Após o Deploy**
- [ ] Site acessível
- [ ] Login funcionando
- [ ] Firebase conectando
- [ ] Todas as funcionalidades OK

---

## 🎯 **Resultado Esperado**

Após seguir este guia:

✅ **Sistema funcionando** perfeitamente no Vercel
✅ **Deploy automático** via GitHub
✅ **Performance otimizada** com CDN global
✅ **SSL automático** e segurança
✅ **Monitoramento** e analytics

---

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs** no Vercel Dashboard
2. **Testar localmente** primeiro
3. **Verificar variáveis** de ambiente
4. **Consultar documentação** do Vercel

---

**🎯 Objetivo**: Deploy perfeito no Vercel com todas as funcionalidades funcionando.

**💡 Dica**: Sempre teste localmente antes de fazer deploy em produção.

**🚀 Sucesso**: Sistema funcionando perfeitamente no Vercel! 🎉
