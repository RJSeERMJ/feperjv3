# 🔐 CONTROLE DE ACESSO BASEADO EM EQUIPES

## 🎯 Funcionalidade Implementada

O sistema agora possui controle de acesso granular baseado em equipes. Cada usuário só pode acessar e modificar dados pertinentes à sua própria equipe, enquanto administradores têm acesso total ao sistema.

## ✅ Principais Características

### **1. Controle de Acesso por Tipo de Usuário**

#### **Administradores**
- ✅ **Acesso total** a todos os dados do sistema
- ✅ **Pode criar, editar e excluir** qualquer registro
- ✅ **Pode visualizar** todas as equipes e atletas
- ✅ **Pode gerenciar** usuários e configurações

#### **Usuários (Chefes de Equipe)**
- ✅ **Acesso restrito** apenas aos dados da sua equipe
- ✅ **Pode criar, editar e excluir** apenas dados da sua equipe
- ✅ **Pode visualizar** apenas atletas da sua equipe
- ✅ **Pode editar** apenas sua própria equipe

### **2. Filtros Automáticos**

#### **Atletas**
- **Administradores**: Veem todos os atletas
- **Usuários**: Veem apenas atletas da sua equipe

#### **Equipes**
- **Administradores**: Veem todas as equipes
- **Usuários**: Veem apenas sua própria equipe

#### **Usuários**
- **Administradores**: Veem todos os usuários
- **Usuários**: Veem apenas usuários da sua equipe (se aplicável)

## 🔧 Implementação Técnica

### **1. Hook de Controle de Acesso**

```typescript
export const useAccessControl = () => {
  const { user } = useAuth();

  // Verifica se o usuário é administrador
  const isAdmin = () => {
    return user?.tipo === 'admin';
  };

  // Verifica se o usuário pode acessar dados de uma equipe específica
  const canAccessTeam = (teamId: string) => {
    if (isAdmin()) return true;
    return user?.idEquipe === teamId;
  };

  // Verifica se o usuário pode modificar dados
  const canModify = (teamId?: string) => {
    if (isAdmin()) return true;
    if (!teamId) return false;
    return user?.idEquipe === teamId;
  };

  // Verifica se o usuário pode excluir registros
  const canDelete = (teamId?: string) => {
    if (isAdmin()) return true;
    if (!teamId) return false;
    return user?.idEquipe === teamId;
  };

  return {
    isAdmin,
    isUser,
    isTeamLeader,
    getUserTeamId,
    getUserTeamName,
    canAccessTeam,
    canAccessAthlete,
    canModify,
    canCreate,
    canDelete,
    getAccessInfo
  };
};
```

### **2. Serviços Atualizados**

#### **Serviço de Atletas**
```typescript
async getAll(userTeamId?: string): Promise<Atleta[]> {
  let querySnapshot;
  
  // Se o usuário tem uma equipe específica, filtrar por ela
  if (userTeamId) {
    const q = query(collection(db, 'atletas'), where('idEquipe', '==', userTeamId));
    querySnapshot = await getDocs(q);
  } else {
    // Se não tem equipe (admin), buscar todos
    querySnapshot = await getDocs(collection(db, 'atletas'));
  }
  
  // ... resto do código
}
```

#### **Serviço de Equipes**
```typescript
async getAll(userTeamId?: string): Promise<Equipe[]> {
  let querySnapshot;
  
  // Se o usuário tem uma equipe específica, filtrar por ela
  if (userTeamId) {
    const q = query(collection(db, 'equipes'), where('__name__', '==', userTeamId));
    querySnapshot = await getDocs(q);
  } else {
    // Se não tem equipe (admin), buscar todas
    querySnapshot = await getDocs(collection(db, 'equipes'));
  }
  
  // ... resto do código
}
```

### **3. Contexto de Autenticação Melhorado**

```typescript
// Buscar dados da equipe se o usuário tiver uma
let equipe = null;
if (usuario.idEquipe) {
  try {
    equipe = await equipeService.getById(usuario.idEquipe);
  } catch (error) {
    console.warn('Erro ao buscar equipe do usuário:', error);
  }
}

const userWithoutPassword = { 
  ...usuario, 
  equipe: equipe || undefined
};
```

## 🎨 Interface Adaptativa

### **1. Badges de Status**
- **Administrador**: Badge vermelho "Administrador: Acesso total ao sistema"
- **Chefe de Equipe**: Badge amarelo "Chefe de Equipe: Equipe: [Nome da Equipe]"
- **Usuário**: Badge azul "Usuário: Equipe: [Nome da Equipe]"

### **2. Botões Desabilitados**
- Botões de edição e exclusão ficam desabilitados quando o usuário não tem permissão
- Feedback visual claro sobre o que pode ou não ser modificado

### **3. Mensagens Contextuais**
- Alertas informativos sobre o nível de acesso
- Mensagens de erro específicas para tentativas de acesso não autorizado

## 🚀 Como Funciona

### **1. Login e Carregamento de Dados**
1. Usuário faz login
2. Sistema carrega dados da equipe automaticamente
3. Contexto de autenticação inclui informações da equipe
4. Hook de controle de acesso fica disponível

### **2. Filtros Automáticos**
1. Cada página verifica o tipo de usuário
2. Se for usuário comum, aplica filtros por equipe
3. Se for administrador, carrega todos os dados
4. Interface se adapta ao nível de acesso

### **3. Validações de Segurança**
1. Todas as operações verificam permissões
2. Tentativas de acesso não autorizado são bloqueadas
3. Logs registram todas as tentativas de acesso
4. Feedback claro para o usuário

## 📊 Exemplos de Uso

### **Cenário 1: Administrador**
```
👤 Usuário: Admin Sistema
🏷️ Tipo: Administrador
🔐 Acesso: Total
📊 Pode ver: Todas as equipes e atletas
✏️ Pode modificar: Qualquer registro
🗑️ Pode excluir: Qualquer registro
```

### **Cenário 2: Chefe de Equipe**
```
👤 Usuário: João Silva
🏷️ Tipo: Chefe de Equipe
🔐 Acesso: Restrito à "Equipe Alpha"
📊 Pode ver: Apenas atletas da "Equipe Alpha"
✏️ Pode modificar: Apenas dados da "Equipe Alpha"
🗑️ Pode excluir: Apenas dados da "Equipe Alpha"
```

## 🔒 Segurança Implementada

### **1. Validação no Frontend**
- Verificação de permissões antes de cada operação
- Botões desabilitados para ações não permitidas
- Feedback visual claro sobre restrições

### **2. Validação no Backend**
- Filtros automáticos nas consultas
- Verificação de propriedade dos dados
- Logs de todas as tentativas de acesso

### **3. Proteção de Dados**
- Usuários não podem acessar dados de outras equipes
- Administradores mantêm acesso total
- Sistema de logs para auditoria

## 🆘 Solução de Problemas

### **Erro: "Você não tem permissão para modificar dados desta equipe"**
- **Causa**: Tentativa de modificar dados de outra equipe
- **Solução**: Apenas administradores podem modificar dados de outras equipes

### **Erro: "Nenhum atleta encontrado para sua equipe"**
- **Causa**: Usuário não tem atletas na sua equipe
- **Solução**: Cadastrar atletas para a equipe ou verificar se está na equipe correta

### **Erro: "Acesso negado"**
- **Causa**: Tentativa de acessar dados sem permissão
- **Solução**: Verificar se o usuário está logado com a conta correta

## 🎯 Benefícios

### **1. Segurança**
- Dados isolados por equipe
- Acesso controlado e auditável
- Proteção contra acesso não autorizado

### **2. Organização**
- Interface limpa e relevante
- Dados organizados por contexto
- Experiência personalizada

### **3. Controle**
- Administradores mantêm controle total
- Chefes de equipe gerenciam seus dados
- Sistema escalável e flexível

## 🔮 Próximas Implementações

### **1. Permissões Granulares**
- Diferentes níveis de acesso dentro da equipe
- Permissões específicas por funcionalidade
- Sistema de roles mais avançado

### **2. Auditoria Avançada**
- Logs detalhados de todas as ações
- Relatórios de acesso e modificações
- Alertas de atividades suspeitas

### **3. Interface de Administração**
- Painel para gerenciar permissões
- Visualização de estrutura organizacional
- Configurações de acesso por equipe

---

**🎉 Controle de acesso implementado com sucesso!**

Agora o sistema possui controle de acesso granular baseado em equipes, garantindo que cada usuário só acesse e modifique dados pertinentes à sua própria equipe.
