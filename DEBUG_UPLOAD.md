# 🔧 Debug do Upload - Google Drive

## 🚨 Problemas Identificados

### 1. **Erro 405 (Resolvido)**
- Configuração do Vercel incorreta
- API routes não estavam configuradas

### 2. **Erro 404 (Atual)**
- API não está sendo encontrada
- Vercel está servindo `index.html` em vez das API routes
- Erro de parsing JSON (recebendo HTML)

## ✅ Soluções Implementadas

### 1. **Corrigido `vercel.json`**
- Reordenado builds (API primeiro)
- Adicionado `rewrites` para API routes
- Removido conflitos de roteamento

### 2. **Criado `vercel-alt.json`**
- Configuração alternativa caso a principal não funcione

### 3. **Melhorado `googleDriveService.ts`**
- Teste de conexão mais robusto
- Verificação de Content-Type
- Logs detalhados para debug

## 🧪 Como Testar

### 1. **Teste da API (Importante!)**
```bash
# Teste GET
curl -H "Accept: application/json" https://seu-dominio.vercel.app/api/test

# Verificar se retorna JSON ou HTML
curl -I https://seu-dominio.vercel.app/api/test
```

### 2. **Verificar no Navegador**
1. Abra o console (F12)
2. Digite: `fetch('/api/test').then(r => r.text()).then(console.log)`
3. Verifique se retorna JSON ou HTML

### 3. **Verificar Variáveis de Ambiente**
A API de teste retorna se as variáveis estão configuradas:
- `GOOGLE_SERVICE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`

## 🔍 Logs para Verificar

### No Console do Navegador:
```
🔍 Testando conexão com Google Drive...
📡 Resposta da API de teste: {status: 404, statusText: "Not Found", ok: false}
❌ API não encontrada (404). Verifique se as API routes estão configuradas corretamente no Vercel.
```

### Se a API estiver funcionando:
```
🔍 Testando conexão com Google Drive...
📡 Resposta da API de teste: {status: 200, statusText: "OK", ok: true, contentType: "application/json"}
✅ Resultado do teste: {message: "API de teste funcionando!", env: {...}}
✅ Conexão com Google Drive estabelecida
```

## 🚨 Possíveis Problemas

### 1. **Configuração do Vercel**
- API routes não estão sendo buildadas
- Roteamento incorreto
- Conflito entre builds

### 2. **Deploy**
- Deploy não incluiu as API routes
- Cache do Vercel
- Build falhou

### 3. **Variáveis de Ambiente**
- `GOOGLE_SERVICE_KEY` não configurada
- `GOOGLE_DRIVE_FOLDER_ID` não configurada

## 🔧 Soluções

### 1. **Forçar Novo Deploy**
```bash
# Deploy forçado
vercel --prod --force

# Ou via GitHub (push forçado)
git add .
git commit -m "Fix API routes configuration"
git push --force
```

### 2. **Verificar Build**
```bash
# Ver logs do build
vercel logs

# Ver se as API routes foram buildadas
vercel ls
```

### 3. **Testar Configuração Alternativa**
Se a configuração principal não funcionar:
```bash
# Renomear arquivos
mv vercel.json vercel-backup.json
mv vercel-alt.json vercel.json

# Fazer novo deploy
vercel --prod
```

### 4. **Verificar Variáveis de Ambiente**
```bash
# Listar variáveis
vercel env ls

# Adicionar se necessário
vercel env add GOOGLE_SERVICE_KEY
vercel env add GOOGLE_DRIVE_FOLDER_ID
```

## 📞 Próximos Passos

1. **Faça deploy forçado** das mudanças
2. **Teste a API** de teste primeiro: `https://seu-dominio.vercel.app/api/test`
3. **Verifique se retorna JSON** (não HTML)
4. **Teste o upload** com um arquivo pequeno
5. **Verifique os logs** no console e no Vercel

## 🆘 Se Ainda Não Funcionar

### Opção 1: Usar Configuração Alternativa
```bash
mv vercel.json vercel-backup.json
mv vercel-alt.json vercel.json
vercel --prod
```

### Opção 2: Verificar Estrutura de Pastas
Certifique-se de que a pasta `api/` está na raiz:
```
projeto/
├── api/
│   ├── test.js
│   ├── upload.js
│   └── folders.js
├── src/
├── vercel.json
└── package.json
```

### Opção 3: Usar Next.js API Routes
Se necessário, migrar para Next.js que tem melhor suporte para API routes.

## 🔧 Comandos Úteis

```bash
# Deploy forçado
vercel --prod --force

# Ver logs em tempo real
vercel logs

# Ver variáveis de ambiente
vercel env ls

# Verificar build
vercel build --prod
```
