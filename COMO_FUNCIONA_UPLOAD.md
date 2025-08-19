# 📤 Como Funciona o Sistema de Upload

## 🔄 **Fluxo Completo do Upload**

### **1. Interface do Usuário (DocumentUploadModal.tsx)**

```typescript
// Usuário clica em "Escolher arquivo"
const handleComprovanteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    handleFileUpload(file, 'comprovanteResidencia'); // Chama função de upload
  }
};
```

### **2. Função Principal de Upload**

```typescript
const handleFileUpload = async (file: File, fileType: string) => {
  // 1. Validações
  if (!atleta?.id) {
    toast.error('Atleta não identificado');
    return;
  }

  // 2. Inicia upload
  const result = await FileUploadService.uploadFile(
    file,           // Arquivo selecionado
    atleta.id,      // ID do atleta
    atleta.nome,    // Nome do atleta
    fileType,       // Tipo do documento
    (progress) => { // Callback de progresso
      setUploadProgress(progress);
    }
  );
};
```

## 🏗️ **Estrutura de Pastas Criada Automaticamente**

### **Pasta Principal:**
```
FEPERJ - Documentos (ID: 1AyoDXJrH8MH-CI-jkap2l04U_UdjhFCh)
```

### **Para cada atleta:**
```
João Silva (ID123)/
├── Comprovante de Residência/
├── Foto 3x4/
├── Identidade/
└── Certificado ADEL/
```

## 🔧 **Processo Detalhado (GoogleDriveService.ts)**

### **Passo 1: Autenticação**
```typescript
// Obter token de acesso usando conta de serviço
const token = await this.getAccessToken();
```

### **Passo 2: Criar Pasta do Atleta**
```typescript
const atletaFolderName = `${atletaNome} (${atletaId})`;
// Busca se já existe ou cria nova pasta
const atletaFolderId = await this.createAtletaFolder(atletaId, atletaNome);
```

### **Passo 3: Criar Subpastas**
```typescript
const documentFolders = await this.createDocumentFolders(atletaFolderId);
// Cria as 4 pastas: Comprovante, Foto, Identidade, Certificado
```

### **Passo 4: Preparar Upload**
```typescript
// Nome único do arquivo
const fileName = `${fileType}_${Date.now()}_${file.name}`;

// Metadados do arquivo
const metadata = {
  name: fileName,
  parents: [documentFolders[fileType]] // Pasta específica
};
```

### **Passo 5: Upload Real**
```typescript
// Criar FormData
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify(metadata)]));
form.append('file', file);

// Enviar para Google Drive API
const response = await fetch(
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  }
);
```

## 📊 **Progresso do Upload**

### **Callbacks de Progresso:**
```typescript
// 10% - Iniciando
onProgress?.({ progress: 10, fileName: file.name, status: 'uploading' });

// 30% - Pasta do atleta criada
onProgress?.({ progress: 30, fileName: file.name, status: 'uploading' });

// 50% - Subpastas criadas
onProgress?.({ progress: 50, fileName: file.name, status: 'uploading' });

// 70% - Preparando upload
onProgress?.({ progress: 70, fileName: file.name, status: 'uploading' });

// 90% - Upload concluído
onProgress?.({ progress: 90, fileName: file.name, status: 'uploading' });

// 100% - Sucesso
onProgress?.({ progress: 100, fileName: file.name, status: 'success' });
```

## 🔍 **Logs no Console**

### **Durante o Upload:**
```
🔧 Inicializando Google Drive Service com conta de serviço...
🔐 Gerando novo token de acesso...
✅ Token de acesso obtido com sucesso
📁 Pasta do atleta criada: [ID_DA_PASTA]
📁 Criando pasta: Comprovante de Residência
📁 Pasta criada: Comprovante de Residência ([ID_SUBPASTA])
✅ Arquivo enviado para o Google Drive: [ID_DO_ARQUIVO]
```

## 🎯 **Tipos de Documentos Suportados**

### **1. Comprovante de Residência**
- **Pasta**: `Comprovante de Residência/`
- **Tipos**: PDF, JPG, PNG
- **Nome**: `comprovanteResidencia_[timestamp]_[nome_original]`

### **2. Foto 3x4**
- **Pasta**: `Foto 3x4/`
- **Tipos**: JPG, PNG
- **Nome**: `foto3x4_[timestamp]_[nome_original]`

### **3. Identidade**
- **Pasta**: `Identidade/`
- **Tipos**: PDF, JPG, PNG
- **Nome**: `identidade_[timestamp]_[nome_original]`

### **4. Certificado ADEL**
- **Pasta**: `Certificado ADEL/`
- **Tipos**: PDF, JPG, PNG
- **Nome**: `certificadoAdel_[timestamp]_[nome_original]`

## 🚨 **Tratamento de Erros**

### **Erros Comuns:**
```typescript
// 1. Atleta não identificado
if (!atleta?.id) {
  toast.error('Atleta não identificado');
  return;
}

// 2. Erro de autenticação
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Erro no upload: ${response.statusText}`);
}

// 3. Erro geral
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  toast.error(`Falha no upload: ${errorMessage}`);
}
```

## 🔄 **Recarregamento Automático**

### **Após Upload Bem-sucedido:**
```typescript
// Recarregar lista de arquivos
await loadAtletaFiles();

// Mostrar mensagem de sucesso
toast.success(`Arquivo "${file.name}" enviado com sucesso!`);
```

## 📱 **Interface Visual**

### **Componentes:**
- **ProgressBar**: Mostra progresso do upload
- **Toast**: Notificações de sucesso/erro
- **ListGroup**: Lista de arquivos enviados
- **Buttons**: Upload, Download, Delete

### **Estados:**
- **uploading**: true/false (desabilita botões)
- **uploadProgress**: Progresso atual
- **files**: Lista de arquivos do atleta

## 🎯 **Resumo do Fluxo**

1. **Usuário** seleciona arquivo
2. **Interface** valida e chama upload
3. **GoogleDriveService** autentica
4. **Cria pastas** automaticamente
5. **Faz upload** para Google Drive
6. **Atualiza interface** com resultado
7. **Recarrega lista** de arquivos

**O sistema é totalmente automático e organiza os arquivos por atleta e tipo de documento!** 🚀
