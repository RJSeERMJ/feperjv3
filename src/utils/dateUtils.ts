/**
 * Função utilitária para formatar datas de forma segura
 * @param data - Data a ser formatada (Date, string, undefined ou null)
 * @returns String formatada da data ou '-' se não houver data
 */
export const formatarData = (data: Date | string | undefined | null): string => {
  if (!data) return '-';
  if (data instanceof Date) {
    return data.toLocaleDateString('pt-BR');
  }
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch (error) {
    console.warn('Erro ao formatar data:', data, error);
    return '-';
  }
};

/**
 * Função utilitária para formatar data e hora de forma segura
 * @param data - Data a ser formatada (Date, string, undefined ou null)
 * @returns String formatada da data e hora ou '-' se não houver data
 */
export const formatarDataHora = (data: Date | string | undefined | null): string => {
  if (!data) return '-';
  if (data instanceof Date) {
    return data.toLocaleString('pt-BR');
  }
  try {
    return new Date(data).toLocaleString('pt-BR');
  } catch (error) {
    console.warn('Erro ao formatar data e hora:', data, error);
    return '-';
  }
};
