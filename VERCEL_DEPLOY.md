# Guia de Deploy no Vercel

## Configurações Criadas

### 1. Arquivo `vercel.json`
- Configurado para React apps com React Router
- Rotas configuradas para SPA (Single Page Application)
- Build configurado para usar `build` como diretório de saída

### 2. Arquivo `.vercelignore`
- Otimiza o deploy excluindo arquivos desnecessários
- Reduz o tamanho do upload

### 3. Package.json atualizado
- Script de build modificado para evitar falhas por warnings

## Passos para Deploy

### Opção 1: Deploy via GitHub (Recomendado)
1. Faça commit das alterações no GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Conecte sua conta GitHub
4. Importe o repositório
5. Configure as variáveis de ambiente (se necessário)
6. Deploy automático será feito

### Opção 2: Deploy via CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Para produção
vercel --prod
```

## Variáveis de Ambiente (Opcional)

Se você quiser usar variáveis de ambiente para as configurações do Firebase:

1. No painel do Vercel, vá em Settings > Environment Variables
2. Adicione as variáveis:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - etc.

3. Atualize o arquivo `src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ... outras configs
};
```

## Problemas Comuns e Soluções

### Erro: "Build failed"
- **SOLUÇÃO**: O projeto foi configurado para usar `--legacy-peer-deps` no Vercel
- Se testar localmente, use: `npm install --legacy-peer-deps`
- Execute `npm run build` localmente para testar

### Erro: "Module not found" ou "Cannot find module"
- **SOLUÇÃO**: Dependências adicionadas ao package.json:
  - `ajv: ^8.12.0`
  - `@babel/helper-define-polyfill-provider: ^0.3.3`

### Erro: "Page not found" em rotas
- O `vercel.json` já está configurado para redirecionar todas as rotas para `index.html`

### Erro: "Module not found"
- Verifique se todos os imports estão corretos
- Certifique-se de que os arquivos existem

## Verificação Pós-Deploy

1. Teste todas as rotas da aplicação
2. Verifique se o Firebase está funcionando
3. Teste login/logout
4. Verifique se os uploads de arquivo funcionam

## Suporte

Se ainda houver problemas:
1. Verifique os logs no painel do Vercel
2. Teste o build localmente com `npm run build`
3. Verifique se não há erros de TypeScript
