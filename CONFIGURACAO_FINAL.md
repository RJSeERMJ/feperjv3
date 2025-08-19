# 🎯 Configuração Final - Supabase

## ✅ **Status da Migração**

A migração do Google Drive para o **Supabase** foi **concluída com sucesso**!

## 🔧 **Configuração Atual**

### **Projeto Supabase:**
- **URL**: `https://kamgocrdbdwjryvcavuo.supabase.co`
- **Status**: ✅ Configurado

### **Arquivos Atualizados:**
- ✅ `src/config/supabase.ts` - Configuração com sua URL
- ✅ `api/upload-supabase.js` - API de upload
- ✅ `api/download-supabase.js` - API de download
- ✅ `api/test-supabase.js` - API de teste
- ✅ `package.json` - Dependência instalada

## 🔑 **Variáveis de Ambiente Necessárias**

### **No Vercel, configure:**

```bash
# Chave anônima (pública)
vercel env add SUPABASE_KEY
# Valor: sua_chave_anon_do_supabase

# Chave de serviço (privada)
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Valor: sua_chave_service_role_do_supabase
```

### **Para obter as chaves:**
1. Acesse [supabase.com](https://supabase.com)
2. Vá no seu projeto: `https://kamgocrdbdwjryvcavuo.supabase.co`
3. **Settings** > **API**
4. Copie:
   - **anon public** → `SUPABASE_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 📦 **Configurar Storage no Supabase**

### **1. Criar Bucket:**
1. No dashboard do Supabase, vá em **Storage**
2. Clique em **Create a new bucket**
3. Configure:
   - **Name**: `feperj-documents`
   - **Public bucket**: `false` (privado)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `application/pdf, image/jpeg, image/jpg, image/png`

### **2. Configurar Políticas:**
1. No bucket criado, vá em **Policies**
2. Adicione políticas para:
   - **Upload**: Permitir upload de arquivos autenticados
   - **Download**: Permitir download de arquivos autenticados
   - **List**: Permitir listagem de arquivos autenticados

## 🧪 **Testar Configuração**

### **1. Deploy:**
```bash
vercel --prod --force
```

### **2. Teste da API:**
```bash
curl https://seu-dominio.vercel.app/api/test-supabase
```

### **3. Teste de Upload:**
```bash
curl -X POST https://seu-dominio.vercel.app/api/upload-supabase \
  -F "file=@teste.pdf" \
  -F "atletaId=123" \
  -F "atletaNome=João Silva" \
  -F "fileType=comprovanteResidencia"
```

## 📁 **Estrutura de Arquivos**

```
feperj-documents/
├── comprovantes-residencia/
├── fotos-3x4/
├── identidades/
└── certificados-adel/
```

## 🚀 **Vantagens do Supabase**

- ✅ **Configuração simples** (sem service account)
- ✅ **Melhor performance** (CDN global)
- ✅ **URLs públicas automáticas**
- ✅ **Controle de permissões granular**
- ✅ **SDK nativo para React**

## 📋 **Checklist Final**

- [x] Projeto Supabase configurado
- [ ] Bucket `feperj-documents` criado
- [ ] Políticas de segurança configuradas
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy realizado
- [ ] API de teste funcionando
- [ ] Upload de arquivo funcionando
- [ ] Download de arquivo funcionando
- [ ] Sistema integrado funcionando

## 🎉 **Próximos Passos**

1. **Configure o bucket** no Supabase
2. **Configure as variáveis** no Vercel
3. **Faça deploy** das mudanças
4. **Teste o sistema** completo

---

**A migração está pronta! Configure as variáveis de ambiente e teste o sistema! 🚀**
