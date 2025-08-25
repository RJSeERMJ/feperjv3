// Sistema de pontuação IPF GL Points para Barra Pronta
// Baseado na implementação oficial da IPF para Good Lift Points
// Fórmula oficial da IPF para Good Lift Points

export type Sex = 'M' | 'F' | 'Mx';
export type Equipment = 'Sleeves' | 'Single-ply' | 'Bare' | 'Wraps' | 'Multi-ply' | 'Unlimited';
export type Event = 'SBD' | 'S' | 'B' | 'D';

type Coefficients = Array<number>;
type ByEvent = {
  SBD: Coefficients;
  B: Coefficients;
};
type ByEquipment = {
  Sleeves: ByEvent;
  "Single-ply": ByEvent;
};
type BySex = {
  M: ByEquipment;
  F: ByEquipment;
};

// Parâmetros oficiais da IPF para GL Points (2024)
const PARAMETERS: BySex = {
  M: {
    Sleeves: {
      SBD: [1199.72839, 1025.18162, 0.00921],
      B: [320.98041, 281.40258, 0.01008],
    },
    "Single-ply": {
      SBD: [1236.25115, 1449.21864, 0.01644],
      B: [381.22073, 733.79378, 0.02398],
    },
  },
  F: {
    Sleeves: {
      SBD: [610.32796, 1045.59282, 0.03048],
      B: [142.40398, 442.52671, 0.04724],
    },
    "Single-ply": {
      SBD: [758.63878, 949.31382, 0.02435],
      B: [221.82209, 357.00377, 0.02937],
    },
  },
};

/**
 * Calcula os IPF GL Points (Good Lift Points)
 * @param totalKg - Total levantado em kg (Agachamento + Supino + Terra)
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @param event - Evento (SBD para total, B para supino)
 * @returns Pontuação IPF GL
 */
export const calculateIPFGLPoints = (
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  event: Event = 'SBD'
): number => {
  // Validações básicas
  if (totalKg === 0) return 0;
  if (bodyweightKg < 40) return 0;

  // Normalização do equipamento
  let normalizedEquipment: 'Sleeves' | 'Single-ply';
  if (equipment === "Bare" || equipment === "Wraps") {
    normalizedEquipment = "Sleeves";
  } else if (equipment === "Multi-ply" || equipment === "Unlimited") {
    normalizedEquipment = "Single-ply";
  } else if (equipment === "Sleeves" || equipment === "Single-ply") {
    normalizedEquipment = equipment;
  } else {
    return 0; // Equipamento não suportado
  }

  // Normalização do sexo (Mx é tratado como M)
  let normalizedSex = sex;
  if (sex === "Mx") normalizedSex = "M";

  // Validação do evento
  if (event !== "SBD" && event !== "B") return 0;
  if (normalizedSex !== "M" && normalizedSex !== "F") return 0;

  // Obter parâmetros para o cálculo
  const params = PARAMETERS[normalizedSex][normalizedEquipment][event];
  
  // Fórmula IPF GL Points: (Total * 100) / (A - B * e^(-C * PesoCorporal))
  const denom = params[0] - params[1] * Math.exp(-1.0 * params[2] * bodyweightKg);
  
  // Calcular pontuação
  const glp = denom === 0 ? 0 : Math.max(0, (totalKg * 100.0) / denom);
  
  // Validações finais
  if (isNaN(glp) || bodyweightKg < 35) {
    return 0.0;
  }
  
  return glp;
};

/**
 * Calcula os IPF GL Points para o total (SBD)
 * @param squatKg - Peso do agachamento em kg
 * @param benchKg - Peso do supino em kg
 * @param deadliftKg - Peso do terra em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @returns Pontuação IPF GL para o total
 */
export const calculateIPFGLPointsTotal = (
  squatKg: number,
  benchKg: number,
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  const totalKg = squatKg + benchKg + deadliftKg;
  return calculateIPFGLPoints(totalKg, bodyweightKg, sex, equipment, 'SBD');
};

/**
 * Calcula os IPF GL Points para o supino
 * @param benchKg - Peso do supino em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @returns Pontuação IPF GL para o supino
 */
export const calculateIPFGLPointsBench = (
  benchKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return calculateIPFGLPoints(benchKg, bodyweightKg, sex, equipment, 'B');
};

/**
 * Calcula os IPF GL Points para o agachamento
 * @param squatKg - Peso do agachamento em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @returns Pontuação IPF GL para o agachamento
 */
export const calculateIPFGLPointsSquat = (
  squatKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return calculateIPFGLPoints(squatKg, bodyweightKg, sex, equipment, 'SBD');
};

/**
 * Calcula os IPF GL Points para o terra
 * @param deadliftKg - Peso do terra em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @returns Pontuação IPF GL para o terra
 */
export const calculateIPFGLPointsDeadlift = (
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return calculateIPFGLPoints(deadliftKg, bodyweightKg, sex, equipment, 'SBD');
};

/**
 * Normaliza o equipamento para o formato aceito pela fórmula
 * @param equipment - Equipamento original
 * @returns Equipamento normalizado
 */
export const normalizeEquipment = (equipment: string): Equipment => {
  switch (equipment.toLowerCase()) {
    case 'raw':
    case 'bare':
    case 'wraps':
      return 'Sleeves';
    case 'equipped':
    case 'single-ply':
    case 'multi-ply':
    case 'unlimited':
      return 'Single-ply';
    default:
      return 'Sleeves'; // Padrão
  }
};

/**
 * Normaliza o sexo para o formato aceito pela fórmula
 * @param sex - Sexo original
 * @returns Sexo normalizado
 */
export const normalizeSex = (sex: string): Sex => {
  switch (sex.toUpperCase()) {
    case 'M':
    case 'MALE':
      return 'M';
    case 'F':
    case 'FEMALE':
      return 'F';
    case 'MX':
    case 'MIXED':
      return 'Mx';
    default:
      return 'M'; // Padrão
  }
};

/**
 * Valida se os parâmetros são válidos para o cálculo
 * @param totalKg - Total em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo
 * @param equipment - Equipamento
 * @returns true se válido, false caso contrário
 */
export const validateParameters = (
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): boolean => {
  return (
    totalKg > 0 &&
    bodyweightKg >= 40 &&
    (sex === 'M' || sex === 'F' || sex === 'Mx') &&
    (equipment === 'Sleeves' || equipment === 'Single-ply' || 
     equipment === 'Bare' || equipment === 'Wraps' || 
     equipment === 'Multi-ply' || equipment === 'Unlimited')
  );
};