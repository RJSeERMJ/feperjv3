# Sistema de Logout Automático por Inatividade

## Visão Geral

Este sistema implementa logout automático por inatividade para usuários comuns (não administradores) do sistema FEPERJ.

## Configuração Fixa

### ⏰ Timers Configurados
- **Timeout Total**: 5 minutos de inatividade
- **Aviso**: 1 minuto antes do logout (4 minutos de inatividade)
- **Aplicação**: Apenas para usuários com `tipo !== 'admin'`

### 🔧 Como Alterar os Timers

Para alterar os tempos, edite o arquivo `src/components/InactivityManager.tsx`:

```typescript
// CONFIGURAÇÃO FIXA: 5 minutos de timeout, 1 minuto de aviso
useInactivityTimer({
  timeoutMinutes: 5,    // ← ALTERE AQUI (minutos de timeout)
  warningMinutes: 1,    // ← ALTERE AQUI (minutos de aviso)
  onWarning: handleInactivityWarning,
  onTimeout: handleInactivityTimeout
});
```

## Funcionamento

### Eventos Monitorados
O sistema monitora os seguintes eventos para detectar atividade:
- `mousedown` - Clique do mouse
- `mousemove` - Movimento do mouse
- `keypress` - Pressionar tecla
- `keydown` - Tecla pressionada
- `scroll` - Rolar a página
- `touchstart` - Toque em dispositivos móveis
- `click` - Qualquer clique

### Fluxo de Funcionamento

1. **Usuário comum logado**: Sistema inicia monitoramento de atividade
2. **Atividade detectada**: Timer é resetado para 5 minutos
3. **4 minutos sem atividade**: Modal de aviso é exibido com countdown de 1 minuto
4. **Usuário pode escolher**:
   - "Continuar Logado": Reset do timer, modal fecha
   - "Fazer Logout": Logout imediato
   - **Não responder**: Logout automático após 1 minuto

## Arquivos do Sistema

### 📁 Estrutura de Arquivos
```
src/
├── hooks/
│   └── useInactivityTimer.ts          # Hook para monitorar atividade
├── components/
│   ├── InactivityWarning.tsx          # Modal de aviso
│   ├── InactivityWarning.css          # Estilos do modal
│   ├── InactivityManager.tsx          # Gerenciador principal
│   └── README_INACTIVITY_SYSTEM.md    # Esta documentação
└── App.tsx                            # Integração global
```

### 🔧 Componentes Principais

#### `useInactivityTimer.ts`
- Monitora eventos de atividade
- Gerencia timers de aviso e timeout
- Configurável (tempo de timeout e aviso)
- Otimizado para evitar resets muito frequentes (mínimo 3 segundos)

#### `InactivityWarning.tsx`
- Modal responsivo com countdown visual
- Opções claras para o usuário
- Estilização com animações
- Funciona em desktop e mobile

#### `InactivityManager.tsx`
- Gerencia toda a lógica de inatividade
- Integra com AuthContext
- Registra logs de atividade
- Configuração fixa de timers

## Características Técnicas

### ✅ Funcionalidades
- **Monitoramento completo** - Mouse, teclado, scroll, touch
- **Interface amigável** - Modal com countdown visual
- **Logs de atividade** - Registra logout automático
- **Otimizado** - Evita resets muito frequentes
- **Responsivo** - Funciona em desktop e mobile
- **Configurável** - Fácil alteração de timers

### 🔒 Segurança
- **Apenas usuários comuns** são afetados
- **Administradores** permanecem sempre logados
- **Sistema não afeta** funcionalidades críticas
- **Logs completos** de todas as ações

### ⚙️ Integração
- **Sistema global** que funciona em todas as páginas
- **Integrado ao AuthContext** para acesso ao usuário
- **Logs registrados** no Firebase
- **Não interfere** com outras funcionalidades

## Logs Registrados

O sistema registra os seguintes eventos:
- Login realizado
- Logout manual
- **Logout automático por inatividade** (novo)
- Avisos de inatividade

## Compatibilidade

- ✅ **Todos os navegadores** (Chrome, Firefox, Safari, Edge)
- ✅ **Dispositivos móveis** (iOS, Android)
- ✅ **Funciona offline**
- ✅ **Não interfere** com outras funcionalidades
- ✅ **Interface responsiva**

## Exemplos de Uso

### ✅ Usuário Navega Normalmente
1. Faz login → Acesso ao sistema
2. Navega entre páginas → Sessão mantida
3. Usa sistema normalmente → Sem interrupções
4. Fica inativo → Timer inicia

### ✅ Usuário Fica Inativo
1. Está logado → Navegando no sistema
2. Para de usar → Timer de inatividade inicia
3. 4 minutos → Modal de aviso aparece
4. 5 minutos → Logout automático (se não responder)

### ✅ Usuário Responde ao Aviso
1. Está logado → Navegando no sistema
2. 4 minutos → Modal de aviso aparece
3. Clica "Continuar Logado" → Timer resetado
4. Continua usando → Sistema funciona normalmente

## Troubleshooting

### Problema: Timer não funciona
**Solução**: Verificar se o usuário não é admin (apenas usuários comuns são afetados)

### Problema: Modal não aparece
**Solução**: Verificar console do navegador para logs de debug

### Problema: Logout não acontece
**Solução**: Verificar se há erros no console ou problemas de conectividade

## Manutenção

### Alterar Timers
1. Editar `src/components/InactivityManager.tsx`
2. Modificar `timeoutMinutes` e `warningMinutes`
3. Reiniciar aplicação

### Desabilitar Sistema
1. Comentar a linha `<InactivityManager />` no `App.tsx`
2. Reiniciar aplicação

### Habilitar para Admins
1. Editar `src/hooks/useInactivityTimer.ts`
2. Remover a condição `user.tipo === 'admin'`
3. Reiniciar aplicação
