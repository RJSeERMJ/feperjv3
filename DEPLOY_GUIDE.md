# 🚀 Guia de Deploy - Sistema de Federações

## 📋 Visão Geral

Este guia explica como fazer deploy do sistema completo para produção, incluindo frontend (Vercel) e backend (Railway/Render).

---

## 🎯 Arquitetura de Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Firebase      │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Firebase)    │
│                 │    │                 │    │                 │
│ - React App     │    │ - Node.js API  │    │ - Firestore     │
│ - Configs       │    │ - Multi-tenant  │    │ - Storage       │
│ - CDN Global    │    │ - Encrypted     │    │ - Auth          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 Deploy do Backend (Railway)

### **1. Preparação**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Inicializar projeto
railway init
```

### **2. Configuração do Railway**

```bash
# 4. Configurar variáveis de ambiente
railway variables set CONFIG_ENCRYPTION_KEY="sua-chave-super-secreta"
railway variables set JWT_SECRET="seu-jwt-secret"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"

# 5. Configurar CORS
railway variables set CORS_ORIGIN="https://seu-app.vercel.app"
```

### **3. Deploy**

```bash
# 6. Fazer deploy
railway up

# 7. Verificar logs
railway logs
```

### **4. Configurar Domínio**

```bash
# 8. Adicionar domínio customizado
railway domain add api.sistemafederacao.com
```

---

## 🌐 Deploy do Frontend (Vercel)

### **1. Preparação**

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Inicializar projeto
vercel init
```

### **2. Configuração do Vercel**

```bash
# 4. Configurar variáveis de ambiente
vercel env add REACT_APP_API_URL
# Valor: https://seu-backend.railway.app

# 5. Configurar build
vercel env add REACT_APP_NODE_ENV production
```

### **3. Deploy**

```bash
# 6. Fazer deploy
vercel --prod

# 7. Verificar deploy
vercel ls
```

### **4. Configurar Domínio**

```bash
# 8. Adicionar domínio customizado
vercel domains add sistemafederacao.com
```

---

## 🔐 Configuração de Segurança

### **1. Headers de Segurança**

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### **2. Rate Limiting**

```javascript
// backend/src/index.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.'
  }
});
```

### **3. CORS Configurado**

```javascript
// backend/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
```

---

## 🗄️ Configuração do Firebase

### **1. Criar Projeto Firebase**

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Nome: "Sistema Federações"
4. Habilite Firestore Database
5. Habilite Storage
6. Configure regras de segurança

### **2. Configurar Firestore**

```javascript
// Regras de segurança
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **3. Configurar Storage**

```javascript
// Regras de storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📊 Monitoramento e Logs

### **1. Railway Logs**

```bash
# Ver logs em tempo real
railway logs --follow

# Ver logs específicos
railway logs --service backend
```

### **2. Vercel Analytics**

```bash
# Instalar Vercel Analytics
npm install @vercel/analytics

# Configurar no App.tsx
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

### **3. Firebase Monitoring**

```javascript
// Configurar Firebase Performance
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

---

## 🔄 CI/CD Pipeline

### **1. GitHub Actions (Backend)**

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run build
      - uses: railway/cli@v2
        with:
          command: up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### **2. GitHub Actions (Frontend)**

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: ['src/**', 'public/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 Testes de Deploy

### **1. Testes Automatizados**

```bash
# Testar backend
curl -X GET https://seu-backend.railway.app/health

# Testar frontend
curl -X GET https://seu-app.vercel.app

# Testar API
curl -X POST https://seu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","senha":"senha123"}'
```

### **2. Testes de Carga**

```bash
# Instalar Artillery
npm install -g artillery

# Teste de carga
artillery quick --count 100 --num 10 https://seu-backend.railway.app/health
```

---

## 📈 Otimizações de Performance

### **1. Frontend**

```javascript
// Lazy loading de componentes
const LazyComponent = React.lazy(() => import('./Component'));

// Code splitting
const routes = [
  {
    path: '/atletas',
    component: React.lazy(() => import('./pages/AtletasPage'))
  }
];
```

### **2. Backend**

```javascript
// Cache de configurações
const tenantCache = new Map();

// Compressão
app.use(compression());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. CORS Errors**
```bash
# Verificar configuração CORS
echo $CORS_ORIGIN

# Configurar corretamente
railway variables set CORS_ORIGIN="https://seu-app.vercel.app"
```

#### **2. Database Connection**
```bash
# Verificar logs do Firebase
railway logs --service backend

# Verificar configuração
railway variables list
```

#### **3. Build Errors**
```bash
# Verificar logs de build
vercel logs

# Rebuild local
npm run build
```

### **Comandos Úteis**

```bash
# Railway
railway status
railway logs --follow
railway variables list
railway restart

# Vercel
vercel ls
vercel logs
vercel env ls
vercel redeploy
```

---

## 📞 Suporte

### **Documentação**
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)

### **Comunidade**
- [Railway Discord](https://discord.gg/railway)
- [Vercel Community](https://github.com/vercel/community)
- [Firebase Community](https://firebase.google.com/community)

---

## ✅ Checklist de Deploy

### **Backend**
- [ ] Configurar Railway
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy
- [ ] Testar health check
- [ ] Configurar domínio
- [ ] Configurar SSL

### **Frontend**
- [ ] Configurar Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy
- [ ] Testar aplicação
- [ ] Configurar domínio
- [ ] Configurar SSL

### **Firebase**
- [ ] Criar projeto
- [ ] Configurar Firestore
- [ ] Configurar Storage
- [ ] Configurar regras de segurança
- [ ] Testar conexão

### **Segurança**
- [ ] Configurar headers de segurança
- [ ] Configurar rate limiting
- [ ] Configurar CORS
- [ ] Testar autenticação
- [ ] Verificar logs

### **Monitoramento**
- [ ] Configurar logs
- [ ] Configurar métricas
- [ ] Configurar alertas
- [ ] Testar monitoramento

---

**🎯 Objetivo**: Deploy seguro, escalável e monitorado do sistema completo.

**💡 Dica**: Sempre teste em ambiente de desenvolvimento antes de fazer deploy em produção.

**🚀 Sucesso**: Sistema funcionando perfeitamente com alta disponibilidade e performance.
