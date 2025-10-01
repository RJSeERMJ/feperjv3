# 🚀 **DOCUMENTAÇÃO DA API FEPERJ**

## 📋 **Visão Geral**

A API FEPERJ é uma API RESTful segura e escalável construída com Next.js API Routes, projetada para funcionar perfeitamente no Vercel. Ela fornece todos os endpoints necessários para o sistema de gestão de atletas e competições de powerlifting.

## 🔐 **Autenticação e Segurança**

### **Sistema de Autenticação JWT**
- Tokens JWT com expiração de 24 horas
- Refresh tokens com expiração de 7 dias
- Rate limiting (100 requests/minuto por padrão)
- Sanitização automática de inputs
- Headers de segurança HTTP
- Logs de auditoria completos

### **Middleware de Segurança**
- Validação de tokens JWT
- Verificação de permissões (Admin/Usuário)
- Rate limiting automático
- Sanitização de dados
- Logging de segurança

## 🌐 **Endpoints da API**

### **Base URL**
```
https://seu-dominio.vercel.app/api
```

### **Headers Obrigatórios**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 🔑 **Autenticação**

### **POST /api/auth/login**
Fazer login no sistema.

**Request:**
```json
{
  "login": "15119236790",
  "senha": "49912170"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "login": "15119236790",
    "nome": "Administrador",
    "tipo": "admin",
    "idEquipe": null
  },
  "expiresIn": 86400
}
```

### **POST /api/auth/refresh**
Renovar token de acesso.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### **POST /api/auth/logout**
Fazer logout do sistema.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

## 👥 **Atletas**

### **GET /api/atletas**
Listar atletas com filtros opcionais.

**Query Parameters:**
- `search` (string): Buscar por nome, CPF ou matrícula
- `equipe` (string): Filtrar por equipe
- `status` (string): Filtrar por status (ATIVO/INATIVO)
- `page` (number): Página (padrão: 1)
- `limit` (number): Limite por página (padrão: 50)

**Response (200):**
```json
{
  "success": true,
  "atletas": [
    {
      "id": "atleta_id",
      "nome": "João Silva",
      "cpf": "12345678901",
      "matricula": "FEPERJ - 123452025",
      "sexo": "M",
      "email": "joao@email.com",
      "telefone": "11999999999",
      "dataNascimento": "1990-01-01T00:00:00.000Z",
      "dataFiliacao": "2024-01-01T00:00:00.000Z",
      "maiorTotal": 500,
      "status": "ATIVO",
      "idEquipe": "equipe_id",
      "equipe": {
        "nomeEquipe": "Equipe Alpha",
        "cidade": "Rio de Janeiro"
      }
    }
  ],
  "total": 1
}
```

### **POST /api/atletas**
Criar novo atleta.

**Request:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "sexo": "M",
  "email": "joao@email.com",
  "telefone": "11999999999",
  "dataNascimento": "1990-01-01",
  "dataFiliacao": "2024-01-01",
  "maiorTotal": 500,
  "status": "ATIVO",
  "idEquipe": "equipe_id"
}
```

**Response (201):**
```json
{
  "success": true,
  "atleta": {
    "id": "novo_atleta_id",
    "nome": "João Silva",
    ...
  }
}
```

### **PUT /api/atletas/{id}**
Atualizar atleta existente.

### **DELETE /api/atletas/{id}**
Deletar atleta.

---

## 🏋️ **Barra Pronta**

### **GET /api/barra-pronta**
Listar entradas da barra pronta.

**Query Parameters:**
- `day` (number): Dia da competição
- `platform` (number): Plataforma
- `flight` (string): Grupo (A-J)
- `search` (string): Buscar por nome

**Response (200):**
```json
{
  "success": true,
  "entradas": [
    {
      "id": "entrada_id",
      "nome": "João Silva",
      "sexo": "M",
      "division": "Open",
      "flight": "A",
      "day": 1,
      "platform": 1,
      "squat1": 200,
      "squat2": 210,
      "squat3": 220,
      "bench1": 150,
      "bench2": 160,
      "bench3": 170,
      "deadlift1": 250,
      "deadlift2": 260,
      "deadlift3": 270
    }
  ],
  "total": 1
}
```

### **POST /api/barra-pronta**
Criar nova entrada.

**Request:**
```json
{
  "nome": "João Silva",
  "sexo": "M",
  "division": "Open",
  "flight": "A",
  "day": 1,
  "platform": 1,
  "squat1": 200,
  "bench1": 150,
  "deadlift1": 250
}
```

### **GET /api/barra-pronta/config**
Obter configuração da competição.

**Response (200):**
```json
{
  "success": true,
  "config": {
    "squatBarAndCollarsWeightKg": 25,
    "benchBarAndCollarsWeightKg": 25,
    "deadliftBarAndCollarsWeightKg": 25,
    "plates": [
      { "weightAny": 25, "color": "#FF0000" },
      { "weightAny": 20, "color": "#0000FF" },
      { "weightAny": 15, "color": "#FFFF00" },
      { "weightAny": 10, "color": "#00FF00" },
      { "weightAny": 5, "color": "#FFFFFF" },
      { "weightAny": 2.5, "color": "#FF8000" },
      { "weightAny": 1.25, "color": "#800080" }
    ]
  }
}
```

### **POST /api/barra-pronta/config**
Salvar configuração da competição.

### **GET /api/barra-pronta/state**
Obter estado atual de levantamento.

**Response (200):**
```json
{
  "success": true,
  "state": {
    "day": 1,
    "platform": 1,
    "flight": "A",
    "lift": "S",
    "attemptOneIndexed": 1,
    "selectedEntryId": null,
    "selectedAttempt": null,
    "isAttemptActive": false
  }
}
```

### **POST /api/barra-pronta/state**
Salvar estado de levantamento.

---

## 📊 **Logs e Auditoria**

### **GET /api/logs**
Listar logs de atividade.

**Query Parameters:**
- `usuario` (string): Filtrar por usuário
- `acao` (string): Filtrar por ação
- `resource` (string): Filtrar por recurso
- `limit` (number): Limite de resultados

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_id",
      "dataHora": "2024-01-01T10:00:00.000Z",
      "usuario": "Administrador",
      "acao": "CRIAR_ATLETA",
      "detalhes": "Atleta João Silva criado com sucesso",
      "tipoUsuario": "admin",
      "resource": "atletas",
      "resourceId": "atleta_id"
    }
  ],
  "total": 1
}
```

---

## 📈 **Estatísticas**

### **GET /api/stats**
Obter estatísticas gerais do sistema.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "atletas": {
      "total": 100,
      "ativos": 85,
      "inativos": 15,
      "porSexo": {
        "masculino": 60,
        "feminino": 40
      },
      "porEquipe": {
        "Equipe Alpha": 25,
        "Equipe Beta": 30
      }
    },
    "barraPronta": {
      "totalEntradas": 50,
      "porDia": { "1": 25, "2": 25 },
      "porFlight": { "A": 15, "B": 20, "C": 15 }
    },
    "logs": {
      "totalLogs": 1000,
      "logsByUser": {
        "Administrador": 500,
        "Usuário": 500
      }
    }
  }
}
```

---

## ❌ **Códigos de Erro**

### **Códigos de Status HTTP**
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Acesso negado
- `404` - Não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

### **Códigos de Erro Personalizados**
- `NO_TOKEN` - Token de acesso requerido
- `TOKEN_EXPIRED` - Token expirado
- `INVALID_TOKEN` - Token inválido
- `RATE_LIMIT_EXCEEDED` - Rate limit excedido
- `INSUFFICIENT_PERMISSIONS` - Permissões insuficientes
- `TEAM_ACCESS_DENIED` - Acesso à equipe negado
- `VALIDATION_ERROR` - Erro de validação
- `INTERNAL_SERVER_ERROR` - Erro interno

### **Exemplo de Resposta de Erro**
```json
{
  "success": false,
  "error": "Token expirado",
  "code": "TOKEN_EXPIRED"
}
```

---

## 🔧 **Configuração**

### **Variáveis de Ambiente Necessárias**

```bash
# Segurança
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
JWT_EXPIRES_IN=24h
API_RATE_LIMIT=100

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 **Deploy no Vercel**

### **1. Configurar Variáveis de Ambiente**
No dashboard do Vercel, adicione todas as variáveis de ambiente necessárias.

### **2. Configurar Build**
O `vercel.json` já está configurado para usar Next.js com API Routes.

### **3. Deploy**
```bash
# Conectar repositório ao Vercel
vercel --prod

# Ou fazer push para GitHub (se conectado)
git push origin main
```

---

## 🧪 **Testando a API**

### **Usando curl**
```bash
# Login
curl -X POST https://seu-dominio.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"15119236790","senha":"49912170"}'

# Listar atletas
curl -X GET https://seu-dominio.vercel.app/api/atletas \
  -H "Authorization: Bearer <token>"
```

### **Usando Postman**
1. Importe a coleção de endpoints
2. Configure as variáveis de ambiente
3. Execute os testes automatizados

---

## 📝 **Logs e Monitoramento**

### **Logs de Segurança**
Todos os eventos de segurança são automaticamente logados:
- Tentativas de login
- Acessos negados
- Atividades suspeitas
- Mudanças de dados críticos

### **Logs de Auditoria**
Todas as operações são registradas:
- Criação, atualização e exclusão de dados
- Acessos a recursos sensíveis
- Mudanças de configuração

---

## 🔒 **Boas Práticas de Segurança**

1. **Nunca exponha tokens ou chaves** no código
2. **Use HTTPS** em produção
3. **Configure rate limiting** adequadamente
4. **Monitore logs** regularmente
5. **Atualize dependências** regularmente
6. **Use chaves diferentes** para dev/prod
7. **Implemente backup** automático
8. **Configure alertas** de segurança

---

## 📞 **Suporte**

Para suporte técnico ou dúvidas sobre a API:
- 📧 Email: suporte@feperj.com
- 📱 WhatsApp: (21) 99999-9999
- 🌐 Website: https://feperj.com

---

**Versão da API:** 1.0.0  
**Última atualização:** Janeiro 2025  
**Compatibilidade:** Vercel, Next.js 14+


