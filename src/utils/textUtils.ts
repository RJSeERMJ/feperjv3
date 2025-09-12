// Utilitários para manipulação de texto em PDFs

/**
 * Quebra texto em múltiplas linhas se exceder a largura máxima
 * @param text Texto a ser quebrado
 * @param maxWidth Largura máxima em pontos
 * @param fontSize Tamanho da fonte
 * @param font Fonte do PDF
 * @returns Array de linhas de texto
 */
export const quebrarTexto = (
  text: string,
  maxWidth: number,
  fontSize: number,
  font: any
): string[] => {
  if (!text || maxWidth <= 0) return [text || ''];

  const palavras = text.split(' ');
  const linhas: string[] = [];
  let linhaAtual = '';

  for (const palavra of palavras) {
    const textoTeste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    const larguraTexto = font.widthOfTextAtSize(textoTeste, fontSize);

    if (larguraTexto <= maxWidth) {
      linhaAtual = textoTeste;
    } else {
      if (linhaAtual) {
        linhas.push(linhaAtual);
        linhaAtual = palavra;
      } else {
        // Palavra muito longa, quebrar no meio
        linhas.push(palavra);
      }
    }
  }

  if (linhaAtual) {
    linhas.push(linhaAtual);
  }

  return linhas;
};

/**
 * Trunca texto se exceder a largura máxima
 * @param text Texto a ser truncado
 * @param maxWidth Largura máxima em pontos
 * @param fontSize Tamanho da fonte
 * @param font Fonte do PDF
 * @param sufixo Sufixo para texto truncado (padrão: '...')
 * @returns Texto truncado
 */
export const truncarTexto = (
  text: string,
  maxWidth: number,
  fontSize: number,
  font: any,
  sufixo: string = '...'
): string => {
  if (!text || maxWidth <= 0) return text || '';

  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    return text;
  }

  let textoTruncado = text;
  const larguraSufixo = font.widthOfTextAtSize(sufixo, fontSize);

  while (textoTruncado.length > 0) {
    const larguraTexto = font.widthOfTextAtSize(textoTruncado, fontSize);
    if (larguraTexto + larguraSufixo <= maxWidth) {
      break;
    }
    textoTruncado = textoTruncado.slice(0, -1);
  }

  return textoTruncado + sufixo;
};

/**
 * Centraliza texto horizontalmente
 * @param text Texto a ser centralizado
 * @param x Posição X inicial
 * @param largura Largura da área
 * @param fontSize Tamanho da fonte
 * @param font Fonte do PDF
 * @returns Posição X centralizada
 */
export const centralizarTexto = (
  text: string,
  x: number,
  largura: number,
  fontSize: number,
  font: any
): number => {
  const larguraTexto = font.widthOfTextAtSize(text, fontSize);
  return x + (largura - larguraTexto) / 2;
};

/**
 * Formatar CPF com máscara
 * @param cpf CPF sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export const formatarCPF = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formatar data para DD/MM/AAAA
 * @param data Data a ser formatada
 * @returns Data formatada
 */
export const formatarData = (data: Date): string => {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

/**
 * Gerar matrícula baseada no CPF
 * @param cpf CPF do atleta
 * @returns Matrícula formatada
 */
export const gerarMatricula = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const primeirosDigitos = cpfLimpo.substring(0, 5);
  const anoAtual = new Date().getFullYear();
  return `FEPERJ - ${primeirosDigitos}${anoAtual}`;
};

/**
 * Limpar nome para uso em arquivos
 * @param nome Nome a ser limpo
 * @returns Nome limpo para arquivo
 */
export const limparNomeParaArquivo = (nome: string): string => {
  return nome
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .toLowerCase();
};
