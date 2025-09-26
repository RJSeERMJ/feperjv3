# Sistema de Logout Automático por Inatividade

## Visão Geral

Este sistema implementa logout automático por inatividade para usuários comuns (não administradores) do sistema FEPERJ.

## Funcionamento

### Configuração
- **Timeout**: 10 minutos de inatividade
- **Aviso**: 2 minutos antes do logout (8 minutos de inatividade)
- **Aplicação**: Apenas para usuários com `tipo !== 'admin'`

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

1. **Usuário logado**: Sistema inicia monitoramento de atividade
2. **Atividade detectada**: Timer é resetado para 10 minutos
3. **8 minutos sem atividade**: Modal de aviso é exibido com countdown de 2 minutos
4. **Usuário pode escolher**:
   - "Continuar Logado": Reset do timer, modal fecha
   - "Fazer Logout": Logout imediato
   - **Não responder**: Logout automático após 2 minutos

### Características Técnicas

#### Hook `useInactivityTimer`
- Monitora eventos de atividade
- Gerencia timers de aviso e timeout
- Configurável (tempo de timeout e aviso)
- Otimizado para evitar resets muito frequentes (mínimo 5 segundos)

#### Componente `InactivityWarning`
- Modal responsivo com countdown visual
- Opções claras para o usuário
- Estilização com animações
- Funciona em desktop e mobile

#### Integração no AuthContext
- Sistema global que funciona em todas as páginas
- Logs de atividade registrados
- Aplicado automaticamente para usuários comuns

### Logs Registrados
- Login realizado
- Logout manual
- Logout automático por inatividade
- Avisos de inatividade

### Configuração
Para alterar os tempos, modifique no `AuthContext.tsx`:
```typescript
useInactivityTimer({
  timeoutMinutes: 10,    // Tempo total de inatividade
  warningMinutes: 2,     // Tempo de aviso antes do logout
  onWarning: handleInactivityWarning,
  onTimeout: handleInactivityTimeout
});
```

### Segurança
- Apenas usuários comuns são afetados
- Administradores permanecem sempre logados
- Sistema não afeta funcionalidades críticas
- Logs completos de todas as ações

### Compatibilidade
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Funciona offline
- ✅ Não interfere com outras funcionalidades
