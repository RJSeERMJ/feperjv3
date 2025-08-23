# Sistema Barra Pronta - Funcionalidade de Arquivos

## Visão Geral

O sistema Barra Pronta agora possui funcionalidade completa de salvamento e carregamento de arquivos, similar ao sistema OpenLifter. Isso permite fazer backup das competições e restaurá-las em outros computadores ou momentos.

## Funcionalidades Implementadas

### 1. Salvamento Automático
- **Persistência automática**: Todas as alterações são salvas automaticamente no navegador
- **Sem necessidade de botão "Salvar"**: O sistema salva automaticamente após cada mudança
- **Indicador visual**: Mostra que o salvamento automático está ativo

### 2. Salvar para Arquivo
- **Botão "Salvar para Arquivo"**: Exporta toda a competição para um arquivo `.barrapronta`
- **Formato JSON**: Arquivo contém todos os dados da competição
- **Nome automático**: Baseado no nome da competição
- **Extensão**: `.barrapronta` (também aceita `.json`)

### 3. Carregar de Arquivo
- **Botão "Carregar de Arquivo"**: Importa dados de uma competição existente
- **Validação**: Verifica se o arquivo tem formato válido
- **Sobrescreve dados**: Substitui completamente os dados atuais
- **Tratamento de erros**: Mensagens claras para problemas de carregamento

### 4. Carregar do Sistema
- **Botão "Carregar do Sistema"**: Carrega competições do banco de dados principal
- **Integração**: Conecta com o sistema de competições existente
- **Importação automática**: Carrega atletas e configurações automaticamente

## Como Usar

### Salvando uma Competição

1. Configure sua competição na aba "Configuração da Competição"
2. Adicione atletas na aba "Inscrições"
3. Na tela inicial, clique em **"Salvar para Arquivo"**
4. O arquivo será baixado automaticamente com extensão `.barrapronta`

### Carregando uma Competição

1. Na tela inicial, clique em **"Carregar de Arquivo"**
2. Selecione um arquivo `.barrapronta` ou `.json` válido
3. O sistema validará o arquivo e carregará os dados
4. A competição será restaurada completamente

### Backup e Restauração

- **Backup**: Use "Salvar para Arquivo" regularmente para fazer backup
- **Restauração**: Use "Carregar de Arquivo" para restaurar de um backup
- **Portabilidade**: Arquivos podem ser transferidos entre computadores
- **Segurança**: Mantenha backups em local seguro

## Estrutura do Arquivo

O arquivo `.barrapronta` contém:

```json
{
  "meet": {
    "name": "Nome da Competição",
    "city": "Local",
    "date": "2024-01-01",
    "divisions": ["Open", "Master"],
    "weightClassesKgMen": [59, 66, 74],
    "weightClassesKgWomen": [47, 52, 57]
  },
  "registration": {
    "entries": [
      {
        "name": "Nome do Atleta",
        "sex": "M",
        "weightClassKg": 74
      }
    ]
  },
  "lifting": {
    "day": 1,
    "platform": 1
  }
}
```

## Vantagens

1. **Backup seguro**: Competições salvas em arquivos locais
2. **Portabilidade**: Transferir entre computadores facilmente
3. **Restauração**: Recuperar competições perdidas
4. **Compatibilidade**: Formato JSON padrão
5. **Validação**: Verificação automática de arquivos válidos

## Compatibilidade

- **Formato**: JSON padrão
- **Extensões**: `.barrapronta` (recomendado) ou `.json`
- **Tamanho**: Depende da quantidade de atletas e dados
- **Versões**: Compatível com versões futuras do sistema

## Solução de Problemas

### Arquivo não carrega
- Verifique se é um arquivo `.barrapronta` ou `.json` válido
- Confirme que o arquivo não está corrompido
- Verifique se foi gerado pelo sistema Barra Pronta

### Erro de validação
- O arquivo deve conter as seções: `meet`, `registration`, `lifting`
- Verifique se o formato JSON está correto
- Tente recriar o arquivo de backup

### Dados não aparecem
- Após carregar, verifique todas as abas
- Use "Carregar de Arquivo" novamente se necessário
- Verifique se não há conflitos com dados existentes

## Notas Técnicas

- **Biblioteca**: Usa `file-saver` para download de arquivos
- **Storage**: Redux-persist para salvamento automático
- **Validação**: Verificação de estrutura JSON e campos obrigatórios
- **Performance**: Carregamento assíncrono para arquivos grandes
