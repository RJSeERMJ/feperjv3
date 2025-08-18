# 🚀 Instalação Rápida - FEPERJ Sistema Web

## ⚡ Setup em 5 minutos

### 1. **Pré-requisitos**
- Node.js 16+ instalado
- Conta no Firebase

### 2. **Clone e Instale**
```bash
git clone <url-do-repositorio>
cd feperj-web
npm install
```

### 3. **Configure o Firebase**
```bash
npm run setup
```
Siga as instruções e insira suas credenciais do Firebase.

### 4. **Execute o Sistema**
```bash
npm start
```

### 5. **Acesse e Faça Login**
- URL: http://localhost:3000
- **Login**: `15119236790`
- **Senha**: `49912170`

## 🔧 Configuração Manual do Firebase

Se preferir configurar manualmente:

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto ou use um existente
3. Ative o **Firestore Database**
4. Vá em Configurações > Geral > Seus aplicativos
5. Adicione um app web e copie as credenciais
6. Edite `src/config/firebase.ts` com suas credenciais

## 📋 Regras do Firestore

No console do Firebase, configure as regras do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## ✅ Pronto!

O sistema está funcionando com todas as funcionalidades principais:
- ✅ Login e autenticação
- ✅ Gestão de atletas
- ✅ Gestão de equipes
- ✅ Gestão de usuários
- ✅ Dashboard com gráficos
- ✅ Log de atividades

## 🚀 Deploy

Para fazer deploy:
```bash
npm run build
firebase deploy
```

---

**Precisa de ajuda?** Consulte o README.md completo para mais detalhes.
