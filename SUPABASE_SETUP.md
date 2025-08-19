# 🚀 Configuração do Supabase - Guia Completo

## 🎯 **Migração do Google Drive para Supabase**

A aplicação foi migrada do Google Drive para o **Supabase Storage**, que oferece:
- ✅ Configuração mais simples
- ✅ Melhor integração com React
- ✅ Storage otimizado para web
- ✅ URLs públicas automáticas
- ✅ Controle de permissões granular

## 🔧 **Configuração do Supabase**

### **✅ Projeto Já Configurado**

Seu projeto Supabase já está configurado:
- **URL**: `https://kamgocrdbdwjryvcavuo.supabase.co`
- **Chave**: Configurada via variável de ambiente

### **2. Configurar Storage**

1. No menu lateral, vá em **Storage**
2. Clique em **Create a new bucket**
3. Configure:
   - **Name**: `feperj-documents`
   - **Public bucket**: `false` (privado)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `application/pdf, image/jpeg, image/jpg, image/png`

### **3. Configurar Políticas de Segurança**

1. No bucket criado, vá em **Policies**
2. Adicione políticas para:
   - **Upload**: Permitir upload de arquivos autenticados
   - **Download**: Permitir download de arquivos autenticados
   - **List**: Permitir listagem de arquivos autenticados

## 🔑 **Configurar Variáveis de Ambiente**

### **No Vercel:**

```bash
# Adicionar variáveis
vercel env add SUPABASE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### **Valores das Variáveis:**

```env
# Backend (API Routes)
SUPABASE_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**Para obter as chaves:**
1. Acesse [supabase.com](https://supabase.com)
2. Vá no seu projeto
3. **Settings** > **API**
4. Copie:
   - **anon public** → `SUPABASE_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 📁 **Estrutura de Pastas no Storage**

```
feperj-documents/
├── comprovantes-residencia/
│   ├── atleta_123_1234567890.pdf
│   └── ...
├── fotos-3x4/
│   ├── atleta_123_1234567890.jpg
│   └── ...
├── identidades/
│   ├── atleta_123_1234567890.pdf
│   └── ...
└── certificados-adel/
    ├── atleta_123_1234567890.pdf
    └── ...
```

## 🧪 **Testando a Configuração**

### **1. Teste da API**
```bash
curl https://seu-dominio.vercel.app/api/test-supabase
```

**Resposta esperada:**
```json
{
  "message": "API de teste Supabase funcionando!",
  "success": true,
  "supabase": {
    "connected": true,
    "buckets": 1,
    "url": "https://kamgocrdbdwjryvcavuo.supabase.co"
  }
}
```

### **2. Teste de Upload**
```bash
curl -X POST https://seu-dominio.vercel.app/api/upload-supabase \
  -F "file=@teste.pdf" \
  -F "atletaId=123" \
  -F "atletaNome=João Silva" \
  -F "fileType=comprovanteResidencia"
```

### **3. Teste de Download**
```bash
curl https://seu-dominio.vercel.app/api/download-supabase?filePath=comprovantes-residencia/atleta_123_1234567890.pdf
```

## 🔄 **Migração de Dados (Opcional)**

Se você já tem arquivos no Google Drive:

1. **Baixar arquivos** do Google Drive
2. **Fazer upload** para o Supabase via interface
3. **Atualizar URLs** no banco de dados (se necessário)

## 📋 **Checklist de Configuração**

- [x] Projeto Supabase criado
- [ ] Bucket `feperj-documents` criado
- [ ] Políticas de segurança configuradas
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] API de teste funcionando
- [ ] Upload de arquivo funcionando
- [ ] Download de arquivo funcionando
- [ ] Sistema integrado funcionando

## 🚨 **Troubleshooting**

### **Erro de Autenticação**
```
❌ Error: Invalid API key
```
**Solução:** Verificar se as chaves estão corretas

### **Erro de Bucket**
```
❌ Error: Bucket not found
```
**Solução:** Verificar se o bucket foi criado corretamente

### **Erro de Permissão**
```
❌ Error: Insufficient permissions
```
**Solução:** Verificar políticas de segurança do bucket

### **Erro de Tamanho**
```
❌ Error: File too large
```
**Solução:** Verificar limite de tamanho no bucket

## 🔧 **Comandos Úteis**

### **Verificar Variáveis de Ambiente**
```bash
vercel env ls
```

### **Deploy Forçado**
```bash
vercel --prod --force
```

### **Ver Logs**
```bash
vercel logs --follow
```

## 📞 **Próximos Passos**

1. **Configure o bucket** no Supabase
2. **Configure as variáveis** no Vercel
3. **Teste as APIs** de upload e download
4. **Faça deploy** das mudanças
5. **Teste o sistema** completo

---

**O Supabase oferece uma solução mais simples e robusta para storage! 🚀**
