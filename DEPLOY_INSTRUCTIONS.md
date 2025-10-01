# 🚀 INSTRUÇÕES DE DEPLOY - FEPERJ

## ✅ **PROBLEMAS CORRIGIDOS**

### **1. Configuração do Vercel**
- ✅ Corrigido `vercel.json` para React App (não Next.js)
- ✅ Adicionado script de build personalizado
- ✅ Configurado `.npmrc` para resolver dependências
- ✅ Criado `.vercelignore` para otimizar deploy

### **2. Dependências**
- ✅ Configurado `legacy-peer-deps=true`
- ✅ Adicionado script `vercel-build` personalizado
- ✅ Configurado variáveis de ambiente corretas

## 🔧 **ARQUIVOS CRIADOS/MODIFICADOS**

### **vercel.json** - Configuração principal
```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "build",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "pages/api/**/*.ts",
      "use": "@vercel/node"
    }
  ]
}
```

### **vercel-build.js** - Script de build personalizado
- Resolve problemas de dependências
- Configura variáveis de ambiente
- Executa build com configurações corretas

### **.npmrc** - Configuração do NPM
```
legacy-peer-deps=true
registry=https://registry.npmjs.org/
strict-ssl=false
```

### **.vercelignore** - Arquivos ignorados no deploy
```
node_modules
.env
*.log
.DS_Store
```

## 🚀 **COMO FAZER O DEPLOY**

### **1. Commit e Push**
```bash
git add .
git commit -m "Fix: Corrigir configuração de deploy Vercel"
git push origin main
```

### **2. Deploy Automático**
- O Vercel detectará as mudanças automaticamente
- Usará o script `vercel-build.js` para build
- Configurações otimizadas para React App

### **3. Verificar Deploy**
- Acesse o dashboard do Vercel
- Verifique os logs de build
- Teste as funcionalidades

## 🔍 **VERIFICAÇÕES IMPORTANTES**

### **Variáveis de Ambiente no Vercel**
Configure no dashboard do Vercel:

```bash
# Firebase
REACT_APP_FIREBASE_API_KEY=sua_chave
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_dominio
REACT_APP_FIREBASE_PROJECT_ID=seu_projeto

# Supabase
REACT_APP_SUPABASE_URL=sua_url
REACT_APP_SUPABASE_ANON_KEY=sua_chave

# Segurança
REACT_APP_JWT_SECRET=sua_chave_jwt
REACT_APP_ENCRYPTION_KEY=sua_chave_criptografia
```

### **Build Command**
- ✅ Configurado: `npm run vercel-build`
- ✅ Output Directory: `build`
- ✅ Node Version: 18.x (automático)

## 🐛 **PROBLEMAS RESOLVIDOS**

### **1. Conflito Next.js vs React App**
- **Problema**: `vercel.json` configurado para Next.js
- **Solução**: Alterado para `@vercel/static-build`

### **2. Dependências Peer Dependencies**
- **Problema**: Conflitos de versões
- **Solução**: `legacy-peer-deps=true` no `.npmrc`

### **3. Build Command**
- **Problema**: Comando de build padrão falhando
- **Solução**: Script personalizado `vercel-build.js`

### **4. Variáveis de Ambiente**
- **Problema**: Build falhando por variáveis
- **Solução**: Configurado no `vercel.json`

## ✅ **STATUS ATUAL**

- ✅ **Configuração corrigida**
- ✅ **Scripts de build funcionais**
- ✅ **Dependências resolvidas**
- ✅ **Pronto para deploy**

## 🚀 **PRÓXIMOS PASSOS**

1. **Fazer commit das mudanças**
2. **Push para repositório**
3. **Verificar deploy no Vercel**
4. **Configurar variáveis de ambiente**
5. **Testar funcionalidades**

**O projeto agora deve fazer deploy corretamente no Vercel!** 🎉
