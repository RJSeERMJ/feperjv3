# Sistema de Janela Espelhada - Barra Pronta

## Visão Geral

O sistema de janela espelhada permite "destacar" as seções de **Resultados** e **Levantamentos** para uma janela separada que pode ser arrastada para outro monitor. A janela espelhada mantém sincronização em tempo real com a tela principal.

## Funcionalidades

### ✅ Características Implementadas

- **Janela Separada**: Abre uma nova janela que pode ser movida para outro monitor
- **Sincronização em Tempo Real**: Usa BroadcastChannel API para comunicação instantânea
- **Espelhamento 100%**: Mesmo layout, dados e mudanças aparecem simultaneamente
- **Indicadores Visuais**: Mostra status de conexão e sincronização
- **Controles Intuitivos**: Botões para abrir/fechar janela espelhada

### 🎯 Componentes Afetados

1. **Results (Resultados)**: Seção de resultados da competição
2. **LiftingTable (Tabela de Levantamentos)**: Tabela principal de levantamentos
3. **LeftCard (Painel do Atleta)**: Painel lateral com informações do atleta atual e próximo

## Como Usar

### Para Resultados

1. Navegue para a aba **"Resultados"** no sistema Barra Pronta
2. Clique no botão **"Abrir em Janela Separada"**
3. Uma nova janela será aberta com o mesmo conteúdo
4. Arraste a janela para outro monitor
5. Use a tela principal normalmente - todas as mudanças aparecerão na janela espelhada

### Para Levantamentos

1. Navegue para a aba **"Levantamentos"** no sistema Barra Pronta
2. Clique no botão **"Abrir em Janela Separada"** na tabela de levantamentos
3. Uma nova janela será aberta com a tabela de levantamentos
4. Arraste a janela para outro monitor
5. Todas as atualizações de peso, status e seleções aparecerão em tempo real

### Para Painel do Atleta

1. Navegue para a aba **"Levantamentos"** no sistema Barra Pronta
2. Clique no botão **"Abrir em Janela Separada"** no painel do atleta (lado esquerdo)
3. Uma nova janela será aberta com as informações do atleta atual e próximo
4. Arraste a janela para outro monitor
5. Todas as mudanças de atleta, peso e informações aparecerão em tempo real

## Indicadores Visuais

### Na Tela Principal
- **Badge Verde "Espelhado"**: Indica que a janela espelhada está ativa
- **Alerta Azul**: Confirma que a sincronização está funcionando
- **Botão "Fechar Janela Espelhada"**: Para encerrar a conexão

### Na Janela Espelhada
- **Cabeçalho Colorido**: Identifica que é uma janela espelhada
- **Badge de Status**: Mostra "Conectado" ou "Desconectado"
- **Indicador de Carregamento**: Aparece enquanto aguarda dados

## Arquitetura Técnica

### BroadcastChannel API
- **Canal de Comunicação**: `results-mirror-channel` e `lifting-mirror-channel`
- **Tipos de Mensagem**: `SYNC_STATE`, `CONNECTION_CHECK`, `CONNECTION_RESPONSE`, `WINDOW_CLOSED`
- **Sincronização**: Automática a cada mudança de estado

### Hook useWindowMirror
```typescript
const {
  isMirrorWindow,    // Se é janela espelhada
  isMainWindow,      // Se é janela principal
  isConnected,       // Status da conexão
  openMirrorWindow,  // Abrir janela espelhada
  closeMirrorWindow, // Fechar janela espelhada
  sendToMirror,      // Enviar dados para espelho
  broadcast          // Broadcast geral
} = useWindowMirror(config);
```

### Componentes Wrapper
- **ResultsMirror**: Wrapper para o componente Results
- **LiftingTableMirror**: Wrapper para o componente LiftingTable

## Vantagens

### ✅ Benefícios
- **Monitor Externo**: Use como display público ou para juízes
- **Sincronização Instantânea**: Sem delay entre as telas
- **Sem Configuração**: Funciona automaticamente
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Robusto**: Reconecta automaticamente se necessário

### 🎯 Casos de Uso
- **Display Público**: Mostrar resultados em tela grande
- **Juízes**: Visualizar levantamentos em monitor separado
- **Apresentações**: Usar como slide durante competições
- **Multi-monitor**: Aproveitar configurações com múltiplas telas

## Limitações

### ⚠️ Considerações
- **Navegador**: Requer suporte ao BroadcastChannel API (Chrome 54+, Firefox 38+)
- **Mesmo Domínio**: Janelas devem estar no mesmo domínio
- **Pop-ups**: Pode ser bloqueado por bloqueadores de pop-up
- **Performance**: Muitas janelas espelhadas podem impactar performance

## Solução de Problemas

### Janela Não Abre
1. Verifique se pop-ups estão permitidos
2. Tente clicar no botão novamente
3. Verifique o console do navegador para erros

### Sincronização Não Funciona
1. Verifique se ambas as janelas estão abertas
2. Recarregue a janela espelhada
3. Feche e reabra a janela espelhada

### Performance Lenta
1. Feche janelas espelhadas não utilizadas
2. Verifique se há muitas abas abertas
3. Reinicie o navegador se necessário

## Desenvolvimento

### Adicionando Novos Componentes
1. Crie um wrapper similar ao `ResultsMirror`
2. Use o hook `useWindowMirror` com canal único
3. Substitua o componente original pelo wrapper
4. Teste a sincronização

### Personalizando Canais
```typescript
const config = {
  channelName: 'meu-canal-unico',
  windowName: 'meu-componente-mirror',
  onMessage: (data) => { /* processar dados */ },
  onConnectionChange: (connected) => { /* status mudou */ }
};
```

## Suporte

Para problemas ou dúvidas sobre o sistema de janela espelhada, verifique:
1. Console do navegador para erros
2. Status de conexão nos indicadores visuais
3. Compatibilidade do navegador com BroadcastChannel API
