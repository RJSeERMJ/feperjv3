# Sistema de Geração de Carteirinhas

Este sistema permite gerar carteirinhas de atletas automaticamente a partir de um PDF modelo, preenchendo os campos com dados dos atletas e inserindo fotos 3x4.

## Funcionalidades

- ✅ Geração individual de carteirinhas
- ✅ Geração em lote (múltiplas carteirinhas)
- ✅ Inserção automática de fotos 3x4
- ✅ Preenchimento automático de campos:
  - Nome completo do atleta
  - Data de nascimento (DD/MM/AAAA)
  - Nome da equipe
  - Ano de validade (ano atual)
  - Cidade da equipe
  - Matrícula (gerada automaticamente)
- ✅ Download individual ou em ZIP
- ✅ Tratamento de textos longos (quebra de linha/truncamento)
- ✅ Validação de dados

## Como Usar

### 1. Acessar a Funcionalidade

1. Vá para a página "Atletas"
2. Clique no botão "Carteirinhas" (ícone de carteirinha)
3. Selecione o modo de processamento:
   - **Individual**: Gera e baixa uma carteirinha por vez
   - **Em Lote**: Gera todas as carteirinhas selecionadas e baixa em ZIP

### 2. Selecionar Atletas

- **Modo Individual**: Clique em "Gerar" ao lado de cada atleta
- **Modo Lote**: Marque os atletas desejados e clique em "Gerar Carteirinhas"

### 3. Processamento

O sistema irá:
1. Carregar o PDF modelo
2. Para cada atleta:
   - Buscar dados no Firebase
   - Buscar foto 3x4 no Supabase
   - Preencher campos no PDF
   - Inserir foto (se disponível)
3. Gerar PDF final
4. Fazer download

## Configuração

### Posições dos Campos

As posições dos campos podem ser ajustadas no arquivo `src/config/carteirinhaConfig.ts`:

```typescript
export const CONFIGURACAO_CARTEIRINHA: CarteirinhaConfig = {
  campos: {
    nome: { x: 200, y: 400, fontSize: 14, maxWidth: 200 },
    dataNascimento: { x: 200, y: 380, fontSize: 12, maxWidth: 150 },
    equipe: { x: 200, y: 360, fontSize: 12, maxWidth: 200 },
    validade: { x: 200, y: 340, fontSize: 12, maxWidth: 100 },
    cidade: { x: 200, y: 320, fontSize: 12, maxWidth: 150 },
    matricula: { x: 200, y: 300, fontSize: 12, maxWidth: 200 },
    foto: { x: 50, y: 300, width: 120, height: 150 }
  }
};
```

### PDF Modelo

O PDF modelo deve estar localizado em:
- `public/modelos/carteirinha.pdf`

## Estrutura de Arquivos

```
src/
├── components/
│   ├── CarteirinhaModal.tsx          # Modal principal
│   └── carteirinha/
│       └── README.md                 # Esta documentação
├── services/
│   └── carteirinhaService.ts         # Serviço de geração
├── config/
│   └── carteirinhaConfig.ts          # Configurações
└── utils/
    └── textUtils.ts                  # Utilitários de texto
```

## Dependências

- `pdf-lib`: Manipulação de PDFs
- `jszip`: Criação de arquivos ZIP
- `@supabase/supabase-js`: Acesso às fotos
- `firebase`: Dados dos atletas

## Tratamento de Erros

- **Foto não encontrada**: Carteirinha é gerada sem foto
- **Equipe não encontrada**: Atleta é pulado no processamento em lote
- **Texto muito longo**: É truncado ou quebrado em múltiplas linhas
- **Erro de geração**: É exibido no status de processamento

## Limitações

- O PDF modelo deve ter campos em posições fixas
- Fotos devem estar no formato JPG ou PNG
- Coordenadas são em pontos (1 ponto = 1/72 polegada)
- Máximo de 20MB por arquivo de foto

## Troubleshooting

### Carteirinha não é gerada
1. Verifique se o PDF modelo existe em `public/modelos/carteirinha.pdf`
2. Verifique se o atleta tem equipe associada
3. Verifique o console do navegador para erros

### Campos mal posicionados
1. Ajuste as coordenadas em `carteirinhaConfig.ts`
2. Use um editor de PDF para medir as posições corretas
3. Teste com um atleta de exemplo

### Foto não aparece
1. Verifique se a foto foi enviada para o Supabase
2. Verifique se o tipo de documento é "foto-3x4"
3. Verifique se a foto está em formato JPG ou PNG

### Performance lenta
1. Para muitos atletas, use o modo lote
2. Verifique a conexão com Supabase
3. Considere otimizar o tamanho das fotos
