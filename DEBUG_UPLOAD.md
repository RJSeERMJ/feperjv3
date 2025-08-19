# 🔧 Debug do Upload - Google Drive

## 🚨 Problema Identificado
O erro 405 indica que o método HTTP não é permitido. Isso acontece porque:

1. **Configuração do Vercel incorreta** - As API routes não estavam configuradas
2. **Falta de roteamento** - O Vercel não estava roteando `/api/*` corretamente

## ✅ Soluções Implementadas

### 1. **Corrigido `vercel.json`**
- Adicionado build para API routes: `"src": "api/**/*.js"`
- Adicionado roteamento: `"src": "/api/(.*)", "dest": "/api/$1"`

### 2. **Melhorado `api/upload.js`**
- Logs detalhados para debug
- Melhor tratamento de erros
- Validação de arquivos
- Limpeza de arquivos temporários

### 3. **Criado `api/test.js`**
- API de teste para verificar se as rotas funcionam
- Verifica variáveis de ambiente

### 4. **Melhorado `googleDriveService.ts`**
- Teste de conexão antes do upload
- Logs detalhados
- Melhor tratamento de erros

## 🧪 Como Testar

### 1. **Teste da API**
```bash
# Teste GET
curl https://seu-dominio.vercel.app/api/test

# Teste POST
curl -X POST https://seu-dominio.vercel.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. **Verificar Variáveis de Ambiente**
A API de teste retorna se as variáveis estão configuradas:
- `GOOGLE_SERVICE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`

### 3. **Teste de Upload**
1. Acesse o sistema
2. Vá em um atleta
3. Tente fazer upload de um arquivo
4. Verifique o console do navegador para logs detalhados

## 🔍 Logs para Verificar

### No Console do Navegador:
```
🚀 Iniciando upload para Google Drive: {...}
🔍 Testando conexão com API...
✅ API funcionando: {...}
📤 Enviando arquivo para API...
📥 Resposta da API: {...}
✅ Arquivo enviado para o Google Drive: {...}
```

### No Vercel Functions Logs:
```
🧪 Test API chamada - Método: GET
🚀 Upload API chamada - Método: POST
📁 Processando upload...
☁️ Fazendo upload para Google Drive...
✅ Upload concluído: {...}
```

## 🚨 Possíveis Problemas

### 1. **Variáveis de Ambiente**
Verifique se estão configuradas no Vercel:
- `GOOGLE_SERVICE_KEY` (JSON da service account)
- `GOOGLE_DRIVE_FOLDER_ID` (ID da pasta no Drive)

### 2. **Permissões do Google Drive**
- Service account deve ter acesso à pasta
- Pasta deve existir e ser acessível

### 3. **Deploy**
- Faça novo deploy após as mudanças
- Verifique se as API routes foram deployadas

## 📞 Próximos Passos

1. **Faça deploy** das mudanças
2. **Teste a API** de teste primeiro
3. **Teste o upload** com um arquivo pequeno
4. **Verifique os logs** no console e no Vercel
5. **Reporte** qualquer erro encontrado

## 🔧 Comandos Úteis

```bash
# Deploy no Vercel
vercel --prod

# Ver logs em tempo real
vercel logs

# Ver variáveis de ambiente
vercel env ls
```
