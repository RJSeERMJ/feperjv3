# 🏋️ FEPERJ - Sistema Web de Gestão de Atletas

Sistema web moderno para a Federação de Powerlifting do Estado do Rio de Janeiro (FEPERJ), convertido do sistema desktop original para uma aplicação web com Firebase.

## 🚀 Funcionalidades

### ✅ **Sistema de Autenticação**
- Login seguro com credenciais do administrador
- Suporte a múltiplos usuários
- Controle de acesso por tipo de usuário (admin/usuário)
- Log de login/logout

### ✅ **Gestão de Atletas**
- Cadastro completo de atletas
- Busca por nome, CPF ou email
- Edição e exclusão de registros
- Vinculação com equipes
- Controle de status (ativo/inativo)

### ✅ **Gestão de Equipes**
- Cadastro de equipes
- Informações de técnico e contatos
- Vinculação com atletas

### ✅ **Gestão de Usuários (Admin)**
- Cadastro de novos usuários
- Controle de permissões
- Edição e exclusão de usuários

### ✅ **Dashboard Interativo**
- Gráficos de estatísticas
- Distribuição por sexo
- Atletas por equipe
- Top 10 maiores totais
- Cards de resumo

### ✅ **Log de Atividades (Admin)**
- Registro completo de todas as ações
- Exportação para CSV
- Limpeza de logs

### 🔄 **Funcionalidades em Desenvolvimento**
- Gestão de competições
- Sistema de inscrições
- Relatórios avançados
- Upload de documentos
- Gestão de categorias

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **UI Framework**: React Bootstrap
- **Backend**: Firebase (Firestore + Authentication + Storage)
- **Gráficos**: Chart.js + React-Chartjs-2
- **Roteamento**: React Router DOM
- **Notificações**: React Toastify
- **Ícones**: React Icons

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Conta no Firebase

## 🔧 Instalação

### 1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd feperj-web
```

### 2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

### 3. **Configure o Firebase**

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative os serviços:
   - **Firestore Database**
   - **Authentication** (opcional, para autenticação avançada)
   - **Storage** (para upload de arquivos)

4. Obtenha as credenciais do projeto:
   - Vá em Configurações do Projeto > Geral
   - Role até "Seus aplicativos" e clique em "Adicionar app"
   - Escolha "Web" e copie as credenciais

5. Configure o arquivo `src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 4. **Configure as regras do Firestore**

No console do Firebase, vá em Firestore Database > Regras e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todos (em produção, configure autenticação)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. **Execute o projeto**
```bash
npm start
# ou
yarn start
```

O sistema estará disponível em `http://localhost:3000`

## 🔐 Credenciais de Acesso

### **Administrador Padrão**
- **Login**: `15119236790`
- **Senha**: `49912170`

### **Criar Novos Usuários**
1. Faça login como administrador
2. Acesse "Usuários" no menu lateral
3. Clique em "Novo Usuário"
4. Preencha os dados e salve

## 📊 Estrutura do Banco de Dados

### **Coleções do Firestore**

#### `usuarios`
- `login`: string (único)
- `nome`: string
- `senha`: string
- `tipo`: 'admin' | 'usuario'
- `dataCriacao`: timestamp

#### `equipes`
- `nomeEquipe`: string
- `cidade`: string
- `tecnico`: string (opcional)
- `telefone`: string (opcional)
- `email`: string (opcional)
- `dataCriacao`: timestamp

#### `atletas`
- `nome`: string
- `cpf`: string (único)
- `sexo`: 'M' | 'F'
- `email`: string (único)
- `telefone`: string (opcional)
- `dataNascimento`: date (opcional)
- `dataFiliacao`: date
- `peso`: number (opcional)
- `altura`: number (opcional)
- `maiorTotal`: number (opcional)
- `status`: 'ATIVO' | 'INATIVO'
- `idEquipe`: string (referência)
- `endereco`: string (opcional)
- `observacoes`: string (opcional)
- `dataCriacao`: timestamp

#### `log_atividades`
- `dataHora`: timestamp
- `usuario`: string
- `acao`: string
- `detalhes`: string (opcional)
- `tipoUsuario`: string (opcional)

## 🚀 Deploy

### **Deploy no Firebase Hosting**

1. **Instale o Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Faça login no Firebase**
```bash
firebase login
```

3. **Inicialize o projeto**
```bash
firebase init hosting
```

4. **Configure o build**
```bash
npm run build
```

5. **Deploy**
```bash
firebase deploy
```

### **Deploy em Outros Serviços**

O projeto pode ser deployado em qualquer serviço que suporte aplicações React:

- **Vercel**: Conecte o repositório GitHub
- **Netlify**: Arraste a pasta `build` ou conecte o GitHub
- **AWS S3 + CloudFront**: Configure o bucket e distribuição
- **Azure Static Web Apps**: Conecte o repositório

## 🔧 Configurações Avançadas

### **Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### **Personalização**

- **Cores**: Edite os arquivos CSS em `src/components/`
- **Logo**: Substitua o ícone no componente `Layout.tsx`
- **Tema**: Modifique as variáveis CSS do Bootstrap

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- ✅ Desktop
- ✅ Tablet
- ✅ Smartphone

## 🔒 Segurança

### **Recomendações para Produção**

1. **Configure autenticação no Firebase**
2. **Implemente regras de segurança no Firestore**
3. **Use HTTPS em produção**
4. **Configure CORS adequadamente**
5. **Implemente rate limiting**

### **Regras de Segurança do Firestore (Exemplo)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Apenas admins podem gerenciar usuários
    match /usuarios/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
    
    // Logs apenas para admins
    match /log_atividades/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

## 🐛 Solução de Problemas

### **Erro de Conexão com Firebase**
- Verifique as credenciais no arquivo de configuração
- Confirme se o projeto está ativo no console
- Verifique as regras do Firestore

### **Erro de Build**
- Limpe o cache: `npm run build -- --reset-cache`
- Verifique as dependências: `npm audit fix`
- Confirme a versão do Node.js

### **Problemas de Performance**
- Implemente paginação nas listas grandes
- Use índices no Firestore para consultas complexas
- Implemente cache local com React Query

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a FEPERJ**
