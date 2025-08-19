# 🚀 Guia Completo: Importar para GitHub e Instalações Rápidas

## 📋 Pré-requisitos

- [Git](https://git-scm.com/) instalado
- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- Conta no [GitHub](https://github.com)
- Projeto Firebase configurado

## 🔄 Passo a Passo para Importar para GitHub

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"New"** (Novo repositório)
3. Configure o repositório:
   - **Repository name**: `feperj-web` (ou outro nome de sua preferência)
   - **Description**: `Sistema Web de Gestão de Atletas FEPERJ`
   - **Visibility**: Público ou Privado (sua escolha)
   - **⚠️ IMPORTANTE**: **NÃO** marque "Add a README file", "Add .gitignore", ou "Choose a license"
4. Clique em **"Create repository"**

### 2. Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub mostrará comandos. Use estes comandos no terminal:

```bash
# Adicionar o repositório remoto (substitua pela URL do seu repositório)
git remote add origin https://github.com/SEU_USUARIO/feperj-web.git

# Enviar o código para o GitHub
git push -u origin master
# ou se o branch principal for 'main':
# git push -u origin main
```

### 3. Verificar Upload

1. Acesse seu repositório no GitHub
2. Confirme que todos os arquivos foram enviados corretamente
3. O projeto deve estar disponível em: `https://github.com/SEU_USUARIO/feperj-web`

## ⚡ Instalações Rápidas (Para Novos Desenvolvedores)

### Opção 1: Clone e Instalação Manual

```bash
# 1. Clonar o repositório
git clone https://github.com/SEU_USUARIO/feperj-web.git
cd feperj-web

# 2. Instalar dependências
npm install
# ou
yarn install

# 3. Configurar Firebase
npm run setup

# 4. Executar o projeto
npm start
```

### Opção 2: Script de Instalação Automática

Crie um arquivo `install.bat` (Windows) ou `install.sh` (Linux/Mac) com o conteúdo:

**Windows (install.bat):**
```batch
@echo off
echo Instalando Sistema FEPERJ Web...
echo.

echo 1. Instalando dependencias...
npm install

echo.
echo 2. Configurando Firebase...
npm run setup

echo.
echo 3. Iniciando o sistema...
npm start
```

**Linux/Mac (install.sh):**
```bash
#!/bin/bash
echo "Instalando Sistema FEPERJ Web..."
echo

echo "1. Instalando dependencias..."
npm install

echo
echo "2. Configurando Firebase..."
npm run setup

echo
echo "3. Iniciando o sistema..."
npm start
```

## 🔧 Configuração do Firebase

### 1. Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Criar projeto"**
3. Digite o nome: `feperj-web`
4. Siga os passos de configuração

### 2. Ativar Serviços

1. **Firestore Database**: Ative e configure as regras
2. **Authentication**: Ative e configure os provedores
3. **Storage**: Ative para upload de arquivos

### 3. Obter Credenciais

1. Vá em **Configurações do Projeto** > **Geral**
2. Role até **"Seus aplicativos"**
3. Clique em **"Adicionar app"** > **Web**
4. Copie as credenciais

### 4. Configurar no Projeto

Execute o comando de setup:
```bash
npm run setup
```

E insira as credenciais quando solicitado.

## 🚀 Deploy Rápido

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init hosting

# Build do projeto
npm run build

# Deploy
firebase deploy
```

### Vercel (Alternativa)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 📱 Acesso ao Sistema

- **URL Local**: `http://localhost:3000`
- **Credenciais Admin**:
  - **Login**: `15119236790`
  - **Senha**: `49912170`

## 🔒 Configurações de Segurança

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin pode acessar tudo
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm start          # Iniciar servidor de desenvolvimento
npm run build      # Build para produção
npm test           # Executar testes

# Firebase
npm run setup      # Configurar Firebase
firebase deploy    # Deploy para Firebase Hosting

# Git
git add .          # Adicionar mudanças
git commit -m ""   # Fazer commit
git push           # Enviar para GitHub
```

## 📞 Suporte

- **Documentação**: Consulte o `README.md`
- **Instalação Rápida**: Consulte o `INSTALACAO_RAPIDA.md`
- **Issues**: Use o GitHub Issues para reportar problemas

## 🎯 Próximos Passos

1. ✅ Configurar Firebase
2. ✅ Testar funcionalidades básicas
3. ✅ Configurar domínio personalizado (opcional)
4. ✅ Implementar funcionalidades avançadas
5. ✅ Configurar CI/CD (opcional)

---

**🎉 Parabéns! Seu sistema FEPERJ Web está pronto para uso!**
