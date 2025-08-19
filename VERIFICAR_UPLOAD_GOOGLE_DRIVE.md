# 🔍 Verificar Upload no Google Drive

## ✅ Sistema Atualizado para Upload Real

O sistema foi atualizado para fazer **upload real** para o Google Drive usando a conta de serviço.

## 📍 Onde os Arquivos Estão Indo

### **Pasta Principal:**
```
FEPERJ - Documentos (ID: 1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh)
```

### **Estrutura Criada Automaticamente:**
```
FEPERJ - Documentos/
├── João Silva (ID123)/
│   ├── Comprovante de Residência/
│   │   └── comprovanteResidencia_1703123456789_documento.pdf
│   ├── Foto 3x4/
│   │   └── foto3x4_1703123456789_foto.jpg
│   ├── Identidade/
│   │   └── identidade_1703123456789_rg.pdf
│   └── Certificado ADEL/
│       └── certificadoAdel_1703123456789_certificado.pdf
└── Maria Santos (ID456)/
    ├── Comprovante de Residência/
    ├── Foto 3x4/
    ├── Identidade/
    └── Certificado ADEL/
```

## 🔍 Como Verificar se os Arquivos Estão Indo para o Lugar Certo

### **Passo 1: Acessar o Google Drive**
1. **Acesse**: [drive.google.com](https://drive.google.com)
2. **Faça login** com a conta que tem acesso à pasta

### **Passo 2: Localizar a Pasta**
1. **Procure por**: "FEPERJ - Documentos"
2. **Ou use o link direto**: `https://drive.google.com/drive/folders/1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh`

### **Passo 3: Verificar Estrutura**
1. **Abra a pasta** "FEPERJ - Documentos"
2. **Verifique se aparecem pastas** com nomes dos atletas
3. **Abra uma pasta de atleta** e verifique as subpastas

## 🔧 Logs para Debug

### **No Console do Navegador (F12):**
```
🔧 Inicializando Google Drive Service com conta de serviço...
🔐 Gerando novo token de acesso...
✅ Token de acesso obtido com sucesso
✅ Google Drive Service inicializado com sucesso
📁 Pasta do atleta criada: [ID_DA_PASTA]
📁 Pasta do atleta encontrada: [ID_DA_PASTA]
✅ Arquivo enviado para o Google Drive: [ID_DO_ARQUIVO]
```

### **O que Procurar:**
- ✅ **"Pasta do atleta criada"** = Nova pasta criada
- ✅ **"Arquivo enviado para o Google Drive"** = Upload real realizado
- ❌ **Erros de autenticação** = Problema com conta de serviço

## 🚨 Possíveis Problemas

### **Problema 1: Pasta não compartilhada**
- **Sintoma**: Erro "Access Denied"
- **Solução**: Compartilhar pasta com `feperj@feperj-2025-469423.iam.gserviceaccount.com`

### **Problema 2: Token inválido**
- **Sintoma**: Erro "Invalid JWT"
- **Solução**: Verificar configuração da conta de serviço

### **Problema 3: Arquivos não aparecem**
- **Sintoma**: Upload parece funcionar mas arquivos não aparecem
- **Solução**: Verificar permissões da pasta

## 📋 Checklist de Verificação

- [ ] **Pasta "FEPERJ - Documentos" existe** no Google Drive
- [ ] **Pasta compartilhada** com a conta de serviço
- [ ] **Logs mostram** "Arquivo enviado para o Google Drive"
- [ ] **Arquivos aparecem** na pasta correta
- [ ] **Estrutura de pastas** criada automaticamente

## 🎯 Próximo Passo

**Teste o upload agora e me diga:**
1. **Aparece algum erro** no console?
2. **Os arquivos aparecem** na pasta do Google Drive?
3. **A estrutura de pastas** foi criada?

**Se houver problemas, me envie os logs do console para eu ajudar!** 🔧
