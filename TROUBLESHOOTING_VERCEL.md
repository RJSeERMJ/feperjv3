# 🔧 TROUBLESHOOTING - DEPLOY VERCEL

## ❌ Problemas Comuns e Soluções

### 1. **Erro: "Build Failed"**
**Sintomas**: Build falha no Vercel mas funciona localmente

**Soluções**:
- ✅ Script de build personalizado criado (`vercel-build.js`)
- ✅ Variáveis de ambiente configuradas
- ✅ Dependências resolvidas com `--legacy-peer-deps`

### 2. **Erro: "Command npm run build exited with 1"**
**Causa**: Warnings do ESLint ou conflitos de dependências

**Solução**: Use o script personalizado:
```json
{
  "buildCommand": "npm run vercel-build"
}
```

### 3. **Erro: "Module not found"**
**Causa**: Dependências não instaladas corretamente

**Solução**: 
- Arquivo `.npmrc` com `legacy-peer-deps=true`
- Script força instalação com `--legacy-peer-deps`

## 🚀 Configuração Atual

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build",
        "buildCommand": "npm run vercel-build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "CI": "false",
    "NPM_CONFIG_LEGACY_PEER_DEPS": "true",
    "GENERATE_SOURCEMAP": "false",
    "SKIP_PREFLIGHT_CHECK": "true"
  }
}
```

### `package.json`
```json
{
  "scripts": {
    "vercel-build": "node vercel-build.js"
  }
}
```

## 🔍 Como Diagnosticar Problemas

### 1. **Teste Local**
```bash
npm run vercel-build
```

### 2. **Verifique os Logs**
- Acesse o painel do Vercel
- Vá em "Deployments" > "View Function Logs"
- Procure por erros específicos

### 3. **Verifique Configurações**
- Certifique-se de que todos os arquivos estão no GitHub
- Verifique se o repositório está conectado corretamente

## 🛠️ Soluções Rápidas

### Se o Deploy Falhar:

1. **Force um Novo Deploy**
   - No painel do Vercel, clique em "Redeploy"

2. **Verifique Variáveis de Ambiente**
   - Vá em Settings > Environment Variables
   - Adicione se necessário:
     - `CI=false`
     - `NPM_CONFIG_LEGACY_PEER_DEPS=true`

3. **Limpe Cache**
   - No painel do Vercel, vá em Settings > General
   - Clique em "Clear Build Cache"

## 📋 Checklist de Deploy

- [ ] ✅ Build funciona localmente (`npm run vercel-build`)
- [ ] ✅ Todos os arquivos estão no GitHub
- [ ] ✅ Repositório conectado no Vercel
- [ ] ✅ Configurações do `vercel.json` corretas
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Script de build personalizado funcionando

## 🆘 Se Nada Funcionar

1. **Crie um Novo Projeto no Vercel**
   - Delete o projeto atual
   - Importe novamente do GitHub

2. **Use CLI do Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **Contate Suporte**
   - Use o chat do Vercel
   - Inclua os logs de erro

---
**💡 Dica**: Sempre teste localmente antes de fazer deploy!
