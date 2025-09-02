import { BARRA_PRONTA_CONSTANTS } from '../constants/barraPronta';
import type { Entry, Lift, LiftStatus } from '../types/barraProntaTypes';

/**
 * Utilitários para o sistema Barra Pronta
 * Centraliza funções comuns que são usadas em vários lugares
 */

/**
 * Obtém o nome do movimento baseado no código
 * @param lift - Código do movimento (S, B, D)
 * @returns Nome do movimento em português
 */
export const getLiftName = (lift: Lift): string => {
  const liftNames = {
    S: 'Agachamento',
    B: 'Supino',
    D: 'Terra'
  } as const;
  
  return liftNames[lift] || 'Movimento';
};

/**
 * Obtém o nome do movimento baseado no código (versão curta)
 * @param lift - Código do movimento (S, B, D)
 * @returns Nome curto do movimento
 */
export const getLiftShortName = (lift: Lift): string => {
  const liftShortNames = {
    S: 'Agach.',
    B: 'Supino',
    D: 'Terra'
  } as const;
  
  return liftShortNames[lift] || 'Mov.';
};

/**
 * Obtém o campo de peso baseado no movimento
 * @param lift - Código do movimento
 * @param attempt - Número da tentativa (1, 2, 3)
 * @returns Nome do campo de peso
 */
export const getWeightField = (lift: Lift, attempt: number): string => {
  const liftPrefix = {
    S: 'squat',
    B: 'bench',
    D: 'deadlift'
  } as const;
  
  return `${liftPrefix[lift]}${attempt}`;
};

/**
 * Obtém o campo de status baseado no movimento
 * @param lift - Código do movimento
 * @returns Nome do campo de status
 */
export const getStatusField = (lift: Lift): string => {
  const statusFields = {
    S: 'squatStatus',
    B: 'benchStatus',
    D: 'deadliftStatus'
  } as const;
  
  return statusFields[lift];
};

/**
 * Obtém o peso da barra + colares baseado no movimento
 * @param lift - Código do movimento
 * @param meet - Estado da competição
 * @returns Peso da barra + colares
 */
export const getBarAndCollarsWeight = (lift: Lift, meet: any): number => {
  const weightFields = {
    S: 'squatBarAndCollarsWeightKg',
    B: 'benchBarAndCollarsWeightKg',
    D: 'deadliftBarAndCollarsWeightKg'
  } as const;
  
  return meet[weightFields[lift]] || 20;
};

/**
 * Obtém o texto do status da tentativa
 * @param status - Status da tentativa
 * @returns Texto descritivo do status
 */
export const getAttemptStatusText = (status: LiftStatus): string => {
  const statusTexts = {
    0: 'Pendente',
    1: 'Good Lift',
    2: 'No Lift',
    3: 'No Attempt'
  } as const;
  
  return statusTexts[status] || 'Desconhecido';
};

/**
 * Obtém a classe CSS do status da tentativa
 * @param status - Status da tentativa
 * @returns Classe CSS para estilização
 */
export const getAttemptStatusClass = (status: LiftStatus): string => {
  const statusClasses = {
    0: 'status-pending',
    1: 'status-good-lift',
    2: 'status-no-lift',
    3: 'status-no-attempt'
  } as const;
  
  return statusClasses[status] || 'status-unknown';
};

/**
 * Verifica se uma tentativa tem peso definido
 * @param entry - Entrada do atleta
 * @param lift - Código do movimento
 * @param attempt - Número da tentativa
 * @returns true se tem peso definido
 */
export const hasAttemptWeight = (entry: Entry, lift: Lift, attempt: number): boolean => {
  const weightField = getWeightField(lift, attempt);
  const weight = (entry as any)[weightField];
  return weight !== null && weight !== undefined && weight > 0;
};

/**
 * Obtém o peso de uma tentativa
 * @param entry - Entrada do atleta
 * @param lift - Código do movimento
 * @param attempt - Número da tentativa
 * @returns Peso da tentativa ou 0 se não definido
 */
export const getAttemptWeight = (entry: Entry, lift: Lift, attempt: number): number => {
  const weightField = getWeightField(lift, attempt);
  return (entry as any)[weightField] || 0;
};

/**
 * Obtém o status de uma tentativa
 * @param entry - Entrada do atleta
 * @param lift - Código do movimento
 * @param attempt - Número da tentativa
 * @returns Status da tentativa ou 0 se não definido
 */
export const getAttemptStatus = (entry: Entry, lift: Lift, attempt: number): LiftStatus => {
  const statusField = getStatusField(lift);
  const statusArray = (entry as any)[statusField] || [];
  return statusArray[attempt - 1] || 0;
};

/**
 * Verifica se uma tentativa já foi marcada
 * @param entry - Entrada do atleta
 * @param lift - Código do movimento
 * @param attempt - Número da tentativa
 * @returns true se já foi marcada
 */
export const isAttemptMarked = (entry: Entry, lift: Lift, attempt: number): boolean => {
  const status = getAttemptStatus(entry, lift, attempt);
  return status === 1 || status === 2; // Good Lift ou No Lift
};

/**
 * Obtém o melhor peso de um movimento
 * @param entry - Entrada do atleta
 * @param lift - Código do movimento
 * @returns Melhor peso do movimento
 */
export const getBestWeight = (entry: Entry, lift: Lift): number => {
  const weights = [1, 2, 3].map(attempt => getAttemptWeight(entry, lift, attempt));
  return Math.max(...weights);
};

/**
 * Obtém o total de um atleta (soma dos melhores pesos)
 * @param entry - Entrada do atleta
 * @returns Total do atleta
 */
export const getAthleteTotal = (entry: Entry): number => {
  const squat = getBestWeight(entry, 'S');
  const bench = getBestWeight(entry, 'B');
  const deadlift = getBestWeight(entry, 'D');
  
  return squat + bench + deadlift;
};

/**
 * Formata peso para exibição
 * @param weight - Peso em kg
 * @returns Peso formatado
 */
export const formatWeight = (weight: number): string => {
  if (weight <= 0) return '0kg';
  return `${weight}kg`;
};

/**
 * Formata pontos IPF GL para exibição
 * @param points - Pontos IPF GL
 * @returns Pontos formatados
 */
export const formatIPFPoints = (points: number): string => {
  if (points <= 0) return '0.00';
  return points.toFixed(2);
};

/**
 * Obtém a classe de peso baseada no peso corporal
 * @param bodyweight - Peso corporal em kg
 * @param sex - Sexo do atleta
 * @param weightClasses - Classes de peso disponíveis
 * @returns Classe de peso
 */
export const getWeightClass = (
  bodyweight: number, 
  sex: 'M' | 'F', 
  weightClasses: number[]
): string => {
  if (bodyweight <= 0) return 'N/A';
  
  const sortedClasses = [...weightClasses].sort((a, b) => a - b);
  
  for (const weightClass of sortedClasses) {
    if (bodyweight <= weightClass) {
      return `${weightClass}kg`;
    }
  }
  
  return `+${sortedClasses[sortedClasses.length - 1]}kg`;
};

/**
 * Calcula a idade baseada na data de nascimento
 * @param birthDate - Data de nascimento (YYYY-MM-DD)
 * @returns Idade em anos
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Obtém a divisão de idade IPF
 * @param birthDate - Data de nascimento
 * @param sex - Sexo do atleta
 * @returns Divisão de idade IPF
 */
export const getIPFAgeDivision = (birthDate: string, sex: 'M' | 'F'): string => {
  const age = calculateAge(birthDate);
  
  if (age < 18) return 'SJ';      // Sub-Junior
  if (age < 23) return 'JR';      // Junior
  if (age < 40) return 'OP';      // Open
  if (age < 50) return 'M1';      // Master I
  if (age < 60) return 'M2';      // Master II
  if (age < 70) return 'M3';      // Master III
  if (age < 80) return 'M4';      // Master IV
  return 'M4';                     // Master IV+
};

/**
 * Obtém o nome da divisão de idade
 * @param division - Código da divisão
 * @returns Nome da divisão
 */
export const getAgeDivisionName = (division: string): string => {
  const divisionNames = {
    SJ: 'Sub-Junior',
    JR: 'Junior',
    OP: 'Open',
    M1: 'Master I',
    M2: 'Master II',
    M3: 'Master III',
    M4: 'Master IV'
  } as const;
  
  return divisionNames[division as keyof typeof divisionNames] || division;
};
